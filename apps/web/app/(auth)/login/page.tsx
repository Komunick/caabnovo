import { AuthForm } from "@/modules/auth/ui/auth-form";
import { AuthScreen } from "@/components/auth-screen";

export default function LoginPage() {
  return (
    <AuthScreen
      eyebrow="Área interna"
      title="Acesse sua conta"
      description="Use suas credenciais institucionais para continuar."
      titleId="login-title"
    >
      <AuthForm mode="login" />
    </AuthScreen>
  );
}
