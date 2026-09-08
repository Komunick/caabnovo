import type { ReactNode } from "react";

export function Menu({ label, children }: Readonly<{ label: string; children: ReactNode }>) {
  return (
    <nav aria-label={label}>
      <ul className="menu">{children}</ul>
    </nav>
  );
}

export function MenuItem({ children }: Readonly<{ children: ReactNode }>) {
  return <li>{children}</li>;
}
