"use client";
import type { SchedulingPolicy } from "@caab/contracts";
import { DraftInput, DraftSelect } from "@/components/ui/draft-controls";
import { FormField } from "@/components/ui/form-field";

export function ServicePolicyFields({
  value,
  onChange,
}: {
  value: SchedulingPolicy;
  onChange(value: SchedulingPolicy): void;
}) {
  return (
    <section className="scheduling-form" aria-labelledby="service-policy-heading">
      <h2 id="service-policy-heading">Regras do atendimento</h2>
      <label className="checkbox-field">
        <DraftInput
          type="checkbox"
          checked={value.immediateConfirmation}
          onChange={(e) => onChange({ ...value, immediateConfirmation: e.target.checked })}
        />
        Confirmar pedidos imediatamente
      </label>
      <p>
        Desative para a equipe aprovar ou recusar cada pedido. Enquanto aguarda, o pedido ocupa a
        vaga.
      </p>
      <div className="scheduling-grid">
        <FormField id="policy-audience" label="Público atendido">
          <DraftSelect
            value={value.audience}
            onChange={(e) =>
              onChange({ ...value, audience: e.target.value as SchedulingPolicy["audience"] })
            }
          >
            <option value="all">Titulares e dependentes</option>
            <option value="holders">Somente titulares</option>
          </DraftSelect>
        </FormField>
        <FormField id="policy-mode" label="Organização da agenda">
          <DraftSelect
            value={value.mode}
            onChange={(e) =>
              onChange({ ...value, mode: e.target.value as SchedulingPolicy["mode"] })
            }
          >
            <option value="professional">Por profissional</option>
            <option value="capacity">Por capacidade do serviço</option>
          </DraftSelect>
        </FormField>
        {value.mode === "capacity" ? (
          <FormField id="policy-capacity" label="Atendimentos simultâneos">
            <DraftInput
              type="number"
              min={1}
              required
              value={value.capacity}
              onChange={(e) => onChange({ ...value, capacity: Number(e.target.value) })}
            />
          </FormField>
        ) : (
          <label className="checkbox-field">
            <DraftInput
              type="checkbox"
              checked={value.allowProfessionalChoice}
              onChange={(e) => onChange({ ...value, allowProfessionalChoice: e.target.checked })}
            />
            Permitir escolha do profissional
          </label>
        )}
        <FormField
          id="policy-minimum"
          label="Antecedência para nova reserva (horas)"
          hint="Zero permite qualquer vaga futura disponível."
        >
          <DraftInput
            type="number"
            min={0}
            required
            value={value.minimumNoticeHours}
            onChange={(e) => onChange({ ...value, minimumNoticeHours: Number(e.target.value) })}
          />
        </FormField>
        <FormField
          id="policy-reschedule"
          label="Antecedência para remarcar (horas)"
          hint="Contada antes do horário atual. Zero retira o prazo mínimo."
        >
          <DraftInput
            type="number"
            min={0}
            required
            value={value.rescheduleNoticeHours}
            onChange={(e) => onChange({ ...value, rescheduleNoticeHours: Number(e.target.value) })}
          />
        </FormField>
        <FormField
          id="policy-horizon"
          label="Agendar até quantos dias à frente"
          hint="Deixe vazio para não limitar o período futuro."
        >
          <DraftInput
            type="number"
            min={1}
            value={value.horizonDays ?? ""}
            onChange={(e) =>
              onChange({
                ...value,
                horizonDays: e.target.value === "" ? null : Number(e.target.value),
              })
            }
          />
        </FormField>
        <FormField
          id="policy-review"
          label="Alertar análise atrasada após (horas)"
          hint="Deixe vazio para desligar este alerta. O pedido não expira."
        >
          <DraftInput
            type="number"
            min={0}
            value={value.reviewAlertHours ?? ""}
            onChange={(e) =>
              onChange({
                ...value,
                reviewAlertHours: e.target.value === "" ? null : Number(e.target.value),
              })
            }
          />
        </FormField>
        <FormField id="policy-urgency" label="Alertar proximidade do atendimento (horas)">
          <DraftInput
            type="number"
            min={0}
            required
            value={value.urgencyHours}
            onChange={(e) => onChange({ ...value, urgencyHours: Number(e.target.value) })}
          />
        </FormField>
      </div>
      <p>
        Limite de duas remarcações confirmadas por reserva. Alternativas de uma troca ainda em
        andamento não consomem outra utilização. Recuperação por indisponibilidade do
        estabelecimento é isenta.
      </p>
    </section>
  );
}
