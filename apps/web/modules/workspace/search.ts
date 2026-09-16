import { getWorkspaceAreas, type WorkspaceArea } from "./areas";

type FunctionDefinition = {
  id: string;
  area: string;
  href: string;
  label: string;
  description: string;
  keywords: string;
  permissions?: readonly string[];
};
export type WorkspaceDestination = Pick<
  WorkspaceArea,
  "id" | "href" | "label" | "description" | "keywords" | "icon"
> & { kind: "area" | "function" };

// Only implemented destinations. Contextual tasks explicitly ask the person to choose a record.
const functions: readonly FunctionDefinition[] = [
  {
    id: "messages-new",
    area: "messages",
    href: "/messages/campaigns/new",
    label: "Preparar mensagem",
    description: "Criar campanha e conferir o público.",
    keywords: "nova campanha envio comunicação",
  },
  {
    id: "messages-templates",
    area: "messages",
    href: "/messages/templates",
    label: "Modelos de mensagens",
    description: "Reutilizar conteúdo de comunicação.",
    keywords: "modelo texto assunto",
  },
  {
    id: "messages-audiences",
    area: "messages",
    href: "/messages/audiences",
    label: "Públicos de mensagens",
    description: "Preparar segmentos e exclusões.",
    keywords: "público segmento destinatário",
  },
  {
    id: "scheduling-new",
    area: "scheduling",
    href: "/scheduling/new",
    label: "Criar reserva",
    description: "Escolha o beneficiário e uma vaga de atendimento.",
    keywords: "novo agendar reservar consulta atendimento",
  },
  {
    id: "scheduling-catalog",
    area: "scheduling",
    href: "/scheduling/catalog",
    label: "Oferta de atendimento",
    description: "Cadastre unidades, serviços, procedimentos e profissionais.",
    keywords: "catálogo configurar habilitar profissional duração",
  },
  {
    id: "scheduling-hours",
    area: "scheduling",
    href: "/scheduling/hours",
    label: "Horários de atendimento",
    description: "Configure expediente, jornada e almoço.",
    keywords: "horas dias semanais intervalo disponibilidade almoço",
  },
  {
    id: "user-disable",
    area: "users",
    href: "/users",
    label: "Desativar colaborador",
    description: "Escolha a conta para conferir sua desativação.",
    keywords: "desativar bloquear suspender encerrar usuario acesso",
    permissions: ["users:disable"],
  },
  {
    id: "partner-publish",
    area: "partners",
    href: "/partners/benefits",
    label: "Publicar benefícios",
    description: "Escolha uma oferta para gerenciar sua publicação.",
    keywords: "publicar ocultar esconder beneficio oferta condicoes canais site aplicativo",
    permissions: ["partners:publish"],
  },
  {
    id: "member-oab",
    area: "members",
    href: "/members/oab",
    label: "Consultar OAB",
    description: "Consultar inscrição na Ordem dos Advogados do Brasil.",
    keywords: "advogado advogada inscrição OAB BA Bahia situação profissional",
  },
  {
    id: "member-new",
    area: "members",
    href: "/members/new",
    label: "Cadastrar associado",
    description: "Abrir um novo cadastro de associado.",
    keywords: "novo criar pessoa titular",
    permissions: ["members:write"],
  },
  {
    id: "member-dependent",
    area: "members",
    href: "/members",
    label: "Dependentes e vínculos",
    description: "Escolha um associado para consultar seus vínculos.",
    keywords: "dependente titular familiar parentesco vincular desvincular",
  },
  {
    id: "member-documents",
    area: "members",
    href: "/members",
    label: "Documentos de associados",
    description: "Escolha um associado para consultar seus documentos.",
    keywords: "arquivo anexo comprovante documento revisão analisar",
    permissions: ["files:read"],
  },
  {
    id: "member-photo",
    area: "members",
    href: "/members",
    label: "Foto do associado",
    description: "Escolha o cadastro para consultar ou atualizar sua foto.",
    keywords: "imagem perfil retrato avatar",
    permissions: ["files:read"],
  },
  {
    id: "member-status",
    area: "members",
    href: "/members",
    label: "Situação e avaliações do associado",
    description: "Escolha um associado para conferir sua situação.",
    keywords:
      "financeira credencial elegibilidade cadastro avaliação bloqueio ativar desbloquear arquivar restaurar",
  },
  {
    id: "partner-benefits",
    area: "partners",
    href: "/partners/benefits",
    label: "Benefícios",
    description: "Consultar benefícios e ofertas dos convênios.",
    keywords: "beneficio desconto oferta vantagem convenio parceiro",
  },
  {
    id: "partner-units",
    area: "partners",
    href: "/partners/units",
    label: "Unidades de parceiros",
    description: "Encontrar unidades e estabelecimentos conveniados.",
    keywords: "unidade endereço local estabelecimento filial",
  },
  {
    id: "partner-categories",
    area: "partners",
    href: "/partners/categories",
    label: "Categorias de parceiros",
    description: "Consultar categorias dos convênios.",
    keywords: "categoria segmento classificação especialidade",
  },
  {
    id: "partner-settings",
    area: "partners",
    href: "/partners/settings",
    label: "Aplicativo de convênios",
    description: "Consultar as configurações dos parceiros no aplicativo.",
    keywords: "configurações aplicativo app convenios apresentação",
  },
  {
    id: "partner-new",
    area: "partners",
    href: "/partners/new",
    label: "Cadastrar parceiro",
    description: "Abrir um novo cadastro de parceiro ou convênio.",
    keywords: "novo criar convenio estabelecimento",
    permissions: ["partners:write"],
  },
  {
    id: "partner-contracts",
    area: "partners",
    href: "/partners",
    label: "Contratos de parceiros",
    description: "Escolha um parceiro para consultar os contratos.",
    keywords: "contrato vigencia validade documentos anexos",
    permissions: ["files:read"],
  },
  {
    id: "partner-reviews",
    area: "partners",
    href: "/partners",
    label: "Avaliações de parceiros",
    description: "Escolha um parceiro para consultar suas avaliações.",
    keywords: "avaliacao nota comentario moderacao",
  },
  {
    id: "news-new",
    area: "news",
    href: "/news/new",
    label: "Criar notícia",
    description: "Escrever uma nova notícia.",
    keywords: "nova criar conteudo texto editor",
    permissions: ["news:write"],
  },
  {
    id: "news-drafts",
    area: "news",
    href: "/news/drafts",
    label: "Rascunhos de notícias",
    description: "Encontrar notícias ainda em edição.",
    keywords: "rascunho editar edicao texto",
  },
  {
    id: "news-publish",
    area: "news",
    href: "/news",
    label: "Publicar notícia",
    description: "Escolha uma notícia para gerenciar sua publicação.",
    keywords: "publicação publicar retirar site aplicativo canal",
    permissions: ["news:publish"],
  },
  {
    id: "news-schedule",
    area: "news",
    href: "/news",
    label: "Programar notícia",
    description: "Escolha uma notícia para consultar sua programação.",
    keywords: "agendar agendamento noticia programacao data horario",
  },
  {
    id: "news-versions",
    area: "news",
    href: "/news",
    label: "Versões e prévia de notícias",
    description: "Escolha uma notícia para conferir versões e prévia.",
    keywords: "versao historico revisão restaurar previa preview",
  },
  {
    id: "news-highlight",
    area: "news",
    href: "/news",
    label: "Destaques de notícias",
    description: "Escolha uma notícia para conferir os destaques.",
    keywords: "destaque capa banner imagem midia",
  },
  {
    id: "user-new",
    area: "users",
    href: "/users",
    label: "Cadastrar colaborador",
    description: "Abrir a lista para criar uma conta de colaborador.",
    keywords: "novo criar usuario funcionario equipe",
    permissions: ["users:create"],
  },
  {
    id: "user-access",
    area: "users",
    href: "/users",
    label: "Acessos de colaboradores",
    description: "Escolha um colaborador para conferir seus acessos.",
    keywords: "permissao permissoes perfil papel funcao administrador conceder remover acesso",
  },
  {
    id: "user-edit",
    area: "users",
    href: "/users",
    label: "Editar colaborador",
    description: "Escolha a conta que deseja atualizar.",
    keywords: "alterar nome conta usuario cadastro",
    permissions: ["users:update"],
  },
  {
    id: "audit-export",
    area: "audit",
    href: "/audit",
    label: "Exportar auditoria",
    description: "Escolher o período e solicitar uma exportação.",
    keywords: "exportacao baixar relatorio historico atividades",
    permissions: ["audit:read", "audit:export"],
  },
  {
    id: "jobs",
    area: "audit",
    href: "/audit/jobs",
    label: "Processamentos",
    description: "Acompanhar execuções, filas e falhas.",
    keywords: "processamento jobs fila erro falha tarefas automaticas",
    permissions: ["jobs:read"],
  },
  {
    id: "jobs-retry",
    area: "audit",
    href: "/audit/jobs",
    label: "Repetir processamento",
    description: "Escolha uma execução para avaliar uma nova tentativa.",
    keywords: "reenvio reenviar redrive repetir tentativa",
    permissions: ["jobs:read", "jobs:redrive"],
  },
  {
    id: "account-profile",
    area: "settings",
    href: "/settings#profile-title",
    label: "Alterar meu nome",
    description: "Atualizar os dados do seu perfil.",
    keywords: "minha conta perfil nome pessoal",
  },
  {
    id: "account-email",
    area: "settings",
    href: "/settings#email-title",
    label: "Alterar meu e-mail",
    description: "Solicitar a troca do e-mail da sua conta.",
    keywords: "email correio endereco trocar acesso",
  },
  {
    id: "account-password",
    area: "settings",
    href: "/settings#password-title",
    label: "Alterar minha senha",
    description: "Atualizar a senha da sua conta.",
    keywords: "senha password credencial seguranca trocar",
  },
];

