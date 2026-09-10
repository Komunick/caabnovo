import { AuthScreen } from "@/components/auth-screen";
import { PasswordRecovery } from "@/modules/auth/ui/password-recovery";
import { isLocalAppURL, loadWorkspaceEnv } from "@caab/config";

// Mail mode is a runtime setting: do not bake a local Mailpit link into a build
// that can later be started on the public site with SMTP configured.
export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  loadWorkspaceEnv();
  const localMail = process.env.MAIL_MODE === "local" && isLocalAppURL(process.env.BETTER_AUTH_URL);
  return (
    <AuthScreen
      eyebrow="Recuperar acesso"
      title="Esqueceu sua senha?"
      titleId="recovery-title"
      description="Informe seu e-mail para receber um link de redefinição."
    >
      <PasswordRecovery localMail={localMail} />
    </AuthScreen>
  );
}
