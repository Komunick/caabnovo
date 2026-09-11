import type { InputHTMLAttributes } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Button } from "./button";

export function SearchField({
  label,
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
}) {
  return (
    <div className="form-field search-field">
      <label htmlFor={id}>{label}</label>
      <div className="field-with-action">
        <input {...props} id={id} type="search" />
        <Button
          type="submit"
          intent="ghost"
          className="field-icon-button"
          aria-label="Buscar"
          title="Buscar"
          disabled={props.disabled}
        >
          <Search size={20} aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

export function FilterToggle({
  expanded,
  controls,
  count = 0,
  onClick,
  disabled,
}: {
  expanded: boolean;
  controls: string;
  count?: number;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button aria-expanded={expanded} aria-controls={controls} onClick={onClick} disabled={disabled}>
      <SlidersHorizontal size={18} aria-hidden="true" />
      Filtros{count ? ` (${count})` : ""}
    </Button>
  );
}
