import { describe, expect, it } from "vitest";
import { csvCell, reportCsv, reportPdf, reportXlsx } from "./report-format";
describe("report formats", () => {
  const doc = {
    title: "Relatório CAAB",
    context: ["Período 2026-09-01 a 2026-09-18"],
    columns: { name: "Nome", value: "Quantidade" },
    rows: [
      { name: '=HYPERLINK("example")', value: 8 },
      { name: "João; ação", value: 0 },
    ],
    notes: "Análise",
  };
  it("escapes CSV formulas, delimiters, quotes and accents", () => {
    expect(csvCell("\t=1+1")).toBe('"\'\t=1+1"');
    expect(reportCsv(doc).toString()).toContain('"\'=HYPERLINK(""example"")";"8"');
    expect(reportCsv(doc).subarray(0, 3).toString("hex")).toBe("efbbbf");
  });
  it("creates genuine PDF and XLSX bytes", async () => {
    expect((await reportPdf(doc)).subarray(0, 5).toString()).toBe("%PDF-");
    expect((await reportXlsx(doc)).subarray(0, 2).toString()).toBe("PK");
  });
});
