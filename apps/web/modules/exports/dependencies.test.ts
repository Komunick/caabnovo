import { Writable } from "node:stream";
import { setTimeout } from "node:timers/promises";
import { writeFile } from "node:fs/promises";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import Cursor from "pg-cursor";
import { expect, it } from "vitest";
import { readXlsx, readPdf } from "../../tests/helpers/read-export";

it("streams 100 synthetic records under Node 24 to a slow consumer and independent readers", async () => {
  const start = performance.now(),
    before = process.memoryUsage().rss;
  let peak = before;
  const consume = () => {
    const chunks: Buffer[] = [];
    const sink = new Writable({
      highWaterMark: 1024,
      write(chunk, _encoding, callback) {
        peak = Math.max(peak, process.memoryUsage().rss);
        chunks.push(Buffer.from(chunk));
        void setTimeout(1).then(() => callback());
      },
    });
    return { sink, chunks };
  };
  const xlsx = consume();
  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
    stream: xlsx.sink,
    useSharedStrings: false,
    useStyles: false,
  });
  const sheet = workbook.addWorksheet("Dados");
  sheet.addRow(["Identificador", "Descrição"]).commit();
  const long = "Água & café 😀 ".repeat(1500);
  for (let index = 0; index < 100; index++)
    sheet.addRow([String(index).padStart(5, "0"), index === 0 ? long : `Pessoa ${index}`]).commit();
  sheet.commit();
  await workbook.commit();
  const rows = readXlsx(Buffer.concat(xlsx.chunks))[0]!;
  expect(rows).toHaveLength(101);
  expect(rows[1]).toEqual(["00000", long]);
  expect(rows[100]).toEqual(["00099", "Pessoa 99"]);
  const pdf = consume();
  const finished = new Promise<void>((resolve, reject) => {
    pdf.sink.once("finish", resolve);
    pdf.sink.once("error", reject);
  });
  const document = new PDFDocument({ bufferPages: false });
  document.pipe(pdf.sink);
  for (let index = 0; index < 100; index++)
    document.text(`Registro ${String(index).padStart(5, "0")} - João`);
  document.end();
  await finished;
  const pages = await readPdf(Buffer.concat(pdf.chunks));
  expect(pages.join(" ")).toContain("Registro 00099 - João");
  expect(pages.length).toBeGreaterThan(1);
  expect(new Cursor("SELECT $1::text", ["sintético"])).toBeInstanceOf(Cursor);
  const metrics = {
    records: 100,
    node: process.version,
    durationMs: Math.round(performance.now() - start),
    initialRss: before,
    peakRss: peak,
    rssDelta: peak - before,
    xlsxBytes: Buffer.concat(xlsx.chunks).length,
    pdfBytes: Buffer.concat(pdf.chunks).length,
  };
  if (process.env.EXPORT_SPIKE_REPORT)
    await writeFile(process.env.EXPORT_SPIKE_REPORT, JSON.stringify(metrics));
}, 30000);
