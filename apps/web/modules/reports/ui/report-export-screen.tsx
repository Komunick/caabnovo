"use client";
import { Fragment, useEffect, useState, type ComponentProps } from "react";
import { useSearchParams } from "next/navigation";
import { useDraftCache } from "@/components/workspace-drafts";
import { useModulePermission } from "@/components/workspace-permissions";
import { FormField } from "@/components/ui/form-field";
import { ExportScreen } from "@/modules/exports/ui/export-screen";
import { REPORT_EXPORT_NOTES_MAX, takeReportExportNotes } from "./client";

/** Uses the same additive renderFilter hook supplied by the Scheduling delivery. */
export function ReportExportScreen(props: ComponentProps<typeof ExportScreen>) {
  const cache = useDraftCache();
  const params = useSearchParams();
  const href = `/reports/exportar?${params}`;
  const canRead = useModulePermission(props.sourcePermission);
  const canExport = useModulePermission("exports:generate");
  const [seed, setSeed] = useState<{ href: string; filters: Record<string, string> }>();
  useEffect(() => {
    const notes = takeReportExportNotes(cache, href);
    if (
      notes &&
      canRead &&
      canExport &&
      props.catalog.filters.some((filter) => filter.key === "notes")
    )
      setSeed({ href, filters: { notes } });
  }, [cache, href, canRead, canExport, props.catalog.filters]);
  return (
    <ExportScreen
      {...props}
      seedFilters={seed?.href === href ? seed.filters : undefined}
      renderFilter={(key, value, onChange, group) => {
        const filter = props.catalog.filters.find((candidate) => candidate.key === key)!;
        if (key === "notes")
          return (
            <FormField key={key} id={`export-filter-${key}`} label={filter.label}>
              <textarea
                value={value}
                maxLength={REPORT_EXPORT_NOTES_MAX}
                onChange={(event) => onChange(event.target.value)}
              />
            </FormField>
          );
        if (key.startsWith("include_") && group) {
          // One fieldset for the eight sources, rendered where the first one appears.
          const sources = props.catalog.filters.filter((candidate) =>
            candidate.key.startsWith("include_"),
          );
          if (sources[0]?.key !== key) return <Fragment key={key} />;
          return (
            <fieldset key="include-sources" className="export-fields export-sources">
              <legend>Fontes incluídas</legend>
              <div className="list-filters export-filters">
                {sources.map((source) => (
                  <FormField
                    key={source.key}
                    id={`export-filter-${source.key}`}
                    label={source.label}
                  >
                    <select
                      value={group.filters[source.key] || "no"}
                      onChange={(event) => group.setFilter(source.key, event.target.value)}
                    >
                      {source.options?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </FormField>
                ))}
              </div>
            </fieldset>
          );
        }
        if (key.startsWith("include_") || key === "groupBy" || key === "environment") {
          return (
            <FormField key={key} id={`export-filter-${key}`} label={filter.label}>
              <select
                value={
                  value ||
                  (key.startsWith("include_") ? "no" : key === "environment" ? "production" : "")
                }
                onChange={(event) => onChange(event.target.value)}
              >
                {key === "groupBy" && !value && <option value="">Selecione o agrupamento</option>}
                {filter.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>
          );
        }
        return undefined;
      }}
    />
  );
}

/** The server denied the destination before mounting an export form. */
export function ClearReportExportNotes() {
  const cache = useDraftCache();
  useEffect(() => {
    takeReportExportNotes(cache, "");
  }, [cache]);
  return null;
}
