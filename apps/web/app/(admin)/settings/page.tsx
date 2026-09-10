import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { resolveCurrentUser } from "@/modules/auth/current-user";
import { AccountSettingsForm } from "@/modules/auth/ui/account-settings-form";

export default async function SettingsPage() {
  const identity = await resolveCurrentUser(
    new Request("http://caab.internal/settings", { headers: await headers() }),
  );
  if (!identity) redirect("/login");

  return (
    <div className="page-stack">
      <header>
        <p className="eyebrow">Minha conta</p>
        <h1>Configurações</h1>
        <p>Atualize seu perfil, suas credenciais e a segurança do seu acesso.</p>
      </header>
      <AccountSettingsForm
        name={identity.name}
        email={identity.email}
        version={identity.version}
        localMail={
          process.env.MAIL_MODE === "local" &&
          ["localhost", "127.0.0.1", "[::1]"].includes(
            new URL(process.env.BETTER_AUTH_URL ?? "http://localhost:3000").hostname,
          )
        }
      />
    </div>
  );
}
