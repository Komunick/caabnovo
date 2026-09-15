"use client";
import { useState, type FormEvent } from "react";
import type { SchedulingHoursRow } from "@caab/contracts";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import {
  Choice,
  DataState,
  SchedulingShell,
  useSchedulingData,
  useSchedulingMutation,
} from "./shared";
const days = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];
function HoursForm({
  path,
  unitId,
  professional,
}: {
  path: string;
  unitId: string;
  professional: boolean;
}) {
  const result = useSchedulingData<{ version: number; rows: SchedulingHoursRow[] }>(
    `${path}?unitId=${unitId}`,
  );
  return result.data ? (
    <HoursEditor
      key={result.data.version}
      path={path}
      unitId={unitId}
      professional={professional}
      data={result.data}
    />
  ) : (
    <DataState error={result.error} reload={result.reload} />
  );
}
function HoursEditor({
  path,
  unitId,
  professional,
  data,
}: {
  path: string;
  unitId: string;
  professional: boolean;
  data: { version: number; rows: SchedulingHoursRow[] };
}) {
  const [rows, setRows] = useState(data.rows);
  const [version, setVersion] = useState(data.version);
  const mutation = useSchedulingMutation();
  const [notice, setNotice] = useState("");
  const change = (weekday: number, field: string, value: string) =>
    setRows((values) =>
      values.map((row) =>
        row.weekday === weekday
          ? { ...row, [field]: value || (field.startsWith("lunch") ? null : "") }
          : row,
      ),
    );
  async function submit(event: FormEvent) {
    event.preventDefault();
    setNotice("");
    const saved = await mutation.mutate<{ version: number }>(path, "PUT", {
      expectedVersion: version,
      ...(professional ? { unitId } : {}),
      rows,
    });
    if (saved) {
      setNotice("Horários salvos.");
      setVersion(saved.version);
    }
  }
  return (
    <form className="page-stack" onSubmit={submit}>
      <p>
        Horário de Salvador (America/Bahia). Desmarque os dias sem atendimento. Uma faixa por dia,
        sem virar a noite.
      </p>
      <fieldset disabled={mutation.pending} className="scheduling-fields">
        {days.map((day, weekday) => {
          const row = rows.find((item) => item.weekday === weekday);
          return (
            <fieldset key={day} className="scheduling-day">
              <legend>{day}</legend>
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={!!row}
                  onChange={(event) =>
                    setRows((values) =>
                      event.target.checked
                        ? [
                            ...values,
                            {
                              weekday,
                              start: "",
                              end: "",
                              lunchStart: null,
                              lunchEnd: null,
                            },
                          ]
                        : values.filter((item) => item.weekday !== weekday),
                    )
                  }
                />
                Atendimento em {day}
              </label>
              {row && (
                <div className="scheduling-grid">
                  {[
                    ["start", "Início"],
                    ["end", "Fim"],
                    ...(professional
                      ? [
                          ["lunchStart", "Início do almoço (opcional)"],
                          ["lunchEnd", "Fim do almoço (opcional)"],
                        ]
                      : []),
                  ].map(([field, label]) => (
                    <FormField key={field} id={`hours-${weekday}-${field}`} label={label}>
                      <input
                        type="time"
                        required={field === "start" || field === "end"}
                        value={String(row[field as keyof SchedulingHoursRow] ?? "")}
                        onChange={(event) => change(weekday, field!, event.target.value)}
                      />
                    </FormField>
                  ))}
                </div>
              )}
            </fieldset>
          );
        })}
      </fieldset>
      {mutation.error && <p role="alert">{mutation.error}</p>}
      {notice && <p role="status">{notice}</p>}
      <Button type="submit" intent="primary" disabled={mutation.pending}>
        {mutation.pending ? "Salvando…" : "Salvar horários"}
      </Button>
    </form>
  );
}
export function SchedulingHours() {
  const [unitId, setUnitId] = useState("");
  const [professionalId, setProfessionalId] = useState("");
  const [kind, setKind] = useState("units");
  const id = kind === "units" ? unitId : professionalId;
  return (
    <SchedulingShell
      title="Horários de atendimento"
      description="Configure primeiro o expediente da unidade e depois a jornada e o almoço de cada profissional nessa unidade."
    >
      <section className="panel page-stack">
        <FormField id="hours-kind" label="Configurar">
          <select value={kind} onChange={(event) => setKind(event.target.value)}>
            <option value="units">Expediente da unidade</option>
            <option value="professionals">Jornada do profissional</option>
          </select>
        </FormField>
        <Choice
          label="Unidade"
          resource="units"
          value={unitId}
          onChange={(value) => {
            setUnitId(value);
            setProfessionalId("");
          }}
        />
        {kind === "professionals" && (
          <Choice
            label="Profissional"
            resource="professionals"
            value={professionalId}
            onChange={setProfessionalId}
          />
        )}
        {id && unitId ? (
          <HoursForm
            key={`${kind}-${id}-${unitId}`}
            path={`${kind}/${id}/hours`}
            unitId={unitId}
            professional={kind === "professionals"}
          />
        ) : (
          <p>Selecione os cadastros para consultar e definir os horários.</p>
        )}
      </section>
    </SchedulingShell>
  );
}
