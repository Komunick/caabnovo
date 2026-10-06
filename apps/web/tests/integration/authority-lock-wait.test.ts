/**
 * CAAB-19, criterio G03 / AC-T004: expiracao de autoridade durante a espera por lock, sem
 * persistencia nem auditoria de sucesso indevidas.
 *
 * Montagem: o "locker" (conexao propria) segura um lock; a operacao sob teste roda num pool de
 * conexao unica com application_name proprio e fica bloqueada em pg_stat_activity
 * (wait_event_type = 'Lock'); enquanto espera, a autoridade do ator termina (sessao ou cargo); o
 * locker libera depois do prazo. A operacao nao pode concluir, persistir nem gravar auditoria de
 * sucesso. Cada cenario de rejeicao compara o estado das tabelas antes e depois, e cada um tem um
 * controle positivo (mesma montagem, autoridade intacta) que conclui de verdade.
 */
import { Client, type Pool } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { accessPermissionSchema } from "@caab/contracts";
import { createDatabaseClient, runMigrations } from "@caab/db";
import { startPostgres } from "../../../../packages/db/tests/postgres-container";
import { syntheticUserContact } from "../helpers/user-contact";
import { AuthenticationRequiredError } from "../../modules/auth/authorize";
import type { RequestActor } from "../../modules/shared/request-context";
import { changeUserAccess } from "../../modules/users/user-access-service";
import {
  initializeUserPassword,
  resetUserPassword,
} from "../../modules/users/initial-password-service";
import { grantRole, promoteRole, revokeRole } from "../../modules/users/role-assignment-service";
import { createUser } from "../../modules/users/user-service";

type RoleCode = "administrator" | "manager" | "collaborator";

interface Account {
  userId: string;
  sessionId: string;
}

interface Fixture {
  actor: Account;
  target: Account;
  /** Used only by createUser: the account it tries to create and its idempotency key. */
  newEmail: string;
  idempotencyKey: string;
}

interface OperationDef {
  name: string;
  /** Extra preconditions for the operation, on top of the actor/target pair. */
  seed(fixture: Fixture): Promise<void>;
  run(pool: Pool, fixture: Fixture): Promise<unknown>;
  /** audit_event.action values a successful run writes (sorted comparison). */
  audit: string[];
  /** security_event.reason_code values a successful run writes (sorted comparison). */
  security: string[];
}

type Settled = { settled: "fulfilled" } | { settled: "rejected"; error: unknown };

/** How the actor's authority ends while the operation waits. */
type Authority = "session-expires" | "role-expires" | "role-revoked" | "none";

type LockKind =
  | "advisory"
  | "user-row"
  | "target-role-held"
  | "target-role-revoked"
  | "user-insert"
  | "idempotency";

interface LockPlan {
  /** LIKE pattern for pg_stat_activity.query: proves the wait is on the intended statement. */
  waitingStatement: string;
  acquire(locker: Client, fixture: Fixture): Promise<void>;
  release: "COMMIT" | "ROLLBACK";
  /** True when the locker's own writes become visible on release (baseline is read from it). */
  commitsChanges: boolean;
}

const DEADLINE_SECONDS = 4;
const WAIT_DETECTION_TIMEOUT_MS = 3000;
const LAST_ADMINISTRATOR_LOCK = "SELECT pg_advisory_xact_lock(hashtext('caab:last-administrator'))";

let container: StartedPostgreSqlContainer;
let admin: Client;
let roleIds: Record<RoleCode, string>;

async function seedAccount(label: string): Promise<Account> {
  const user = await admin.query<{ id: string }>(
    `INSERT INTO "user"(name,email) VALUES ($1,$2) RETURNING id`,
    [`Conta ${label}`, `${label}-${crypto.randomUUID()}@example.test`],
  );
  const userId = user.rows[0]!.id;
  const sessionId = crypto.randomUUID();
  await admin.query(
    "INSERT INTO session(id,token,user_id,expires_at) VALUES ($1,$1,$2,clock_timestamp()+interval '1 hour')",
    [sessionId, userId],
  );
  await admin.query(
    "INSERT INTO verification(identifier,value,expires_at) VALUES ($1,$2,clock_timestamp()+interval '1 hour')",
    [`sintetico:${label}`, userId],
  );
  return { userId, sessionId };
}

