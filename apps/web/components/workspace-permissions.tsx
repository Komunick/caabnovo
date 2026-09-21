"use client";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

const Context = createContext<readonly string[] | null>(null);
export function WorkspacePermissions({
  initial,
  children,
}: {
  initial: readonly string[];
  children: ReactNode;
}) {
  const [permissions, setPermissions] = useState(initial);
  const current = useRef(initial);
  const pathname = usePathname(),
    router = useRouter();
  useEffect(() => {
    current.current = initial;
    setPermissions(initial);
  }, [initial]);
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
        const data = response.ok ? await response.json() : { permissions: [] };
        if (
          !Array.isArray(data.permissions) ||
          !data.permissions.every((key: unknown) => typeof key === "string")
        )
          return;
        const next: string[] = data.permissions;
        if (
          !controller.signal.aborted &&
          [...current.current].sort().join() !== [...next].sort().join()
        ) {
          current.current = next;
          setPermissions(next);
          router.refresh();
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
  }, [pathname, router]);
  return <Context value={permissions}>{children}</Context>;
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
