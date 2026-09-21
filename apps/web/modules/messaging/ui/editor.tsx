"use client";
import { useModulePermission } from "@/components/workspace-permissions";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  messageDataSchema,
  type MessageData,
  type MessageKind,
  type MessageRecord,
  type MessagePreview,
} from "@caab/contracts";
import { useDraftCache, useDraftState } from "@/components/workspace-drafts";
import { Button, buttonVariants } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useMessageData, useMessageMutation, messageRequest } from "./client";
import { MessageShell, MessageDataState, labels, listPath, messageDate } from "./shared";
import { MessageChoice } from "./choice";
import { AudienceSummary } from "./audience-summary";
import { AudienceFields } from "./audience-fields";
import { MessagePreviewView } from "./preview";
import { MessageHistory } from "./history";
import styles from "./messages.module.css";

export function MessageEditorPage({ kind, id }: { kind: MessageKind; id: string }) {
  const result = useMessageData<MessageRecord>(id === "new" ? null : `${kind}/${id}`);
  if (id !== "new" && !result.data)
    return (
      <MessageShell
        active={kind}
        title={`Editar ${labels[kind].singular}`}
        description="Conteúdo e configurações da comunicação."
      >
        <section className="panel">
          <MessageDataState {...result} />
        </section>
      </MessageShell>
    );
  return (
    <MessageEditor
      key={`${kind}:${id}`}
      kind={kind}
      initial={
        result.data ?? {
          id: "new",
          kind,
          data: messageDataSchema.parse({ name: "Nova mensagem" }),
          version: 0,
          archivedAt: null,
          scheduledAt: null,
          updatedAt: new Date().toISOString(),
        }
      }
    />
  );
}
function MessageEditor({ kind, initial }: { kind: MessageKind; initial: MessageRecord }) {
  const router = useRouter(),
    cache = useDraftCache();
  const [saved, setSaved] = useState(initial);
  const [edit, setEdit] = useDraftState(`edit:${initial.id}`, () => ({
    ...initial,
    data: initial.id === "new" ? { ...initial.data, name: "" } : initial.data,
  }));
  const [names, setNames] = useDraftState<Record<string, string>>(`names:${initial.id}`, () =>
    Object.fromEntries((initial.people ?? []).map((p) => [p.id, p.name])),
  );
  const [tab, setTab] = useDraftState(`tab:${initial.id}`, "content");
  const [schedule, setSchedule] = useDraftState(`schedule:${initial.id}`, "");
  const [preview, setPreview] = useState<{ source: string; value: MessagePreview } | null>(null);
  const [confirm, setConfirm] = useState<
    "send" | "schedule" | "reschedule" | "archive" | "restore" | "cancel" | "discard" | null
  >(null);
  const [notice, setNotice] = useState("");
  const [historyRevision, setHistoryRevision] = useState(0);
  const canWrite = useModulePermission("messages:write");
  const mutation = useMessageMutation(`edit:${initial.id}`);
  const dirty =
    JSON.stringify(edit.data) !== JSON.stringify(saved.data) || edit.version !== saved.version;
  const locked = Boolean(saved.archivedAt || saved.scheduledAt);
  const set = (patch: Partial<MessageData>) => {
    setEdit({ ...edit, data: { ...edit.data, ...patch } });
    setNotice("");
    setPreview(null);
  };
  async function save() {
    const result = await mutation.mutate<MessageRecord>(
      `${kind}${saved.id === "new" ? "" : `/${saved.id}`}`,
      saved.id === "new" ? "POST" : "PUT",
      { expectedVersion: edit.version, data: edit.data },
    );
    if (!result) return;
    setSaved(result);
    setEdit(result);
    setNotice("Alterações salvas.");
    if (saved.id === "new") {
      // Clear after updating React: useDraftState writes synchronously to the cache.
      cache.clear();
      cache.writeForRoute(`/messages/${kind}/${result.id}`, `schedule:${result.id}`, schedule);
      cache.writeForRoute(`/messages/${kind}/${result.id}`, `tab:${result.id}`, tab);
      router.replace(`/messages/${kind}/${result.id}`);
    }
  }
  async function review(action?: "send" | "schedule" | "reschedule") {
    setNotice("");
    const result = await mutation.mutate<MessagePreview>("preview", "POST", { data: edit.data });
    if (!result) return;
    setPreview({ source: JSON.stringify(edit.data), value: result });
    if (action && result.issues.length === 0) setConfirm(action);
    else setTab("preview");
  }
  async function command(action: string) {
    const result = await mutation.mutate<MessageRecord>(`${kind}/${saved.id}/command`, "POST", {
      action,
      expectedVersion: edit.version,
      ...(action === "schedule" || action === "reschedule"
        ? { scheduledAt: new Date(`${schedule}:00-03:00`).toISOString() }
        : {}),
    });
    if (!result) return;
    setConfirm(null);
    if (action === "duplicate") {
      // The new record must not replace the original record's cached form.
      router.push(`/messages/${kind}/${result.id}`);
      return;
    }
    setSaved(result);
    setEdit(result);
    if (action === "schedule" || action === "reschedule" || action === "cancel") setSchedule("");
    setHistoryRevision((n) => n + 1);
    setNotice(
      action === "send"
        ? "Solicitação registrada como bloqueada. Nenhuma mensagem foi enviada."
        : action === "schedule" || action === "reschedule"
          ? "Programação registrada. No horário, a falta de meio de envio será registrada como bloqueio."
          : action === "cancel"
            ? "Programação cancelada."
            : "Alteração salva.",
    );
  }
  async function discard() {
    if (saved.id === "new") {
      cache.clear();
      router.push(listPath(kind));
      return;
    }
    try {
      const current = await messageRequest<MessageRecord>(`${kind}/${saved.id}`);
      cache.clear();
      mutation.setError("");
      setSaved(current);
      setEdit(current);
      setNames(Object.fromEntries((current.people ?? []).map((p) => [p.id, p.name])));
      setSchedule("");
      setTab("content");
      setPreview(null);
      setConfirm(null);
      setHistoryRevision((n) => n + 1);
      setNotice("Versão atual carregada.");
    } catch {
      setNotice("Não foi possível carregar. Suas edições foram preservadas.");
    }
  }
  const visiblePreview = preview?.source === JSON.stringify(edit.data) ? preview.value : null;
  const organization = (saved.id !== "new" || kind === "campaigns") && (
    <section className={tab === "schedule" ? styles.stack : "panel"} id="message-scheduling">
      <h2>{kind === "campaigns" ? "Agendamento e envio" : "Organização"}</h2>
      {kind === "campaigns" && (
        <>
          <p className={styles.notice}>
            Nenhum meio de envio configurado. Você pode preparar e programar campanhas; as
            solicitações ficarão bloqueadas até que os meios sejam definidos. Não serão reenviadas
            automaticamente.
          </p>
          {!saved.archivedAt && (
            <>
              <FormField
                id="message-schedule"
                label="Programar para"
                hint="Horário de Brasília (UTC−3). Entre um minuto e um ano a partir de agora."
              >
                <input
                  type="datetime-local"
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                />
              </FormField>
              <div className={styles.actions}>
                <Button
                  intent="primary"
                  disabled={!canWrite || saved.id === "new" || locked || dirty || mutation.pending}
                  onClick={() => void review("send")}
                >
                  Solicitar envio agora
                </Button>
                <Button
                  disabled={
                    saved.id === "new" ||
                    dirty ||
                    mutation.pending ||
                    !schedule ||
                    !Number.isFinite(new Date(`${schedule}:00-03:00`).getTime())
                  }
                  onClick={() => void review(saved.scheduledAt ? "reschedule" : "schedule")}
                >
                  {saved.scheduledAt ? "Revisar reagendamento" : "Revisar programação"}
                </Button>
              </div>
              {(dirty || saved.id === "new") && (
                <p>
                  Salve o rascunho para revisar e confirmar o agendamento. O horário digitado será
                  preservado.
                </p>
              )}
            </>
          )}
          {saved.scheduledAt && (
            <Button disabled={!canWrite || mutation.pending} onClick={() => setConfirm("cancel")}>
              Cancelar programação
            </Button>
          )}
        </>
      )}
      <div className={styles.actions}>
        {kind === "campaigns" && saved.id !== "new" && (
          <Button
            disabled={!canWrite || mutation.pending || dirty}
            onClick={() => void command("duplicate")}
          >
            Duplicar campanha
          </Button>
        )}
        {saved.id !== "new" && !saved.scheduledAt && (
          <Button
            disabled={!canWrite || mutation.pending || dirty}
            onClick={() => setConfirm(saved.archivedAt ? "restore" : "archive")}
          >
            {saved.archivedAt ? "Restaurar" : "Arquivar"}
          </Button>
        )}
      </div>
    </section>
  );
  return (
    <MessageShell
      active={kind}
      title={saved.id === "new" ? labels[kind].add : saved.data.name}
      description={
        kind === "audiences"
          ? "Defina os filtros e as exclusões deste público."
          : "Prepare o conteúdo e confira os destinatários antes de solicitar o envio."
      }
    >
      <div className={styles.actions}>
        <Link href={listPath(kind)} className={buttonVariants()}>
          Voltar à lista
        </Link>
        <span>
          {saved.archivedAt
            ? "Arquivado"
            : saved.scheduledAt
              ? `Programada para ${messageDate(saved.scheduledAt)}`
              : saved.version
                ? `Versão ${saved.version}`
                : "Novo rascunho"}
        </span>
        {dirty && <span role="status">Alterações ainda não salvas</span>}
      </div>
      {notice && <p role="status">{notice}</p>}
      {mutation.error && <p role="alert">{mutation.error}</p>}
      {locked && (
        <p className={styles.notice}>
          {saved.archivedAt
            ? "Restaure este registro para editar."
            : "Cancele a programação antes de editar o conteúdo ou público."}
        </p>
      )}
      <section className="panel">
        <div className={styles.actions} role="group" aria-label="Etapas da mensagem">
          {(kind === "audiences"
            ? ["content", "preview"]
            : [
                "content",
                ...(kind === "campaigns" ? ["audience"] : []),
                "preview",
                ...(kind === "campaigns" ? ["schedule"] : []),
              ]
          ).map((value) => (
            <Button
              key={value}
              intent={tab === value ? "primary" : "secondary"}
              aria-pressed={tab === value}
              onClick={() => setTab(value)}
            >
              {value === "content"
                ? kind === "audiences"
                  ? "Público"
                  : "Conteúdo"
                : value === "audience"
                  ? "Público"
                  : value === "schedule"
                    ? "Agendamento"
                    : "Prévia"}
            </Button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <fieldset disabled={!canWrite || locked || mutation.pending} className={styles.stack}>
            {tab === "content" && (
              <>
                <FormField id="message-name" label="Nome interno">
                  <Input
                    value={edit.data.name}
                    required
                    minLength={2}
                    maxLength={160}
                    onChange={(e) => set({ name: e.target.value })}
                  />
                </FormField>
                {kind === "audiences" ? (
                  <AudienceFields
                    value={edit.data.audience}
                    onChange={(audience) => set({ audience })}
                    names={names}
                    setNames={setNames}
                  />
                ) : (
                  <>
                    {kind === "campaigns" && (
                      <MessageChoice
                        label="Usar modelo"
                        resource="templates"
                        onChoose={(item) => {
                          if (item.data) set({ subject: item.data.subject, body: item.data.body });
                        }}
                      />
                    )}
                    <FormField id="message-subject" label="Assunto">
                      <Input
                        value={edit.data.subject}
                        maxLength={200}
                        onChange={(e) => set({ subject: e.target.value })}
                      />
                    </FormField>
                    <FormField
                      id="message-body"
                      label="Mensagem"
                      hint="Personalize com {{nome}} ou {{primeiro_nome}}. O texto será adaptado ao meio de envio quando ele for definido."
                    >
                      <textarea
                        value={edit.data.body}
                        rows={12}
                        maxLength={12000}
                        onChange={(e) => set({ body: e.target.value })}
                      />
                    </FormField>
                    <span>{edit.data.body.length}/12000 caracteres</span>
                  </>
                )}
              </>
            )}
            {tab === "audience" && kind === "campaigns" && (
              <>
                <MessageChoice
                  label="Usar público salvo"
                  resource="audiences"
                  onChoose={(item) => {
                    if (item.data) {
                      set({ audience: item.data.audience });
                      void messageRequest<MessageRecord>(`audiences/${item.id}`)
                        .then((record) =>
                          setNames(
                            Object.fromEntries((record.people ?? []).map((p) => [p.id, p.name])),
                          ),
                        )
                        .catch(() => {});
                    }
                  }}
                />
                <AudienceFields
                  value={edit.data.audience}
                  onChange={(audience) => set({ audience })}
                  names={names}
                  setNames={setNames}
                />
              </>
            )}
          </fieldset>
          {tab === "preview" && (
            <div className={styles.stack}>
              <h2>Conferir prévia</h2>
              <Button disabled={!canWrite || mutation.pending} onClick={() => void review()}>
                Atualizar prévia
              </Button>
              {visiblePreview ? (
                <>
                  <AudienceSummary audience={edit.data.audience} />
                  <MessagePreviewView
                    preview={visiblePreview}
                    audienceOnly={kind === "audiences"}
                  />
                </>
              ) : (
                <p>Atualize a prévia para conferir o conteúdo e o público atual.</p>
              )}
            </div>
          )}
          {tab === "schedule" && organization}
          <div className={styles.actions}>
            {!locked && (
              <Button type="submit" intent="primary" disabled={!canWrite || mutation.pending}>
                {mutation.pending
                  ? "Salvando…"
                  : kind === "campaigns"
                    ? "Salvar rascunho"
                    : kind === "templates"
                      ? "Salvar modelo"
                      : "Salvar público"}
              </Button>
            )}
            <Button onClick={() => setConfirm("discard")} disabled={!canWrite || mutation.pending}>
              Descartar edições
            </Button>
          </div>
        </form>
      </section>
      {tab !== "schedule" && organization}
      {kind === "campaigns" && saved.id !== "new" && (
        <MessageHistory key={historyRevision} id={saved.id} />
      )}
      <Dialog
        open={confirm !== null}
        onOpenChange={(open) => {
          if (!open && !mutation.pending) setConfirm(null);
        }}
      >
        <DialogContent
          title={
            confirm === "send"
              ? "Confirmar solicitação"
              : confirm === "schedule" || confirm === "reschedule"
                ? "Confirmar programação"
                : confirm === "discard"
                  ? "Descartar edições?"
                  : "Confirmar alteração"
          }
          description={
            confirm === "discard"
              ? "As edições não salvas serão descartadas e a versão atual será carregada."
              : "Confira os dados antes de continuar."
          }
        >
          {(confirm === "send" || confirm === "schedule" || confirm === "reschedule") &&
            visiblePreview && (
              <>
                <p>
                  <strong>{saved.data.name}</strong> · Versão {edit.version}
                </p>
                {(confirm === "schedule" || confirm === "reschedule") && (
                  <p>Horário de Brasília: {schedule.replace("T", " ")}</p>
                )}
                <>
                  <AudienceSummary audience={edit.data.audience} />
                  <MessagePreviewView
                    preview={visiblePreview}
                    audienceOnly={kind === "audiences"}
                  />
                </>
              </>
            )}
          {confirm === "archive" && (
            <p>Arquivar retira este registro da lista de ativos. O histórico será preservado.</p>
          )}
          {confirm === "restore" && <p>O registro voltará à lista de ativos.</p>}
          {confirm === "cancel" && (
            <p>A programação será cancelada e a campanha poderá ser editada.</p>
          )}
          {mutation.error && <p role="alert">{mutation.error}</p>}
          <div className={styles.actions}>
            <Button disabled={!canWrite || mutation.pending} onClick={() => setConfirm(null)}>
              Voltar
            </Button>
            <Button
              intent={confirm === "discard" ? "danger" : "primary"}
              disabled={!canWrite || mutation.pending}
              onClick={() => {
                if (confirm === "discard") void discard();
                else if (confirm) void command(confirm);
              }}
            >
              {mutation.pending
                ? "Processando…"
                : confirm === "send"
                  ? "Confirmar solicitação sem canal"
                  : confirm === "schedule" || confirm === "reschedule"
                    ? "Confirmar programação"
                    : "Confirmar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MessageShell>
  );
}
