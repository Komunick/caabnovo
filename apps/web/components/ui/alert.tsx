import type { HTMLAttributes } from "react";
import { cn } from "./utils";

export function Alert({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("alert", className)} role="alert" {...props}>
      {children}
    </div>
  );
}
