import type { HTMLAttributes, ReactNode, TableHTMLAttributes } from "react";
import { cn } from "./utils";

export function TableContainer({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("table-scroll", className)} tabIndex={0} {...props} />;
}

export function Table({
  caption,
  children,
  ...props
}: TableHTMLAttributes<HTMLTableElement> & { caption?: ReactNode }) {
  return (
    <table {...props}>
      {caption ? <caption className="sr-only">{caption}</caption> : null}
      {children}
    </table>
  );
}
