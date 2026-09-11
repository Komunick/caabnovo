"use client";
import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type OabLookupResult, oabNumberSchema } from "@caab/contracts";
import { memberRequest, mutationHeaders } from "./client";
import { formatMemberDate } from "./labels";
import styles from "./members.module.css";

export function OabLookup({
  member,
}: {
  member?: { id: string; name: string; number: string; compatible: boolean };
}) {
  const [number, setNumber] = useState(member?.number ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<OabLookupResult | null>(null);
  const inFlight = useRef(false);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const supported = !member || member.compatible;
  const statusLabels = {
    regular: "Regular",
    irregular: "Irregular",
    unknown: "Situação não informada",
    not_found: "Inscrição não encontrada",
  };
  return (
    <section className={`panel ${styles.root}`} aria-labelledby="oab-lookup-title">
      <h2 id="oab-lookup-title">Consultar inscrição OAB</h2>
      <p>
        Esta consulta abrange a OAB da Bahia. Você pode consultar uma inscrição sem criar um
        associado.
      </p>
      {member && (
        <p>
          Consulta pelo cadastro de <strong>{member.name}</strong>.
        </p>
      )}
      {!supported && (
        <p role="status">
          Este cadastro não possui uma inscrição compatível. A integração atende números de
          advogados da OAB/BA; inscrições de outros estados, de estagiários ou suplementares ainda
          não são cobertas.
        </p>
      )}
      <form
        aria-label="Consulta OAB"
        onSubmit={async (event) => {
          event.preventDefault();
          if (inFlight.current || !supported) return;
          setError("");
          setResult(null);
          if (!oabNumberSchema.safeParse(number).success) {
            setError("Informe um número de inscrição válido, usando apenas números.");
            return;
          }
          inFlight.current = true;
          setPending(true);
          try {
            const response = await memberRequest<OabLookupResult>("/api/v1/members/oab-query", {
              method: "POST",
              headers: mutationHeaders(crypto.randomUUID()),
              body: JSON.stringify(
                member ? { memberId: member.id } : { number: number.trim(), state: "BA" },
              ),
              signal: AbortSignal.timeout(105_000),
            });
            setResult(response);
          } catch (failure) {
            setError(
              failure instanceof Error && failure.name === "TimeoutError"
                ? "A consulta demorou mais que o esperado. Tente novamente em instantes."
                : failure instanceof Error
                  ? failure.message
                  : "Não foi possível consultar a OAB. Tente novamente.",
            );
          } finally {
            inFlight.current = false;
            setPending(false);
          }
        }}
      >
        <fieldset disabled={!hydrated || pending || !supported}>
          <div className={styles.grid}>
            <div className="form-field">
              <label htmlFor="oab-query-number">Número da OAB</label>
              <input
                id="oab-query-number"
                value={number}
                readOnly={!!member}
                inputMode="numeric"
                pattern="[0-9]{1,6}"
                maxLength={6}
                required
                onChange={(event) => {
                  setNumber(event.target.value);
                  setResult(null);
                  setError("");
                }}
              />
            </div>
            <div className="form-field">
              <label htmlFor="oab-query-state">Estado da OAB</label>
              <input id="oab-query-state" value="Bahia (BA)" readOnly />
            </div>
          </div>
          <Button type="submit" intent="primary">
            <Search size={18} aria-hidden="true" />
            {pending ? "Consultando…" : "Consultar OAB"}
          </Button>
        </fieldset>
      </form>
      <p role="status" aria-live="polite">
        {pending
          ? "Aguardando a OAB-BA. A consulta pode levar até 95 segundos."
          : result
            ? `Consulta concluída: ${statusLabels[result.status]}.`
            : ""}
      </p>
      {error && <p role="alert">{error}</p>}
      {result && (
        <section className={styles.card} aria-labelledby="oab-result-title">
          <h3 id="oab-result-title">Resultado da consulta</h3>
          <p>
            <strong>{statusLabels[result.status]}</strong>
          </p>
          {result.name && <p>{result.name}</p>}
          <p>
            OAB {result.number}/{result.state}
          </p>
          {result.status === "not_found" && (
            <p>
              Confira o número informado. A ausência de registro não significa que a inscrição
              esteja irregular.
            </p>
          )}
          {result.status === "unknown" && (
            <p>
              A fonte não informou uma regularidade reconhecida. Não foi atribuída uma situação por
              suposição.
            </p>
          )}
          <p>Fonte: {result.source}</p>
          <p>Consultada em {formatMemberDate(result.checkedAt)}.</p>
          <p>
            A consulta não altera o cadastro, as avaliações, a elegibilidade ou os créditos do
            associado.
          </p>
        </section>
      )}
      <p>
        <a href="https://consulta.oab.org.br/" target="_blank" rel="noreferrer">
          Abrir consulta nacional da OAB
        </a>{" "}
        para conferência manual de outras inscrições.
      </p>
    </section>
  );
}
