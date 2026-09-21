"use client";
import { useEffect, useState } from "react";
/** Refresh the warning when a scheduled deletion crosses its deadline in an open page. */
export function useEffectiveDeletion(effectiveAt: string | null | undefined, initial = false) {
  const [expired, setExpired] = useState(initial);
  useEffect(() => {
    const remaining = effectiveAt ? Date.parse(effectiveAt) - Date.now() : Infinity;
    setExpired(remaining <= 0);
    if (Number.isFinite(remaining) && remaining > 0) {
      const timer = setTimeout(() => setExpired(true), Math.min(remaining + 50, 2_147_483_647));
      return () => clearTimeout(timer);
    }
  }, [effectiveAt]);
  return Boolean(effectiveAt) && expired;
}
