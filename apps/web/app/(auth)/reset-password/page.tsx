import { AuthScreen } from "@/components/auth-screen";
import { PasswordRecovery } from "@/modules/auth/ui/password-recovery";

export default function ResetPasswordPage() {
  return (
    <AuthScreen
      eyebrow="Recuperar acesso"
      title="Defina sua nova senha"
      titleId="reset-title"
      description="Depois de salvar, entre novamente na sua conta."
    >
      <PasswordRecovery reset />
    </AuthScreen>
  );
}
