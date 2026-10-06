"use client";
import { Fragment, useEffect, useMemo, useState, type ComponentProps } from "react";
import { FormField } from "@/components/ui/form-field";
import { ExportScreen } from "@/modules/exports/ui/export-screen";
import { REPORT_EXPORT_NOTES_MAX, takeReportExportNotes } from "./client";

/** Uses the same additive renderFilter hook supplied by the Scheduling delivery. */
export function ReportExportScreen(props: ComponentProps<typeof ExportScreen>) {
  // The comment travels through sessionStorage, not the URL. It is read after mounting so the
  // first client render matches the server HTML; the screen then restarts once from the merged
  // initial selection (its draft key follows `initial`), before the user can have typed anything.
  const [carried, setCarried] = useState("");
  useEffect(() => {
    const notes = takeReportExportNotes();
    if (notes) setCarried(notes);
  }, []);
  const hasNotes = props.catalog.filters.some((filter) => filter.key === "notes");
  const initial = useMemo(
    () =>
      carried && hasNotes
        ? { ...props.initial, filters: { ...props.initial?.filters, notes: carried } }
        : props.initial,
    [carried, hasNotes, props.initial],
  );
  return (
    <ExportScreen
      {...props}
      initial={initial}
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
