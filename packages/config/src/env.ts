import { z } from "zod";
import { loadWorkspaceEnv } from "./load-env";
import { publicAppUrlSchema, isLocalAppURL } from "./public-origin";

const serverEnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z.url().startsWith("postgresql://"),
    DATABASE_ADMIN_URL: z.url().startsWith("postgresql://").optional(),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: publicAppUrlSchema,
    FILE_STORAGE_BACKEND: z.literal("database").default("database"),
    CLAMAV_HOST: z.string().min(1),
    CLAMAV_PORT: z.coerce.number().int().min(1).max(65535).default(3310),
    OTEL_EXPORTER_OTLP_ENDPOINT: z.url(),
    LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  })
  .superRefine((env, context) => {
    if (isLocalAppURL(env.BETTER_AUTH_URL)) return;
    if (
      /replace[-_ ]?with|change[-_ ]?me|synthetic|(?:e2e|test)[-_ ](?:only|secret)/i.test(
        env.BETTER_AUTH_SECRET,
      )
    ) {
      context.addIssue({
        code: "custom",
        path: ["BETTER_AUTH_SECRET"],
        message:
          "Public deployments require a unique random authentication secret, not a test/example value",
      });
    }
    for (const field of ["DATABASE_URL", "DATABASE_ADMIN_URL"] as const) {
      if (!env[field]) continue;
      const password = decodeURIComponent(new URL(env[field]).password);
      if (/^(?:change-me(?:-runtime)?|postgres|password|synthetic)$/i.test(password))
        context.addIssue({
          code: "custom",
          path: [field],
          message: "Public deployments must replace example database credentials",
        });
    }
  });

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function loadServerEnv(source: NodeJS.ProcessEnv = process.env): ServerEnv {
  if (source === process.env) loadWorkspaceEnv();
  return serverEnvSchema.parse(source);
}
