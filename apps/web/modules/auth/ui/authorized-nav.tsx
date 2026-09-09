"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Menu, MenuItem } from "@/components/ui/menu";
import { getWorkspaceAreas, isAreaActive } from "@/modules/workspace/areas";

export function AuthorizedNav({ permissions }: Readonly<{ permissions: readonly string[] }>) {
  const router = useRouter();
  const pathname = usePathname();
  const items = getWorkspaceAreas(permissions);

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
        {items.map((area) => {
          const { href, label, icon: Icon } = area;
          return (
            <MenuItem key={area.id}>
              <Link href={href} aria-current={isAreaActive(area, pathname) ? "page" : undefined}>
                <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
                <span>{label}</span>
              </Link>
            </MenuItem>
          );
        })}
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
