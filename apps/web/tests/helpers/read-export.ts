import { parse } from "csv-parse/sync";
import { unzipSync, strFromU8 } from "fflate";
import { XMLParser } from "fast-xml-parser";

/** Test-only readers, independent of the production writers. Synthetic inputs only. */
export function readCsv(bytes: Uint8Array): string[][] {
  return parse(bytes, { bom: true, columns: false, skip_empty_lines: false });
}

export function readXlsx(bytes: Uint8Array): string[][][] {
  const files = unzipSync(bytes);
  const parser = new XMLParser({
    ignoreAttributes: false,
    parseTagValue: false,
    trimValues: false,
  });
  const list = <T>(value: T | T[] | undefined): T[] =>
    value === undefined ? [] : Array.isArray(value) ? value : [value];
  const shared = files["xl/sharedStrings.xml"]
    ? list(parser.parse(strFromU8(files["xl/sharedStrings.xml"])).sst.si).map((item) =>
        String((item as { t: string }).t),
      )
    : [];
  return Object.keys(files)
    .filter((key) => /^xl\/worksheets\/sheet\d+\.xml$/.test(key))
    .sort((a, b) => Number(a.match(/sheet(\d+)/)![1]) - Number(b.match(/sheet(\d+)/)![1]))
    .map((key) => {
      const sheet = parser.parse(strFromU8(files[key]!));
      return list(sheet.worksheet.sheetData?.row).map((raw) => {
        const row = raw as {
          c?: {
            "@_r": string;
            "@_t"?: string;
            v?: string;
            is?: { t: string | { "#text": string } };
          }[];
        };
        const cells: string[] = [];
        for (const cell of list(row.c)) {
          const index =
            [...cell["@_r"].replace(/\d/g, "")].reduce(
              (n, char) => n * 26 + char.charCodeAt(0) - 64,
              0,
            ) - 1;
          const inline = cell.is?.t;
          cells[index] =
            cell["@_t"] === "s"
              ? shared[Number(cell.v)]!
              : String(typeof inline === "object" ? inline["#text"] : (inline ?? cell.v ?? ""));
        }
        return Array.from({ length: cells.length }, (_, index) => cells[index] ?? "");
      });
    });
}

export async function readPdf(bytes: Uint8Array): Promise<string[]> {
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loading = getDocument({ data: Uint8Array.from(bytes), useSystemFonts: true });
  const document = await loading.promise;
  try {
    const pages: string[] = [];
    for (let page = 1; page <= document.numPages; page++) {
      const content = await (await document.getPage(page)).getTextContent();
      pages.push(content.items.map((item) => ("str" in item ? item.str : "")).join("\n"));
    }
    return pages;
  } finally {
    await loading.destroy();
  }
}
