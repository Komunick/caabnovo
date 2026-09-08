import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { twoFactor } from "better-auth/plugins";
import { authSchema, type Database } from "@caab/db";

export interface CreateAuthOptions {
  database: Database;
  baseURL: string;
  secret: string;
  disableRateLimit?: boolean;
}

export function createAuth(options: CreateAuthOptions) {
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
      minPasswordLength: 12,
      maxPasswordLength: 128,
    },
    session: {
      cookieCache: { enabled: false },
    },
    rateLimit: {
      enabled: !options.disableRateLimit,
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
    plugins: [
      twoFactor({
        issuer: "CAAB",
        skipVerificationOnEnable: false,
        trustDeviceMaxAge: 0,
        twoFactorCookieMaxAge: 300,
      }),
    ],
  });
}
