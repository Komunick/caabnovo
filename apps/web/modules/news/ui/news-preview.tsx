"use client";
import { useState } from "react";
import { Monitor, Smartphone, Columns2 } from "lucide-react";
import type { NewsRecord } from "../news-service";
import { Button } from "@/components/ui/button";
import { NewsArticle } from "./news-article";
import styles from "./news-preview.module.css";

export function NewsPreview({
  draft,
  availableFileIds,
}: {
  draft: NewsRecord;
  availableFileIds: string[];
}) {
  const [mode, setMode] = useState<"site" | "mobile" | "both">("site");
  return (
    <section className={styles.preview} aria-label="Prévia por dispositivo">
      <div className={styles.controls}>
        <div>
          <h2>Confira antes de publicar</h2>
          <p>A mesma notícia, adaptada ao tamanho da tela.</p>
        </div>
        <div className={styles.modes} role="group" aria-label="Dispositivo da prévia">
          {(
            [
              { value: "site", label: "Site", Icon: Monitor },
              { value: "mobile", label: "Mobile", Icon: Smartphone },
              { value: "both", label: "Lado a lado", Icon: Columns2 },
            ] as const
          ).map(({ value, label, Icon }) => (
            <Button
              key={value}
              intent={mode === value ? "primary" : "secondary"}
              aria-pressed={mode === value}
              onClick={() => setMode(value)}
            >
              <Icon size={18} aria-hidden="true" />
              {label}
            </Button>
          ))}
        </div>
      </div>
      <div className={mode === "both" ? styles.both : styles.single}>
        {(["site", "mobile"] as const)
          .filter((device) => mode === "both" || mode === device)
          .map((device) => (
            <section
              key={device}
              className={device === "mobile" ? styles.mobile : styles.site}
              aria-label={device === "mobile" ? "Visualização mobile" : "Visualização do site"}
            >
              <div className={styles.deviceBar}>
                {device === "mobile" ? (
                  <Smartphone size={16} aria-hidden="true" />
                ) : (
                  <Monitor size={16} aria-hidden="true" />
                )}
                <span>
                  {device === "mobile"
                    ? "Mobile · leitura em celular"
                    : "Site · leitura em tela ampla"}
                </span>
              </div>
              <div className={styles.canvas}>
                <NewsArticle
                  id={draft.id}
                  metadata={draft.metadata}
                  body={draft.body}
                  date={draft.updatedAt}
                  availableFileIds={availableFileIds}
                />
              </div>
            </section>
          ))}
      </div>
    </section>
  );
}
