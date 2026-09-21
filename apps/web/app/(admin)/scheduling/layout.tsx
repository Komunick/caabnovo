import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { resolveRequestActor } from "@/modules/auth/request-actor";
import { PermissionGate } from "@/components/workspace-permissions";
export default async function SchedulingLayout({ children }: { children: ReactNode }) {
  const actor = await resolveRequestActor(
    new Request("http://caab.internal/scheduling", { headers: await headers() }),
  );
  if (!actor) redirect("/login");
  if (!actor.permissions.has("scheduling:read")) notFound();
  return <PermissionGate permission="scheduling:read">{children}</PermissionGate>;
}
