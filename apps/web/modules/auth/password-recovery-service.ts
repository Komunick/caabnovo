import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { Pool } from "pg";
import { APIError } from "better-auth/api";
import { hashPassword } from "better-auth/crypto";
import { withTransaction } from "@caab/db";
import { writeAuditEvent } from "@caab/db/repositories/audit-writer";
import { newPasswordSchema } from "@caab/contracts";
import { z } from "zod";

export const resetIdentifier = (token: string) =>
  `caab-reset:${createHash("sha256").update(token).digest("hex")}`;
const invalidLink = () =>
  new APIError("BAD_REQUEST", {
    code: "INVALID_TOKEN",
    message: "Invalid or expired recovery link",
  });

export async function requestPasswordRecovery(
  pool: Pool,
  email: unknown,
  send: (data: { user: { id: string; email: string }; token: string }) => Promise<void>,
) {
  const address = z.email().max(254).parse(email).toLowerCase();
  await withTransaction(pool, async (client) => {
    const {
      rows: [user],
    } = await client.query<{ id: string; email: string }>(
      `SELECT u.id,u.email FROM "user" u WHERE u.email=$1 AND u.status='active'
      AND EXISTS (SELECT 1 FROM account a WHERE a.user_id=u.id AND a.provider_id='credential' AND a.password IS NOT NULL) FOR UPDATE`,
      [address],
    );
    if (!user) return;
    const token = randomBytes(32).toString("hex");
    await client.query(
      "DELETE FROM verification WHERE value=$1 AND (identifier LIKE 'caab-reset:%' OR identifier LIKE 'reset-password:%')",
      [user.id],
    );
    await client.query(
      "INSERT INTO verification (id,identifier,value,expires_at) VALUES ($1,$2,$3,now()+interval '30 minutes')",
      [randomUUID(), resetIdentifier(token), user.id],
    );
    await send({ user, token });
  });
}

export async function resetPasswordRecovery(pool: Pool, body: unknown, requestId: string) {
  const parsed = z
    .object({ token: z.string().regex(/^[a-f0-9]{64}$/), newPassword: newPasswordSchema })
    .strict()
    .safeParse(body);
  if (!parsed.success) throw invalidLink();
  const { token, newPassword } = parsed.data;
  // Read the owner first, then lock the user before any token/credential/session rows.
  // Settings changes and reset requests use this same order.
  const {
    rows: [candidate],
  } = await pool.query<{ value: string }>(
    "SELECT value FROM verification WHERE identifier=$1 AND expires_at>now()",
    [resetIdentifier(token)],
  );
  if (!candidate) throw invalidLink();
  const passwordHash = await hashPassword(newPassword);
  await withTransaction(pool, async (client) => {
    const {
      rows: [user],
    } = await client.query<{ id: string }>(
      `SELECT id FROM "user" WHERE id=$1 AND status='active' FOR UPDATE`,
      [candidate.value],
    );
    if (!user) throw invalidLink();
    const consumed = await client.query(
      "DELETE FROM verification WHERE identifier=$1 AND value=$2 AND expires_at>now() RETURNING id",
      [resetIdentifier(token), user.id],
    );
    if (!consumed.rowCount) throw invalidLink();
    const updated = await client.query(
      "UPDATE account SET password=$2,updated_at=now() WHERE user_id=$1 AND provider_id='credential' AND password IS NOT NULL",
      [user.id, passwordHash],
    );
    if (updated.rowCount !== 1) throw invalidLink();
    await client.query('UPDATE "user" SET version=version+1,updated_at=now() WHERE id=$1', [
      user.id,
    ]);
    await client.query(
      "UPDATE account_email_change SET consumed_at=now() WHERE user_id=$1 AND consumed_at IS NULL",
      [user.id],
    );
    await client.query("DELETE FROM verification WHERE value=$1", [user.id]);
    await client.query("DELETE FROM session WHERE user_id=$1", [user.id]);
    await writeAuditEvent(client, {
      actorUserId: user.id,
      effectiveIdentity: `user:${user.id}`,
      action: "user.password.reset",
      entityType: "user",
      entityId: user.id,
      reason: "Redefinição confirmada por link de recuperação",
      origin: "web",
      requestId,
      correlationId: requestId,
    });
  });
}
