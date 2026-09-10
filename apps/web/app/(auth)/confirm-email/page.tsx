import { ConfirmEmail } from "@/modules/auth/ui/confirm-email";
import { AuthScreen } from "@/components/auth-screen";

export default function ConfirmEmailPage() {
  return (
    <AuthScreen
      title="Confirmar novo e-mail"
      titleId="confirm-email-title"
      eyebrow="Minha conta"
      description="Confirme o endereço que será usado no seu acesso."
    >
      <ConfirmEmail />
    </AuthScreen>
  );
}
