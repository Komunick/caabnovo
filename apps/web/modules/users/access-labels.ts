import type { AccessPermission } from "@caab/contracts";

export const accessGroups: { name: string; actions: [AccessPermission, string][] }[] = [
  { name: "Exportação", actions: [["exports:generate", "Exportar dados dos módulos autorizados"]] },
  {
    name: "Agendamentos",
    actions: [
      ["scheduling:read", "Consultar agendamentos"],
      ["scheduling:write", "Alterar agendamentos e oferta"],
    ],
  },
  {
    name: "Relatórios e Análises",
    actions: [["reports:read", "Consultar análises dos domínios autorizados"]],
  },
  {
    name: "Mensagens",
    actions: [
      ["messages:access", "Consultar mensagens"],
      ["messages:write", "Preparar e alterar mensagens"],
    ],
  },
  {
    name: "Parceiros",
    actions: [
      ["partners:read", "Consultar parceiros, contratos e benefícios"],
      ["partners:write", "Cadastrar e editar parceiros e ofertas"],
      ["partners:publish", "Aprovar contratos e publicar benefícios"],
    ],
  },
  {
    name: "Notícias",
    actions: [
      ["news:read", "Consultar notícias e rascunhos"],
      ["news:write", "Criar e editar notícias"],
      ["news:publish", "Publicar, programar e arquivar notícias"],
    ],
  },
  {
    name: "Associados",
    actions: [
      ["members:read", "Consultar associados"],
      ["members:write", "Cadastrar e editar associados"],
      ["members:review", "Analisar documentos e situações"],
    ],
  },
  {
    name: "Colaboradores",
    actions: [
      ["users:read", "Consultar colaboradores"],
      ["users:create", "Criar colaboradores"],
      ["users:update", "Editar colaboradores"],
      ["users:disable", "Desativar colaboradores"],
      ["users:delete", "Excluir colaboradores"],
    ],
  },
  {
    name: "Gestão de acessos",
    actions: [["roles:read", "Consultar perfis de acesso"]],
  },
  {
    name: "Auditoria",
    actions: [["audit:read", "Consultar eventos"]],
  },
  {
    name: "Processamentos",
    actions: [
      ["jobs:read", "Consultar processamentos"],
      ["jobs:redrive", "Reprocessar falhas"],
    ],
  },
  {
    name: "Arquivos",
    actions: [
      ["files:read", "Consultar e baixar arquivos"],
      ["files:create", "Enviar arquivos"],
      ["files:delete", "Excluir arquivos"],
    ],
  },
];

// Historical audit labels do not add grantable options to the access editor.
export const accessLabels = new Map<string, string>([
  ...accessGroups.flatMap((group) => group.actions),
  ["roles:grant", "Conceder acessos"],
  ["roles:revoke", "Remover acessos"],
  ["access:manage", "Administrar acessos"],
  ["users:reset-password", "Gerar nova senha de colaborador"],
  ["audit:export", "Exportar auditoria"],
  ["reports:export", "Exportar relatórios"],
]);
