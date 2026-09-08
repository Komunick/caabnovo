import { createHmac } from "node:crypto";
import { Client } from "pg";
import { createDatabaseClient, runMigrations } from "@caab/db";
import { createAuth } from "../../modules/auth/auth-factory";
import { syntheticUsers } from "./fixtures";

const origin = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
const adminUrl =
  process.env.DATABASE_ADMIN_URL ?? "postgresql://postgres:change-me@127.0.0.1:5432/caab";

function cookieFrom(response: Response): string {
  const value = response.headers.get("set-cookie") ?? "";
  const match = /(?:^|, )((?:__Secure-)?caab\.session=[^;]+)/.exec(value);
  if (!match?.[1]) throw new Error("The synthetic user session cookie was not issued");
  return match[1];
}

function totpCode(uri: string): string {
  const secret = new URL(uri).searchParams.get("secret");
  if (!secret) throw new Error("TOTP URI has no secret");
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const char of secret.replace(/=+$/, "").toUpperCase()) {
    bits += alphabet.indexOf(char).toString(2).padStart(5, "0");
  }
  const bytes = Buffer.alloc(Math.floor(bits.length / 8));
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(bits.slice(index * 8, index * 8 + 8), 2);
  }
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30_000)));
  const digest = createHmac("sha1", bytes).update(counter).digest();
  const offset = (digest.at(-1) ?? 0) & 0x0f;
  return ((digest.readUInt32BE(offset) & 0x7fffffff) % 1_000_000).toString().padStart(6, "0");
}

export default async function globalSetup() {
  await runMigrations(adminUrl);
  const database = createDatabaseClient(adminUrl);
  const auth = createAuth({
    database: database.db,
    baseURL: origin,
    secret: process.env.BETTER_AUTH_SECRET ?? "e2e-only-secret-with-at-least-32-characters",
    disableRateLimit: true,
  });
  const admin = new Client({ connectionString: adminUrl });
  await admin.connect();

  async function post(path: string, body: unknown, cookie = "") {
    return auth.handler(
      new Request(`${origin}/api/auth${path}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin,
          ...(cookie ? { cookie } : {}),
        },
        body: JSON.stringify(body),
      }),
    );
  }

  async function ensureUser(user: { email: string; password: string }, name: string) {
    const existing = await admin.query<{ two_factor_enabled: boolean }>(
      'SELECT two_factor_enabled FROM "user" WHERE email = $1',
      [user.email],
    );
    if (existing.rows[0]) return existing.rows[0].two_factor_enabled;
    const response = await post("/sign-up/email", { ...user, name });
    if (!response.ok) throw new Error(`Unable to create synthetic user: ${response.status}`);
    return cookieFrom(response);
  }

  try {
    await ensureUser(syntheticUsers.ordinary, "Usuário Sintético");
    const adminState = await ensureUser(syntheticUsers.administrator, "Administrador Sintético");
    if (adminState !== true) {
      const cookie =
        typeof adminState === "string"
          ? adminState
          : cookieFrom(
              await post("/sign-in/email", {
                email: syntheticUsers.administrator.email,
                password: syntheticUsers.administrator.password,
              }),
            );
      const enable = await post(
        "/two-factor/enable",
        { password: syntheticUsers.administrator.password, method: "totp", issuer: "CAAB" },
        cookie,
      );
      if (!enable.ok) throw new Error(`Unable to enroll synthetic MFA: ${enable.status}`);
      const enrollment = (await enable.json()) as { totpURI: string };
      const verify = await post(
        "/two-factor/verify-totp",
        { code: totpCode(enrollment.totpURI), trustDevice: false },
        cookie,
      );
      if (!verify.ok) throw new Error(`Unable to confirm synthetic MFA: ${verify.status}`);
    }
  } finally {
    await admin.end();
    await database.close();
  }
}
