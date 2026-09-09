import type { ReactNode } from "react";
import { headers } from "next/headers";
import { resolveRequestActor } from "@/modules/auth/request-actor";
import { PERMISSIONS } from "@/modules/auth/permissions";
import { AuditNavigation } from "@/modules/audit/ui/audit-navigation";

export default async function AuditLayout({ children }: Readonly<{ children: ReactNode }>) {
  const requestHeaders = await headers();
  const actor = await resolveRequestActor(
    new Request("http://caab.internal/audit", { headers: requestHeaders }),
  );
  return (
    <div className="page-stack">
      <AuditNavigation
        events={actor?.permissions.has(PERMISSIONS.auditRead) ?? false}
        jobs={actor?.permissions.has(PERMISSIONS.jobsRead) ?? false}
      />
      {children}
    </div>
  );
}
