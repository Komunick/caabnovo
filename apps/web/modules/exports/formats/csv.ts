import { end, textValue, write, type Writer } from "./shared";
/** Apostrophe intentionally neutralizes spreadsheet formulas. */
function cell(value: string, numeric = false) {
  const first = [...value].find((char) => char.charCodeAt(0) > 31 && !/\s/.test(char));
  const safe =
    !numeric && ((first && "=+@-".includes(first)) || /^[\t\r\n]/.test(value))
      ? `'${value}`
      : value;
  return `"${safe.replaceAll('"', '""')}"`;
}
export const writeCsv: Writer = async (rows, columns, output, signal) => {
  signal.throwIfAborted();
  await write(output, "\uFEFF" + columns.map((c) => cell(c.label)).join(",") + "\r\n", signal);
  for await (const row of rows)
    await write(
      output,
      columns
        .map((c) => {
          const value = row.values[c.key],
            text = textValue(value);
          // Only finite, strictly numeric values in a numeric column bypass formula escaping.
          // A negative textual value or a formula disguised as a number remains protected.
          const numeric =
            c.scalarType === "number" &&
            ((typeof value === "number" && Number.isFinite(value)) ||
              (typeof value === "string" &&
                value.trim() === value &&
                /^-?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(value) &&
                Number.isFinite(Number(value))));
          return cell(text, numeric);
        })
        .join(",") + "\r\n",
      signal,
    );
  await end(output, signal);
};
