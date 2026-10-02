"use client";
import Link from "next/link";
import { Download } from "lucide-react";
import { PermissionGate } from "@/components/workspace-permissions";
import { buttonVariants } from "@/components/ui/button";

export function SchedulingExportLink({
  dataset,
  filters = {},
}: {
  dataset: "bookings" | "catalog" | "hours" | "absences";
  filters?: Record<string, string>;
}) {
  const query = new URLSearchParams({ dataset });
  for (const [key, value] of Object.entries(filters)) if (value) query.set(key, value);
  return (
    <PermissionGate permission="scheduling:read">
      <PermissionGate permission="exports:generate">
        <Link href={`/scheduling/exportar?${query}`} className={buttonVariants()}>
          <Download size={18} aria-hidden="true" /> Exportar Agendamentos
        </Link>
      </PermissionGate>
    </PermissionGate>
  );
}
