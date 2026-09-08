import { AuthForm } from "@/modules/auth/ui/auth-form";
import { AuthScreen } from "@/components/auth-screen";

export default function MfaPage() {
  return (
    <AuthScreen
      eyebrow="Segunda etapa"
      title="Confirme sua identidade"
      description="Digite o código de seis dígitos do seu aplicativo autenticador."
      titleId="mfa-title"
    >
      <AuthForm mode="mfa" />
    </AuthScreen>
  );
}
