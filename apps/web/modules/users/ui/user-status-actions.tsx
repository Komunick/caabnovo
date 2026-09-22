"use client";
import { useRouter } from "next/navigation";
import type { User } from "@caab/contracts";
import { useDraftState } from "@/components/workspace-drafts";
import { SensitiveActionDialog } from "./sensitive-action-dialog";

export function UserStatusActions({
  user,
  canDisable,
  canReactivate,
}: {
  user: User;
  canDisable: boolean;
  canReactivate: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useDraftState("user-status:error", "");
  if (user.deletionEffectiveAt || !(user.status === "active" ? canDisable : canReactivate))
    return null;
  const disabling = user.status === "active";
  return (
    <div>
      {error && <p role="alert">{error}</p>}
      <SensitiveActionDialog
        triggerLabel={disabling ? "Desativar colaborador" : "Reativar colaborador"}
        title={disabling ? "Desativar colaborador" : "Reativar colaborador"}
        confirmLabel={disabling ? "Confirmar desativação" : "Confirmar reativação"}
        description={
          disabling
            ? "O acesso será desativado e as sessões serão encerradas. O cadastro será preservado."
            : "O colaborador poderá entrar novamente com sua senha. As sessões encerradas não serão restauradas."
        }
        onConfirm={async () => {
          setError("");
          const response = await fetch(`/api/v1/users/${user.id}`, {
            method: "PATCH",
            headers: { "content-type": "application/json", "x-csrf-token": crypto.randomUUID() },
            body: JSON.stringify({
              status: disabling ? "disabled" : "active",
              version: user.version,
            }),
          });
          if (!response.ok) {
            const message =
              response.status === 409
                ? "O cadastro foi alterado ou é o último administrador ativo. Atualize e confira os dados."
                : "Não foi possível alterar a situação do colaborador. Confira suas permissões.";
            setError(message);
            throw new Error(message);
          }
          router.refresh();
        }}
      />
    </div>
  );
}