async function giveRole(userId: string, roleId: string, grantedBy: string) {
  await admin.query(
    "INSERT INTO user_role(user_id,role_id,granted_by,justification) VALUES ($1,$2,$3,'Cargo sintetico do cenario')",
    [userId, roleId, grantedBy],
  );
}

async function seedFixture(): Promise<Fixture> {
  const actor = await seedAccount("ator");
  const target = await seedAccount("alvo");
  // The administrator role grants every permission present in the permission table (view
  // effective_user_permission), which migrations 0014/0026/0028 populate and these tests keep.
  await giveRole(actor.userId, roleIds.administrator, actor.userId);
  return {
    actor,
    target,
    newEmail: `criada-${crypto.randomUUID()}@example.test`,
    idempotencyKey: crypto.randomUUID(),
  };
}

function requestActor(account: Account): RequestActor {
  return {
    userId: account.userId,
    sessionId: account.sessionId,
    permissions: new Set<string>(accessPermissionSchema.options),
  };
}

function commandBase(fixture: Fixture) {
  return {
    actor: requestActor(fixture.actor),
    effectiveIdentity: `user:${fixture.actor.userId}`,
    requestId: crypto.randomUUID(),
    correlationId: crypto.randomUUID(),
  };
}

const grantRoleOp: OperationDef = {
  name: "grantRole",
  seed: async () => {},
  run: (pool, fixture) =>
    grantRole(pool, {
      ...commandBase(fixture),
      targetUserId: fixture.target.userId,
      roleId: roleIds.manager,
      justification: "Concessao sintetica durante espera por lock",
    }),
  audit: ["user.role.granted"],
  security: ["ROLE_GRANTED"],
};

const revokeRoleOp: OperationDef = {
  name: "revokeRole",
  seed: (fixture) => giveRole(fixture.target.userId, roleIds.collaborator, fixture.actor.userId),
  run: (pool, fixture) =>
    revokeRole(pool, {
      ...commandBase(fixture),
      targetUserId: fixture.target.userId,
      roleId: roleIds.collaborator,
      reason: "Encerramento sintetico durante espera por lock",
    }),
  audit: ["user.role.revoked"],
  security: ["ROLE_REVOKED"],
};

const promoteRoleOp: OperationDef = {
  name: "promoteRole",
  seed: (fixture) => giveRole(fixture.target.userId, roleIds.collaborator, fixture.actor.userId),
  run: (pool, fixture) =>
    promoteRole(pool, {
      ...commandBase(fixture),
      targetUserId: fixture.target.userId,
      roleId: roleIds.collaborator,
    }),
  audit: ["user.role.granted", "user.role.revoked"],
  security: ["ROLE_GRANTED", "ROLE_REVOKED"],
};

const changeUserAccessOp: OperationDef = {
  name: "changeUserAccess",
  // Current version 1 and current permissions are what the command below must echo back.
  seed: async (fixture) => {
    await admin.query(
      "INSERT INTO user_access(user_id,permissions,updated_by) VALUES ($1,ARRAY['news:read'],$2)",
      [fixture.target.userId, fixture.actor.userId],
    );
  },
  run: (pool, fixture) =>
    changeUserAccess(pool, {
      actor: requestActor(fixture.actor),
      targetUserId: fixture.target.userId,
      input: {
        version: 1,
        expectedPermissions: ["news:read"],
        permissions: ["news:read", "news:write"],
        justification: "Ajuste sintetico durante espera por lock",
      },
      requestId: crypto.randomUUID(),
      correlationId: crypto.randomUUID(),
    }),
  audit: ["user.access.updated"],
  security: [],
};

const resetUserPasswordOp: OperationDef = {
  name: "resetUserPassword",
  // Replacement requires an existing credential; the digest in the snapshot detects any rotation.
  seed: async (fixture) => {
    await admin.query(
      `INSERT INTO account(account_id,provider_id,user_id,password,issuer)
       VALUES ($1,'credential',$2,'sintetico-hash-anterior','local:credential')`,
      [fixture.target.userId, fixture.target.userId],
    );
  },
  run: (pool, fixture) =>
    resetUserPassword(pool, {
      actor: requestActor(fixture.actor),
      userId: fixture.target.userId,
      version: 1,
      requestId: crypto.randomUUID(),
      correlationId: crypto.randomUUID(),
    }),
  audit: ["user.password.reset"],
  security: ["PASSWORD_RESET_BY_ADMINISTRATOR"],
};

