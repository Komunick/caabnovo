"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import type { PartnerRecord, PartnerHistoryItem } from "@caab/contracts";
import { Button, buttonVariants } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { ProfileForm } from "./profile-form";
import { UnitPanel } from "./unit-panel";
import { ContractPanel } from "./contract-panel";
import { BenefitPanel } from "./benefit-panel";
import { partnerRequest, mutationHeaders } from "./client";
import { formatDate, historyDescription, statusLabels } from "./labels";
import styles from "./partners.module.css";
type HistoryPage = { items: PartnerHistoryItem[]; page: number; hasNextPage: boolean };
export function PartnerEditor({
  initial,
  canReadFiles,
  canUpload,
  canWrite,
  canPublish,
}: {
  initial: PartnerRecord;
  canReadFiles: boolean;
  canUpload: boolean;
  canWrite: boolean;
  canPublish: boolean;
}) {
  const searchParams = useSearchParams();
  const [partner, setPartner] = useState(initial);
  const [tab, setTab] = useState(
    searchParams.get("tab") === "benefits" ? "Benefícios" : "Cadastro",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<HistoryPage | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [historyPage, setHistoryPage] = useState(1);
  const historyRequest = useRef(0);
  const retry = useRef({ body: "", key: "" });
  async function command(input: Record<string, unknown>) {
    setBusy(true);
    setError("");
    setMessage("");
    const body = JSON.stringify({ ...input, expectedVersion: partner.version });
    if (retry.current.body !== body) retry.current = { body, key: crypto.randomUUID() };
    try {
      setPartner(
        await partnerRequest<PartnerRecord>(`/api/v1/partners/${partner.id}/commands`, {
          method: "POST",
          headers: mutationHeaders(retry.current.key),
          body,
        }),
      );
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
    const request = ++historyRequest.current;
    setHistoryLoading(true);
    setHistoryError("");
    setHistoryPage(page);
    try {
      const result = await partnerRequest<HistoryPage>(
        `/api/v1/partners/${partner.id}/history?page=${page}`,
      );
      if (request === historyRequest.current) setHistory(result);
    } catch (e) {
      if (request === historyRequest.current)
        setHistoryError(e instanceof Error ? e.message : "Falha ao consultar histórico.");
    } finally {
      if (request === historyRequest.current) setHistoryLoading(false);
    }
  }
  const disabled = busy || !!partner.archivedAt;
  return (
    <div className={styles.root}>
      <header className="page-header">
        <p className="eyebrow">Rede conveniada</p>
        <h1>{partner.profile.name}</h1>
        <p>
          {partner.archivedAt ? "Cadastro arquivado" : statusLabels[partner.status]} ·{" "}
          {partner.profile.category} · atualizado em {formatDate(partner.updatedAt)}
        </p>
        <Link className={buttonVariants({ size: "compact" })} href="/partners">
          Voltar à lista
        </Link>
      </header>
      {error && (
        <div role="alert" className={styles.notice}>
          <p>{error}</p>
          <Button
            disabled={busy}
            onClick={() => {
              void partnerRequest<PartnerRecord>(`/api/v1/partners/${partner.id}`)
                .then((record) => {
                  setPartner(record);
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
      <nav className="module-tabs" aria-label="Seções do parceiro">
        {["Cadastro", "Unidades", "Contratos", "Benefícios", "Histórico"].map((label) => (
          <Button
            key={label}
            aria-pressed={tab === label}
            intent={tab === label ? "primary" : "secondary"}
            disabled={busy}
            onClick={() => {
              setTab(label);
              if (label === "Histórico") void loadHistory();
            }}
          >
            {label}
          </Button>
        ))}
      </nav>
      <div hidden={tab !== "Cadastro"}>
        <section className="panel">
          <h2>Cadastro</h2>
          <ProfileForm
            key={partner.version}
            profile={partner.profile}
            disabled={disabled || !canWrite}
            onSave={async (profile, justification) => {
              await command({ action: "update", profile, justification });
            }}
          />
          {canWrite && (
            <>
              <hr />
              <form
                onSubmit={async (event) => {
                  event.preventDefault();
                  const data = new FormData(event.currentTarget);
                  const action = String(data.get("action"));
                  const success = await command({
                    action: action === "active" || action === "suspended" ? "status" : action,
                    ...(action === "active" || action === "suspended" ? { status: action } : {}),
                    justification: String(data.get("justification")),
                  });
                  if (success)
                    setMessage(
                      "Situação atualizada. Benefícios retirados precisam ser publicados novamente.",
                    );
                }}
              >
                <fieldset disabled={busy}>
                  <legend>Situação do parceiro</legend>
                  <p>Suspender ou arquivar retira os benefícios de exibição.</p>
                  <FormField id="partner-state-action" label="Alterar situação">
                    <select name="action" key={`${partner.archivedAt}-${partner.status}`}>
                      {partner.archivedAt ? (
                        <option value="restore">Restaurar cadastro</option>
                      ) : (
                        <>
                          <option value={partner.status === "active" ? "suspended" : "active"}>
                            {partner.status === "active"
                              ? "Suspender parceiro"
                              : "Reativar parceiro"}
                          </option>
                          <option value="archive">Arquivar cadastro</option>
                        </>
                      )}
                    </select>
                  </FormField>
                  <FormField id="partner-state-reason" label="Justificativa da mudança de situação">
                    <textarea name="justification" required minLength={3} maxLength={1000} />
                  </FormField>
                  <Button type="submit">Confirmar alteração de situação</Button>
                </fieldset>
              </form>
            </>
          )}
        </section>
      </div>
      <div hidden={tab !== "Unidades"}>
        <UnitPanel partner={partner} disabled={disabled} canWrite={canWrite} command={command} />
      </div>
      <div hidden={tab !== "Contratos"}>
        <ContractPanel
          partner={partner}
          disabled={disabled}
          canWrite={canWrite}
          canPublish={canPublish}
          canReadFiles={canReadFiles}
          canUpload={canUpload}
          command={command}
        />
      </div>
      <div hidden={tab !== "Benefícios"}>
        <BenefitPanel
          partner={partner}
          disabled={disabled}
          canWrite={canWrite}
          canPublish={canPublish}
          command={command}
        />
      </div>
      {tab === "Histórico" && (
        <section className="panel">
          <h2>Histórico</h2>
          <p role="status">{historyLoading ? "Carregando histórico…" : ""}</p>
          {historyError && (
            <div className={styles.notice}>
              <p role="alert">Não foi possível carregar o histórico. {historyError}</p>
              <Button disabled={historyLoading} onClick={() => void loadHistory(historyPage)}>
                Tentar carregar histórico novamente
              </Button>
            </div>
          )}
          {history && (
            <>
              {!history.items.length && <p>Nenhuma alteração registrada.</p>}
              <ul className={styles.list}>
                {history.items.map((event) => (
                  <li key={event.id} className={styles.card}>
                    <h3>{historyDescription(event)}</h3>
                    <p>{formatDate(event.createdAt)}</p>
                    <p className={styles.prose}>{event.reason}</p>
                  </li>
                ))}
              </ul>
              <nav className={styles.actions} aria-label="Paginação do histórico">
                {history.page > 1 && (
                  <Button
                    disabled={historyLoading}
                    onClick={() => {
                      void loadHistory(history.page - 1);
                    }}
                  >
                    Página anterior
                  </Button>
                )}
                <span>Página {history.page}</span>
                {history.hasNextPage && (
                  <Button
                    disabled={historyLoading}
                    onClick={() => {
                      void loadHistory(history.page + 1);
                    }}
                  >
                    Próxima página
                  </Button>
                )}
              </nav>
            </>
          )}
        </section>
      )}
    </div>
  );
}
