import { partnerErrors } from "./labels";
export const mutationHeaders = (key: string) => ({
  "content-type": "application/json",
  "x-csrf-token": crypto.randomUUID(),
  "idempotency-key": key,
});
export async function partnerRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: "no-store", ...options });
  const result = await response.json();
  if (!response.ok)
    throw new Error(
      partnerErrors[result.error?.code ?? result.code] ??
        `Não foi possível concluir a operação (${response.status}).`,
    );
  return result as T;
}
export type PartnerCommandHandler = (input: Record<string, unknown>) => Promise<boolean>;
