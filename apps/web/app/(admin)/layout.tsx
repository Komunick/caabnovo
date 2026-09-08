import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { resolveCurrentUser } from "@/modules/auth/current-user";
import { AuthorizedNav } from "@/modules/auth/ui/authorized-nav";
import { AppShell } from "@/components/app-shell";
import { Brand } from "@/components/brand";
import { WorkspaceControls } from "@/components/workspace-controls";

export default async function AdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  const requestHeaders = await headers();
  const identity = await resolveCurrentUser(
    new Request("http://caab.internal/api/v1/me", { headers: requestHeaders }),
  );
  if (!identity) redirect("/login");

  return (
    <AppShell
      controls={<WorkspaceControls permissions={identity.permissions} />}
      sidebar={
        <div className="sidebar-inner">
          <Brand inverse />
          <AuthorizedNav permissions={identity.permissions} />
          <p className="sidebar-footer">
            <span aria-hidden="true" /> Ambiente seguro
          </p>
          <div className="sidebar-profile">
            <span className="sidebar-profile__avatar" aria-hidden="true">
              {identity.name.trim().charAt(0).toLocaleUpperCase("pt-BR")}
            </span>
            <span className="sidebar-profile__copy">
              <strong>{identity.name}</strong>
              <span>{identity.roles[0]?.name ?? "Usuário interno"}</span>
            </span>
          </div>
        </div>
      }
    >
      {children}
    </AppShell>
  );
}
