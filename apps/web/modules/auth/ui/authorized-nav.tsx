"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, FileClock, House, LogOut, MonitorCog, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Menu, MenuItem } from "@/components/ui/menu";
import { PERMISSIONS } from "../permissions";

export function AuthorizedNav({ permissions }: Readonly<{ permissions: readonly string[] }>) {
  const router = useRouter();
  const pathname = usePathname();
  const allowed = new Set(permissions);
  const items = [
    { href: "/", label: "Início", icon: House, visible: true },
    {
      href: "/users",
      label: "Usuários",
      icon: UsersRound,
      visible: allowed.has(PERMISSIONS.usersRead),
    },
    {
      href: "/audit",
      label: "Auditoria",
      icon: FileClock,
      visible: allowed.has(PERMISSIONS.auditRead),
    },
    {
      href: "/operations/jobs",
      label: "Operações",
      icon: Activity,
      visible: allowed.has(PERMISSIONS.jobsRead),
    },
    { href: "/sessions", label: "Sessões", icon: MonitorCog, visible: true },
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
    <div className="sidebar-navigation">
      <p className="sidebar-navigation__label">Navegação</p>
      <Menu label="Navegação administrativa">
        {items
          .filter(({ visible }) => visible)
          .map(({ href, label, icon: Icon }) => (
            <MenuItem key={href}>
              <Link
                href={href}
                aria-current={
                  href === "/"
                    ? pathname === href
                      ? "page"
                      : undefined
                    : pathname.startsWith(href)
                      ? "page"
                      : undefined
                }
              >
                <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
                <span>{label}</span>
              </Link>
            </MenuItem>
          ))}
        <MenuItem>
          <Button className="sidebar-logout" intent="ghost" onClick={logout}>
            <LogOut size={19} strokeWidth={1.8} aria-hidden="true" />
            <span>Sair</span>
          </Button>
        </MenuItem>
      </Menu>
    </div>
  );
}
