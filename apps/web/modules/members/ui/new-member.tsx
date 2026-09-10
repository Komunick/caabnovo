"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { MemberRecord } from "@caab/contracts";
import { ProfileForm } from "./profile-form";
import { memberRequest, mutationHeaders } from "./client";
import styles from "./members.module.css";
export function NewMember() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const retry = useRef({ body: "", key: "" });
  return (
    <section className={`panel ${styles.root}`}>
      <h2>Dados do associado</h2>
      <p>Este cadastro não cria login nem concede benefícios automaticamente.</p>
      {error && <p role="alert">{error}</p>}
      <ProfileForm
        disabled={busy}
        onSave={async (profile, justification) => {
          setBusy(true);
          setError("");
          const body = JSON.stringify({ profile, justification });
          if (retry.current.body !== body) retry.current = { body, key: crypto.randomUUID() };
          try {
            const record = await memberRequest<MemberRecord>("/api/v1/members", {
              method: "POST",
              headers: mutationHeaders(retry.current.key),
              body,
            });
            router.push(`/members/${record.id}`);
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
