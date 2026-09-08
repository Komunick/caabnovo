import "server-only";
import pino from "pino";
import { allowlistedLogFields } from "@caab/config/redaction";

export const logger = pino({
  name: "caab-web",
  level: process.env.LOG_LEVEL ?? "info",
  base: { service: "caab-web" },
  formatters: {
    log: (value) => allowlistedLogFields(value),
  },
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "password",
      "token",
      "secret",
      "*.password",
      "*.token",
    ],
    censor: "[REDACTED]",
  },
});
