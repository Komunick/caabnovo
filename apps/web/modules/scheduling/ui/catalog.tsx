"use client";
import { useModulePermission } from "@/components/workspace-permissions";
import { DraftScope, useDraftState, useDraftCache } from "@/components/workspace-drafts";
import { DraftInput, DraftTextarea, DraftForm } from "@/components/ui/draft-controls";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Plus, ArrowLeft, Pencil } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchField } from "@/components/ui/search-controls";
import { Table, TableContainer } from "@/components/ui/table";
import { catalogLabels } from "./catalog-labels";
import {
  schedulingKinds,
  brazilianPhoneSchema,
  contactFieldMessages,
  type SchedulingCatalogItem,
  type SchedulingKind,
  type SchedulingPage,
} from "@caab/contracts";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { BrazilianAddressFields } from "@/components/ui/brazilian-address-fields";
import { ValidatedTextField } from "@/components/ui/validated-text-field";
import {
  Choice,
  DataState,
  Pagination,
  SchedulingShell,
  useSchedulingData,
  useSchedulingMutation,
} from "./shared";

function CatalogForm({
  kind,
  item: currentItem,
  onSaved,
  onClose,
}: {
  kind: SchedulingKind;
  item?: SchedulingCatalogItem;
  onSaved(): void;
  onClose(): void;
}) {
  const [item] = useDraftState("baseline", currentItem);
  const [unitId, setUnitId] = useDraftState("catalog:unitId", item?.unitId ?? "");
  const [serviceId, setServiceId] = useDraftState("catalog:serviceId", item?.serviceId ?? "");
  const [procedureId, setProcedureId] = useDraftState(
    "catalog:procedureId",
    item?.procedureId ?? "",
  );
  const [professionalId, setProfessionalId] = useDraftState(
    "catalog:professionalId",
    item?.professionalId ?? "",
  );
  const canWrite = useModulePermission("scheduling:write");
  const mutation = useSchedulingMutation("catalog");
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    formRef.current?.querySelector<HTMLInputElement>("input:not([disabled])")?.focus();
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const data: Record<string, unknown> = {
      active: form.has("active"),
      ...(item ? { expectedVersion: item.version } : {}),
    };
    if (kind !== "assignments") data.name = form.get("name");
    if (kind === "units") {
      data.phone = form.get("phone");
      data.address = Object.fromEntries(
        [
          "postalCode",
          "street",
          "neighborhood",
          "number",
          "complement",
          "city",
          "state",
          "address",
        ].map((key) => [key, form.get(key) ?? ""]),
      );
    }
    if (kind === "services") data.unitId = unitId;
    if (kind === "procedures") {
      data.serviceId = serviceId;
      data.durationMinutes = Number(form.get("durationMinutes"));
      data.description = form.get("description");
    }
    if (kind === "assignments") Object.assign(data, { unitId, procedureId, professionalId });
    if (await mutation.mutate(`${kind}${item ? `/${item.id}` : ""}`, item ? "PATCH" : "POST", data))
      onSaved();
  }
  return (
    <section className="panel">
      <h2>Dados do cadastro</h2>
      <DraftForm
        draftKey="scheduling-catalog-1"
        ref={formRef}
        onSubmit={submit}
        className="scheduling-form"
      >
        <fieldset disabled={!canWrite || mutation.pending} className="scheduling-fields">
          {kind !== "assignments" && (
            <FormField id="catalog-name" label="Nome">
              <DraftInput
                name="name"
                required
                minLength={2}
                maxLength={160}
                defaultValue={item?.name}
              />
            </FormField>
          )}
          {(kind === "services" || kind === "assignments" || kind === "procedures") && (
            <Choice
              label="Unidade"
              resource="units"
              value={unitId}
              selectedLabel={item?.unitName}
              disabled={!!item}
              onChange={(value) => {
                setUnitId(value);
                setServiceId("");
                setProcedureId("");
              }}
              required
            />
          )}
          {(kind === "procedures" || kind === "assignments") && (
            <Choice
              key={`service-${unitId}`}
              label="Serviço"
              selectedLabel={item?.serviceName}
              resource="services"
              filters={`unitId=${unitId}`}
              disabled={!unitId || !!item}
              value={serviceId}
              onChange={(value) => {
                setServiceId(value);
                setProcedureId("");
              }}
              required={!item}
            />
          )}
          {kind === "assignments" && (
            <>
              <Choice
                key={`procedure-${serviceId}`}
                label="Procedimento"
                selectedLabel={item?.procedureName}
                resource="procedures"
                filters={`serviceId=${serviceId}`}
                disabled={!serviceId || !!item}
                value={procedureId}
                onChange={setProcedureId}
                required={!item}
              />
              <Choice
                label="Profissional"
                selectedLabel={item?.professionalName}
                resource="professionals"
                value={professionalId}
                disabled={!!item}
                onChange={setProfessionalId}
                required
              />
            </>
          )}
          {item && ["services", "procedures", "assignments"].includes(kind) && (
            <p>
              Para mudar a unidade ou os vínculos, cadastre uma nova oferta. Este registro preserva
              o histórico.
            </p>
          )}
          {kind === "units" && (
            <>
              <BrazilianAddressFields prefix="scheduling-unit" initial={item?.address} />
              <ValidatedTextField
                id="catalog-phone"
                label="Telefone (opcional)"
                mask="phone"
                schema={brazilianPhoneSchema}
                message={contactFieldMessages.phone}
                name="phone"
                type="tel"
                maxLength={20}
                placeholder="(71) 99999-9999"
                defaultValue={item?.phone}
              />
            </>
          )}
          {kind === "procedures" && (
            <>
              <FormField id="catalog-duration" label="Duração em minutos">
                <DraftInput
                  type="number"
                  name="durationMinutes"
                  min={1}
                  max={1440}
                  required
                  defaultValue={item?.durationMinutes ?? ""}
                />
              </FormField>
              <p>
                Uma nova duração vale para novas reservas e remarcações. Reservas existentes mantêm
                sua duração.
              </p>
              <FormField id="catalog-description" label="Descrição (opcional)">
                <DraftTextarea
                  name="description"
                  maxLength={1000}
                  defaultValue={item?.description}
                />
              </FormField>
            </>
          )}
          <label className="checkbox-field">
            <DraftInput name="active" type="checkbox" defaultChecked={item?.active ?? true} />
            Ativo
          </label>
        </fieldset>
        {mutation.error && <p role="alert">{mutation.error}</p>}
        <div className="scheduling-actions">
          <Button
            type="submit"
            intent="primary"
            size={item ? "default" : "add"}
            disabled={!canWrite || mutation.pending}
          >
            {!item && <Plus aria-hidden="true" />}
            {mutation.pending
              ? "Salvando…"
              : item
                ? "Salvar alterações"
                : catalogLabels[kind].add.replace(/^Nov[ao]/, "Criar")}
          </Button>
          <Button disabled={!canWrite || mutation.pending} onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </DraftForm>
    </section>
  );
}
export function SchedulingCatalog() {
  const query = useSearchParams();
  const selected = query.get("kind") as SchedulingKind;
  const kind = schedulingKinds.includes(selected) ? selected : "units";
  return <CatalogPage key={kind} kind={kind} />;
}
function CatalogPage({ kind }: { kind: SchedulingKind }) {
  const drafts = useDraftCache();
  const canWrite = useModulePermission("scheduling:write");
  const router = useRouter();
  const query = useSearchParams();
  const page = Math.max(1, Number(query.get("page")) || 1);
  const q = query.get("q") ?? "";
  const [editing, setEditing] = useDraftState<SchedulingCatalogItem | "new" | null>(
    "catalog:editing",
    null,
  );
  const [notice, setNotice] = useState("");
  const addRef = useRef<HTMLButtonElement>(null);
  const result = useSchedulingData<SchedulingPage<SchedulingCatalogItem>>(
    `${kind}?page=${page}&q=${encodeURIComponent(q)}`,
  );
  const label = catalogLabels[kind];
  function navigate(nextPage: number, search = q) {
    router.push(
      `/scheduling/catalog?${new URLSearchParams({ kind, page: String(nextPage), q: search })}`,
      { scroll: false },
    );
  }
  function close() {
    drafts.clear(`catalog-record:${editing === "new" ? "new" : editing?.id}:`);
    setEditing(null);
    requestAnimationFrame(() => addRef.current?.focus());
  }
  return (
    <SchedulingShell
      title={editing ? (editing === "new" ? label.add : label.edit) : label.title}
      description={label.description}
      action={
        editing ? (
          <Button onClick={() => setEditing(null)}>
            <ArrowLeft aria-hidden="true" size={18} /> Voltar para{" "}
            {label.title.toLocaleLowerCase("pt-BR")}
          </Button>
        ) : (
          <Button
            ref={addRef}
            intent="primary"
            size="add"
            onClick={() => {
              setEditing("new");
              setNotice("");
            }}
          >
            <Plus aria-hidden="true" /> {label.add}
          </Button>
        )
      }
    >
      {notice && (
        <p className="scheduling-notice" role="status">
          {notice}
        </p>
      )}
      {editing ? (
        <DraftScope name={`catalog-record:${editing === "new" ? "new" : editing.id}`}>
          <CatalogForm
            key={`${kind}-${typeof editing === "string" ? editing : editing.id}`}
            kind={kind}
            item={editing === "new" ? undefined : editing}
            onClose={close}
            onSaved={() => {
              close();
              result.reload();
              setNotice("Registro salvo.");
            }}
          />
        </DraftScope>
      ) : (
        <section className="panel">
          <h2>Encontrar {label.title.toLocaleLowerCase("pt-BR")}</h2>
          <DraftForm
            draftKey="scheduling-catalog-2"
            role="search"
            aria-label={`Buscar ${label.title.toLocaleLowerCase("pt-BR")}`}
            onSubmit={(event) => {
              event.preventDefault();
              navigate(1, String(new FormData(event.currentTarget).get("q") ?? ""));
            }}
          >
            <div className="filter-toolbar">
              <SearchField
                key={q}
                id="catalog-search"
                label="Buscar registros"
                name="q"
                maxLength={160}
                defaultValue={q}
              />
              <Button
                onClick={() => {
                  drafts.clear("scheduling-catalog-2:");
                  navigate(1, "");
                }}
              >
                Limpar filtros
              </Button>
            </div>
          </DraftForm>
          {result.data ? (
            <>
              {result.data.items.length ? (
                <TableContainer aria-label={`Lista de ${label.title.toLocaleLowerCase("pt-BR")}`}>
                  <Table className="scheduling-table" caption={`${label.title} de atendimento`}>
                    <thead>
                      <tr>
                        <th scope="col">Nome</th>
                        <th scope="col">
                          {kind === "procedures" ? "Serviço e duração" : "Unidade e serviço"}
                        </th>
                        <th scope="col">Situação</th>
                        <th scope="col">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.data.items.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <strong>{item.name}</strong>
                          </td>
                          <td>
                            {[
                              item.unitName,
                              item.serviceName,
                              item.durationMinutes ? `${item.durationMinutes} min` : "",
                            ]
                              .filter(Boolean)
                              .join(" · ") || "—"}
                          </td>
                          <td>
                            <span className="status-badge">
                              {item.active ? "Ativo" : "Inativo"}
                            </span>
                          </td>
                          <td>
                            <Button
                              size="compact"
                              disabled={!canWrite}
                              aria-label={`Editar ${item.name}`}
                              onClick={() => {
                                setEditing(item);
                                setNotice("");
                              }}
                            >
                              <Pencil size={16} aria-hidden="true" /> Editar
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </TableContainer>
              ) : (
                <div className="scheduling-empty">
                  <p>
                    {q
                      ? "Nenhum registro encontrado para essa busca."
                      : `Nenhum cadastro em ${label.title.toLocaleLowerCase("pt-BR")} ainda.`}
                  </p>
                  <Button
                    onClick={() => {
                      setEditing("new");
                      setNotice("");
                    }}
                  >
                    <Plus size={18} aria-hidden="true" /> {label.add}
                  </Button>
                </div>
              )}
              <Pagination {...result.data} onPage={navigate} />
            </>
          ) : (
            <DataState error={result.error} reload={result.reload} />
          )}
        </section>
      )}
    </SchedulingShell>
  );
}
