import PDFDocument from "pdfkit";
import { finished } from "node:stream/promises";
import { setImmediate } from "node:timers/promises";
import { textValue, type Writer } from "./shared";
import type { ExportColumn } from "@caab/contracts";
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
export const writePdf: Writer = async (rows, columns, output, signal) => {
  signal.throwIfAborted();
  const pdf = new PDFDocument({
    size: "A4",
    layout: "landscape",
    margin: 35,
    bufferPages: false,
    autoFirstPage: false,
    info: {
      Title: "Exportação CAAB",
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
    let y = newPage(0);
    for await (const row of rows) {
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
  }
};
