import { Writable } from "node:stream";
import { expect, it, vi } from "vitest";
import { runExport } from "./service";
import { writeCsv } from "./formats/csv";
import type { ExportColumn } from "@caab/contracts";
const columns: ExportColumn[] = [
  { key: "name", label: "Nome", scalarType: "text", sortable: true, defaultSelected: true },
];
function fixture(delay = 0) {
  let closed = false;
  const phases: string[] = [];
  const chunks: Buffer[] = [];
  const sink = new Writable({
    highWaterMark: 1,
    write(chunk, _e, cb) {
      chunks.push(Buffer.from(chunk));
      setTimeout(cb, delay);
    },
  });
  return {
    sink,
    chunks,
    phases,
    get closed() {
      return closed;
    },
    deps: {
      columns,
      write: writeCsv,
      async *batches() {
        try {
          for (let batch = 0; batch < 5; batch++)
            yield Array.from({ length: 20 }, (_, n) => ({
              id: String(batch * 20 + n),
              values: { name: `Pessoa ${batch * 20 + n}` },
            }));
        } finally {
          closed = true;
        }
      },
      authorize: vi.fn(async (ids: readonly string[]) => {
        expect(ids.length).toBeLessThanOrEqual(100);
      }),
      update: vi.fn(async (phase: string) => {
        phases.push(phase);
      }),
      heartbeatMs: 10000,
    },
  };
}
it("exports every row and marks completed only after sink completion", async () => {
  const f = fixture();
  await runExport(f.deps, f.sink, new AbortController().signal);
  expect(f.closed).toBe(true);
  expect(f.phases.at(-1)).toBe("completed");
  expect(f.sink.writableFinished).toBe(true);
  expect(Buffer.concat(f.chunks).toString()).toContain("Pessoa 99");
  expect(new Set(f.deps.authorize.mock.calls.flatMap((c) => c[0])).size).toBe(100);
});
it("aborts the whole export if a record loses authorization, without omitting it", async () => {
  const f = fixture();
  f.deps.authorize.mockImplementation(async (ids) => {
    if (ids.includes("40")) throw new Error("PERMISSION_DENIED");
  });
  await expect(runExport(f.deps, f.sink, new AbortController().signal)).rejects.toThrow(
    "PERMISSION_DENIED",
  );
  expect(f.closed).toBe(true);
  expect(f.phases.at(-1)).toBe("failed");
  expect(f.phases).not.toContain("completed");
});
it("keeps checking authorization during backpressure and stops on control failure", async () => {
  const f = fixture(30);
  let checks = 0;
  f.deps.heartbeatMs = 5;
  f.deps.authorize.mockImplementation(async () => {
    if (++checks > 3) throw new Error("CONTROL_UNAVAILABLE");
  });
  await expect(runExport(f.deps, f.sink, new AbortController().signal)).rejects.toBeDefined();
  expect(f.phases).not.toContain("completed");
  expect(f.sink.destroyed).toBe(true);
});
it("closes the source after browser cancellation and records cancellation", async () => {
  const f = fixture(10),
    controller = new AbortController();
  setTimeout(() => controller.abort(), 35);
  await expect(runExport(f.deps, f.sink, controller.signal)).rejects.toBeDefined();
  expect(f.closed).toBe(true);
  expect(f.phases.at(-1)).toBe("cancelled");
});
it("records failure when the data pool cannot open without a false completion", async () => {
  const f = fixture();
  f.deps.batches = async function* () {
    yield await Promise.reject(new Error("POOL_UNAVAILABLE"));
  };
  await expect(runExport(f.deps, f.sink, new AbortController().signal)).rejects.toThrow(
    "POOL_UNAVAILABLE",
  );
  expect(f.phases.at(-1)).toBe("failed");
  expect(f.phases).not.toContain("completed");
});
