"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";

type Drafts = { values: Map<string, unknown>; scope: string };
const DraftContext = createContext<Drafts | null>(null);

/** Private to the authenticated workspace; cleared on logout, never written to storage. */
export function WorkspaceDrafts({ children }: { children: ReactNode }) {
  const values = useRef(new Map<string, unknown>());
  const pathname = usePathname();
  const query = useSearchParams();
  const scope = `${pathname}?kind=${query.get("kind") ?? ""}:`;
  const context = useMemo(() => ({ values: values.current, scope }), [scope]);
  return <DraftContext.Provider value={context}>{children}</DraftContext.Provider>;
}

export function DraftScope({ name, children }: { name: string; children: ReactNode }) {
  const parent = useContext(DraftContext);
  const context = useMemo(
    () => (parent ? { ...parent, scope: `${parent.scope}${name}:` } : null),
    [parent, name],
  );
  return <DraftContext.Provider value={context}>{children}</DraftContext.Provider>;
}

export function useDraftCache() {
  const context = useContext(DraftContext);
  return useMemo(
    () => ({
      scope: context?.scope ?? "",
      read: (key: string) => context?.values.get(`${context.scope}${key}`),
      has: (key: string) => context?.values.has(`${context.scope}${key}`) ?? false,
      write: (key: string, value: unknown) => {
        context?.values.set(`${context.scope}${key}`, value);
      },
      writeForRoute: (pathname: string, key: string, value: unknown) => {
        context?.values.set(`${pathname}?kind=:${key}`, value);
      },
      remove: (key: string) => {
        context?.values.delete(`${context.scope}${key}`);
      },
      clear: (prefix = "") => {
        if (!context) return;
        for (const key of context.values.keys())
          if (key.startsWith(`${context.scope}${prefix}`)) context.values.delete(key);
      },
    }),
    [context],
  );
}

/** Preserve actual React values (rich text, Sets and Files), without replaying mutations. */
export function useDraftState<T>(
  key: string,
  initial: T | (() => T),
): [T, Dispatch<SetStateAction<T>>] {
  const cache = useDraftCache();
  const identity = `${cache.scope}${key}`;
  const init = () =>
    cache.has(key)
      ? (cache.read(key) as T)
      : typeof initial === "function"
        ? (initial as () => T)()
        : initial;
  const [state, setState] = useState(() => ({ identity, value: init() }));
  let value = state.value;
  if (state.identity !== identity) {
    value = init();
    setState({ identity, value });
  }
  useEffect(() => {
    if (!cache.has(key)) cache.write(key, value);
  }, [cache, key]); // Capture the original revision along with the edit.
  const current = useRef(value);
  current.current = value;
  const update = useCallback<Dispatch<SetStateAction<T>>>(
    (next) => {
      const updated =
        typeof next === "function" ? (next as (previous: T) => T)(current.current) : next;
      cache.write(key, updated);
      // Match React state's no-op behavior, including native select input/change ordering.
      if (Object.is(current.current, updated)) return;
      current.current = updated;
      setState({ identity, value: updated });
    },
    [cache, identity, key],
  );
  return [value, update];
}
