"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AuditNavigation({ events, jobs }: Readonly<{ events: boolean; jobs: boolean }>) {
  const pathname = usePathname();
  if (!events && !jobs) return null;
  const processing = pathname === "/audit/jobs" || pathname.startsWith("/audit/jobs/");
  return (
    <nav className="audit-navigation" aria-label="Áreas de auditoria">
      {events ? (
        <Link href="/audit" aria-current={!processing ? "page" : undefined}>
          Eventos
        </Link>
      ) : null}
      {jobs ? (
        <Link href="/audit/jobs" aria-current={processing ? "page" : undefined}>
          Processamentos
        </Link>
      ) : null}
    </nav>
  );
}
