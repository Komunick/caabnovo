import {
  FileClock,
  House,
  MonitorCog,
  Newspaper,
  Settings,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { PERMISSIONS } from "../auth/permissions";

export type WorkspaceArea = {
  id: string;
  href: string;
  label: string;
  description: string;
  keywords: string;
  icon: LucideIcon;
  paths: readonly string[];
};

export function getWorkspaceAreas(permissions: readonly string[]): WorkspaceArea[] {
  const allowed = new Set(permissions);
  const areas: WorkspaceArea[] = [
    {
      id: "home",
      href: "/",
      label: "Início",
      description: "Visão geral do seu ambiente de trabalho.",
      keywords: "dashboard visão geral",
      icon: House,
      paths: ["/"],
    },
    {
      id: "news",
      href: "/news",
      label: "Notícias",
      description: "Crie, publique e programe notícias e destaques para site e aplicativo.",
      keywords:
        "comunicação conteúdo editorial notícias rascunhos destaques publicação agenda aplicativo",
      icon: Newspaper,
      paths: ["/news"],
    },
  ];
  if (allowed.has(PERMISSIONS.usersRead)) {
    areas.push({
      id: "users",
      href: "/users",
      label: "Usuários",
      description: "Gerencie contas, estados e funções de acesso.",
      keywords: "contas permissões equipe",
      icon: UsersRound,
      paths: ["/users"],
    });
  }
  const events = allowed.has(PERMISSIONS.auditRead);
  const jobs = allowed.has(PERMISSIONS.jobsRead);
  if (events || jobs) {
    areas.push({
      id: "audit",
      href: events ? "/audit" : "/audit/jobs",
      label: "Auditoria",
      description:
        events && jobs
          ? "Consulte eventos e acompanhe processamentos."
          : events
            ? "Consulte eventos críticos e trilhas de atividade."
            : "Acompanhe processamentos, filas e ocorrências.",
      keywords: "eventos histórico operações processamentos jobs filas exportações",
      icon: FileClock,
      paths: ["/audit", "/operations"],
    });
  }
  areas.push({
    id: "sessions",
    href: "/sessions",
    label: "Sessões",
    description: "Confira como sua sessão e identidade são protegidas.",
    keywords: "identidade segurança",
    icon: MonitorCog,
    paths: ["/sessions"],
  });
  areas.push({
    id: "settings",
    href: "/settings",
    label: "Configurações",
    description: "Atualize seu perfil, e-mail, senha e segurança da conta.",
    keywords: "perfil nome email senha segurança minha conta configurações",
    icon: Settings,
    paths: ["/settings"],
  });
  return areas;
}

export function isAreaActive(area: WorkspaceArea, pathname: string): boolean {
  return area.paths.some(
    (path) => pathname === path || (path !== "/" && pathname.startsWith(`${path}/`)),
  );
}
