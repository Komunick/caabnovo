"use client";
import Link from "next/link";
import { useState } from "react";
import {
  schedulingStatusLabels,
  type SchedulingBooking,
  type SchedulingPage,
} from "@caab/contracts";
import {
  SchedulingShell,
  DataState,
  Pagination,
  Choice,
  dateTimeLabel,
  useSchedulingData,
} from "./shared";
type Item = SchedulingBooking & {
  ageHours: number;
  overdue: boolean;
  urgent: boolean;
  teamRole: string;
};
export function SchedulingApprovalQueue() {
  const [page, setPage] = useState(1),
    [unitId, setUnitId] = useState("");
  const result = useSchedulingData<SchedulingPage<Item>>(
    `approval-queue?page=${page}${unitId ? `&unitId=${unitId}` : ""}`,
  );
  return (
    <SchedulingShell
      title="Pendências de atendimento"
      description="Remarcações aparecem primeiro, pela proximidade do horário original. Novos pedidos seguem a ordem de chegada."
    >
      <section className="panel scheduling-form">
        <Choice
          label="Unidade"
          resource="units"
          value={unitId}
          onChange={(id) => {
            setUnitId(id);
            setPage(1);
          }}
        />
        {result.data ? (
          <>
            {!result.data.items.length && <p>Nenhum pedido pendente nos filtros selecionados.</p>}
            <ol className="scheduling-history">
              {result.data.items.map((item) => (
                <li key={item.id}>
                  <Link href={`/scheduling/${item.id}`}>
                    <strong>
                      {item.memberName} · {item.procedureName}
                    </strong>
                  </Link>
                  <p>
                    {schedulingStatusLabels[item.status]} · {item.unitName} ·{" "}
                    {item.teamRole === "primary" ? "Sua equipe é responsável" : "Atuação de backup"}
                  </p>
                  {item.originalStart && (
                    <p>Horário original: {dateTimeLabel(item.originalStart)}</p>
                  )}
                  <p>Destino: {dateTimeLabel(item.startsAt)}</p>
                  {item.enteredReviewAt && (
                    <p>
                      Em análise desde {dateTimeLabel(item.enteredReviewAt)} ·{" "}
                      {Math.floor(item.ageHours)} hora(s)
                    </p>
                  )}
                  {item.overdue && (
                    <p>
                      <strong>Análise atrasada</strong>
                    </p>
                  )}
                  {item.urgent && (
                    <p>
                      <strong>Atendimento próximo ou horário solicitado já passou</strong>
                    </p>
                  )}
                </li>
              ))}
            </ol>
            <Pagination {...result.data} onPage={setPage} />
          </>
        ) : (
          <DataState error={result.error} reload={result.reload} />
        )}
      </section>
    </SchedulingShell>
  );
}
