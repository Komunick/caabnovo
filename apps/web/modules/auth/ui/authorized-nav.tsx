"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, MenuItem } from "@/components/ui/menu";
import { PERMISSIONS } from "../permissions";

export function AuthorizedNav({ permissions }: Readonly<{ permissions: readonly string[] }>) {
  const router = useRouter();
  const pathname = usePathname();
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
    <Menu label="Navegação administrativa">
      {items
        .filter(({ visible }) => visible)
        .map(({ href, label }) => (
          <MenuItem key={href}>
            <Link href={href} aria-current={pathname === href ? "page" : undefined}>
              {label}
            </Link>
          </MenuItem>
        ))}
      <MenuItem>
        <Button intent="ghost" onClick={logout}>
          Sair
        </Button>
      </MenuItem>
    </Menu>
  );
}
