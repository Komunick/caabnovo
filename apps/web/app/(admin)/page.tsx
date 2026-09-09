import Link from "next/link";
import { headers } from "next/headers";
import { ArrowUpRight, BadgeCheck, KeyRound, Layers3, ShieldCheck, Sparkles } from "lucide-react";
import { resolveCurrentUser } from "@/modules/auth/current-user";
import { getWorkspaceAreas } from "@/modules/workspace/areas";

export default async function AdminHomePage() {
  const requestHeaders = await headers();
  const identity = await resolveCurrentUser(
    new Request("http://caab.internal/api/v1/me", { headers: requestHeaders }),
  );
  const firstName = identity?.name.trim().split(/\s+/)[0] ?? "";
  const visibleAreas = getWorkspaceAreas(identity?.permissions ?? []).filter(
    ({ id }) => id !== "home",
  );
  const stats = [
    {
      label: "Áreas habilitadas",
      value: String(visibleAreas.length),
      detail: "áreas disponíveis para seu perfil",
      icon: Layers3,
      tone: "blue",
    },
    {
      label: "Permissões efetivas",
      value: String(identity?.permissions.length ?? 0),
      detail: "sincronizadas nesta sessão",
      icon: KeyRound,
      tone: "violet",
    },
    {
      label: "Funções atribuídas",
      value: String(identity?.roles.length ?? 0),
      detail: identity?.roles[0]?.name ?? "perfil interno",
      icon: BadgeCheck,
      tone: "cyan",
    },
    {
      label: "Proteção MFA",
      value: identity?.twoFactorEnabled ? "Ativa" : "Padrão",
      detail: identity?.twoFactorEnabled ? "segundo fator habilitado" : "sessão monitorada",
      icon: ShieldCheck,
      tone: "green",
    },
  ];

  return (
    <div className="page-stack dashboard-page">
      <header className="dashboard-hero">
        <div className="dashboard-hero__copy">
          <span className="dashboard-kicker">
            <Sparkles size={14} aria-hidden="true" /> Workspace inteligente
          </span>
          <h1>{firstName ? `Olá, ${firstName}.` : "Visão geral"}</h1>
          <p>
            Tudo o que você precisa para administrar o ambiente com clareza, segurança e agilidade.
          </p>
        </div>
        <div className="dashboard-orbit" aria-label="Acesso verificado e monitorado">
          <span className="dashboard-orbit__ring" aria-hidden="true" />
          <span className="dashboard-orbit__core" aria-hidden="true">
            <ShieldCheck size={30} strokeWidth={1.65} />
          </span>
          <span className="dashboard-orbit__copy">
            <small>Status do ambiente</small>
            <strong>Seguro e monitorado</strong>
          </span>
        </div>
      </header>

      <section className="dashboard-summary" aria-labelledby="dashboard-summary-title">
        <h2 className="sr-only" id="dashboard-summary-title">
          Resumo do seu acesso
        </h2>
        <div className="metric-grid">
          {stats.map(({ label, value, detail, icon: Icon, tone }, index) => (
            <article className={`metric-card metric-card--${tone}`} key={label}>
              <span className="metric-card__icon" aria-hidden="true">
                <Icon size={20} strokeWidth={1.8} />
              </span>
              <span className="metric-card__content">
                <small>{label}</small>
                <strong>{value}</strong>
                <span>{detail}</span>
              </span>
              <span className="metric-card__spark" aria-hidden="true">
                {[35, 58, 44, 76, 62, 92].map((height, barIndex) => (
                  <i
                    key={`${label}-${height}`}
                    style={{
                      height: `${Math.max(20, height - index * 4 + barIndex * 2)}%`,
                    }}
                  />
                ))}
              </span>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="available-areas-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Sua área de trabalho</p>
            <h2 id="available-areas-title">Áreas disponíveis</h2>
          </div>
          <p>{visibleAreas.length} acessos habilitados</p>
        </div>
        <div className="module-grid">
          {visibleAreas.map(({ href, label, description, icon: Icon }) => (
            <Link className="module-card" href={href} key={href}>
              <span className="module-card__icon" aria-hidden="true">
                <Icon size={23} strokeWidth={1.7} />
              </span>
              <span className="module-card__content">
                <strong>{label}</strong>
                <span>{description}</span>
              </span>
              <ArrowUpRight className="module-card__arrow" size={20} aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>

      <section className="dashboard-guidance" aria-labelledby="guidance-title">
        <div>
          <p className="eyebrow">Boas práticas</p>
          <h2 id="guidance-title">Proteja o ambiente institucional</h2>
        </div>
        <p>
          Confira os dados antes de confirmar ações sensíveis e encerre a sessão ao deixar o
          dispositivo. Toda permissão é aplicada de acordo com sua função atual.
        </p>
      </section>
    </div>
  );
}
