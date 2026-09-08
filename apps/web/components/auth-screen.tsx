import type { ReactNode } from "react";
import { BadgeCheck, LockKeyhole, ShieldCheck } from "lucide-react";
import { Brand } from "@/components/brand";

export function AuthScreen({
  eyebrow,
  title,
  description,
  titleId,
  children,
}: Readonly<{
  eyebrow: string;
  title: string;
  description: string;
  titleId: string;
  children: ReactNode;
}>) {
  return (
    <main id="main-content" className="auth-shell" tabIndex={-1}>
      <section className="auth-story" aria-label="Ambiente administrativo seguro">
        <Brand inverse />
        <div className="auth-story__content">
          <span className="auth-story__icon" aria-hidden="true">
            <ShieldCheck size={28} strokeWidth={1.75} />
          </span>
          <p className="eyebrow eyebrow--inverse">Ambiente institucional</p>
          <p className="auth-story__title">Gestão segura, simples e rastreável.</p>
          <p>
            Um espaço central para administrar acessos, acompanhar operações e preservar a
            integridade das informações da CAAB.
          </p>
          <ul className="auth-benefits">
            <li>
              <BadgeCheck aria-hidden="true" /> Acesso baseado em permissões
            </li>
            <li>
              <BadgeCheck aria-hidden="true" /> Ações sensíveis auditadas
            </li>
          </ul>
        </div>
        <p className="auth-story__footer">Uso exclusivo de pessoas autorizadas</p>
      </section>

      <section className="auth-panel" aria-labelledby={titleId}>
        <div className="auth-card">
          <div className="auth-card__brand">
            <Brand compact />
          </div>
          <span className="auth-card__icon" aria-hidden="true">
            <LockKeyhole size={22} strokeWidth={1.8} />
          </span>
          <p className="eyebrow">{eyebrow}</p>
          <h1 id={titleId}>{title}</h1>
          <p className="auth-card__description">{description}</p>
          {children}
          <p className="auth-card__notice">
            Seus dados de acesso são protegidos e nunca devem ser compartilhados.
          </p>
        </div>
      </section>
    </main>
  );
}
