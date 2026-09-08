import { z } from "zod";

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.url().startsWith("postgresql://"),
  DATABASE_ADMIN_URL: z.url().startsWith("postgresql://").optional(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  S3_ENDPOINT: z.url(),
  S3_REGION: z.string().min(1).default("us-east-1"),
  S3_ACCESS_KEY: z.string().min(1),
  S3_SECRET_KEY: z.string().min(1),
  S3_QUARANTINE_BUCKET: z.string().min(3),
  S3_PRIVATE_BUCKET: z.string().min(3),
  S3_PUBLIC_BUCKET: z.string().min(3),
  CLAMAV_HOST: z.string().min(1),
  CLAMAV_PORT: z.coerce.number().int().min(1).max(65535).default(3310),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.url(),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function loadServerEnv(source: NodeJS.ProcessEnv = process.env): ServerEnv {
  return serverEnvSchema.parse(source);
}
