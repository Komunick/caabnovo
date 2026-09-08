import { cn } from "@/components/ui/utils";

export function Brand({
  inverse = false,
  compact = false,
}: Readonly<{ inverse?: boolean; compact?: boolean }>) {
  return (
    <div className={cn("brand", inverse && "brand--inverse", compact && "brand--compact")}>
      <span className="brand__mark" aria-hidden="true">
        C
      </span>
      <span className="brand__copy">
        <strong>CAAB</strong>
        <span>Gestão interna</span>
      </span>
    </div>
  );
}
