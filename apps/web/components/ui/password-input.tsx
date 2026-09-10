"use client";

import { useId, useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "./input";

export function PasswordInput({ id, ...props }: Omit<ComponentProps<typeof Input>, "type">) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [visible, setVisible] = useState(false);
  const label = visible ? "Ocultar senha" : "Mostrar senha";
  return (
    <div className="password-input">
      <Input {...props} id={inputId} type={visible ? "text" : "password"} />
      <button
        className="password-input-toggle"
        type="button"
        aria-label={label}
        aria-controls={inputId}
        title={label}
        disabled={props.disabled}
        onClick={() => setVisible((value) => !value)}
      >
        {visible ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
      </button>
    </div>
  );
}
