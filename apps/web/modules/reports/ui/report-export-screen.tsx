"use client";
import { Fragment, type ComponentProps } from "react";
import { FormField } from "@/components/ui/form-field";
import { ExportScreen } from "@/modules/exports/ui/export-screen";

/** Uses the same additive renderFilter hook supplied by the Scheduling delivery. */
export function ReportExportScreen(props: ComponentProps<typeof ExportScreen>) {
  return (
    <ExportScreen
      {...props}
      renderFilter={(key, value, onChange, group) => {
        const filter = props.catalog.filters.find((candidate) => candidate.key === key)!;
        if (key === "notes")
          return (
            <FormField key={key} id={`export-filter-${key}`} label={filter.label}>
              <textarea
                value={value}
                maxLength={2000}
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
