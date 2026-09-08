import { LoaderCircle } from "lucide-react";

export function Spinner({ label = "Carregando" }: Readonly<{ label?: string }>) {
  return (
    <span className="spinner" role="status">
      <LoaderCircle aria-hidden="true" className="spinner__icon" size={18} />
      <span className="sr-only">{label}</span>
    </span>
  );
}
