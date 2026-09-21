"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@caab/contracts";
import { SensitiveActionDialog } from "./sensitive-action-dialog";
export function UserLifecycle({
  user,
  canDelete,
  canRestore,
}: {
  user: User;
  canDelete: boolean;
  canRestore: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const scheduled = Boolean(user.deletionEffectiveAt);
  if (!(scheduled ? canRestore : canDelete)) return null;
  return (
    <section className="panel page-stack" aria-labelledby="user-lifecycle-title">
      <h2 id="user-lifecycle-title">Exclusão do colaborador</h2>
      {scheduled && (
        <p>
          A conta está bloqueada. A exclusão lógica tem vigência em{" "}
          {new Date(user.deletionEffectiveAt!).toLocaleString("pt-BR")}. Histórico e vínculos são
          preservados.
        </p>
      )}
      {error && <p role="alert">{error}</p>}
      <SensitiveActionDialog
        triggerLabel={scheduled ? "Restaurar colaborador" : "Excluir colaborador"}
        title={scheduled ? "Restaurar colaborador" : "Excluir colaborador"}
        confirmLabel={scheduled ? "Confirmar restauração" : "Confirmar exclusão"}
        description={
          scheduled
            ? "Desfazer a exclusão e reativar a conta. As sessões encerradas continuarão inválidas."
            : "A conta será bloqueada e suas sessões encerradas agora. Após 24 horas, será excluída das listagens normais. O histórico será preservado."
        }
        onConfirm={async () => {
          setError("");
          const response = await fetch(`/api/v1/users/${user.id}/lifecycle`, {
            method: "POST",
            headers: { "content-type": "application/json", "x-csrf-token": crypto.randomUUID() },
            body: JSON.stringify({
              action: scheduled ? "restore" : "delete",
              version: user.version,
            }),
          });
          if (!response.ok) {
            const result = await response.json().catch(() => null);
            setError(
              result?.code === "LAST_ADMINISTRATOR"
                ? "O último administrador ativo não pode ser excluído."
                : response.status === 409
                  ? "O cadastro foi alterado. Atualize a página antes de repetir a ação."
                  : "Não foi possível concluir. Confira suas permissões.",
            );
            throw new Error("Lifecycle refused");
          }
          router.refresh();
        }}
      />
    </section>
  );
}
