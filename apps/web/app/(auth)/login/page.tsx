import { AuthForm } from "@/modules/auth/ui/auth-form";

export default function LoginPage() {
  return (
    <main className="auth-shell">
      <section className="auth-card" aria-labelledby="login-title">
        <p>CAAB · Área interna</p>
        <h1 id="login-title">Acesse sua conta</h1>
        <p>Use suas credenciais institucionais.</p>
        <AuthForm mode="login" />
      </section>
    </main>
  );
}
