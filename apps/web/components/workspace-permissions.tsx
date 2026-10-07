"use client";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

const Context = createContext<readonly string[] | null>(null);
export function WorkspacePermissions({
  initial,
  initialIdentityId,
  children,
}: {
  initial: readonly string[];
  initialIdentityId: string;
  children: ReactNode;
}) {
  const [permissions, setPermissions] = useState(initial);
  const [identityId, setIdentityId] = useState<string | null>(initialIdentityId);
  const [refreshPending, setRefreshPending] = useState(false);
  const current = useRef(initial);
  const currentIdentity = useRef<string | null>(initialIdentityId);
  const pathname = usePathname(),
    router = useRouter();
  useEffect(() => {
    // A stale server layout must not restore the old account after /me changed identity.
    if (currentIdentity.current !== initialIdentityId) return;
    current.current = initial;
    setPermissions(initial);
  }, [initial, initialIdentityId]);
  useEffect(() => {
    if (!refreshPending) return;
    setRefreshPending(false);
    // Commit the identity gate (and unmount private drafts) before requesting a new layout.
    router.refresh();
  }, [refreshPending, router]);
  useEffect(() => {
    const controller = new AbortController();
    let running = false;
    async function refresh() {
      if (running || document.visibilityState === "hidden") return;
      running = true;
      try {
        const response = await fetch("/api/v1/me", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok && response.status !== 401) return;
        const data = response.ok ? await response.json() : { id: null, permissions: [] };
        if (response.ok && (typeof data.id !== "string" || !data.id)) return;
        if (
          !Array.isArray(data.permissions) ||
          !data.permissions.every((key: unknown) => typeof key === "string")
        )
          return;
        const next: string[] = data.permissions;
        const nextIdentity: string | null = data.id;
        if (
          !controller.signal.aborted &&
          (currentIdentity.current !== nextIdentity ||
            [...current.current].sort().join() !== [...next].sort().join())
        ) {
          currentIdentity.current = nextIdentity;
          current.current = next;
          setIdentityId(nextIdentity);
          setPermissions(next);
          setRefreshPending(true);
        }
      } catch {
        /* Keep navigation stable during transient network errors; APIs reauthorize. */
      } finally {
        running = false;
      }
    }
    void refresh();
    const timer = setInterval(() => void refresh(), 15000);
    window.addEventListener("focus", refresh);
    return () => {
      controller.abort();
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [pathname, router, initialIdentityId]);
  const confirmedIdentity = identityId === initialIdentityId;
  return (
    <Context value={confirmedIdentity ? permissions : []}>
      {confirmedIdentity ? children : <p role="status">Atualizando sua sessão…</p>}
    </Context>
  );
}
export function useWorkspacePermissions(fallback: readonly string[] = []) {
  return useContext(Context) ?? fallback;
}
export function useModulePermission(permission: string) {
  return useWorkspacePermissions().includes(permission);
}
export function PermissionGate({
  permission,
  children,
}: {
  permission: string;
  children: ReactNode;
}) {
  return useModulePermission(permission) ? children : null;
}
