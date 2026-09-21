import { Writable } from "node:stream";
import { expect, it } from "vitest";
import { readCsv, readXlsx, readPdf } from "../../../tests/helpers/read-export";
import { writeCsv } from "./csv";
import { writeXlsx } from "./xlsx";
import { writePdf } from "./pdf";
import type { ExportColumn } from "@caab/contracts";
const columns: ExportColumn[] = ["id", "name"].map((key) => ({
  key,
  label: key,
  scalarType: "text",
  sortable: true,
  defaultSelected: true,
}));
async function* records() {
  for (let n = 0; n < 100; n++)
    yield {
      id: String(n),
      values: {
        id: String(n).padStart(6, "0"),
        name: n === 0 ? '=1+1,"João"\nSalvador' : `Pessoa ${n}`,
      },
    };
}
function target() {
  const chunks: Buffer[] = [];
  const sink = new Writable({
    highWaterMark: 256,
    write(chunk, _encoding, callback) {
      chunks.push(Buffer.from(chunk));
      setTimeout(callback, 1);
    },
  });
  return { sink, bytes: () => Buffer.concat(chunks) };
}
it("CSV preserves 100 rows, identifiers, quoted newlines and neutralizes formulas", async () => {
  const t = target();
  await writeCsv(records(), columns, t.sink, new AbortController().signal);
  const rows = readCsv(t.bytes());
  expect(rows).toHaveLength(101);
  expect(rows[1]).toEqual(["000000", `'=1+1,"João"\nSalvador`]);
  expect(rows[100]).toEqual(["000099", "Pessoa 99"]);
});
it("XLSX streams to a slow sink and preserves string cells and all 100 records", async () => {
  const t = target();
  await writeXlsx(records(), columns, t.sink, new AbortController().signal);
  const sheets = readXlsx(t.bytes());
  expect(sheets[1]).toHaveLength(101);
  expect(sheets[1]![1]).toEqual(["000000", '=1+1,"João"\nSalvador']);
  expect(sheets[1]![100]).toEqual(["000099", "Pessoa 99"]);
}, 30000);
it("XLSX reconstructs Unicode, natural markers and simultaneous long cells across sheets", async () => {
  const values = { id: "#CAAB:natural" + "😀\n".repeat(400), name: "Nome ç𐐀".repeat(6000) };
  async function* source() {
    yield { id: "logical", values };
  }
  const t = target();
  await writeXlsx(source(), columns, t.sink, new AbortController().signal, { sheetRows: 2 });
  const sheets = readXlsx(t.bytes()).slice(1);
  expect(sheets.length).toBeGreaterThan(1);
  const rebuilt = ["", ""];
  for (const sheet of sheets)
    for (const row of sheet.slice(1))
      for (let col = 0; col < 2; col++) {
        const cell = row[col] ?? "";
        expect(cell.length).toBeLessThanOrEqual(32767);
        expect(cell.split("\n").length - 1).toBeLessThanOrEqual(253);
        rebuilt[col] += cell
          .replace(/^#CAAB:r=1;c=\d+;p=\d+\/\d+#/, "")
          .replace(/^##CAAB:/, "#CAAB:");
      }
  expect(rebuilt).toEqual([values.id, values.name]);
}, 30000);
it("PDF repeats columns across pages and emits every record", async () => {
  const t = target();
  await writePdf(records(), columns, t.sink, new AbortController().signal);
  const pages = await readPdf(t.bytes());
  expect(pages.length).toBeGreaterThan(1);
  expect(pages.every((p) => p.includes("name"))).toBe(true);
  expect(pages.join(" ")).toContain("Pessoa 99");
}, 30000);
it("writers reject cancellation without reporting a complete file", async () => {
  for (const writer of [writeCsv, writeXlsx, writePdf]) {
    const controller = new AbortController();
    controller.abort();
    const t = target();
    await expect(writer(records(), columns, t.sink, controller.signal)).rejects.toBeDefined();
  }
});
