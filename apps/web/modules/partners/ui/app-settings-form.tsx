"use client";
import { useState } from "react";
import type { PartnerAppSettings, PartnerCategory } from "@caab/contracts";
import { Button } from "@/components/ui/button";
import { usePartnerMutation } from "./use-partner-mutation";
import { partnerRequest } from "./client";
import styles from "./partners.module.css";
type Data = { settings: PartnerAppSettings; categories: PartnerCategory[] };
export function AppSettingsForm({ initial, canPublish }: { initial: Data; canPublish: boolean }) {
  const [data, setData] = useState(initial);
  const [mode, setMode] = useState(initial.settings.mode);
  const [selected, setSelected] = useState(
    initial.settings.mode === "all"
      ? initial.categories.filter((c) => c.active).map((c) => c.id)
      : initial.settings.categoryIds,
  );
  const mutation = usePartnerMutation();
  const active = data.categories.filter((category) => category.active);
  const visibleCount =
    mode === "all" ? active.length : active.filter((c) => selected.includes(c.id)).length;
  return (
    <section className="panel">
      <h2>Categorias na página do app</h2>
      <p>
        Esta escolha controla o catálogo e os benefícios retornados para o aplicativo. Publicações
        do site mantêm seus próprios canais e vigências.
      </p>
      {!canPublish && (
        <p>
          Sua conta pode consultar esta configuração. A permissão de publicação é necessária para
          alterá-la.
        </p>
      )}
      {mutation.error && (
        <div className={styles.notice}>
          <p role="alert">{mutation.error}</p>
          <Button
            disabled={mutation.busy}
            onClick={() => {
              void partnerRequest<Data>("/api/v1/partners/settings")
                .then((current) => {
                  setData(current);
                  mutation.setError(
                    "Dados atuais carregados. Sua seleção foi mantida; revise antes de salvar novamente.",
                  );
                })
                .catch((error) => mutation.setError(String(error)));
            }}
          >
            Atualizar versão da configuração
          </Button>
        </div>
      )}
      <p role="status">{mutation.notice}</p>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          const result = await mutation.save<Data>(
            "/api/v1/partners/settings",
            {
              expectedVersion: data.settings.version,
              mode,
              categoryIds:
                mode === "selected" ? selected.filter((id) => active.some((c) => c.id === id)) : [],
            },
            "Configuração do app salva.",
          );
          if (result) {
            setData(result);
          }
        }}
      >
        <fieldset disabled={!canPublish || mutation.busy}>
          <legend>Exibição de categorias</legend>
          <div className={styles.checks}>
            <label>
              <input
                type="radio"
                name="category-mode"
                checked={mode === "all"}
                onChange={() => setMode("all")}
              />
              Todas as categorias ativas
            </label>
            <label>
              <input
                type="radio"
                name="category-mode"
                checked={mode === "selected"}
                onChange={() => setMode("selected")}
              />
              Escolher categorias
            </label>
          </div>
          <fieldset>
            <legend>Categorias disponíveis</legend>
            {!active.length ? (
              <p>Nenhuma categoria ativa. Cadastre uma categoria antes de selecioná-la.</p>
            ) : (
              <div className={styles.categoryChoices}>
                {active.map((category) => (
                  <label key={category.id} className={styles.card}>
                    <input
                      type="checkbox"
                      disabled={mode === "all"}
                      checked={mode === "all" || selected.includes(category.id)}
                      onChange={(event) =>
                        setSelected(
                          event.target.checked
                            ? [...selected, category.id]
                            : selected.filter((id) => id !== category.id),
                        )
                      }
                    />
                    <span>{category.name}</span>
                  </label>
                ))}
              </div>
            )}
          </fieldset>
          {mode === "selected" && (
            <div className={styles.actions}>
              <Button type="button" onClick={() => setSelected(active.map((c) => c.id))}>
                Selecionar todas
              </Button>
              <Button type="button" onClick={() => setSelected([])}>
                Desmarcar todas
              </Button>
            </div>
          )}
          <p>
            {visibleCount}{" "}
            {visibleCount === 1 ? "categoria selecionada" : "categorias selecionadas"} para o app.
          </p>
          {mode === "selected" && visibleCount === 0 && (
            <p className={styles.notice}>
              Ao salvar sem categorias selecionadas, nenhum parceiro ou benefício será exibido nesse
              catálogo do app.
            </p>
          )}

          <Button type="submit" intent="primary">
            Salvar configuração do app
          </Button>
        </fieldset>
      </form>
    </section>
  );
}
