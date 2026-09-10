"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronsUpDown, LogOut, MonitorCog, Settings } from "lucide-react";

export function AccountMenu({
  name,
  email,
  role,
}: Readonly<{ name: string; email: string; role: string }>) {
  const router = useRouter();
  const pathname = usePathname();
  const panelId = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    function outside(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  async function logout() {
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/auth/sign-out", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      });
      if (!response.ok) throw new Error();
      router.replace("/login");
      router.refresh();
    } catch {
      setError("Não foi possível sair. Tente novamente.");
    } finally {
      setPending(false);
    }
  }
  return (
    <div ref={root} className="account-menu">
      <button
        ref={trigger}
        className="sidebar-profile account-menu-trigger"
        type="button"
        aria-label={`Menu da conta de ${name}`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
      >
        <span className="account-menu-collapsed-label">Conta</span>
        <span className="sidebar-profile__copy">
          <strong>{name}</strong>
          <span>{role}</span>
        </span>
        <ChevronsUpDown className="account-menu-chevron" size={16} aria-hidden="true" />
      </button>
      {open ? (
        <div id={panelId} className="account-menu-panel">
          <p className="account-menu-identity">
            <strong>{name}</strong>
            <small>{email}</small>
          </p>
          <nav aria-label="Minha conta">
            <Link href="/settings" onClick={() => setOpen(false)}>
              <Settings size={18} aria-hidden="true" />
              <span>Configurações da conta</span>
            </Link>
            <Link href="/sessions" onClick={() => setOpen(false)}>
              <MonitorCog size={18} aria-hidden="true" />
              <span>Sessões</span>
            </Link>
          </nav>
          <button type="button" className="account-menu-logout" disabled={pending} onClick={logout}>
            <LogOut size={18} aria-hidden="true" />
            <span>{pending ? "Saindo…" : "Sair"}</span>
          </button>
          {error ? <p role="alert">{error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
