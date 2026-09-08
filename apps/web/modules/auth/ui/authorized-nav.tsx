"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PERMISSIONS } from "../permissions";

export function AuthorizedNav({ permissions }: Readonly<{ permissions: readonly string[] }>) {
  const router = useRouter();
  const allowed = new Set(permissions);
  const items = [
    { href: "/", label: "Início", visible: true },
    { href: "/users", label: "Usuários", visible: allowed.has(PERMISSIONS.usersRead) },
    { href: "/audit", label: "Auditoria", visible: allowed.has(PERMISSIONS.auditRead) },
    {
      href: "/operations/jobs",
      label: "Operações",
      visible: allowed.has(PERMISSIONS.jobsRead),
    },
    { href: "/sessions", label: "Sessões", visible: true },
  ];

  async function logout() {
    const response = await fetch("/api/auth/sign-out", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    });
    if (!response.ok) return;
    router.replace("/login");
    router.refresh();
  }

  return (
    <nav aria-label="Navegação administrativa">
      {items
        .filter(({ visible }) => visible)
        .map(({ href, label }) => (
          <Link key={href} href={href}>
            {label}
          </Link>
        ))}
      <button type="button" onClick={logout}>
        Sair
      </button>
    </nav>
  );
}
