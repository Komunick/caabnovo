"use client";
import { useState, type FormEvent } from "react";
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

const labels: Record<SchedulingKind, string> = {
  units: "Unidades",
  services: "Serviços",
  procedures: "Procedimentos",
  professionals: "Profissionais",
  assignments: "Habilitações",
};
function CatalogForm({
  kind,
  item,
  onSaved,
  onClose,
}: {
  kind: SchedulingKind;
  item?: SchedulingCatalogItem;
  onSaved(): void;
  onClose(): void;
}) {
  const [unitId, setUnitId] = useState(item?.unitId ?? "");
  const [serviceId, setServiceId] = useState(item?.serviceId ?? "");
  const [procedureId, setProcedureId] = useState(item?.procedureId ?? "");
  const [professionalId, setProfessionalId] = useState(item?.professionalId ?? "");
  const mutation = useSchedulingMutation();
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
      <h2>
        {item ? "Editar registro" : "Novo registro"} · {labels[kind]}
      </h2>
      <form onSubmit={submit} className="page-stack">
        <fieldset disabled={mutation.pending} className="scheduling-fields">
          {kind !== "assignments" && (
            <FormField id="catalog-name" label="Nome">
              <input name="name" required minLength={2} maxLength={160} defaultValue={item?.name} />
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
                <input
                  type="number"
                  name="durationMinutes"
                  min={1}
                  max={1440}
                  required
                  defaultValue={item?.durationMinutes ?? 30}
                />
              </FormField>
              <p>
                Uma nova duração vale para novas reservas e remarcações. Reservas existentes mantêm
                sua duração.
              </p>
              <FormField id="catalog-description" label="Descrição (opcional)">
                <textarea name="description" maxLength={1000} defaultValue={item?.description} />
              </FormField>
            </>
          )}
          <label className="checkbox-field">
            <input name="active" type="checkbox" defaultChecked={item?.active ?? true} />
            Ativo
          </label>
        </fieldset>
        {mutation.error && <p role="alert">{mutation.error}</p>}
        <div className="scheduling-actions">
          <Button type="submit" intent="primary" disabled={mutation.pending}>
            {mutation.pending ? "Salvando…" : "Salvar registro"}
          </Button>
          <Button disabled={mutation.pending} onClick={onClose}>
            Fechar formulário
          </Button>
        </div>
      </form>
    </section>
  );
}
export function SchedulingCatalog() {
  const [kind, setKind] = useState<SchedulingKind>("units");
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<SchedulingCatalogItem | "new" | null>(null);
  const [notice, setNotice] = useState("");
  const result = useSchedulingData<SchedulingPage<SchedulingCatalogItem>>(
    `${kind}?page=${page}&q=${encodeURIComponent(q)}`,
  );
  return (
    <SchedulingShell
      title="Oferta de atendimento"
      description="Cadastre unidades, serviços, procedimentos e profissionais. Depois habilite cada profissional e configure os horários."
    >
      <section className="panel">
        <div className="scheduling-grid">
          <FormField id="catalog-kind" label="Cadastro">
            <select
              value={kind}
              onChange={(event) => {
                setKind(event.target.value as SchedulingKind);
                setPage(1);
                setQ("");
                setEditing(null);
                setNotice("");
              }}
            >
              {schedulingKinds.map((key) => (
                <option key={key} value={key}>
                  {labels[key]}
                </option>
              ))}
            </select>
          </FormField>
          <FormField id="catalog-search" label="Buscar registros">
            <input
              type="search"
              value={q}
              onChange={(event) => {
                setQ(event.target.value);
                setPage(1);
              }}
            />
          </FormField>
        </div>
        <Button
          intent="primary"
          onClick={() => {
            setEditing("new");
            setNotice("");
          }}
        >
          Novo registro
        </Button>
      </section>
      {notice && <p role="status">{notice}</p>}
      {editing && (
        <CatalogForm
          key={`${kind}-${typeof editing === "string" ? editing : editing.id}`}
          kind={kind}
          item={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            result.reload();
            setNotice("Registro salvo.");
          }}
        />
      )}
      <section className="panel">
        <h2>{labels[kind]}</h2>
        {result.data ? (
          <>
            <ul className="scheduling-list">
              {result.data.items.map((item) => (
                <li key={item.id}>
                  <div>
                    <strong>{item.name}</strong>
                    {item.unitName && (
                      <p>
                        {item.unitName}
                        {item.serviceName ? ` · ${item.serviceName}` : ""}
                      </p>
                    )}
                    <p>
                      {item.active ? "Ativo" : "Inativo"}
                      {item.durationMinutes ? ` · ${item.durationMinutes} min` : ""}
                    </p>
                  </div>
                  <Button aria-label={`Editar ${item.name}`} onClick={() => setEditing(item)}>
                    Editar
                  </Button>
                </li>
              ))}
            </ul>
            {!result.data.total && (
              <p>Nenhum registro encontrado. Use “Novo registro” para começar.</p>
            )}
            <Pagination {...result.data} onPage={setPage} />
          </>
        ) : (
          <DataState error={result.error} reload={result.reload} />
        )}
      </section>
    </SchedulingShell>
  );
}
