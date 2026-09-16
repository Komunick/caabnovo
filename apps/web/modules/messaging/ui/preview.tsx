"use client";
import type { MessagePreview } from "@caab/contracts";
import styles from "./messages.module.css";
export function MessagePreviewView({
  preview,
  audienceOnly = false,
}: {
  preview: MessagePreview;
  audienceOnly?: boolean;
}) {
  return (
    <div className={styles.stack}>
      <dl className={styles.counts}>
        {(
          [
            ["Encontrados", preview.counts.matched],
            ["Exclusões", preview.counts.excluded],
            ["Bloqueados", preview.counts.suppressed],
            ["Para preparação", preview.counts.eligible],
          ] as const
        ).map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      {!audienceOnly && preview.issues.length > 0 && (
        <ul role="alert">
          {preview.issues.map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      )}
      {!audienceOnly && (
        <>
          {" "}
          <div className={styles.preview}>
            <h3>{preview.subject || "Sem assunto"}</h3>
            <p>{preview.body || "Sem conteúdo"}</p>
          </div>
          <p>
            Personalização de exemplo: {preview.sample[0]?.name ?? "Pessoa de exemplo"}. O resultado
            pode variar conforme o meio de envio.
          </p>
        </>
      )}
      <p>
        As contagens incluem o público inteiro. A amostra mostra no máximo dez pessoas e não limita
        os destinatários.
      </p>
      <details>
        <summary>Amostra do público ({preview.sample.length})</summary>
        <ul>
          {preview.sample.map((person) => (
            <li key={person.id}>{person.name}</li>
          ))}
        </ul>
      </details>
      <p className={styles.notice}>
        Nenhum meio de envio configurado. Esta prévia não envia mensagens. A inclusão no público não
        representa consentimento para um canal futuro.
      </p>
    </div>
  );
}
