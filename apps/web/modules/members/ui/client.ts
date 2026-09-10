import { memberErrors } from "./labels";
export function mutationHeaders(key: string) {
  return {
    "content-type": "application/json",
    "x-csrf-token": crypto.randomUUID(),
    "idempotency-key": key,
  };
}
export async function memberRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: "no-store", ...options });
  const result = await response.json();
  if (!response.ok)
    throw new Error(
      memberErrors[result.error?.code ?? result.code] ??
        `Não foi possível concluir a operação (${response.status}).`,
    );
  return result as T;
}
