"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Moon, Search, Sun } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { getWorkspaceDestinations, searchWorkspaceDestinations } from "@/modules/workspace/search";
import { useWorkspacePermissions } from "./workspace-permissions";

type Theme = "light" | "dark";

export function WorkspaceControls({ permissions }: Readonly<{ permissions: readonly string[] }>) {
  const currentPermissions = useWorkspacePermissions(permissions);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [theme, setTheme] = useState<Theme>("light");
  const searchRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const items = useMemo(() => getWorkspaceDestinations(currentPermissions), [currentPermissions]);
  const results = searchWorkspaceDestinations(items, query);

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
      <button
        className="command-trigger"
        type="button"
        aria-label="Buscar no site"
        onClick={() => setOpen(true)}
      >
        <Search size={17} aria-hidden="true" />
        <span>Buscar no site...</span>
        <kbd>Ctrl + K</kbd>
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
          description="Encontre funções e áreas do site. Use as setas e Enter para acessar."
        >
          <div className="command-search">
            <Search size={19} aria-hidden="true" />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ex.: OAB, benefícios, alterar senha"
              aria-label="Buscar funções e áreas"
              onKeyDown={(event) => {
                const links = resultsRef.current?.querySelectorAll<HTMLAnchorElement>("a");
                if (event.key === "Enter") {
                  event.preventDefault();
                  links?.[0]?.click();
                }
                if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                  event.preventDefault();
                  links?.[event.key === "ArrowDown" ? 0 : links.length - 1]?.focus();
                }
              }}
            />
          </div>
          <div
            className="command-results"
            aria-live="polite"
            ref={resultsRef}
            onKeyDown={(event) => {
              if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
              event.preventDefault();
              const links = [...event.currentTarget.querySelectorAll<HTMLAnchorElement>("a")];
              const index = links.indexOf(event.target as HTMLAnchorElement);
              const next = index + (event.key === "ArrowDown" ? 1 : -1);
              if (next < 0 || next >= links.length) searchRef.current?.focus();
              else links[next]?.focus();
            }}
          >
            {results.length ? (
              results.map(({ id, href, label, description, icon: Icon }) => (
                <Link href={href} key={id} prefetch={false} onClick={() => setOpen(false)}>
                  <span className="command-result__icon" aria-hidden="true">
                    <Icon size={18} />
                  </span>
                  <span>
                    <strong>{label}</strong>
                    <small>{description}</small>
                  </span>
                  <kbd>↵</kbd>
                </Link>
              ))
            ) : (
              <p className="command-empty">Nenhuma função encontrada. Tente outro nome.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
