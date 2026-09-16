"use client";
import { DraftInput } from "./draft-controls";
import { useEffect, useRef, useState, type ComponentProps } from "react";
import { FormField } from "./form-field";
import { MaskedContactInput, type ContactMask } from "./masked-contact-input";

/** Uses the same contract as the server and announces errors beside their field. */
export function ValidatedTextField({
  id,
  label,
  hint,
  schema,
  message,
  mask,
  onValueChange,
  ...props
}: Omit<
  ComponentProps<"input">,
  "id" | "onChange" | "onBlur" | "onInvalid" | "value" | "defaultValue"
> & {
  id: string;
  label: string;
  hint?: string;
  defaultValue?: string;
  schema: { safeParse(value: unknown): { success: boolean } };
  message: string;
  mask?: ContactMask;
  onValueChange?: (input: HTMLInputElement) => void;
}) {
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const input = inputRef.current;
    if (input) input.setCustomValidity(schema.safeParse(input.value).success ? "" : message);
  }, [schema, message, props.defaultValue]);
  function validate(input: HTMLInputElement, show: boolean) {
    const next = schema.safeParse(input.value).success ? "" : message;
    input.setCustomValidity(next);
    if (show || !next) setError(next);
  }
  const events = {
    onBlur: (event: React.FocusEvent<HTMLInputElement>) => validate(event.currentTarget, true),
    onInvalid: (event: React.FormEvent<HTMLInputElement>) => validate(event.currentTarget, true),
  };
  const change = (input: HTMLInputElement) => {
    validate(input, !!error);
    onValueChange?.(input);
  };
  return (
    <FormField id={id} label={label} hint={hint} error={error}>
      {mask ? (
        <MaskedContactInput
          {...props}
          {...events}
          ref={inputRef}
          kind={mask}
          onValueChange={change}
        />
      ) : (
        <DraftInput
          {...props}
          {...events}
          ref={inputRef}
          onChange={(event) => change(event.currentTarget)}
        />
      )}
    </FormField>
  );
}
