"use client";
import { useRef, useState } from "react";
import { mutationHeaders, partnerRequest } from "./client";
export function usePartnerMutation() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const inFlight = useRef(false);
  const retry = useRef({ body: "", key: "", url: "" });
  async function save<T>(url: string, input: unknown, message: string): Promise<T | null> {
    if (inFlight.current) return null;
    inFlight.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    const body = JSON.stringify(input);
    if (retry.current.body !== body || retry.current.url !== url)
      retry.current = { url, body, key: crypto.randomUUID() };
    try {
      const result = await partnerRequest<T>(url, {
        method: "POST",
        headers: mutationHeaders(retry.current.key),
        body,
      });
      setNotice(message);
      return result;
    } catch (error) {
      setError(error instanceof Error ? error.message : "Não foi possível salvar.");
      return null;
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  return { busy, error, notice, save, setError };
}
