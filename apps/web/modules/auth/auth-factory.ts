import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { authSchema, type Database } from "@caab/db";
import type { Pool } from "pg";
import { requestPasswordRecovery, resetPasswordRecovery } from "./password-recovery-service";
import { z } from "zod";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { newPasswordSchema, PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH } from "@caab/contracts";

export interface CreateAuthOptions {
  database: Database;
  pool: Pool;
  baseURL: string;
  secret: string;
  disableRateLimit?: boolean;
  sendResetPassword?: (data: {
    user: { id: string; email: string };
    token: string;
  }) => Promise<void>;
  checkMailAvailable?: () => Promise<void>;
}

const allowedPaths = new Set([
  "/sign-up/email",
  "/sign-in/email",
  "/sign-out",
  "/get-session",
  "/request-password-reset",
  "/reset-password",
]);

export function createAuth(options: CreateAuthOptions) {
  const query = options.pool;
  const secureCookies = new URL(options.baseURL).protocol === "https:";
  return betterAuth({
    appName: "CAAB",
    baseURL: options.baseURL,
    basePath: "/api/auth",
    secret: options.secret,
    database: drizzleAdapter(options.database, {
      provider: "pg",
      schema: authSchema,
      usePlural: false,
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: PASSWORD_MIN_LENGTH,
      maxPasswordLength: PASSWORD_MAX_LENGTH,
      sendResetPassword: options.sendResetPassword,
      resetPasswordTokenExpiresIn: 1800,
      revokeSessionsOnPasswordReset: true,
    },
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (
          ctx.request &&
          ctx.request.method !== "GET" &&
          ctx.request.headers.get("origin") !== new URL(options.baseURL).origin
        )
          throw new APIError("FORBIDDEN", {
            code: "ORIGIN_DENIED",
            message: "Request origin denied",
          });
        if (!allowedPaths.has(ctx.path))
          throw new APIError("NOT_FOUND", {
            code: "ACCOUNT_ROUTE_DISABLED",
            message: "Use the account settings workflow",
          });
        if (
          ctx.path === "/sign-up/email" &&
          !z.string().trim().min(1).max(160).safeParse(ctx.body?.name).success
        )
          throw new APIError("BAD_REQUEST", { code: "INVALID_NAME", message: "Invalid name" });
        const field =
          ctx.path === "/sign-up/email"
            ? "password"
            : ["/reset-password", "/change-password", "/set-password"].includes(ctx.path)
              ? "newPassword"
              : null;
        if (field && !newPasswordSchema.safeParse(ctx.body?.[field]).success) {
          throw new APIError("BAD_REQUEST", {
            code: "PASSWORD_POLICY_FAILED",
            message: "Password does not meet the account policy",
          });
        }
        if (ctx.path === "/reset-password") {
          try {
            await resetPasswordRecovery(options.pool, ctx.body, crypto.randomUUID());
          } catch (error) {
            if (error instanceof APIError) throw error;
            throw new APIError("INTERNAL_SERVER_ERROR", {
              code: "INTERNAL_ERROR",
              message: "Recovery could not be completed",
            });
          }
          return ctx.json({ status: true });
        }
        if (ctx.path === "/request-password-reset") {
          if (!z.email().max(254).safeParse(ctx.body?.email).success)
            throw new APIError("BAD_REQUEST", { code: "INVALID_EMAIL", message: "Invalid email" });
          try {
            if (!options.sendResetPassword) throw new Error("Mail unavailable");
            // Check the transport for every address, before looking up an account.
            await options.checkMailAvailable?.();
            await requestPasswordRecovery(options.pool, ctx.body.email, options.sendResetPassword);
          } catch {
            throw new APIError("SERVICE_UNAVAILABLE", {
              code: "RECOVERY_UNAVAILABLE",
              message: "Recovery is temporarily unavailable",
            });
          }
          return ctx.json({
            status: true,
            message: "If this email exists, check your email for the reset link",
          });
        }
      }),
      after: createAuthMiddleware(async (ctx) => {
        if (ctx.path === "/get-session") {
          const result = ctx.context.returned as { session?: { token?: string } } | null;
          if (result?.session?.token) {
            const active = await query.query(
              `SELECT s.id FROM session s JOIN "user" u ON u.id=s.user_id WHERE s.token=$1 AND s.revoked_at IS NULL AND s.expires_at>now() AND u.status='active'`,
              [result.session.token],
            );
            if (!active.rowCount) return ctx.json(null);
          }
        }
      }),
    },
    databaseHooks: {
      session: {
        create: {
          before: async (session) => {
            const active = await query.query(
              "SELECT id FROM \"user\" WHERE id=$1 AND status='active'",
              [session.userId],
            );
            if (!active.rowCount) return false;
            return { data: session };
          },
        },
      },
    },
    session: {
      cookieCache: { enabled: false },
    },
    rateLimit: {
      enabled: !options.disableRateLimit,
      customRules: {
        "/request-password-reset": { window: 60, max: 3 },
        "/reset-password": { window: 60, max: 5 },
      },
    },
    advanced: {
      database: {
        generateId: "uuid",
      },
      useSecureCookies: false,
      defaultCookieAttributes: {
        httpOnly: true,
        secure: secureCookies,
        sameSite: "strict",
        path: "/",
      },
      cookies: {
        session_token: {
          name: "caab.session",
        },
      },
    },
  });
}
