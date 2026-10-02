import { Client, Pool } from "pg";
import { Writable } from "node:stream";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { runMigrations } from "@caab/db";
import type { ExportRequest } from "@caab/contracts";
import { startPostgres } from "../../../../packages/db/tests/postgres-container";
import { schedulingExports } from "../../modules/scheduling/export-adapter";
import {
  schedulingExportFixtures,
  schedulingAbsenceExportFixtures,
} from "../../modules/scheduling/export-fixtures";
import { exportBatches } from "../../modules/exports/query";
import { authorizeCurrentExport, lookupExport } from "../../modules/exports/runtime";
import { writeCsv } from "../../modules/exports/formats/csv";
import { writeXlsx } from "../../modules/exports/formats/xlsx";
import { writePdf } from "../../modules/exports/formats/pdf";
import { readCsv, readXlsx, readPdf } from "../helpers/read-export";
import type { RequestActor } from "../../modules/shared/request-context";

let container: StartedPostgreSqlContainer,
  admin: Client,
  data: Pool,
  control: Pool,
  actor: RequestActor;
const signal = () => new AbortController().signal;
beforeAll(async () => {
  container = await startPostgres({ memory: 0.25, cpu: 1 });
  await runMigrations(container.getConnectionUri());
  admin = new Client({ connectionString: container.getConnectionUri() });
  await admin.connect();
  const userId = (
    await admin.query(
      `INSERT INTO "user"(name,email) VALUES('Exportação sintética','scheduling-export@example.test') RETURNING id`,
    )
  ).rows[0].id;
  const sessionId = crypto.randomUUID();
  await admin.query(
    "INSERT INTO session(id,token,user_id,expires_at) VALUES($1,$1,$2,now()+interval '1 hour')",
    [sessionId, userId],
  );
  await admin.query(
    "INSERT INTO user_access(user_id,permissions,updated_by) VALUES($1,ARRAY['scheduling:read','exports:generate'],$1)",
    [userId],
  );
  actor = { userId, sessionId, permissions: new Set(["scheduling:read", "exports:generate"]) };
  await admin.query(
    `CREATE TEMP TABLE export_fixture AS SELECT * FROM jsonb_to_recordset($1::jsonb)
    AS f(id uuid,"memberName" text,"startsAt" timestamptz,status text,description text,"forbiddenCpf" text)`,
    [JSON.stringify(schedulingExportFixtures)],
  );
  await admin.query(`INSERT INTO member(id,name,cpf) SELECT id,"memberName",CASE WHEN row_number() OVER(ORDER BY id)=1 THEN '12345678901' END FROM export_fixture;
    INSERT INTO scheduling_unit(id,name) SELECT id,'Unidade '||id FROM export_fixture;
    INSERT INTO scheduling_service(id,unit_id,name) SELECT id,id,'Serviço '||id FROM export_fixture;
    INSERT INTO scheduling_procedure(id,unit_id,service_id,name,duration_minutes,description) SELECT id,id,id,'Procedimento '||id,60,coalesce(description,'') FROM export_fixture;
    INSERT INTO scheduling_professional(id,name) SELECT id,'Profissional '||id FROM export_fixture;
    INSERT INTO scheduling_assignment(id,unit_id,procedure_id,professional_id) SELECT id,id,id,id FROM export_fixture;
    INSERT INTO scheduling_unit_hours(unit_id,weekday,start_local,end_local) SELECT id,1,'08:00','18:00' FROM export_fixture;
    INSERT INTO scheduling_professional_hours(professional_id,unit_id,weekday,start_local,end_local,lunch_start,lunch_end) SELECT id,id,1,'08:00','18:00','12:00','13:00' FROM export_fixture;`);
  await admin.query(
    `INSERT INTO scheduling_booking(id,assignment_id,professional_id,member_id,starts_at,ends_at,duration_snapshot,status,created_by)
    SELECT id,id,id,id,"startsAt","startsAt"+interval '1 hour',60,status,$1 FROM export_fixture`,
    [userId],
  );
  await admin.query(
    `INSERT INTO scheduling_absence(id,booking_id,member_id,recorded_by,recorded_at,appeal_deadline,restriction_ends_at)
    SELECT id,id,id,$1,'2030-01-03T12:00:00Z'::timestamptz,'2030-01-03T12:00:00Z'::timestamptz+interval '168 hours','2030-01-03T12:00:00Z'::timestamptz+interval '720 hours' FROM export_fixture`,
    [userId],
  );
  const url = new URL(container.getConnectionUri());
  url.username = "caab_runtime";
  url.password = "change-me-runtime";
  data = new Pool({ connectionString: url.toString(), max: 1 });
  control = new Pool({ connectionString: url.toString(), max: 1 });
}, 120000);
afterAll(async () => {
  await data?.end();
  await control?.end();
  await admin?.end();
  await container?.stop();
});
const cases: {
  dataset: string;
  column: string;
  filters: Record<string, string>;
  expected: [string, string][];
}[] = [
  {
    dataset: "bookings",
    column: "memberName",
    filters: { from: "2030-01-01", to: "2030-12-31" },
    expected: schedulingExportFixtures.map((f) => [f.memberName, f.id]),
  },
  {
    dataset: "catalog",
    column: "name",
    filters: { kind: "procedures" },
    expected: schedulingExportFixtures.map((f) => [`Procedimento ${f.id}`, f.id]),
  },
  {
    dataset: "hours",
    column: "start",
    filters: { kind: "professionals" },
    expected: schedulingExportFixtures.map((f) => ["08:00", `professionals/${f.id}/${f.id}/1`]),
  },
  {
    dataset: "absences",
    column: "memberName",
    filters: { from: "2030-01-03", to: "2030-12-31" },
    expected: schedulingAbsenceExportFixtures.map((f) => [f.memberName, f.id]),
  },
];
function request(entry = cases[0]!): ExportRequest {
  return {
    module: "scheduling",
    dataset: entry.dataset,
    columns: [entry.column, "id"],
    filters: entry.filters,
    sort: [{ field: "id", direction: "asc" }],
    format: "csv",
  };
}
async function collect(input: ExportRequest) {
  const adapter = lookupExport(input.module, input.dataset),
    output = [];
  for await (const batch of exportBatches(data, adapter, input, signal(), 17))
    output.push(...batch);
  return output;
}
async function file(input: ExportRequest) {
  const adapter = lookupExport(input.module, input.dataset),
    controller = new AbortController();
  const chunks: Buffer[] = [];
  const sink = new Writable({
    write(chunk, _encoding, callback) {
      chunks.push(Buffer.from(chunk));
      callback();
    },
  });
  const columns = input.columns.map((key) => adapter.columns.find((column) => column.key === key)!);
  await authorizeCurrentExport(control, adapter, actor, input, [], controller.signal);
  async function* rows() {
    for await (const batch of exportBatches(data, adapter, input, controller.signal, 17)) {
      await authorizeCurrentExport(
        control,
        adapter,
        actor,
        input,
        batch.map((row) => row.id),
        controller.signal,
      );
      yield* batch;
    }
  }
  await { csv: writeCsv, xlsx: writeXlsx, pdf: writePdf }[input.format](
    rows(),
    columns,
    sink,
    controller.signal,
  );
  return { bytes: Buffer.concat(chunks), columns };
}
describe.sequential("scheduling exports through SQL cursor and independent file parsers", () => {
  for (const entry of cases) {
    for (const format of ["csv", "xlsx", "pdf"] as const) {
      it(`exports all 100 ${entry.dataset} rows with ordered columns in ${format}`, async () => {
        const input = { ...request(entry), format },
          result = await file(input);
        if (format === "pdf") {
          const text = (await readPdf(result.bytes)).join(" ").replace(/\s/g, "");
          let offset = -1;
          for (const [value, id] of entry.expected) {
            const next = text.indexOf(id.replace(/\s/g, ""), offset + 1);
            expect(next).toBeGreaterThan(offset);
            offset = next;
            // PDF text extraction interleaves columns on each visual line.
            for (const line of value.split("\n")) expect(text).toContain(line.replace(/\s/g, ""));
          }
          expect(text).not.toContain("12345678901");
        } else {
          const rows = format === "csv" ? readCsv(result.bytes) : readXlsx(result.bytes)[1];
          const expected = entry.expected.map((row) =>
            row.map((value) => (format === "csv" && /^[=+@-]/.test(value) ? "'" + value : value)),
          );
          expect(rows).toEqual([result.columns.map((c) => c.label), ...expected]);
        }
      }, 60000);
      it(`exports empty ${entry.dataset} with headers in ${format}`, async () => {
        const result = await file({
          ...request(entry),
          format,
          filters: { ...entry.filters, unitId: "ffffffff-ffff-4fff-8fff-ffffffffffff" },
        });
        if (format === "pdf") {
          const text = (await readPdf(result.bytes)).join(" ");
          for (const column of result.columns) expect(text).toContain(column.label);
          expect(text).not.toContain(schedulingExportFixtures[0]!.id);
        } else
          expect(format === "csv" ? readCsv(result.bytes) : readXlsx(result.bytes)[1]).toEqual([
            result.columns.map((c) => c.label),
          ]);
      }, 60000);
    }
  }
  it("combines filters, preserves long cells, projects all five catalogs and both hours sources", async () => {
    const first = schedulingExportFixtures[0]!;
    expect(
      await collect({
        ...request(),
        filters: {
          memberId: first.id,
          unitId: first.id,
          professionalId: first.id,
          status: "cancelled",
          q: "Beneficiário",
          from: "2030-01-02",
          to: "2030-01-02",
        },
      }),
    ).toHaveLength(1);
    expect(await collect({ ...request(), filters: { q: "%_" } })).toHaveLength(0);
    for (const kind of ["units", "services", "procedures", "professionals", "assignments"])
      expect(await collect({ ...request(cases[1]), filters: { kind } })).toHaveLength(100);
    expect(await collect({ ...request(cases[2]), filters: { kind: "units" } })).toHaveLength(100);
    const rows = await collect({
      ...request(cases[1]),
      columns: ["description"],
      filters: { kind: "procedures", procedureId: first.id },
    });
    expect(rows[0]!.values.description).toBe(first.description);
  });
  it("reauthorizes current grants between batches and refuses expired/revoked sessions", async () => {
    const adapter = schedulingExports[0]!,
      input = request(),
      iterator = exportBatches(data, adapter, input, signal(), 17);
    const first = await iterator.next();
    expect(first.value).toHaveLength(17);
    try {
      await admin.query(
        "UPDATE user_access SET permissions=ARRAY['exports:generate'] WHERE user_id=$1",
        [actor.userId],
      );
      await expect(
        authorizeCurrentExport(
          control,
          adapter,
          actor,
          input,
          first.value!.map((row) => row.id),
          signal(),
        ),
      ).rejects.toMatchObject({ code: "PERMISSION_DENIED" });
      await admin.query(
        "UPDATE user_access SET permissions=ARRAY['scheduling:read','exports:generate'] WHERE user_id=$1",
        [actor.userId],
      );
      await admin.query("UPDATE session SET revoked_at=now() WHERE id=$1", [actor.sessionId]);
      await expect(
        authorizeCurrentExport(control, adapter, actor, input, [], signal()),
      ).rejects.toBeDefined();
    } finally {
      await iterator.return();
      await admin.query(
        "UPDATE user_access SET permissions=ARRAY['scheduling:read','exports:generate'] WHERE user_id=$1",
        [actor.userId],
      );
      await admin.query("UPDATE session SET revoked_at=NULL WHERE id=$1", [actor.sessionId]);
    }
  });
  it("filters absence metadata by the same name/status semantics and never exports review text or evidence", async () => {
    const first = schedulingAbsenceExportFixtures[0]!;
    await admin.query(
      "INSERT INTO scheduling_absence_appeal(absence_id,kind,explanation,submitted_by,submitted_at) VALUES($1,'justification',$2,$3,'2030-01-03T13:00:00Z')",
      [first.id, first.privateExplanation, actor.userId],
    );
    const evidenceId = crypto.randomUUID();
    await admin.query(
      `INSERT INTO stored_file(id,owner_type,owner_id,original_name,object_key,quarantine_key,declared_mime,visibility,status,scan_result,uploaded_by)
      VALUES($1,'member',$2,$3,$4,$4,'application/pdf','private','available','clean',$5)`,
      [
        evidenceId,
        first.id,
        first.privateEvidence,
        `absence-export-proof/${evidenceId}`,
        actor.userId,
      ],
    );
    await admin.query("INSERT INTO scheduling_absence_evidence(absence_id,file_id) VALUES($1,$2)", [
      first.id,
      evidenceId,
    ]);
    const input: ExportRequest = {
      ...request(cases[3]),
      filters: { q: "Beneficiário", status: "under_review", from: "2030-01-03", to: "2030-01-03" },
      columns: ["memberName", "status", "appealKind", "recordedAt", "id"],
    };
    const rows = await collect(input);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.values).toMatchObject({
      id: first.id,
      status: "Em análise",
      appealKind: "Justificativa",
      recordedAt: "03/01/2030 09:00:00",
    });
    expect(
      await collect({ ...input, filters: { q: "Beneficiário", status: "accepted" } }),
    ).toHaveLength(0);
    expect(await collect({ ...input, filters: { q: "%_" } })).toHaveLength(0);
    for (const format of ["csv", "xlsx", "pdf"] as const) {
      const result = await file({ ...input, format });
      const content =
        format === "pdf"
          ? (await readPdf(result.bytes)).join(" ")
          : JSON.stringify(format === "csv" ? readCsv(result.bytes) : readXlsx(result.bytes)[1]);
      expect(content).toContain("Beneficiário");
      expect(content).toContain("Em análise");
      expect(content).not.toContain(first.privateExplanation);
      expect(content).not.toContain(first.privateEvidence);
    }
    for (const forbidden of ["explanation", "evidenceFileIds", "email"])
      expect(() =>
        lookupExport("scheduling", "absences").query({ ...input, columns: [forbidden] }),
      ).toThrow("EXPORT_CONFIGURATION_INVALID");
  });
});
