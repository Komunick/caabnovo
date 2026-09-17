import { isLocalAppURL, isLoopbackHostname } from "@caab/config";

export function assertLocalSeedTarget(env: Record<string, string | undefined>) {
  if (env.NODE_ENV === "production" || !isLocalAppURL(env.BETTER_AUTH_URL))
    throw new Error("Synthetic seeds require a local non-production application");
  for (const name of ["DATABASE_ADMIN_URL", "DATABASE_URL"]) {
    if (!env[name] && name === "DATABASE_URL") continue;
    let url: URL;
    try {
      url = new URL(env[name] ?? "");
    } catch {
      throw new Error("Synthetic seeds require explicit local database URLs");
    }
    if (url.protocol !== "postgresql:" || !isLoopbackHostname(url.hostname) || url.search)
      throw new Error(
        "Synthetic seeds require loopback database URLs without connection overrides",
      );
  }
}
