import type { ReactNode } from "react";

export function AppShell({
  sidebar,
  children,
}: Readonly<{ sidebar: ReactNode; children: ReactNode }>) {
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">{sidebar}</aside>
      <div className="admin-workspace">
        <header className="admin-topbar">
          <p>Portal administrativo</p>
          <span className="secure-indicator">
            <span aria-hidden="true" /> Sessão protegida
          </span>
        </header>
        <main id="main-content" className="admin-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
