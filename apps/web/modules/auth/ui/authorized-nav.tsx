"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, MenuItem } from "@/components/ui/menu";
import { getWorkspaceAreas, isAreaActive } from "@/modules/workspace/areas";

export function AuthorizedNav({ permissions }: Readonly<{ permissions: readonly string[] }>) {
  const pathname = usePathname();
  const items = getWorkspaceAreas(permissions).filter(
    (area) => area.id !== "sessions" && area.id !== "settings",
  );

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
      </Menu>
    </div>
  );
}
