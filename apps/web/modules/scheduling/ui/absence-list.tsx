"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  schedulingAbsenceStatusLabels,
  type SchedulingAbsenceListItem,
  type SchedulingPage,
} from "@caab/contracts";
import { DraftScope, useDraftCache } from "@/components/workspace-drafts";
import { DraftForm, DraftSelect } from "@/components/ui/draft-controls";
import { Button, buttonVariants } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { PanelHeading } from "@/components/ui/panel-heading";
import { SearchField, FilterToggle } from "@/components/ui/search-controls";
import { Table, TableContainer } from "@/components/ui/table";
import { SchedulingExportLink } from "./export-link";
import { SchedulingShell, DataState, Pagination, dateTimeLabel, useSchedulingData } from "./shared";

export function SchedulingAbsenceList() {
  const query = useSearchParams(),
    router = useRouter();
  const filters = new URLSearchParams();
  for (const key of ["q", "status", "page"]) {
    const value = query.get(key);
    if (value) filters.set(key, value);
  }
  const result = useSchedulingData<SchedulingPage<SchedulingAbsenceListItem>>(
    `absences?${filters}`,
  );
  const filtered = Boolean(
    query.get("q") || (query.get("status") && query.get("status") !== "all"),
  );
  function changePage(page: number) {
    const next = new URLSearchParams(filters);
    next.set("page", String(page));
    router.push(`/scheduling/absences?${next}`);
  }
  return (
    <SchedulingShell
      title="Faltas"
      description="Acompanhe os prazos e os pedidos de justificativa ou contestação de falta."
      action={false}
    >
      <section className="panel">
        <PanelHeading title="Encontrar falta">
          <SchedulingExportLink
            dataset="absences"
            filters={{
              q: query.get("q") ?? "",
              status: query.get("status") === "all" ? "" : (query.get("status") ?? ""),
            }}
          />
        </PanelHeading>
        <DraftScope
          name={`absence-list-filters:${query.get("q") ?? ""}:${query.get("status") ?? ""}`}
        >
          <AbsenceFilters key={query.toString()} initial={new URLSearchParams(filters)} />
        </DraftScope>
        {result.data ? (
          <>
            {result.data.items.length ? (
              <TableContainer role="region" aria-label="Faltas registradas">
                <Table
                  className="scheduling-table"
                  caption="Faltas e prazos de revisão (horário da Bahia)"
                >
                  <thead>
                    <tr>
                      <th scope="col">Beneficiário</th>
                      <th scope="col">Atendimento</th>
                      <th scope="col">Registro da falta</th>
                      <th scope="col">Situação</th>
                      <th scope="col">Resposta até</th>
                      <th scope="col">Restrição</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.data.items.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <Link
                            href={`/scheduling/${item.bookingId}#falta`}
                            aria-label={`Ver falta de ${item.memberName} em ${dateTimeLabel(item.startsAt)}`}
                          >
                            {item.memberName}
                          </Link>
                        </td>
                        <td>
                          <strong>{item.procedureName}</strong>
                          <span className="scheduling-muted">{item.unitName}</span>
                          <span className="scheduling-muted">{dateTimeLabel(item.startsAt)}</span>
                        </td>
                        <td>{dateTimeLabel(item.recordedAt)}</td>
                        <td>{schedulingAbsenceStatusLabels[item.status]}</td>
                        <td>{dateTimeLabel(item.appealDeadline)}</td>
                        <td>
                          {item.restrictionActive ? (
                            <>
                              Novas reservas impedidas até {dateTimeLabel(item.restrictionEndsAt)}
                            </>
                          ) : (
                            "Sem restrição por esta falta"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TableContainer>
            ) : (
              <div role="status">
                <p>
                  {filtered
                    ? "Nenhuma falta encontrada para estes filtros."
                    : "Nenhuma falta registrada."}
                </p>
                {!filtered && (
                  <p>
                    O registro de falta fica no detalhe de um compromisso confirmado, após o término
                    previsto. <Link href="/scheduling">Consultar agenda</Link>
                  </p>
                )}
              </div>
            )}
            <Pagination {...result.data} onPage={changePage} />
          </>
        ) : (
          <DataState error={result.error} reload={result.reload} />
        )}
      </section>
    </SchedulingShell>
  );
}
function AbsenceFilters({ initial }: { initial: URLSearchParams }) {
  const router = useRouter(),
    drafts = useDraftCache();
  const [expanded, setExpanded] = useState(
    Boolean(initial.get("status") && initial.get("status") !== "all"),
  );
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget),
      next = new URLSearchParams();
    for (const key of ["q", "status"]) {
      const value = String(form.get(key) ?? "").trim();
      if (value && value !== "all") next.set(key, value);
    }
    drafts.clear("scheduling-absence-filters:");
    router.push(`/scheduling/absences?${next}`);
  }
  return (
    <DraftForm
      draftKey="scheduling-absence-filters"
      role="search"
      aria-label="Filtros de faltas"
      className="scheduling-filters"
      onSubmit={submit}
    >
      <div className="filter-toolbar">
        <SearchField
          id="absence-person"
          name="q"
          label="Nome do beneficiário"
          defaultValue={initial.get("q") ?? ""}
          maxLength={100}
        />
        <FilterToggle
          expanded={expanded}
          controls="absence-extra-filters"
          count={initial.get("status") && initial.get("status") !== "all" ? 1 : 0}
          onClick={() => setExpanded(!expanded)}
        />
        {(initial.get("q") || initial.get("status") || expanded) && (
          <Link
            href="/scheduling/absences"
            className={buttonVariants()}
            onClick={() => drafts.clear("scheduling-absence-filters:")}
          >
            Limpar filtros
          </Link>
        )}
      </div>
      <div id="absence-extra-filters" hidden={!expanded}>
        <div className="scheduling-grid">
          <FormField id="absence-status" label="Situação">
            <DraftSelect
              name="status"
              defaultValue={initial.get("status") ?? "all"}
              onChange={(event) => event.currentTarget.form?.requestSubmit()}
            >
              <option value="all">Todas</option>
              {Object.entries(schedulingAbsenceStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </DraftSelect>
          </FormField>
          <Button type="submit">Aplicar filtros</Button>
        </div>
      </div>
    </DraftForm>
  );
}
