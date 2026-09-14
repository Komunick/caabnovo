"use client";

import type { ComponentProps } from "react";

export type ContactMask = "cpf" | "phone" | "cnpj" | "postalCode" | "oab";
export function formatContactInput(value: string, kind: ContactMask) {
  if (kind === "oab") return value.replace(/\D/g, "").slice(0, 6);
  if (kind === "cnpj") {
    const valueChars = value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 14);
    return valueChars
      .replace(/^(.{2})(.)/, "$1.$2")
      .replace(/^(.{6})(.)/, "$1.$2")
      .replace(/^(.{10})(.)/, "$1/$2")
      .replace(/^(.{15})(.)/, "$1-$2");
  }
  if (kind === "postalCode")
    return value
      .replace(/\D/g, "")
      .slice(0, 8)
      .replace(/^(\d{5})(\d)/, "$1-$2");
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
  onValueChange,
  ...props
}: Omit<ComponentProps<"input">, "defaultValue" | "onChange" | "type" | "value"> & {
  kind: ContactMask;
  defaultValue?: string;
  onValueChange?: (input: HTMLInputElement) => void;
}) {
  return (
    <input
      {...props}
      type="text"
      inputMode={kind === "cnpj" ? "text" : "numeric"}
      defaultValue={kind === "oab" ? defaultValue : formatContactInput(defaultValue, kind)}
      onPaste={(event) => {
        event.preventDefault();
        const input = event.currentTarget;
        const start = input.selectionStart ?? input.value.length;
        const end = input.selectionEnd ?? start;
        const pasted = event.clipboardData
          .getData("text")
          .replace(kind === "cnpj" ? /[^a-z0-9]/gi : /\D/g, "");
        input.value = formatContactInput(
          input.value.slice(0, start) + pasted + input.value.slice(end),
          kind,
        );
        onValueChange?.(input);
      }}
      onChange={(event) => {
        const input = event.currentTarget;
        const digitsBeforeCaret = input.value
          .slice(0, input.selectionStart ?? input.value.length)
          .replace(kind === "cnpj" ? /[^a-z0-9]/gi : /\D/g, "").length;
        input.value = formatContactInput(input.value, kind);
        let caret = 0;
        let count = 0;
        while (caret < input.value.length && count < digitsBeforeCaret) {
          if ((kind === "cnpj" ? /[A-Z0-9]/ : /\d/).test(input.value.charAt(caret))) count++;
          caret++;
        }
        input.setSelectionRange(caret, caret);
        onValueChange?.(input);
      }}
      onKeyDown={(event) => {
        const input = event.currentTarget;
        const start = input.selectionStart ?? 0;
        if (start !== input.selectionEnd) return;
        // Skip mask punctuation so Backspace/Delete always removes a digit.
        if (event.key === "Backspace") {
          let from = start;
          while (
            from > 0 &&
            (kind === "cnpj" ? /[^A-Z0-9]/ : /\D/).test(input.value.charAt(from - 1))
          )
            from--;
          if (from < start) input.setSelectionRange(Math.max(0, from - 1), start);
        } else if (event.key === "Delete") {
          let to = start;
          while (
            to < input.value.length &&
            (kind === "cnpj" ? /[^A-Z0-9]/ : /\D/).test(input.value.charAt(to))
          )
            to++;
          if (to > start) input.setSelectionRange(start, Math.min(input.value.length, to + 1));
        }
      }}
    />
  );
}
