"use client";

import { usePathname } from "next/navigation";
import { ModuleNavigation } from "@/components/ui/module-navigation";

export function AuditNavigation({ events, jobs }: Readonly<{ events: boolean; jobs: boolean }>) {
  const pathname = usePathname();
  if (!events && !jobs) return null;
  const processing = pathname === "/audit/jobs" || pathname.startsWith("/audit/jobs/");
  return (
    <ModuleNavigation
      label="Áreas de auditoria"
      items={[
        ...(events ? [{ href: "/audit", label: "Eventos", active: !processing }] : []),
        ...(jobs ? [{ href: "/audit/jobs", label: "Processamentos", active: processing }] : []),
      ]}
    />
  );
}
