"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/components/ui/utils";

function sectionTitle(pathname: string): string {
  if (pathname.startsWith("/users")) return "Usuários";
  if (pathname.startsWith("/audit")) return "Auditoria";
  if (pathname.startsWith("/operations")) return "Auditoria";
  if (pathname.startsWith("/sessions")) return "Sessões";
  return "Visão geral";
}

export function AppShell({
  sidebar,
  controls,
  children,
}: Readonly<{ sidebar: ReactNode; controls?: ReactNode; children: ReactNode }>) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div
      className={cn(
        "admin-shell",
        collapsed && "admin-shell--collapsed",
        mobileOpen && "admin-shell--mobile-open",
      )}
    >
      <aside className="admin-sidebar" id="admin-navigation">
        {sidebar}
        <button
          className="sidebar-collapse"
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
          title={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {collapsed ? (
            <PanelLeftOpen size={17} aria-hidden="true" />
          ) : (
            <PanelLeftClose size={17} aria-hidden="true" />
          )}
        </button>
      </aside>
      <button
        className="sidebar-scrim"
        type="button"
        onClick={() => setMobileOpen(false)}
        aria-label="Fechar menu de navegação"
      />
      <div className="admin-workspace">
        <header className="admin-topbar">
          <div className="topbar-context">
            <button
              className="mobile-menu-trigger"
              type="button"
              onClick={() => setMobileOpen((value) => !value)}
              aria-controls="admin-navigation"
              aria-expanded={mobileOpen}
              aria-label="Abrir menu de navegação"
            >
              <Menu size={20} aria-hidden="true" />
            </button>
            <span>
              <small>Portal administrativo</small>
              <strong>{sectionTitle(pathname)}</strong>
            </span>
          </div>
          <div className="topbar-actions">
            {controls}
            <span className="secure-indicator">
              <span aria-hidden="true" /> Sessão protegida
            </span>
          </div>
        </header>
        <main id="main-content" className="admin-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