const initializeUserPasswordOp: OperationDef = {
  name: "initializeUserPassword",
  // First initialization requires a target without any credential password: none is seeded.
  seed: async () => {},
  run: (pool, fixture) =>
    initializeUserPassword(pool, {
      actor: requestActor(fixture.actor),
      userId: fixture.target.userId,
      requestId: crypto.randomUUID(),
      correlationId: crypto.randomUUID(),
    }),
  audit: ["user.password.initialized"],
  security: ["INITIAL_PASSWORD_CREATED"],
};

const createUserOp: OperationDef = {
  name: "createUser",
  seed: async () => {},
  run: (pool, fixture) =>
    createUser(pool, {
      ...commandBase(fixture),
      ...syntheticUserContact(),
      name: "Pessoa sintetica criada sob espera",
      email: fixture.newEmail,
      roleIds: [],
      idempotencyKey: fixture.idempotencyKey,
    }),
  audit: ["user.created"],
  security: ["ACCOUNT_CREATED"],
};

/** grantRole where the target still holds a role that the locker revokes while the actor waits. */
const grantRoleOverRevokedRoleOp: OperationDef = {
  ...grantRoleOp,
  seed: (fixture) => giveRole(fixture.target.userId, roleIds.collaborator, fixture.actor.userId),
};

const gatedOperations = [
  grantRoleOp,
  revokeRoleOp,
  promoteRoleOp,
  changeUserAccessOp,
  resetUserPasswordOp,
  initializeUserPasswordOp,
];

const locks: Record<LockKind, LockPlan> = {
  // Taken first by currentAuthority, changeUserAccess and initializeUserPassword.
  advisory: {
    waitingStatement: "%pg_advisory_xact_lock%",
    acquire: async (locker) => {
      await locker.query(LAST_ADMINISTRATOR_LOCK);
    },
    release: "COMMIT",
    commitsChanges: false,
  },
  // Second lock: the SELECT ... FOR UPDATE over the actor and target "user" rows.
  "user-row": {
    waitingStatement: '%FROM "user"%FOR UPDATE%',
    acquire: async (locker, fixture) => {
      await locker.query('SELECT id FROM "user" WHERE id=$1 FOR UPDATE', [fixture.target.userId]);
    },
    release: "COMMIT",
    commitsChanges: false,
  },
  // Taken by findActiveUserRole (revokeRole, promoteRole), after the authority was checked.
  "target-role-held": {
    waitingStatement: "%user_role%FOR UPDATE%",
    acquire: async (locker, fixture) => {
      await locker.query(
        "SELECT id FROM user_role WHERE user_id=$1 AND revoked_at IS NULL FOR UPDATE",
        [fixture.target.userId],
      );
    },
    release: "COMMIT",
    commitsChanges: false,
  },
  // Taken by findOverlappingUserRole (grantRole): the concurrent revocation commits on release,
  // so the grant would otherwise go through.
  "target-role-revoked": {
    waitingStatement: "%user_role%FOR UPDATE%",
    acquire: async (locker, fixture) => {
      // Revoked as the system: filling revoked_by (a foreign key to "user") would take a
      // FOR KEY SHARE lock on the actor's row, and the operation would then wait on its own first
      // FOR UPDATE of "user" instead of on the user_role lock this scenario is about.
      await locker.query(
        `UPDATE user_role SET revoked_at=clock_timestamp(), revoked_by=NULL,
           revocation_origin='system', revocation_reason=$2
         WHERE user_id=$1 AND revoked_at IS NULL`,
        [fixture.target.userId, "Revogacao sintetica concorrente"],
      );
    },
    release: "COMMIT",
    commitsChanges: true,
  },
  // createUser: the INSERT into "user" waits for an uncommitted account with the same e-mail.
  "user-insert": {
    waitingStatement: '%INSERT INTO "user"%',
    acquire: async (locker, fixture) => {
      await locker.query(`INSERT INTO "user"(name,email) VALUES ('Concorrente sintetico',$1)`, [
        fixture.newEmail,
      ]);
    },
    release: "ROLLBACK",
    commitsChanges: false,
  },
  // createUser: the idempotency claim waits for an uncommitted record with the same key.
  idempotency: {
    waitingStatement: "%idempotency_record%",
    acquire: async (locker, fixture) => {
      await locker.query(
        `INSERT INTO idempotency_record(scope,key,request_fingerprint,expires_at)
         VALUES ('users:create',$1,'sintetico-concorrente',clock_timestamp()+interval '1 hour')`,
        [fixture.idempotencyKey],
      );
    },
    release: "ROLLBACK",
    commitsChanges: false,
  },
};

