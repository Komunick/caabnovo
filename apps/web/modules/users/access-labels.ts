import type { AccessPermission } from "@caab/contracts";

export const accessGroups: { name: string; actions: [AccessPermission, string][] }[] = [
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
    ],
  },
  {
    name: "Gestão de acessos",
    actions: [
      ["roles:read", "Consultar perfis de acesso"],
      ["roles:grant", "Conceder acessos"],
      ["roles:revoke", "Remover acessos"],
    ],
  },
  {
    name: "Auditoria",
    actions: [
      ["audit:read", "Consultar eventos"],
      ["audit:export", "Exportar eventos"],
    ],
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

export const accessLabels = new Map<string, string>(accessGroups.flatMap((group) => group.actions));
