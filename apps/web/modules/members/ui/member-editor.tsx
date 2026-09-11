"use client";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import {
  memberDimensions,
  type MemberRecord,
  type MemberDimension,
  type MemberListItem,
} from "@caab/contracts";
import { Button, buttonVariants } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { ProfileForm } from "./profile-form";
import { MemberDocuments } from "./member-documents";
import { MemberAdministrativeStatus } from "./member-administrative-status";
import { memberRequest, mutationHeaders } from "./client";
import {
  actionLabels,
  administrativeStatusLabels,
  dimensionLabels,
  formatMemberDate,
  resultLabels,
} from "./labels";
import styles from "./members.module.css";

type HistoryPage = {
  items: {
    id: string;
    action: string;
    reason: string;
    createdAt: string;
    actorName: string;
    after?: {
      previousAdministrativeStatus?: MemberRecord["administrativeStatus"];
      administrativeStatus?: MemberRecord["administrativeStatus"];
    };
  }[];
  page: number;
  hasNextPage: boolean;
};
export function MemberEditor({
  initial,
  canReadFiles,
  canUpload,
  canWrite,
  canReview,
}: {
  initial: MemberRecord;
  canReadFiles: boolean;
  canUpload: boolean;
  canWrite: boolean;
  canReview: boolean;
}) {
  const [member, setMember] = useState(initial);
  const [tab, setTab] = useState("Situações");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [dimension, setDimension] = useState<MemberDimension>("registration");
  const [matches, setMatches] = useState<MemberListItem[]>([]);
  const [searched, setSearched] = useState(false);
  const [history, setHistory] = useState<HistoryPage | null>(null);
  const retry = useRef({ body: "", key: "" });
  async function command(input: Record<string, unknown>) {
    setBusy(true);
    setError("");
    setMessage("");
    const body = JSON.stringify({ ...input, expectedVersion: member.version });
    if (retry.current.body !== body) retry.current = { body, key: crypto.randomUUID() };
    try {
      const updated = await memberRequest<MemberRecord>(`/api/v1/members/${member.id}/commands`, {
        method: "POST",
        headers: mutationHeaders(retry.current.key),
        body,
      });
      setMember(updated);
      setHistory(null);
      setMessage("Alteração registrada.");
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha na alteração.");
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function loadHistory(page = 1) {
    try {
      setHistory(
        await memberRequest<HistoryPage>(`/api/v1/members/${member.id}/history?page=${page}`),
      );
    } catch (e) {
      setError(String(e));
    }
  }
  return (
    <div className={styles.root}>
      <header className="page-header">
        <p className="eyebrow">Pessoas</p>
        <h1>{member.profile.socialName || member.profile.name}</h1>
        <p>
          {member.archivedAt ? "Cadastro arquivado" : "Cadastro de associado ou dependente"} ·
          atualizado em {formatMemberDate(member.updatedAt)}
        </p>
        <Link className={buttonVariants({ size: "compact" })} href="/members">
          Voltar à lista
        </Link>
      </header>
      {error && (
        <div className={styles.notice} role="alert">
          <p>{error}</p>
          <Button
            disabled={busy}
            onClick={() => {
              void memberRequest<MemberRecord>(`/api/v1/members/${member.id}`)
                .then((m) => {
                  setMember(m);
                  setError("");
                  setMessage("Dados recarregados. Revise antes de salvar.");
                })
                .catch((e) => setError(String(e)));
            }}
          >
            Recarregar dados
          </Button>
        </div>
      )}
      <p role="status" aria-live="polite">
        {message}
      </p>
      <nav className="module-tabs" aria-label="Seções do cadastro">
        {["Situações", "Cadastro", "Dependentes", "Documentos", "Histórico"].map((label) => (
          <Button
            key={label}
            aria-pressed={tab === label}
            intent={tab === label ? "primary" : "secondary"}
            onClick={() => {
              setTab(label);
              if (label === "Histórico") void loadHistory();
            }}
          >
            {label}
          </Button>
        ))}
      </nav>
      {tab === "Cadastro" && (
        <section className="panel">
          <h2>Cadastro</h2>
          <ProfileForm
            key={member.version}
            profile={member.profile}
            disabled={busy || !!member.archivedAt || !canWrite}
            onSave={async (profile, justification) => {
              await command({ action: "update", profile, justification });
            }}
          />
          <hr />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void command({
                action: member.archivedAt ? "restore" : "archive",
                justification: String(new FormData(e.currentTarget).get("reason")),
              });
            }}
          >
            <FormField id="archive-reason" label="Motivo do arquivamento ou restauração">
              <textarea name="reason" required minLength={3} maxLength={1000} />
            </FormField>
            <Button
              type="submit"
              disabled={busy || !canWrite}
              intent={member.archivedAt ? "secondary" : "danger"}
            >
              {member.archivedAt ? "Restaurar cadastro" : "Arquivar cadastro"}
            </Button>
          </form>
        </section>
      )}
      {tab === "Situações" && (
        <>
          <MemberAdministrativeStatus
            key={member.version}
            member={member}
            busy={busy}
            canReview={canReview}
            command={command}
          />
          <section className="panel">
            <h2>Situações independentes</h2>
            <p>
              Aprovação cadastral não determina benefícios ou créditos. Consulte a fonte e a regra
              de cada decisão.
            </p>
            <div className={styles.grid}>
              {Object.keys(memberDimensions).map((key) => {
                const current = member.assessments.find((a) => a.dimension === key);
                return (
                  <article className={styles.card} key={key}>
                    <h3>{dimensionLabels[key]}</h3>
                    {key === "credential" && (
                      <p>
                        Situação registrada a partir da evidência apresentada. Não emite uma
                        credencial.
                      </p>
                    )}
                    <strong>{current ? resultLabels[current.result] : "Não avaliada"}</strong>
                    {key === "oab" && (
                      <p>
                        <Link
                          className={buttonVariants({ size: "compact" })}
                          href={`/members/oab?memberId=${member.id}`}
                        >
                          Consultar OAB do associado
                        </Link>
                      </p>
                    )}
                    {current && (
                      <>
                        <p>{current.reason}</p>
                        <p>Fonte / regra: {current.source}</p>
                        <p>Conferência manual em {formatMemberDate(current.observedAt)}</p>
                        <p>Registrado por {current.actorName}</p>
                        {current.validUntil && (
                          <p>
                            Validade: {formatMemberDate(current.validUntil)}
                            {current.expired ? " — Vencida" : ""}
                          </p>
                        )}
                        {current.profileChanged && (
                          <p>
                            <strong>
                              Identificação alterada após esta avaliação. Revise a decisão.
                            </strong>
                          </p>
                        )}
                      </>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
          <section className="panel">
            <h2>Registrar avaliação manual</h2>
            <p>
              <a href="https://consulta.oab.org.br/" target="_blank" rel="noreferrer">
                Abrir consulta oficial da OAB
              </a>
              . Registre o resultado observado; nenhuma consulta é feita automaticamente.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const d = new FormData(e.currentTarget);
                const observed = String(d.get("observed"));
                const until = String(d.get("until"));
                void command({
                  action: "assess",
                  dimension,
                  result: d.get("result"),
                  source: d.get("source"),
                  justification: d.get("reason"),
                  observedAt: new Date(`${observed}T00:00:00-03:00`).toISOString(),
                  validUntil: until ? new Date(`${until}T23:59:59-03:00`).toISOString() : null,
                });
              }}
            >
              <fieldset disabled={busy || !!member.archivedAt || !canReview}>
                <div className={styles.grid}>
                  <FormField id="assessment-dimension" label="Dimensão">
                    <select
                      value={dimension}
                      onChange={(e) => setDimension(e.target.value as MemberDimension)}
                    >
                      {Object.keys(memberDimensions).map((key) => (
                        <option key={key} value={key}>
                          {dimensionLabels[key]}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <FormField id="assessment-result" label="Resultado">
                    <select key={dimension} name="result">
                      {memberDimensions[dimension].map((r) => (
                        <option key={r} value={r}>
                          {resultLabels[r]}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <FormField id="assessment-observed" label="Data da conferência">
                    <input
                      name="observed"
                      type="date"
                      required
                      defaultValue={new Date().toISOString().slice(0, 10)}
                      max={new Date().toISOString().slice(0, 10)}
                    />
                  </FormField>
                  <FormField
                    id="assessment-until"
                    label="Validade até (obrigatória para credencial válida)"
                  >
                    <input name="until" type="date" />
                  </FormField>
                </div>
                <FormField id="assessment-source" label="Fonte ou regra aplicada">
                  <input name="source" required minLength={3} maxLength={300} />
                </FormField>
                <FormField id="assessment-reason" label="Motivo da decisão">
                  <textarea name="reason" required minLength={3} maxLength={1000} />
                </FormField>
                <Button type="submit" intent="primary">
                  Registrar avaliação
                </Button>
              </fieldset>
            </form>
          </section>
          {member.assessments.length > 0 && (
            <details className="panel">
              <summary>Todas as avaliações anteriores</summary>
              <ul className={styles.list}>
                {member.assessments.map((a) => (
                  <li className={styles.card} key={a.id}>
                    {dimensionLabels[a.dimension]}: {resultLabels[a.result]} ·{" "}
                    {formatMemberDate(a.createdAt)} · {a.actorName}
                    <p>{a.reason}</p>
                    <p>Fonte: {a.source}</p>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}
      {tab === "Dependentes" && (
        <section className="panel">
          <h2>Vínculos entre pessoas</h2>
          <p>
            Dependentes possuem cadastro próprio. O vínculo declarado não concede benefício
            automaticamente.
          </p>
          <ul className={styles.list}>
            {member.relationships.map((r) => (
              <li className={styles.card} key={r.id}>
                <Link href={`/members/${r.holderId === member.id ? r.dependentId : r.holderId}`}>
                  {r.holderId === member.id ? r.dependentName : r.holderName}
                </Link>{" "}
                · {r.holderId === member.id ? "Dependente" : "Titular"} · {r.relationship}
                <p>
                  Desde {formatMemberDate(r.startsOn, true)} ·{" "}
                  {r.endedAt ? `Encerrado em ${formatMemberDate(r.endedAt)}` : "Vínculo ativo"}
                </p>
                {!r.endedAt && r.holderId === member.id && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void command({
                        action: "unlink",
                        relationshipId: r.id,
                        justification: String(new FormData(e.currentTarget).get("reason")),
                      });
                    }}
                  >
                    <FormField id={`end-${r.id}`} label="Motivo do encerramento">
                      <input name="reason" required minLength={3} maxLength={1000} />
                    </FormField>
                    <Button type="submit" disabled={busy || !!member.archivedAt || !canWrite}>
                      Encerrar vínculo
                    </Button>
                  </form>
                )}
              </li>
            ))}
          </ul>
          {!member.relationships.length && <p>Nenhum vínculo registrado.</p>}
          <h3>Vincular dependente existente</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const q = String(new FormData(e.currentTarget).get("q"));
              void memberRequest<{ items: MemberListItem[] }>(
                `/api/v1/members?q=${encodeURIComponent(q)}`,
              )
                .then((r) => {
                  setMatches(r.items.filter((m) => m.id !== member.id));
                  setSearched(true);
                })
                .catch((e) => setError(String(e)));
            }}
          >
            <FormField id="dependent-search" label="Buscar pessoa pelo nome">
              <input name="q" required minLength={2} />
            </FormField>
            <Button type="submit">Buscar pessoa</Button>
          </form>
          {searched && !matches.length && (
            <p>
              Nenhuma pessoa encontrada. <Link href="/members/new">Cadastrar pessoa</Link>
            </p>
          )}
          {matches.length > 0 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const d = new FormData(e.currentTarget);
                void command({
                  action: "link",
                  dependentId: d.get("dependentId"),
                  relationship: d.get("relationship"),
                  startsOn: d.get("startsOn"),
                  justification: d.get("reason"),
                });
              }}
            >
              <fieldset disabled={busy || !!member.archivedAt || !canWrite}>
                <FormField id="dependent-id" label="Pessoa encontrada">
                  <select name="dependentId">
                    {matches.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField id="dependent-type" label="Relação declarada">
                  <input
                    name="relationship"
                    required
                    minLength={2}
                    maxLength={80}
                    placeholder="Descreva o vínculo"
                  />
                </FormField>
                <FormField id="dependent-start" label="Início do vínculo">
                  <input
                    name="startsOn"
                    type="date"
                    required
                    max={new Date().toISOString().slice(0, 10)}
                    defaultValue={new Date().toISOString().slice(0, 10)}
                  />
                </FormField>
                <FormField id="dependent-reason" label="Justificativa do vínculo">
                  <textarea name="reason" required minLength={3} maxLength={1000} />
                </FormField>
                <Button type="submit" intent="primary" size="add">
                  <Plus size={20} aria-hidden="true" />
                  Vincular dependente
                </Button>
              </fieldset>
            </form>
          )}
        </section>
      )}
      {tab === "Documentos" && (
        <MemberDocuments
          member={member}
          disabled={busy || !!member.archivedAt}
          canWrite={canWrite}
          canReview={canReview}
          canRead={canReadFiles}
          canUpload={canUpload}
          command={command}
        />
      )}
      {tab === "Histórico" && (
        <section className="panel">
          <h2>Histórico do cadastro</h2>
          <p>Horários de Brasília. Alterações preservam responsável e motivo.</p>
          {!history ? (
            <p>Carregando histórico…</p>
          ) : (
            <>
              <ul className={styles.list}>
                {history.items.map((item) => (
                  <li className={styles.card} key={item.id}>
                    <strong>
                      {actionLabels[item.action.replace("member.", "")] ?? "Alteração registrada"}
                    </strong>
                    <p>{item.reason}</p>
                    {item.after?.previousAdministrativeStatus &&
                      item.after.administrativeStatus && (
                        <p>
                          {administrativeStatusLabels[item.after.previousAdministrativeStatus]} →{" "}
                          {administrativeStatusLabels[item.after.administrativeStatus]}
                        </p>
                      )}
                    <p>
                      {item.actorName} · {formatMemberDate(item.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
              <div className={styles.actions}>
                <Button
                  disabled={history.page === 1}
                  onClick={() => void loadHistory(history.page - 1)}
                >
                  Anteriores
                </Button>
                <span>Página {history.page}</span>
                <Button
                  disabled={!history.hasNextPage}
                  onClick={() => void loadHistory(history.page + 1)}
                >
                  Próximos
                </Button>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
