"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Activity,
  Command,
  FileClock,
  House,
  MonitorCog,
  Moon,
  Search,
  Sun,
  UsersRound,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { PERMISSIONS } from "@/modules/auth/permissions";

type Theme = "light" | "dark";

export function WorkspaceControls({ permissions }: Readonly<{ permissions: readonly string[] }>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [theme, setTheme] = useState<Theme>("light");
  const searchRef = useRef<HTMLInputElement>(null);
  const allowed = useMemo(() => new Set(permissions), [permissions]);
  const items = useMemo(
    () =>
      [
        { href: "/", label: "Visão geral", hint: "Dashboard", icon: House, visible: true },
        {
          href: "/users",
          label: "Usuários",
          hint: "Contas e permissões",
          icon: UsersRound,
          visible: allowed.has(PERMISSIONS.usersRead),
        },
        {
          href: "/audit",
          label: "Auditoria",
          hint: "Eventos e exportações",
          icon: FileClock,
          visible: allowed.has(PERMISSIONS.auditRead),
        },
        {
          href: "/operations/jobs",
          label: "Operações",
          hint: "Jobs e processamento",
          icon: Activity,
          visible: allowed.has(PERMISSIONS.jobsRead),
        },
        {
          href: "/sessions",
          label: "Sessões",
          hint: "Identidade e segurança",
          icon: MonitorCog,
          visible: true,
        },
      ].filter(({ visible }) => visible),
    [allowed],
  );
  const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
  const results = items.filter(
    ({ label, hint }) =>
      !normalizedQuery || `${label} ${hint}`.toLocaleLowerCase("pt-BR").includes(normalizedQuery),
  );

  useEffect(() => {
    const active = document.documentElement.dataset.theme;
    setTheme(active === "dark" ? "dark" : "light");

    function openCommand(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    }

    window.addEventListener("keydown", openCommand);
    return () => window.removeEventListener("keydown", openCommand);
  }, []);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    requestAnimationFrame(() => searchRef.current?.focus());
  }, [open]);

  function toggleTheme() {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem("caab-theme", nextTheme);
    setTheme(nextTheme);
  }

  return (
    <div className="workspace-controls">
      <button className="command-trigger" type="button" onClick={() => setOpen(true)}>
        <Search size={17} aria-hidden="true" />
        <span>Buscar área...</span>
        <kbd>
          <Command size={12} aria-hidden="true" />K
        </kbd>
      </button>
      <button
        className="icon-button"
        type="button"
        onClick={toggleTheme}
        aria-label={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
        title={theme === "dark" ? "Tema claro" : "Tema escuro"}
      >
        {theme === "dark" ? (
          <Sun size={18} aria-hidden="true" />
        ) : (
          <Moon size={18} aria-hidden="true" />
        )}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          title="Navegação rápida"
          description="Busque e acesse uma área permitida para seu perfil."
        >
          <div className="command-search">
            <Search size={19} aria-hidden="true" />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Digite o nome de uma área"
              aria-label="Buscar área"
            />
          </div>
          <div className="command-results" aria-live="polite">
            {results.length ? (
              results.map(({ href, label, hint, icon: Icon }) => (
                <Link href={href} key={href} onClick={() => setOpen(false)}>
                  <span className="command-result__icon" aria-hidden="true">
                    <Icon size={18} />
                  </span>
                  <span>
                    <strong>{label}</strong>
                    <small>{hint}</small>
                  </span>
                  <kbd>↵</kbd>
                </Link>
              ))
            ) : (
              <p className="command-empty">Nenhuma área encontrada.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
