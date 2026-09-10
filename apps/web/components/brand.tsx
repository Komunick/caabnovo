import { cn } from "@/components/ui/utils";
import Image from "next/image";

export function Brand({
  inverse = false,
  compact = false,
}: Readonly<{ inverse?: boolean; compact?: boolean }>) {
  return (
    <div className={cn("brand", inverse && "brand--inverse", compact && "brand--compact")}>
      <span className="brand__logo">
        <Image src="/caab-logo.png" alt="CAAB" width={500} height={500} unoptimized />
      </span>
      <span className="brand__copy">
        <span>Gestão interna</span>
      </span>
    </div>
  );
}
