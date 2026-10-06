import PDFDocument from "pdfkit";
import { finished } from "node:stream/promises";
import { setImmediate } from "node:timers/promises";
import { textValue, type Writer } from "./shared";
import type { ExportColumn } from "@caab/contracts";
import { createReadStream } from "node:fs";
import { mkdtemp, open, unlink, rmdir, type FileHandle } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createInterface } from "node:readline";
/** Portuguese is covered by the standard PDF font. Unsupported code points
 * use an explicit reversible escape instead of disappearing as missing glyphs. */
function printable(value: string) {
  return [...value]
    .map((c) =>
      c === "\\"
        ? "\\\\"
        : c.codePointAt(0)! > 255 || (c.codePointAt(0)! < 32 && c !== "\n")
          ? `\\u{${c.codePointAt(0)!.toString(16).toUpperCase()}}`
          : c,
    )
    .join("");
}
export function createPdfWriter(presentation?: {
  title: string;
  notes: string;
  context: string;
  evolution: boolean;
}): Writer {
  return async (rows, columns, output, signal) => {
    signal.throwIfAborted();
    const pdf = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margin: 35,
      bufferPages: false,
      autoFirstPage: false,
      info: {
        Title: presentation?.title ?? "Exportação CAAB",
        Subject: "America/Bahia. Unicode: \\u{hex}; barra original: \\\\.",
      },
    });
    const stop = () => {
      pdf.destroy(new Error("EXPORT_CANCELLED"));
      output.destroy(new Error("EXPORT_CANCELLED"));
    };
    signal.addEventListener("abort", stop, { once: true });
    const done = finished(output, { readable: false, signal, cleanup: true });
    void done.catch(() => {});
    pdf.on("error", (error) => output.destroy(error));
    output.on("error", () => pdf.destroy());
    pdf.pipe(output);
    const flow = async () => {
      signal.throwIfAborted();
      while (pdf.readableLength > 65536) {
        await setImmediate(undefined, { signal });
        if (output.destroyed) throw output.errored ?? new Error("EXPORT_STREAM_CLOSED");
      }
    };
    const bands: ExportColumn[][] = [];
    for (let n = 0; n < columns.length; n += 4) bands.push(columns.slice(n, n + 4));
    let logical = 0,
      page = 0;
    let chartDirectory: string | undefined,
      chartFile: FileHandle | undefined,
      maximum = 1;
    const presentationPage = (heading: string) => {
      pdf.addPage();
      page++;
      pdf.font("Helvetica").fontSize(9).fillColor("#142b49");
      pdf.text(`CAAB | Fuso: America/Bahia | Página ${page}`, 35, 25);
      pdf.font("Helvetica-Bold").fontSize(18).text(heading, 35, 58);
      pdf.font("Helvetica").fontSize(10);
      return 92;
    };
    const paragraph = async (text: string, start: number, heading: string) => {
      let y = start;
      for (const part of printable(text).split("\n")) {
        let line = "";
        const draw = async () => {
          if (y > 525) y = presentationPage(heading);
          pdf.text(line, 35, y, { width: 770, lineBreak: false });
          y += 15;
          await flow();
        };
        for (const char of part) {
          if (line && pdf.widthOfString(line + char) > 760) {
            const split = line.lastIndexOf(" ");
            const remaining = split > 0 ? line.slice(split + 1) : "";
            if (split > 0) line = line.slice(0, split);
            await draw();
            line = remaining;
          }
          line += char;
        }
        await draw();
      }
      return y;
    };
    const newPage = (band: number) => {
      pdf.addPage();
      page++;
      pdf.font("Helvetica").fontSize(9);
      pdf.text(
        `CAAB | Fuso: America/Bahia | Faixa ${band + 1}/${bands.length} | Página ${page}`,
        35,
        25,
      );
      pdf
        .fontSize(8)
        .text(
          "Unicode: \\u{hex}; barra original: \\\\. Continuação mantém o número do registro.",
          35,
          40,
        );
      const width = 770 / bands[band]!.length;
      bands[band]!.forEach((c, i) =>
        pdf.text(printable(c.label), 35 + i * width, 58, { width: width - 10, lineBreak: false }),
      );
      return 83;
    };
    try {
      if (presentation) {
        let coverY = presentationPage(`CAAB | ${presentation.title}`);
        coverY = await paragraph(presentation.context, coverY, presentation.title);
        coverY = await paragraph(
          `Gerado em: ${new Date().toISOString()} (UTC)`,
          coverY,
          presentation.title,
        );
        coverY += 20;
        if (coverY > 495) coverY = presentationPage(presentation.title);
        pdf.font("Helvetica-Bold").fontSize(12).text("Análise da gestão", 35, coverY);
        pdf.font("Helvetica").fontSize(10);
        coverY = await paragraph(
          "Interpretação da gestão, separada dos indicadores medidos.",
          coverY + 22,
          "Análise da gestão (continuação)",
        );
        await paragraph(
          presentation.notes || "Nenhum comentário incluído.",
          coverY + 10,
          "Análise da gestão (continuação)",
        );
        if (presentation.evolution) {
          // Spool only authorized aggregate chart points, never the whole file or detail rows.
          // This keeps memory bounded for long periods and is removed on success/failure/cancel.
          chartDirectory = await mkdtemp(join(tmpdir(), "caab-export-chart-"));
          chartFile = await open(join(chartDirectory, "series.jsonl"), "wx");
        }
      }
      let y = newPage(0);
      for await (const row of rows) {
        if (chartFile && row.chart) {
          maximum = Math.max(maximum, row.chart.value);
          await chartFile.writeFile(`${JSON.stringify(row.chart)}\n`);
        }
        logical++;
        for (let band = 0; band < bands.length; band++) {
          if (bands.length > 1 && (logical > 1 || band > 0)) y = newPage(band);
          const cols = bands[band]!,
            width = 770 / cols.length;
          const lines = cols.map((c) => {
            const value = printable(textValue(row.values[c.key]));
            const result: string[] = [];
            for (const paragraph of value.split("\n")) {
              let line = "";
              for (const char of paragraph) {
                if (line && pdf.widthOfString(line + char) > width - 12) {
                  result.push(line);
                  line = "";
                }
                line += char;
              }
              result.push(line);
            }
            return result;
          });
          const length = Math.max(...lines.map((l) => l.length));
          for (let n = 0; n < length; n++) {
            if (y > 530) y = newPage(band);
            if (n === 0 || y === 83) {
              pdf.fontSize(7).text(`Registro ${logical}${n ? " (continuação)" : ""}`, 35, y);
              y += 11;
              pdf.fontSize(8);
            }
            lines.forEach((line, i) =>
              pdf.text(line[n] ?? "", 35 + i * width, y, { width: width - 10, lineBreak: false }),
            );
            y += 12;
            await flow();
          }
          y += 8;
        }
      }
      if (chartFile && chartDirectory) {
        await chartFile.close();
        chartFile = undefined;
        const series = createReadStream(join(chartDirectory, "series.jsonl"));
        const lines = createInterface({ input: series, crlfDelay: Infinity });
        let chartY = presentationPage("Evolução mensal"),
          hasSeries = false;
        try {
          for await (const line of lines) {
            signal.throwIfAborted();
            hasSeries = true;
            const point = JSON.parse(line) as { label: string; value: number };
            pdf.font("Helvetica").fontSize(9);
            const label = printable(`${point.label}: ${point.value.toLocaleString("pt-BR")}`);
            const height = Math.max(24, pdf.heightOfString(label, { width: 285 }) + 8);
            if (chartY + height > 530) chartY = presentationPage("Evolução mensal (continuação)");
            pdf.fontSize(9).fillColor("#142b49").text(label, 35, chartY, { width: 285 });
            if (point.value > 0)
              pdf.rect(335, chartY + 2, (point.value / maximum) * 450, 10).fill("#214f86");
            chartY += height;
            await flow();
          }
          if (!hasSeries) pdf.text("Sem dados de evolução no período selecionado.", 35, chartY);
        } finally {
          lines.close();
          series.destroy();
          await finished(series, { cleanup: true }).catch(() => {});
        }
      }
      signal.throwIfAborted();
      pdf.end();
      await done;
    } catch (error) {
      pdf.destroy();
      if (!output.destroyed)
        output.destroy(error instanceof Error ? error : new Error("EXPORT_FAILED"));
      throw error;
    } finally {
      signal.removeEventListener("abort", stop);
      await chartFile?.close();
      if (chartDirectory) {
        // Delete only the two exact artifacts created by this invocation; no recursive deletion.
        await unlink(join(chartDirectory, "series.jsonl")).catch((error: NodeJS.ErrnoException) => {
          if (error.code !== "ENOENT") throw error;
        });
        await rmdir(chartDirectory);
      }
    }
  };
}
export const writePdf: Writer = createPdfWriter();
