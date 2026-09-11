import type { ReactNode } from "react";

// Each page places its authorized tabs directly below its own heading.
export default function AuditLayout({ children }: Readonly<{ children: ReactNode }>) {
  return children;
}
