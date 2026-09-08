import Link from "next/link";
import { headers } from "next/headers";
import {
  Activity,
  ArrowUpRight,
  FileClock,
  MonitorCog,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { resolveCurrentUser } from "@/modules/auth/current-user";
import { PERMISSIONS } from "@/modules/auth/permissions";

export default async function AdminHomePage() {
  const requestHeaders = await headers();
  const identity = await resolveCurrentUser(
    new Request("http://caab.internal/api/v1/me", { headers: requestHeaders }),
  );
  const allowed = new Set(identity?.permissions ?? []);
  const firstName = identity?.name.trim().split(/\s+/)[0] ?? "";
  const areas = [
    {
      href: "/users",
      title: "Usuários",
      description: "Gerencie contas, estados e funções de acesso.",
      icon: UsersRound,
      visible: allowed.has(PERMISSIONS.usersRead),
    },
    {
      href: "/audit",
      title: "Auditoria",
      description: "Consulte eventos críticos e trilhas de atividade.",
      icon: FileClock,
      visible: allowed.has(PERMISSIONS.auditRead),
    },
    {
      href: "/operations/jobs",
      title: "Operações",
      description: "Acompanhe processamentos, filas e ocorrências.",
      icon: Activity,
      visible: allowed.has(PERMISSIONS.jobsRead),
    },
    {
      href: "/sessions",
      title: "Sessões",
      description: "Confira como sua sessão e identidade são protegidas.",
      icon: MonitorCog,
      visible: true,
    },
  ];

  return (
    <div className="page-stack dashboard-page">
      <header className="dashboard-hero">
        <div>
          <p className="eyebrow">Visão geral</p>
          <h1>Início</h1>
          <p>
            {firstName ? `Olá, ${firstName}. ` : ""}Acesse rapidamente as áreas disponíveis para o
            seu perfil.
          </p>
        </div>
        <div className="dashboard-trust" aria-label="Segurança da sessão">
          <span className="dashboard-trust__icon" aria-hidden="true">
            <ShieldCheck size={25} strokeWidth={1.75} />
          </span>
          <span>
            <strong>Acesso verificado</strong>
            <span>Permissões atualizadas nesta sessão</span>
          </span>
        </div>
      </header>

      <section aria-labelledby="available-areas-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Sua área de trabalho</p>
            <h2 id="available-areas-title">Áreas disponíveis</h2>
          </div>
          <p>{areas.filter(({ visible }) => visible).length} acessos habilitados</p>
        </div>
        <div className="module-grid">
          {areas
            .filter(({ visible }) => visible)
            .map(({ href, title, description, icon: Icon }) => (
              <Link className="module-card" href={href} key={href}>
                <span className="module-card__icon" aria-hidden="true">
                  <Icon size={23} strokeWidth={1.7} />
                </span>
                <span className="module-card__content">
                  <strong>{title}</strong>
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
