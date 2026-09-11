"use client";

import type { ComponentProps } from "react";

function formatDigits(value: string, kind: "cpf" | "phone") {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (kind === "cpf") {
    return digits
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3}\.\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3}\.\d{3}\.\d{3})(\d)/, "$1-$2");
  }
  if (!digits) return "";
  if (digits.length <= 2) return `(${digits}`;
  const local = digits.slice(2);
  const split = local.length > 8 ? 5 : 4;
  return `(${digits.slice(0, 2)}) ${local.slice(0, split)}${local.length > split ? `-${local.slice(split)}` : ""}`;
}

export function MaskedContactInput({
  kind,
  defaultValue = "",
  ...props
}: Omit<ComponentProps<"input">, "defaultValue" | "onChange" | "type" | "value"> & {
  kind: "cpf" | "phone";
  defaultValue?: string;
}) {
  return (
    <input
      {...props}
      type="text"
      inputMode="numeric"
      defaultValue={formatDigits(defaultValue, kind)}
      onChange={(event) => {
        const input = event.currentTarget;
        const digitsBeforeCaret = input.value
          .slice(0, input.selectionStart ?? input.value.length)
          .replace(/\D/g, "").length;
        input.value = formatDigits(input.value, kind);
        let caret = 0;
        let count = 0;
        while (caret < input.value.length && count < digitsBeforeCaret) {
          if (/\d/.test(input.value.charAt(caret))) count++;
          caret++;
        }
        input.setSelectionRange(caret, caret);
      }}
      onKeyDown={(event) => {
        const input = event.currentTarget;
        const start = input.selectionStart ?? 0;
        if (start !== input.selectionEnd) return;
        // Skip mask punctuation so Backspace/Delete always removes a digit.
        if (event.key === "Backspace") {
          let from = start;
          while (from > 0 && /\D/.test(input.value.charAt(from - 1))) from--;
          if (from < start) input.setSelectionRange(Math.max(0, from - 1), start);
        } else if (event.key === "Delete") {
          let to = start;
          while (to < input.value.length && /\D/.test(input.value.charAt(to))) to++;
          if (to > start) input.setSelectionRange(start, Math.min(input.value.length, to + 1));
        }
      }}
    />
  );
}