/** Whole-table state that no rejected operation may change (credential hashes only as digest). */
async function snapshot(db: Pick<Client, "query">) {
  const rows = async (sql: string) => (await db.query(sql)).rows as Record<string, unknown>[];
  return {
    users: await rows('SELECT id,email,status,version,updated_at FROM "user" ORDER BY id'),
    roles: await rows(
      `SELECT id,user_id,role_id,granted_by,grant_origin,valid_from,valid_until,revoked_at,
        revoked_by,revocation_origin,revocation_reason FROM user_role ORDER BY id`,
    ),
    access: await rows(
      "SELECT user_id,permissions,version,updated_by,updated_at FROM user_access ORDER BY user_id",
    ),
    accounts: await rows(
      `SELECT id,user_id,provider_id,issuer,account_id,updated_at,
        md5(coalesce(password,'')) AS password_digest FROM account ORDER BY id`,
    ),
    sessions: await rows("SELECT id,user_id,expires_at,revoked_at FROM session ORDER BY id"),
    verifications: await rows("SELECT id,value FROM verification ORDER BY id"),
    idempotency: await rows(
      "SELECT scope,key,status,response_reference FROM idempotency_record ORDER BY scope,key",
    ),
    audit: await rows("SELECT id,action,entity_id FROM audit_event ORDER BY id"),
    security: await rows("SELECT id,event_type,reason_code FROM security_event ORDER BY id"),
  };
}
type Snapshot = Awaited<ReturnType<typeof snapshot>>;

interface Exercise {
  operation: OperationDef;
  lock: LockKind;
  authority: Authority;
  /** Hold the lock until after the deadline. Defaults to true unless nothing depends on it. */
  pastDeadline?: boolean;
}

