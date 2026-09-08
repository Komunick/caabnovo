import { AuthForm } from "@/modules/auth/ui/auth-form";

export default function MfaPage() {
  return (
    <main id="main-content" className="auth-shell" tabIndex={-1}>
      <section className="auth-card" aria-labelledby="mfa-title">
        <p>Segunda etapa</p>
        <h1 id="mfa-title">Confirme sua identidade</h1>
        <p>Digite o código de seis dígitos do seu aplicativo autenticador.</p>
        <AuthForm mode="mfa" />
      </section>
    </main>
  );
}
