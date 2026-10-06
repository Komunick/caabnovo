import { Writable } from "node:stream";
import { expect, it } from "vitest";
import { readCsv, readXlsx, readPdf } from "../../../tests/helpers/read-export";
import { writeCsv } from "./csv";
import { writeXlsx } from "./xlsx";
import { createPdfWriter, writePdf } from "./pdf";
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
it("executive PDF restores management analysis and paginated bars without changing selected table columns", async () => {
  async function* source() {
    for (let n = 0; n < 35; n++)
      yield {
        id: String(n),
        values: { name: `Indicador ${n}`, hidden: "COLUNA_NAO_SELECIONADA" },
        chart: {
          label: `2026-${String(n + 1).padStart(2, "0")} Série sintética com rótulo extenso`,
          value: n,
        },
      };
  }
  const t = target();
  await createPdfWriter({
    title: "Resultados e evolução",
    context: "2020-01-01 a 2026-10-06 | Teste",
    notes: "Comentário da gestão ".repeat(95) + "FIM_ANALISE",
    evolution: true,
  })(source(), [columns[1]!], t.sink, new AbortController().signal);
  const pages = await readPdf(t.bytes()),
    text = pages.join(" ");
  expect(text).toContain("Análise da gestão");
  expect(text.replace(/\s/g, "")).toContain("FIM_ANALISE");
  expect(text).toContain("Evolução mensal (continuação)");
  expect(text).toContain("Indicador 34");
  expect(text).not.toContain("COLUNA_NAO_SELECIONADA");
  expect(text).toContain("2026-35");
}, 30000);
it("executive PDF makes an empty series explicit", async () => {
  async function* empty() {}
  const t = target();
  await createPdfWriter({
    title: "Resultados e evolução",
    context: "Teste",
    notes: "",
    evolution: true,
  })(empty(), columns, t.sink, new AbortController().signal);
  const text = (await readPdf(t.bytes())).join(" ");
  expect(text).toContain("Nenhum comentário incluído.");
  expect(text).toContain("Sem dados de evolução no período selecionado.");
});
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
it("PDF retains the end of a long value, Unicode escapes and columns in horizontal bands", async () => {
  const many = Array.from({ length: 6 }, (_, n) => ({
    ...columns[0]!,
    key: `c${n}`,
    label: `Coluna ${n}`,
  }));
  async function* source() {
    yield {
      id: "one",
      values: Object.fromEntries(
        many.map((c, n) => [
          c.key,
          n === 0 ? "Trecho longo ".repeat(1200) + "FIM_UNICODE 😀" : `VALOR_COLUNA_${n}`,
        ]),
      ),
    };
  }
  const t = target();
  await writePdf(source(), many, t.sink, new AbortController().signal);
  const pages = await readPdf(t.bytes()),
    text = pages.join(" ");
  expect(pages.length).toBeGreaterThan(2);
  expect(text.replace(/\s/g, "")).toContain("FIM_UNICODE");
  expect(text).toContain("\\u{1F600}");
  for (let n = 1; n < 6; n++) expect(text).toContain(`VALOR_COLUNA_${n}`);
  expect(text.indexOf("VALOR_COLUNA_3")).toBeLessThan(text.indexOf("VALOR_COLUNA_4"));
}, 30000);
