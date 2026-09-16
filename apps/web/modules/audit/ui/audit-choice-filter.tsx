"use client";

import { useEffect, useRef } from "react";
import { useDraftState } from "@/components/workspace-drafts";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";

type Choice = { value: string; label: string };
const normalize = (value: string) =>
  value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");

/** Same native input + datalist pattern as the state field in partner addresses. */
export function AuditChoiceFilter({
  id,
  label,
  value,
  options,
  placeholder,
  onChange,
}: Readonly<{
  id: string;
  label: string;
  value: string;
  options: Choice[];
  placeholder: string;
  onChange: (value: string) => void;
}>) {
  const input = useRef<HTMLInputElement>(null);
  const [selection, setSelection] = useDraftState(`audit-choice:${id}`, {
    value,
    text: options.find((option) => value && option.value === value)?.label ?? "",
  });
  const text =
    selection.value === value
      ? selection.text
      : (options.find((option) => value && option.value === value)?.label ?? "");
  useEffect(() => {
    input.current?.setCustomValidity(
      !text.trim() || options.some((option) => normalize(option.label) === normalize(text))
        ? ""
        : "Escolha uma op��o da lista ou limpe o campo.",
    );
  }, [text, options]);
  return (
    <div>
      <FormField id={id} label={label}>
        <Input
          ref={input}
          list={`${id}-options`}
          autoComplete="off"
          placeholder={placeholder}
          value={text}
          onChange={(event) => {
            const next = event.target.value;
            const match = options.find((option) => normalize(option.label) === normalize(next));
            event.target.setCustomValidity(
              !next.trim() || match ? "" : "Escolha uma opção da lista ou limpe o campo.",
            );
            setSelection({ value: match?.value ?? "", text: next });
            onChange(match?.value ?? "");
          }}
        />
      </FormField>
      <datalist id={`${id}-options`}>
        {options.map((option) => (
          <option key={option.value} value={option.label} />
        ))}
      </datalist>
    </div>
  );
}