export function getWorkspaceDestinations(permissions: readonly string[]): WorkspaceDestination[] {
  const areas = getWorkspaceAreas(permissions);
  const allowed = new Set(permissions);
  const destinations: WorkspaceDestination[] = areas.map((area) => ({ ...area, kind: "area" }));
  for (const item of functions) {
    const area = areas.find((area) => area.id === item.area);
    if (
      !area ||
      (item.permissions && !item.permissions.every((permission) => allowed.has(permission)))
    )
      continue;
    destinations.push({
      id: item.id,
      href: item.href,
      label: item.label,
      description: `${area.label} · ${item.description}`,
      keywords: `${area.label} ${item.keywords}`,
      icon: area.icon,
      kind: "function",
    });
  }
  return destinations;
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
export function searchWorkspaceDestinations(items: readonly WorkspaceDestination[], query: string) {
  const normalized = normalize(query);
  if (!normalized) return items.filter((item) => item.kind === "area");
  const words = normalized.split(/\s+/);
  return items
    .map((item) => {
      const label = normalize(item.label);
      const text = normalize(`${item.label} ${item.description} ${item.keywords}`);
      return {
        item,
        matches: words.every((word) => text.includes(word)),
        score:
          (label === normalized
            ? 100
            : label.startsWith(normalized)
              ? 60
              : words.every((word) => label.includes(word))
                ? 30
                : 0) + (item.kind === "function" ? 10 : 0),
      };
    })
    .filter(({ matches }) => matches)
    .sort((a, b) => b.score - a.score || a.item.label.localeCompare(b.item.label, "pt-BR"))
    .map(({ item }) => item);
}