async function exercise({ operation, lock: lockKind, authority, pastDeadline }: Exercise) {
  const lock = locks[lockKind];
  const fixture = await seedFixture();
  await operation.seed(fixture);
  const appName = `authority-wait-${crypto.randomUUID()}`;
  const waiting = createDatabaseClient(container.getConnectionUri(), {
    application_name: appName,
    max: 1,
    statement_timeout: 15_000,
  });
  const locker = new Client({ connectionString: container.getConnectionUri() });
  await locker.connect();
  let pending: Promise<Settled> | undefined;
  try {
    await waiting.pool.query("SELECT 1");
    const deadline = (
      await admin.query<{ at: Date }>(
        `SELECT clock_timestamp()+interval '${DEADLINE_SECONDS} seconds' AS at`,
      )
    ).rows[0]!.at;
    if (authority === "session-expires") {
      await admin.query("UPDATE session SET expires_at=$2 WHERE id=$1", [
        fixture.actor.sessionId,
        deadline,
      ]);
    } else if (authority === "role-expires") {
      // user_role_validity: valid_until (deadline) is after valid_from (seeding time).
      await admin.query(
        "UPDATE user_role SET valid_until=$2 WHERE user_id=$1 AND revoked_at IS NULL",
        [fixture.actor.userId, deadline],
      );
    }

    await locker.query("BEGIN");
    await lock.acquire(locker, fixture);
    if (authority === "role-revoked") {
      // Revocation inside the locker's transaction: it becomes visible only when the lock is freed.
      await locker.query(
        `UPDATE user_role SET revoked_at=clock_timestamp(), revoked_by=$1,
          revocation_reason='Revogacao sintetica do cargo do ator'
         WHERE user_id=$1 AND revoked_at IS NULL`,
        [fixture.actor.userId],
      );
    }
    const baselineFromLocker = lock.commitsChanges || authority === "role-revoked";
    const before = await snapshot(baselineFromLocker ? locker : admin);

    pending = operation.run(waiting.pool, fixture).then(
      (): Settled => ({ settled: "fulfilled" }),
      (error: unknown): Settled => ({ settled: "rejected", error }),
    );

    await expect
      .poll(
        async () =>
          (
            await admin.query<{ n: number }>(
              `SELECT count(*)::int AS n FROM pg_stat_activity
               WHERE application_name=$1 AND wait_event_type='Lock' AND query LIKE $2`,
              [appName, lock.waitingStatement],
            )
          ).rows[0]!.n,
        {
          timeout: WAIT_DETECTION_TIMEOUT_MS,
          message: `${operation.name} never blocked on the ${lockKind} lock`,
        },
      )
      .toBe(1);
    // The wait must start, and its transaction (now() is frozen at BEGIN) must have begun, before
    // the deadline; otherwise the scenario would not exercise an expiry during the wait.
    const timing = await admin.query(
      `SELECT xact_start < $2::timestamptz AS began_before_deadline,
        clock_timestamp() < $2::timestamptz AS waiting_before_deadline
       FROM pg_stat_activity WHERE application_name=$1 AND wait_event_type='Lock'`,
      [appName, deadline],
    );
    expect(timing.rows).toEqual([{ began_before_deadline: true, waiting_before_deadline: true }]);

    if (pastDeadline ?? authority !== "role-revoked") {
      await admin.query(
        "SELECT pg_sleep(greatest(0,extract(epoch FROM $1::timestamptz-clock_timestamp()))+0.1)",
        [deadline],
      );
    }
    await locker.query(lock.release);
    const settled = await pending;
    const after = await snapshot(admin);
    return { settled, before, after };
  } finally {
    await locker.query("ROLLBACK").catch(() => undefined);
    await pending;
    await waiting.close();
    await locker.end();
  }
}

function rejectionOf(settled: Settled): unknown {
  return settled.settled === "rejected" ? settled.error : { unexpectedSuccess: true };
}

function expectRejected(operation: OperationDef, settled: Settled, status: 401 | 403) {
  const error = rejectionOf(settled);
  const reason = `${operation.name} must be rejected with ${status} instead of completing`;
  if (status === 401) expect(error, reason).toBeInstanceOf(AuthenticationRequiredError);
  expect(error, reason).toMatchObject({ status });
}

function expectNothingPersisted(before: Snapshot, after: Snapshot) {
  // No success audit, no security event, no persisted change in any related table.
  expect(after.audit).toEqual(before.audit);
  expect(after.security).toEqual(before.security);
  expect(after).toEqual(before);
}

function expectApplied(
  operation: OperationDef,
  settled: Settled,
  before: Snapshot,
  after: Snapshot,
) {
  expect(settled).toEqual({ settled: "fulfilled" });
  const known = (rows: Record<string, unknown>[]) => new Set(rows.map((row) => row.id));
  const knownAudit = known(before.audit);
  const knownSecurity = known(before.security);
  expect(
    after.audit
      .filter((row) => !knownAudit.has(row.id))
      .map((row) => row.action)
      .sort(),
  ).toEqual([...operation.audit].sort());
  expect(
    after.security
      .filter((row) => !knownSecurity.has(row.id))
      .map((row) => row.reason_code)
      .sort(),
  ).toEqual([...operation.security].sort());
  expect(after).not.toEqual(before);
}

beforeAll(async () => {
  container = await startPostgres();
  await runMigrations(container.getConnectionUri());
  admin = new Client({ connectionString: container.getConnectionUri() });
  await admin.connect();
  // manager and collaborator come from migration 0026; administrator is created here, as the
  // other suites do. Roles and permissions are never truncated, so the permission table keeps the
  // rows that effective_user_permission needs.
  await admin.query(
    `INSERT INTO role(code,name,description,is_administrative)
     VALUES ('administrator','Administrador','Administrador sintetico',true) ON CONFLICT DO NOTHING`,
  );
  const roles = await admin.query<{ id: string; code: RoleCode }>(
    "SELECT id,code FROM role WHERE code IN ('administrator','manager','collaborator')",
  );
  roleIds = Object.fromEntries(roles.rows.map((row) => [row.code, row.id])) as Record<
    RoleCode,
    string
  >;
  expect(Object.keys(roleIds).sort()).toEqual(["administrator", "collaborator", "manager"]);
}, 120_000);

