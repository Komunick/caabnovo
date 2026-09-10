import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { resolveCurrentUser } from "@/modules/auth/current-user";
import { AccountSettingsForm } from "@/modules/auth/ui/account-settings-form";
import { isLocalAppURL } from "@caab/config";

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
        localMail={process.env.MAIL_MODE === "local" && isLocalAppURL(process.env.BETTER_AUTH_URL)}
      />
    </div>
  );
}
