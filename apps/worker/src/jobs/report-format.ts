import PDFDocument from "pdfkit";
import writeXlsxFile from "write-excel-file/node";
import type { ReportRow } from "@caab/contracts";
export interface ReportDocument {
  title: string;
  context: string[];
  columns: Record<string, string>;
  rows: ReportRow[];
  notes: string;
  chart?: { label: string; value: number }[];
}
export function csvCell(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return `"${value}"`;
  let text = String(value ?? "");
  // eslint-disable-next-line no-control-regex -- Neutralize leading control characters used to hide spreadsheet formulas.
  if (/^[\s\u0000-\u001f]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}
export function reportCsv(doc: ReportDocument) {
  const keys = Object.keys(doc.columns);
  return Buffer.from(
    `\uFEFF${[
      ["Relatório", doc.title],
      ...doc.context.map((value) => ["Contexto", value]),
      ...(doc.notes ? [["Análise da gestão", doc.notes]] : []),
      Object.values(doc.columns),
      ...doc.rows.map((row) => keys.map((key) => row[key] ?? "")),
    ]
      .map((line) => line.map(csvCell).join(";"))
      .join("\r\n")}\r\n`,
    "utf8",
  );
}
export async function reportXlsx(doc: ReportDocument): Promise<Buffer> {
  const keys = Object.keys(doc.columns);
  const data = [
    Object.values(doc.columns).map((value) => ({
      type: String,
      value,
      fontWeight: "bold" as const,
    })),
    ...doc.rows.map((row) =>
      keys.map((key) =>
        typeof row[key] === "number"
          ? { type: Number, value: row[key] as number }
          : { type: String, value: String(row[key] ?? "") },
      ),
    ),
  ];
  const context = [
    doc.title,
    ...doc.context,
    ...(doc.notes ? [`Análise da gestão: ${doc.notes}`] : []),
  ].map((value) => [{ type: String, value }]);
  return writeXlsxFile([
    { data, sheet: "Dados", columns: keys.map(() => ({ width: 24 })) },
    { data: context, sheet: "Contexto", columns: [{ width: 100 }] },
  ]).toBuffer();
}
export async function reportPdf(doc: ReportDocument): Promise<Buffer> {
  const pdf = new PDFDocument({
    size: "A4",
    layout: Object.keys(doc.columns).length > 5 ? "landscape" : "portrait",
    margin: 36,
    bufferPages: true,
    info: { Title: doc.title, Author: "CAAB" },
  });
  const chunks: Buffer[] = [];
  const done = new Promise<Buffer>((resolve, reject) => {
    pdf.on("data", (chunk: Buffer) => chunks.push(chunk));
    pdf.on("end", () => resolve(Buffer.concat(chunks)));
    pdf.on("error", reject);
  });
  // eslint-disable-next-line no-control-regex -- Strip non-printing characters while preserving line breaks in PDF text.
  const safe = (text: string) => text.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "");
  pdf.font("Helvetica-Bold").fontSize(18).fillColor("#153e59").text(`CAAB | ${doc.title}`);
  pdf.moveDown(0.6).font("Helvetica").fontSize(9).fillColor("#222222");
  for (const line of doc.context) pdf.text(safe(line));
  if (doc.notes)
    pdf
      .moveDown()
      .font("Helvetica-Bold")
      .text("Análise da gestão")
      .font("Helvetica")
      .text(safe(doc.notes));
  if (doc.chart?.length) {
    pdf.moveDown().font("Helvetica-Bold").text("Evolução mensal");
    const maximum = Math.max(1, ...doc.chart.map((bar) => bar.value));
    for (const bar of doc.chart) {
      if (pdf.y > pdf.page.height - 85) pdf.addPage();
      const y = pdf.y + 5;
      pdf
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#222222")
        .text(`${bar.label}: ${bar.value}`, 36, y, { width: 210 });
      pdf
        .rect(250, y, Math.max(1, (bar.value / maximum) * (pdf.page.width - 300)), 9)
        .fill("#21638b");
      pdf.y = y + 18;
    }
  }
  pdf.moveDown();
  const keys = Object.keys(doc.columns),
    width = (pdf.page.width - 72) / keys.length;
  const line = (values: string[], header: boolean) => {
    pdf.font(header ? "Helvetica-Bold" : "Helvetica").fontSize(8);
    const heights = values.map((value) => pdf.heightOfString(safe(value), { width: width - 10 }));
    const height = Math.max(22, ...heights.map((h) => h + 12));
    if (pdf.y + height > pdf.page.height - 48) {
      pdf.addPage();
      if (!header) line(Object.values(doc.columns), true);
    }
    const y = pdf.y;
    pdf.font(header ? "Helvetica-Bold" : "Helvetica").fontSize(8);
    if (header) pdf.rect(36, y, pdf.page.width - 72, height).fill("#e5edf2");
    values.forEach((value, index) =>
      pdf.fillColor("#222222").text(safe(value), 41 + index * width, y + 5, { width: width - 10 }),
    );
    pdf
      .moveTo(36, y + height)
      .lineTo(pdf.page.width - 36, y + height)
      .strokeColor("#ccd5dc")
      .stroke();
    pdf.y = y + height;
  };
  line(Object.values(doc.columns), true);
  for (const row of doc.rows)
    line(
      keys.map((key) => String(row[key] ?? "")),
      false,
    );
  if (!doc.rows.length) pdf.moveDown().text("Nenhum registro encontrado para o período e filtros.");
  const pages = pdf.bufferedPageRange();
  for (let page = 0; page < pages.count; page++) {
    pdf.switchToPage(page);
    pdf
      .fontSize(8)
      .fillColor("#555555")
      .text(`${page + 1} / ${pages.count}`, 36, pdf.page.height - 30, { lineBreak: false });
  }
  pdf.end();
  return done;
}
