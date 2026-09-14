"use client";
import { useEffect, useState } from "react";
import type { PartnerReview } from "@caab/contracts";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { partnerRequest } from "./client";
import { usePartnerMutation } from "./use-partner-mutation";
import { formatDate } from "./labels";
import styles from "./partners.module.css";
type Reviews = {
  items: PartnerReview[];
  page: number;
  hasNextPage: boolean;
  summary: { count: number; average: number | null };
};
const labels = { pending: "Aguardando moderação", published: "Aprovada", hidden: "Oculta" };
export function ReviewPanel({
  partnerId,
  canModerate,
}: {
  partnerId: string;
  canModerate: boolean;
}) {
  const [result, setResult] = useState<Reviews | null>(null);
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [decision, setDecision] = useState<{
    review: PartnerReview;
    status: "published" | "hidden";
  } | null>(null);
  const mutation = usePartnerMutation();
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    void partnerRequest<Reviews>(
      `/api/v1/partners/${partnerId}/reviews?status=${status}&page=${page}`,
      { signal: controller.signal },
    )
      .then((data) => {
        if (!controller.signal.aborted) {
          setResult(data);
          setDecision((current) => {
            if (!current) return null;
            const review = data.items.find((item) => item.id === current.review.id);
            return review ? { ...current, review } : current;
          });
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setError(error instanceof Error ? error.message : "Falha ao carregar avaliações.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [partnerId, status, page, revision]);
  return (
    <section className="panel">
      <h2>Avaliações</h2>
      <p>
        Consulte e modere as opiniões recebidas dos associados. A nota e o comentário originais são
        preservados.
      </p>
      <p className={styles.notice}>
        O recebimento automático depende da integração com o aplicativo, ainda não conectada neste
        ambiente. Não há cadastro manual de avaliações.
      </p>
      <FormField id="partner-review-status" label="Situação das avaliações">
        <select
          value={status}
          disabled={loading || mutation.busy || !!decision}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
        >
          <option value="all">Todas</option>
          {Object.entries(labels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </FormField>
      <p role="status">{loading ? "Carregando avaliações…" : mutation.notice}</p>
      {(error || mutation.error) && (
        <div className={styles.notice}>
          <p role="alert">{error || mutation.error}</p>
          <Button
            disabled={loading || mutation.busy}
            onClick={() => {
              mutation.setError("");
              setRevision((value) => value + 1);
            }}
          >
            Atualizar avaliações
          </Button>
        </div>
      )}
      {result && (
        <>
          <p>
            {result.summary.count} avaliações recebidas
            {result.summary.average !== null
              ? ` · Média recebida: ${result.summary.average.toLocaleString("pt-BR")} de 5 (inclui avaliações ocultas)`
              : ""}
            .
          </p>
          {!result.items.length && !loading && (
            <p>Nenhuma avaliação encontrada para esta seleção.</p>
          )}
          <ul className={styles.list}>
            {result.items.map((review) => (
              <li className={styles.card} key={review.id}>
                <h3>
                  {review.authorLabel} · {review.rating} de 5
                </h3>
                <p>
                  {formatDate(review.submittedAt)} · {labels[review.status]}
                </p>
                <p className={styles.prose}>{review.comment || "Sem comentário escrito."}</p>
                {review.moderationReason && (
                  <p className={styles.prose}>
                    Última moderação: {review.moderationReason} · {formatDate(review.moderatedAt)}
                  </p>
                )}
                {canModerate && (
                  <div className={styles.actions}>
                    {review.status !== "published" && (
                      <Button
                        disabled={loading || mutation.busy || !!decision}
                        onClick={() => setDecision({ review, status: "published" })}
                      >
                        Aprovar avaliação
                      </Button>
                    )}
                    {review.status !== "hidden" && (
                      <Button
                        disabled={loading || mutation.busy || !!decision}
                        onClick={() => setDecision({ review, status: "hidden" })}
                      >
                        Ocultar avaliação
                      </Button>
                    )}
                  </div>
                )}
                {decision?.review.id === review.id && (
                  <form
                    onSubmit={async (event) => {
                      event.preventDefault();
                      const saved = await mutation.save(
                        `/api/v1/partners/${partnerId}/reviews/${review.id}`,
                        {
                          expectedVersion: decision.review.version,
                          status: decision.status,
                        },
                        "Moderação registrada. A opinião original foi preservada.",
                      );
                      if (saved) {
                        setDecision(null);

                        setRevision((value) => value + 1);
                      }
                    }}
                  >
                    <fieldset disabled={mutation.busy}>
                      <legend>
                        {decision.status === "published"
                          ? "Aprovar avaliação"
                          : "Ocultar avaliação"}
                      </legend>

                      <div className={styles.actions}>
                        <Button intent="primary" type="submit">
                          Confirmar moderação
                        </Button>
                        <Button
                          type="button"
                          onClick={() => {
                            setDecision(null);
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </fieldset>
                  </form>
                )}
              </li>
            ))}
          </ul>
          <nav className={styles.actions} aria-label="Paginação de avaliações">
            {result.page > 1 && (
              <Button
                disabled={loading || mutation.busy || !!decision}
                onClick={() => setPage(result.page - 1)}
              >
                Página anterior
              </Button>
            )}
            <span>Página {result.page}</span>
            {result.hasNextPage && (
              <Button
                disabled={loading || mutation.busy || !!decision}
                onClick={() => setPage(result.page + 1)}
              >
                Próxima página
              </Button>
            )}
          </nav>
        </>
      )}
    </section>
  );
}
