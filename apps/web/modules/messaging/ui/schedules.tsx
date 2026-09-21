"use client";
import Link from "next/link";
import { useState } from "react";
import { Plus } from "lucide-react";
import type { MessageList, MessageSchedule, MessageRecord } from "@caab/contracts";
import { useDraftState } from "@/components/workspace-drafts";
import { Button, buttonVariants } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { SearchField } from "@/components/ui/search-controls";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Table, TableContainer } from "@/components/ui/table";
import { useMessageData, useMessageMutation } from "./client";
import {
  MessageShell,
  MessagePagination,
  MessageDataState,
  messageDate,
  executionReasons,
} from "./shared";
import styles from "./messages.module.css";
export function MessageSchedulesPage() {
  const [search, setSearch] = useDraftState("schedules:search", "");
  const [q, setQ] = useState(search);
  const [status, setStatus] = useDraftState("schedules:status", "scheduled");
  const [from, setFrom] = useDraftState("schedules:from", "");
  const [to, setTo] = useDraftState("schedules:to", "");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<{
    item: MessageSchedule;
    action: "cancel" | "reschedule";
  } | null>(null);
  const [date, setDate] = useDraftState("schedules:date", "");
  const [notice, setNotice] = useState("");
  const result = useMessageData<MessageList<MessageSchedule>>(
    `schedules?q=${encodeURIComponent(q)}&status=${status}&page=${page}${from ? `&from=${from}` : ""}${to ? `&to=${to}` : ""}`,
  );
  const mutation = useMessageMutation("schedules");
  async function command() {
    if (!selected) return;
    const changed = await mutation.mutate<MessageRecord>(
      `campaigns/${selected.item.campaignId}/command`,
      "POST",
      {
        action: selected.action,
        expectedVersion: selected.item.currentVersion,
        ...(selected.action === "reschedule"
          ? { scheduledAt: new Date(`${date}:00-03:00`).toISOString() }
          : {}),
      },
    );
    if (changed) {
      setNotice(
        selected.action === "cancel"
          ? "Agendamento cancelado."
          : "Agendamento alterado. O horário anterior foi preservado no histórico.",
      );
      setSelected(null);
      setDate("");
      result.reload();
    }
  }
  return (
    <MessageShell
      active="schedules"
      title="Agendamentos"
      description="Confira quando cada campanha será processada e gerencie os horários."
    >
      <div className={styles.actions}>
        <Link
          href="/messages/campaigns/new"
          className={buttonVariants({ intent: "primary", size: "add" })}
        >
          <Plus aria-hidden="true" />
          Novo agendamento
        </Link>
        <Link href="/messages" className={buttonVariants()}>
          Escolher campanha existente
        </Link>
      </div>
      <p className={styles.notice}>
        Horário de Brasília (UTC−3). Sem meio de envio configurado, o processamento registra
        bloqueio; nenhuma mensagem é transmitida.
      </p>
      {notice && <p role="status">{notice}</p>}
      <section className="panel">
        <h2>Encontrar agendamento</h2>
        <form
          className={styles.grid}
          onSubmit={(e) => {
            e.preventDefault();
            setQ(search);
            setPage(1);
          }}
        >
          <SearchField
            id="schedule-search"
            label="Buscar campanha"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <FormField id="schedule-status" label="Situação">
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="scheduled">Agendadas</option>
              <option value="blocked">Bloqueadas</option>
              <option value="canceled">Canceladas</option>
              <option value="all">Todas as solicitações</option>
            </select>
          </FormField>
          <FormField id="schedule-from" label="De">
            <input
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setPage(1);
              }}
            />
          </FormField>
          <FormField id="schedule-to" label="Até">
            <input
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) => {
                setTo(e.target.value);
                setPage(1);
              }}
            />
          </FormField>
        </form>
        {result.data ? (
          <>
            {!result.data.items.length ? (
              <p>Nenhum agendamento encontrado. Crie um novo ou escolha uma campanha existente.</p>
            ) : (
              <TableContainer aria-label="Agendamentos de mensagens">
                <Table
                  className={styles.scheduleTable}
                  role="table"
                  caption="Campanhas por horário de Brasília"
                >
                  <thead role="rowgroup">
                    <tr role="row">
                      <th role="columnheader" scope="col">
                        Campanha
                      </th>
                      <th role="columnheader" scope="col">
                        Horário
                      </th>
                      <th role="columnheader" scope="col">
                        Situação
                      </th>
                      <th role="columnheader" scope="col">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody role="rowgroup">
                    {result.data.items.map((item) => (
                      <tr role="row" key={item.id}>
                        <td role="cell" data-label="Campanha">
                          <Link href={`/messages/campaigns/${item.campaignId}`}>{item.name}</Link>
                        </td>
                        <td role="cell" data-label="Horário">
                          {messageDate(item.scheduledAt)}
                        </td>
                        <td role="cell" data-label="Situação">
                          {item.status === "scheduled"
                            ? "Agendada"
                            : (executionReasons[item.reason ?? ""] ?? item.status)}
                        </td>
                        <td role="cell" data-label="Ações">
                          {item.status === "scheduled" ? (
                            <div className={styles.actions}>
                              <Button
                                onClick={() => {
                                  setSelected({ item, action: "reschedule" });
                                  setDate("");
                                }}
                              >
                                Reagendar
                              </Button>
                              <Button onClick={() => setSelected({ item, action: "cancel" })}>
                                Cancelar
                              </Button>
                            </div>
                          ) : (
                            <Link href={`/messages/campaigns/${item.campaignId}`}>
                              Ver histórico
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TableContainer>
            )}
            <MessagePagination result={result.data} onPage={setPage} />
          </>
        ) : (
          <MessageDataState {...result} />
        )}
      </section>
      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open && !mutation.pending) setSelected(null);
        }}
      >
        <DialogContent
          title={selected?.action === "reschedule" ? "Reagendar campanha" : "Cancelar agendamento"}
          description="A alteração será registrada no histórico da campanha."
        >
          {selected && (
            <>
              <p>
                <strong>{selected.item.name}</strong> · {messageDate(selected.item.scheduledAt)}
              </p>
              {selected.action === "reschedule" ? (
                <FormField
                  id="reschedule-date"
                  label="Novo horário"
                  hint="Horário de Brasília. Entre um minuto e um ano a partir de agora."
                >
                  <input
                    type="datetime-local"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </FormField>
              ) : (
                <p>A campanha voltará a permitir edições.</p>
              )}
              {mutation.error && <p role="alert">{mutation.error}</p>}
              <div className={styles.actions}>
                <Button disabled={mutation.pending} onClick={() => setSelected(null)}>
                  Voltar
                </Button>
                <Button
                  intent="primary"
                  disabled={
                    mutation.pending ||
                    (selected.action === "reschedule" &&
                      (!date || !Number.isFinite(new Date(`${date}:00-03:00`).getTime())))
                  }
                  onClick={() => void command()}
                >
                  {mutation.pending
                    ? "Processando…"
                    : selected.action === "reschedule"
                      ? "Confirmar reagendamento"
                      : "Confirmar cancelamento"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </MessageShell>
  );
}
