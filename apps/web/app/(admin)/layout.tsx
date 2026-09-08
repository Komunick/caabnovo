import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { resolveCurrentUser } from "@/modules/auth/current-user";
import { AuthorizedNav } from "@/modules/auth/ui/authorized-nav";
import { AppShell } from "@/components/app-shell";

export default async function AdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  const requestHeaders = await headers();
  const identity = await resolveCurrentUser(
    new Request("http://caab.internal/api/v1/me", { headers: requestHeaders }),
  );
  if (!identity) redirect("/login");

  return (
    <AppShell
      sidebar={
        <>
          <strong>CAAB Administração</strong>
          <p>{identity.name}</p>
          <AuthorizedNav permissions={identity.permissions} />
        </>
      }
    >
      {children}
    </AppShell>
  );
}
