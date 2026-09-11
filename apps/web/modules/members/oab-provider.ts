import "server-only";
import { loadWorkspaceEnv } from "@caab/config/load-env";
import { z } from "zod";
import { oabNumberSchema, type OabLookupResult } from "@caab/contracts";
import { OabError } from "./oab-errors";

export type OabProvider = (number: string) => Promise<Pick<OabLookupResult, "status" | "name">>;
const providerRow = z.object({
  Nome: z.string().trim().min(1).max(160),
  OAB: z.union([oabNumberSchema, z.number().int().positive().max(999999).transform(String)]),
  SituacaoRegular: z.string().max(100).nullable().optional(),
});
type OabEnvironment = Readonly<Record<string, string | undefined>>;
export function isOabConfigured(env: OabEnvironment = process.env) {
  return (
    env.OAB_API_ENABLED === "true" && !!env.API_OAB_KEY?.trim() && !!env.API_OAB_PASSWORD?.trim()
  );
}
export function createOabProvider(
  env: OabEnvironment = process.env,
  fetcher: typeof fetch = fetch,
  timeoutMs = 95_000,
): OabProvider {
  if (env === process.env) loadWorkspaceEnv();
  if (!isOabConfigured(env)) throw new OabError("OAB_NOT_CONFIGURED", 503);
  const credentials = { Chave: env.API_OAB_KEY!.trim(), Senha: env.API_OAB_PASSWORD!.trim() };
  return async (input) => {
    const number = oabNumberSchema.parse(input);
    const url = new URL(
      "https://oab-ba.implanta.net.br/siscaf/servico/api/RelatoriosPersonalizados",
    );
    url.search = new URLSearchParams({
      sistema: "siscaf",
      modulo: "WEBSERVICE CAAB",
      nomeRelatorio: "STATUS CAAB",
      OAB: number,
    }).toString();
    const controller = new AbortController();
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const deadline = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(new OabError("OAB_TIMEOUT", 504));
        controller.abort();
        void reader?.cancel().catch(() => {});
      }, timeoutMs);
    });
    try {
      return await Promise.race([
        deadline,
        (async () => {
          const response = await fetcher(url, {
            headers: credentials,
            signal: controller.signal,
            redirect: "error",
            cache: "no-store",
          });
          if ([401, 403].includes(response.status))
            throw new OabError("OAB_CREDENTIALS_REJECTED", 503);
          if (!response.ok) throw new OabError("OAB_UNAVAILABLE", 503);
          if (!response.body || Number(response.headers.get("content-length")) > 65_536)
            throw new OabError("OAB_INVALID_RESPONSE", 502);
          reader = response.body.getReader();
          const decoder = new TextDecoder("utf-8", { fatal: true });
          let bytes = 0;
          let text = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            bytes += value.byteLength;
            if (bytes > 65_536) throw new OabError("OAB_INVALID_RESPONSE", 502);
            try {
              text += decoder.decode(value, { stream: true });
            } catch {
              throw new OabError("OAB_INVALID_RESPONSE", 502);
            }
          }
          let data: unknown;
          try {
            data = JSON.parse(text + decoder.decode());
          } catch {
            throw new OabError("OAB_INVALID_RESPONSE", 502);
          }
          const parsed = z.array(providerRow).max(1).safeParse(data);
          if (!parsed.success) throw new OabError("OAB_INVALID_RESPONSE", 502);
          const row = parsed.data[0];
          if (!row) return { status: "not_found" as const, name: null };
          if (row.OAB.replace(/^0+/, "") !== number.replace(/^0+/, ""))
            throw new OabError("OAB_INVALID_RESPONSE", 502);
          const value = row.SituacaoRegular?.trim()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toUpperCase();
          const status = value === "SIM" ? "regular" : value === "NAO" ? "irregular" : "unknown";
          return { name: row.Nome, status } as Pick<OabLookupResult, "status" | "name">;
        })(),
      ]);
    } catch (error) {
      if (error instanceof OabError) throw error;
      throw new OabError(
        controller.signal.aborted ? "OAB_TIMEOUT" : "OAB_UNAVAILABLE",
        controller.signal.aborted ? 504 : 503,
      );
    } finally {
      clearTimeout(timer);
      controller.abort();
      void reader?.cancel().catch(() => {});
    }
  };
}
