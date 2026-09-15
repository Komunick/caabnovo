"use client";

import { useLinkStatus } from "next/link";

export function NavigationPending() {
  const { pending } = useLinkStatus();
  return (
    <span className="navigation-pending" data-pending={pending || undefined}>
      <span className="navigation-pending__dot" aria-hidden="true" />
      <span className="sr-only" role="status">
        {pending ? "Abrindo página…" : ""}
      </span>
    </span>
  );
}
