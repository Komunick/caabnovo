import pino from "pino";
import { allowlistedLogFields } from "@caab/config/redaction";

export const logger = pino({
  name: "caab-worker",
  level: process.env.LOG_LEVEL ?? "info",
  base: { service: "caab-worker" },
  formatters: { log: (value) => allowlistedLogFields(value) },
  redact: {
    paths: ["password", "token", "secret", "cookie", "authorization", "*.password", "*.token"],
    censor: "[REDACTED]",
  },
});
