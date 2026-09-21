"use client";
import { useDraftState, useDraftCache } from "@/components/workspace-drafts";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { PartnerRecord } from "@caab/contracts";
import { ProfileForm } from "./profile-form";
import { partnerRequest, mutationHeaders } from "./client";
import styles from "./partners.module.css";
export function NewPartner() {
  const drafts = useDraftCache();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useDraftState("new-partner:error", "");
  const retry = useRef({ body: "", key: "" });
  return (
    <section className={`panel ${styles.root}`}>
      <h2>Dados do parceiro</h2>
      <p>Informe os dados do estabelecimento e os contatos administrativos.</p>
      {error && <p role="alert">{error}</p>}
      <ProfileForm
        disabled={busy}
        onSave={async (profile) => {
          setBusy(true);
          setError("");
          const body = JSON.stringify({ profile });
          if (retry.current.body !== body) retry.current = { body, key: crypto.randomUUID() };
          try {
            const record = await partnerRequest<PartnerRecord>("/api/v1/partners", {
              method: "POST",
              headers: mutationHeaders(retry.current.key),
              body,
            });
            drafts.clear();
            router.push(`/partners/${record.id}`);
            return true;
          } catch (e) {
            setError(e instanceof Error ? e.message : "Falha ao cadastrar.");
          } finally {
            setBusy(false);
          }
        }}
      />
    </section>
  );
}
