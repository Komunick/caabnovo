import ExcelJS from "exceljs";
import { PassThrough, type Writable } from "node:stream";
import { finished } from "node:stream/promises";
import { drain, textValue, type Rows } from "./shared";
import type { ExportColumn } from "@caab/contracts";

/** ExcelJS 4.4's internal StreamBuf ignores backpressure. This pinned bridge
 * replaces ZIP entry streams with bounded Node streams; each committed row
 * waits for its entry to drain. Validate on every ExcelJS upgrade. */
class BoundedWorkbook extends ExcelJS.stream.xlsx.WorkbookWriter {
  declare zip: {
    append(stream: PassThrough, options: { name: string }): void;
    abort(): void;
    on(event: string, listener: (error: Error) => void): void;
  };
  entries = new Set<PassThrough>();
  _openStream(path: string) {
    const stream = new PassThrough({
      writableObjectMode: true,
      writableHighWaterMark: 1,
      readableHighWaterMark: 64 * 1024,
      transform(chunk: unknown, _encoding, callback) {
        // ExcelJS also writes its reusable StringBuf. Snapshot before it resets.
        const value =
          chunk && typeof chunk === "object" && "toBuffer" in chunk
            ? (chunk as { toBuffer(): Buffer }).toBuffer()
            : chunk;
        callback(null, value);
      },
    });
    this.entries.add(stream);
    this.zip.append(stream, { name: path });
    stream.once("finish", () => {
      this.entries.delete(stream);
      stream.emit("zipped");
    });
    stream.on("error", () => {});
    return stream;
  }
  stop() {
    for (const stream of this.entries) stream.destroy();
    this.zip.abort();
  }
}
const prefix = "#CAAB:";
function parts(value: string): string[] {
  const result: string[] = [];
  let start = 0,
    size = 0,
    lines = 0,
    pos = 0;
  for (const char of value) {
    if (size + char.length > 32600 || (char === "\n" && lines === 253)) {
      result.push(value.slice(start, pos));
      start = pos;
      size = 0;
      lines = 0;
    }
    size += char.length;
    pos += char.length;
    if (char === "\n") lines++;
  }
  result.push(value.slice(start));
  return result;
}
export async function writeXlsx(
  rows: Rows,
  columns: ExportColumn[],
  output: Writable,
  signal: AbortSignal,
  options: { sheetRows?: number } = {},
) {
  signal.throwIfAborted();
  const workbook = new BoundedWorkbook({
    stream: output,
    useSharedStrings: false,
    useStyles: false,
  });
  const stop = () => {
    workbook.stop();
    output.destroy(new Error("EXPORT_CANCELLED"));
  };
  signal.addEventListener("abort", stop, { once: true });
  output.on("error", () => workbook.stop());
  let fault: Error | undefined;
  workbook.zip.on("error", (error) => {
    fault = error;
    output.destroy(error);
  });
  const commitRow = async (sheet: ExcelJS.Worksheet, values: string[]) => {
    signal.throwIfAborted();
    if (fault) throw fault;
    sheet.addRow(values).commit();
    await drain((sheet as unknown as { stream: PassThrough }).stream, signal);
  };
  const commitSheet = async (sheet: ExcelJS.Worksheet) => {
    const stream = (sheet as unknown as { stream: PassThrough }).stream;
    const done = finished(stream, { readable: false, cleanup: true, signal });
    sheet.commit();
    await done;
  };
  try {
    const legend = workbook.addWorksheet("Legenda");
    for (const line of [
      "CAAB — exportação integral. Fuso: America/Bahia.",
      "As planilhas Dados preservam a ordem das colunas selecionadas.",
      "Texto iniciado por #CAAB: recebe # adicional; remova somente esse escape.",
      "Células extensas: #CAAB:r=registro;c=coluna;p=parte/total# seguido do texto original.",
      "Reunir partes do mesmo registro/coluna, inclusive entre planilhas. Remover apenas esses marcadores.",
      "Continuações não são novos registros. Células vazias nas demais colunas não repetem dados.",
    ])
      await commitRow(legend, [line]);
    await commitSheet(legend);
    const limit = Math.min(1048576, Math.max(2, options.sheetRows ?? 1048576));
    let index = 1,
      count = 1,
      logical = 0;
    let sheet = workbook.addWorksheet(`Dados ${index}`);
    await commitRow(
      sheet,
      columns.map((c) => c.label),
    );
    for await (const row of rows) {
      logical++;
      const cells = columns.map((c) => parts(textValue(row.values[c.key])));
      const length = Math.max(...cells.map((p) => p.length));
      for (let part = 0; part < length; part++) {
        if (count === limit) {
          await commitSheet(sheet);
          sheet = workbook.addWorksheet(`Dados ${++index}`);
          count = 1;
          await commitRow(
            sheet,
            columns.map((c) => c.label),
          );
        }
        await commitRow(
          sheet,
          cells.map((chunks, col) => {
            const value = chunks[part];
            if (value === undefined) return "";
            if (chunks.length > 1)
              return `${prefix}r=${logical};c=${col + 1};p=${part + 1}/${chunks.length}#${value}`;
            return value.startsWith(prefix) ? `#${value}` : value;
          }),
        );
        count++;
      }
    }
    await commitSheet(sheet);
    signal.throwIfAborted();
    await workbook.commit();
    signal.throwIfAborted();
  } catch (error) {
    workbook.stop();
    if (!output.destroyed)
      output.destroy(error instanceof Error ? error : new Error("EXPORT_FAILED"));
    throw error;
  } finally {
    signal.removeEventListener("abort", stop);
  }
}
