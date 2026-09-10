import "server-only";
import nodemailer from "nodemailer";

export function accountMailConfig(env: Record<string, string | undefined>) {
  const baseURL = new URL(env.BETTER_AUTH_URL ?? "http://localhost:3000");
  const localHost = (value: string) => ["localhost", "127.0.0.1", "[::1]", "::1"].includes(value);
  const local = env.MAIL_MODE === "local";
  if (local) {
    if (!localHost(baseURL.hostname) || !localHost(env.SMTP_HOST ?? "127.0.0.1")) {
      throw new Error("Local mail is restricted to loopback addresses");
    }
    return {
      local,
      baseURL,
      from: "CAAB Local <caab@example.test>",
      host: env.SMTP_HOST ?? "127.0.0.1",
      port: Number(env.SMTP_PORT ?? 1025),
      secure: false,
      requireTLS: false,
      auth: undefined,
    };
  }
  if (
    env.MAIL_MODE !== "smtp" ||
    baseURL.protocol !== "https:" ||
    localHost(baseURL.hostname) ||
    !env.SMTP_HOST ||
    localHost(env.SMTP_HOST) ||
    !env.SMTP_USER ||
    !env.SMTP_PASSWORD ||
    !env.MAIL_FROM
  ) {
    throw new Error("Real mail requires SMTP credentials, a sender and a public HTTPS URL");
  }
  return {
    local,
    baseURL,
    from: env.MAIL_FROM,
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT ?? 587),
    secure: env.SMTP_PORT === "465",
    requireTLS: true,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
  };
}

export async function sendAccountEmail(to: string, token: string) {
  const config = accountMailConfig(process.env);
  const url = new URL("/confirm-email", config.baseURL);
  // Fragment keeps the secret out of request URLs, server access logs and referrers.
  url.hash = `token=${token}`;
  await sendMail(
    to,
    "Confirme seu novo e-mail no CAAB",
    `Confirme a troca do e-mail da sua conta CAAB usando o link abaixo. Entre na conta que solicitou a mudança. O link expira em 30 minutos e só pode ser utilizado uma vez.\n\n${url.toString()}\n\nSe você não solicitou esta mudança, ignore esta mensagem. Seu e-mail atual permanece válido.`,
  );
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const config = accountMailConfig(process.env);
  const url = new URL("/reset-password", config.baseURL);
  url.hash = `token=${encodeURIComponent(token)}`;
  await sendMail(
    to,
    "Redefina sua senha no CAAB",
    `Você solicitou a redefinição da senha da sua conta CAAB. Abra o link para escolher uma nova senha. Ele expira em 30 minutos e só pode ser usado uma vez.\n\n${url.toString()}\n\nSe não foi você, ignore esta mensagem. Sua senha permanece a mesma.`,
  );
}

async function sendMail(to: string, subject: string, text: string) {
  const config = accountMailConfig(process.env);
  const transport = createAccountTransport(config);
  try {
    await transport.sendMail({ from: config.from, to, subject, text });
  } finally {
    transport.close();
  }
}

export async function checkAccountMailAvailable() {
  const transport = createAccountTransport(accountMailConfig(process.env));
  try {
    await transport.verify();
  } finally {
    transport.close();
  }
}

function createAccountTransport(config: ReturnType<typeof accountMailConfig>) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    requireTLS: config.requireTLS,
    auth: config.auth,
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 5000,
    disableFileAccess: true,
    disableUrlAccess: true,
    logger: false,
    debug: false,
  });
}
