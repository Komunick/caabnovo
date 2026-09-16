import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { resolveRequestActor } from "@/modules/auth/request-actor";
export default async function MessagesLayout({ children }: { children: ReactNode }) {
  const actor = await resolveRequestActor(
    new Request("http://caab.internal/messages", { headers: await headers() }),
  );
  if (!actor) redirect("/login");
  if (!actor.permissions.has("messages:access"))
    return (
      <div className="page-stack">
        <h1>Mensagens</h1>
        <p role="alert">Você não tem acesso ao módulo de mensagens.</p>
      </div>
    );
  return children;
}
