"use client";

import { useEffect, useState } from "react";

export const ANNOUNCE_EVENT = "caab:announce";

export function announce(message: string): void {
  window.dispatchEvent(new CustomEvent<string>(ANNOUNCE_EVENT, { detail: message }));
}

export function LiveRegion() {
  const [message, setMessage] = useState("");
  useEffect(() => {
    const listener = (event: Event) => setMessage((event as CustomEvent<string>).detail);
    window.addEventListener(ANNOUNCE_EVENT, listener);
    return () => window.removeEventListener(ANNOUNCE_EVENT, listener);
  }, []);
  return (
    <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
      {message}
    </div>
  );
}
