export const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "cookie",
  "authorization",
  "secret",
  "totpSecret",
  "recoveryCodes",
  "email",
  "name",
  "ipAddress",
  "userAgent",
]);

const SAFE_LOG_KEYS = new Set([
  "level",
  "time",
  "message",
  "msg",
  "service",
  "event",
  "outcome",
  "reasonCode",
  "requestId",
  "correlationId",
  "userId",
  "jobId",
  "fileId",
  "durationMs",
  "statusCode",
  "errorCode",
]);

export function redactSensitive(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactSensitive);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, nested]) => [
      key,
      [...SENSITIVE_KEYS].some((candidate) => candidate.toLowerCase() === key.toLowerCase())
        ? "[REDACTED]"
        : redactSensitive(nested),
    ]),
  );
}

export function allowlistedLogFields(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => SAFE_LOG_KEYS.has(key))
      .map(([key, nested]) => [key, redactSensitive(nested)]),
  );
}
