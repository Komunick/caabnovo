import { end, textValue, write, type Writer } from "./shared";
/** Apostrophe intentionally neutralizes spreadsheet formulas. */
function cell(value: string) {
  const first = [...value].find((char) => char.charCodeAt(0) > 31 && !/\s/.test(char));
  const safe = (first && "=+@-".includes(first)) || /^[\t\r\n]/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}
export const writeCsv: Writer = async (rows, columns, output, signal) => {
  signal.throwIfAborted();
  await write(output, "\uFEFF" + columns.map((c) => cell(c.label)).join(",") + "\r\n", signal);
  for await (const row of rows)
    await write(
      output,
      columns.map((c) => cell(textValue(row.values[c.key]))).join(",") + "\r\n",
      signal,
    );
  await end(output, signal);
};
