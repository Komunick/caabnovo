"use client";
import { useDraftState } from "@/components/workspace-drafts";
import {
  cloneElement,
  useEffect,
  useRef,
  type ReactElement,
  type ReactNode,
  type SyntheticEvent,
} from "react";

type FieldControlProps = {
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
};

export function FormField({
  id,
  label,
  hint,
  error,
  invalidMessage,
  className,
  action,
  children,
}: Readonly<{
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  invalidMessage?: string;
  className?: string;
  action?: ReactNode;
  children: ReactElement<FieldControlProps>;
}>) {
  const [localError, setLocalError] = useDraftState(`validation:${id}`, "");
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const form = container.current?.closest("form");
    const reset = () => setLocalError("");
    form?.addEventListener("reset", reset);
    return () => form?.removeEventListener("reset", reset);
  }, [setLocalError]);
  const ownedValidity = useRef(new WeakMap<HTMLElement, string>());
  const visibleError = error || localError;
  function validate(event: SyntheticEvent, show: boolean) {
    const control = event.target;
    if (
      !(
        control instanceof HTMLInputElement ||
        control instanceof HTMLTextAreaElement ||
        control instanceof HTMLSelectElement
      ) ||
      !control.willValidate ||
      control.id !== id
    )
      return;
    const previous = ownedValidity.current.get(control);
    if (previous && control.validationMessage === previous) control.setCustomValidity("");
    ownedValidity.current.delete(control);
    let message = "";
    if (control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement) {
      const text =
        control instanceof HTMLTextAreaElement ||
        ["text", "search", "email", "url", "tel", "password"].includes(control.type);
      const value =
        control instanceof HTMLInputElement &&
        (control.type === "password" || control.dataset.password === "true")
          ? control.value
          : control.value.trim();
      if (text && control.required && !value) message = "Preencha este campo.";
      else if (text && value && control.minLength > 0 && value.length < control.minLength)
        message = `Use pelo menos ${control.minLength} caracteres.`;
      else if (text && control.maxLength >= 0 && value.length > control.maxLength)
        message = `Use no máximo ${control.maxLength} caracteres.`;
    }
    // Preserve messages supplied by contract-based controls (CPF, phone, CEP, etc.).
    if (message && !control.validity.customError) {
      control.setCustomValidity(message);
      ownedValidity.current.set(control, message);
    }
    const validity = control.validity;
    if (validity.customError) message = control.validationMessage;
    else if (validity.valueMissing) message = "Preencha este campo.";
    else if (validity.typeMismatch)
      message =
        control instanceof HTMLInputElement && control.type === "email"
          ? "Informe um e-mail válido."
          : "Informe um endereço válido com http:// ou https://.";
    else if (validity.rangeUnderflow)
      message = `Informe um valor igual ou posterior a ${control.getAttribute("min")}.`;
    else if (validity.rangeOverflow)
      message = `Informe um valor igual ou anterior a ${control.getAttribute("max")}.`;
    else if (!validity.valid) message = "Confira o formato deste campo.";
    else message = "";
    if (show || localError || !message) setLocalError(message ? invalidMessage || message : "");
  }
  const describedBy = [
    children.props["aria-describedby"],
    hint ? `${id}-hint` : null,
    visibleError ? `${id}-error` : null,
  ]
    .filter(Boolean)
    .join(" ");
  const control = cloneElement(children, {
    id,
    ...(describedBy ? { "aria-describedby": describedBy } : {}),
    ...(visibleError ? { "aria-invalid": true } : {}),
  });
  return (
    <div
      ref={container}
      className={["form-field", className].filter(Boolean).join(" ")}
      onBlur={(event) => validate(event, true)}
      onInput={(event) => validate(event, false)}
      onChange={(event) => validate(event, true)}
      onInvalidCapture={(event) => validate(event, true)}
    >
      <label htmlFor={id}>{label}</label>
      {action ? (
        <div className="field-with-action">
          {control}
          {action}
        </div>
      ) : (
        control
      )}
      {hint ? (
        <p className="field-hint" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
      {visibleError ? (
        <p className="field-error" id={`${id}-error`} role="alert">
          {visibleError}
        </p>
      ) : null}
    </div>
  );
}
