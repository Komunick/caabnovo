import type { ReactNode } from "react";

export function AppShell({
  sidebar,
  children,
}: Readonly<{ sidebar: ReactNode; children: ReactNode }>) {
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">{sidebar}</aside>
      <main id="main-content" className="admin-content" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