afterAll(async () => {
  await admin?.end();
  await container?.stop();
});

beforeEach(async () => {
  await admin.query('TRUNCATE "user", verification, idempotency_record CASCADE');
});

describe("authority expiry while waiting for a lock", () => {
  describe("actor session expires during the wait for the advisory lock", () => {
    it.each(gatedOperations)("$name rejects with 401 and persists nothing", async (operation) => {
      const { settled, before, after } = await exercise({
        operation,
        lock: "advisory",
        authority: "session-expires",
      });
      expectRejected(operation, settled, 401);
      expectNothingPersisted(before, after);
    });
  });

  describe("actor session expires during the wait for the second lock (user row FOR UPDATE)", () => {
    // Proves the session is read again after the SELECT ... FOR UPDATE, not only after the
    // advisory lock.
    it.each(gatedOperations)("$name rejects with 401 and persists nothing", async (operation) => {
      const { settled, before, after } = await exercise({
        operation,
        lock: "user-row",
        authority: "session-expires",
      });
      expectRejected(operation, settled, 401);
      expectNothingPersisted(before, after);
    });
  });

  describe("actor administrative role ends during the wait for the advisory lock", () => {
    const cases = (["role-expires", "role-revoked"] as const).flatMap((authority) =>
      [grantRoleOp, changeUserAccessOp].map((operation) => ({
        authority,
        operation,
        name: operation.name,
      })),
    );
    it.each(cases)(
      "$name rejects with 403 and persists nothing when the role is $authority",
      async ({ operation, authority }) => {
        const { settled, before, after } = await exercise({
          operation,
          lock: "advisory",
          authority,
        });
        expectRejected(operation, settled, 403);
        expectNothingPersisted(before, after);
      },
    );
  });

  describe("positive control: same setup with an unexpired session", () => {
    it.each(gatedOperations)(
      "$name completes and audits once the lock is released",
      async (operation) => {
        const { settled, before, after } = await exercise({
          operation,
          lock: "advisory",
          authority: "none",
          pastDeadline: true,
        });
        expectApplied(operation, settled, before, after);
      },
    );
  });

  // Locks taken after currentAuthority has already approved the actor. The session expires while
  // the operation waits on them, so the correct behavior is still a 401 with nothing persisted:
  // authority must hold when the operation acts, not only when it started.
  describe("actor session expires during a lock taken after the authority check", () => {
    const cases: { name: string; operation: OperationDef; lock: LockKind }[] = [
      // findOverlappingUserRole
      { name: "grantRole", operation: grantRoleOverRevokedRoleOp, lock: "target-role-revoked" },
      // findActiveUserRole
      { name: "revokeRole", operation: revokeRoleOp, lock: "target-role-held" },
      // findActiveUserRole
      { name: "promoteRole", operation: promoteRoleOp, lock: "target-role-held" },
      // INSERT INTO "user" (unique e-mail)
      { name: "createUser (user insert)", operation: createUserOp, lock: "user-insert" },
      // INSERT INTO idempotency_record (unique scope/key)
      { name: "createUser (idempotency claim)", operation: createUserOp, lock: "idempotency" },
    ];

    it.each(cases)("$name rejects with 401 and persists nothing", async (scenario) => {
      const { settled, before, after } = await exercise({
        operation: scenario.operation,
        lock: scenario.lock,
        authority: "session-expires",
      });
      expectRejected(scenario.operation, settled, 401);
      expectNothingPersisted(before, after);
    });

    it.each(cases)(
      "positive control: $name completes with an unexpired session",
      async (scenario) => {
        const { settled, before, after } = await exercise({
          operation: scenario.operation,
          lock: scenario.lock,
          authority: "none",
          pastDeadline: false,
        });
        expectApplied(scenario.operation, settled, before, after);
      },
    );
  });
});
