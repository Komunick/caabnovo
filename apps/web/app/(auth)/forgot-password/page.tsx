import { AuthScreen } from "@/components/auth-screen";
import { PasswordRecovery } from "@/modules/auth/ui/password-recovery";

export default function ForgotPasswordPage() {
  const localMail =
    process.env.MAIL_MODE === "local" &&
    ["localhost", "127.0.0.1", "[::1]"].includes(
      new URL(process.env.BETTER_AUTH_URL ?? "http://localhost:3000").hostname,
    );
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
