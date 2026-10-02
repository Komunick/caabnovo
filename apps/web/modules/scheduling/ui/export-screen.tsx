"use client";
import type { ExportCatalog } from "@caab/contracts";
import { DraftScope } from "@/components/workspace-drafts";
import { ExportScreen } from "@/modules/exports/ui/export-screen";
import { Choice } from "./shared";

const choices: Record<string, { label: string; resource: string }> = {
  memberId: { label: "Pessoa atendida", resource: "beneficiaries" },
  unitId: { label: "Unidade", resource: "units" },
  professionalId: { label: "Profissional", resource: "professionals" },
  serviceId: { label: "Serviço", resource: "services" },
  procedureId: { label: "Procedimento", resource: "procedures" },
};
export function SchedulingExportScreen({
  catalog,
  backHref,
  initialFilters,
  selectedLabels,
}: {
  catalog: ExportCatalog;
  backHref: string;
  initialFilters: Record<string, string>;
  selectedLabels: Record<string, string>;
}) {
  return (
    <ExportScreen
      catalog={catalog}
      backHref={backHref}
      sourcePermission="scheduling:read"
      initialFilters={initialFilters}
      renderFilter={(key, value, onChange) => {
        const choice = choices[key];
        return choice ? (
          <DraftScope key={key} name={`export-choice:${catalog.dataset}:${key}`}>
            <Choice
              {...choice}
              value={value}
              onChange={onChange}
              selectedLabel={value === initialFilters[key] ? selectedLabels[key] : undefined}
            />
          </DraftScope>
        ) : null;
      }}
    />
  );
}
