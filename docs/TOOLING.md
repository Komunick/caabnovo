# Ferramentas, skills e verificação documental

Revisado em 02/10/2026. A stack do produto está em [STACK.md](STACK.md). Este documento descreve o
processo de trabalho; uma ferramenta disponível ao agente não se torna dependência da aplicação nem
uma automação em execução.

UI/UX deve seguir o [guia principal](caab-design.md) antes da implementação e na revisão. Testes de
produto e seleção de comandos: [STACK](STACK.md#16-testes). Trabalho em execução:
[caderno temporário](agentcache.md); regras de manutenção no [AGENTS](../AGENTS.md).

## Skills versionadas do projeto

O projeto registra Spec Kit 1.0.2, integrado ao Codex com scripts PowerShell e numeração sequencial
de especificações. Fontes: [inicialização](../.specify/init-options.json) e
[integração](../.specify/integration.json).

| Skill                                                                     | Finalidade                                                     |
| ------------------------------------------------------------------------- | -------------------------------------------------------------- |
| [speckit-constitution](../.agents/skills/speckit-constitution/SKILL.md)   | Atualizar princípios e governança.                             |
| [speckit-specify](../.agents/skills/speckit-specify/SKILL.md)             | Especificar uma funcionalidade.                                |
| [speckit-clarify](../.agents/skills/speckit-clarify/SKILL.md)             | Resolver lacunas de requisitos.                                |
| [speckit-plan](../.agents/skills/speckit-plan/SKILL.md)                   | Planejar solução, pesquisa e contratos.                        |
| [speckit-tasks](../.agents/skills/speckit-tasks/SKILL.md)                 | Ordenar tarefas e dependências.                                |
| [speckit-checklist](../.agents/skills/speckit-checklist/SKILL.md)         | Conferir qualidade dos requisitos.                             |
| [speckit-analyze](../.agents/skills/speckit-analyze/SKILL.md)             | Analisar consistência entre artefatos.                         |
| [speckit-implement](../.agents/skills/speckit-implement/SKILL.md)         | Executar tarefas de implementação.                             |
| [speckit-converge](../.agents/skills/speckit-converge/SKILL.md)           | Registrar lacunas entre implementação e planejamento.          |
| [speckit-taskstoissues](../.agents/skills/speckit-taskstoissues/SKILL.md) | Converter tarefas em issues do GitHub; não cria itens no Jira. |

O [workflow completo](../.specify/workflows/speckit/workflow.yml) encadeia especificação, revisão,
plano, revisão, tarefas e implementação. Sua existência não comprova execução. Para cada trabalho,
distinguir skill consultada, workflow executado e edição direta. Não declarar cumprimento integral
de uma skill apenas porque seu arquivo foi lido.

## Seleção da especificação

Uma branch pode reunir mudanças de várias funções. O diretório numerado de spec não determina o nome
da branch e não identifica sozinho a tarefa ativa.

O seletor `.specify/feature.json` é estado local por worktree, ignorado pelo Git. Não versioná-lo
nem copiar automaticamente o seletor da principal para outra entrega. Antes de executar qualquer
comando, escolher a especificação responsável e conferir os caminhos resolvidos. Não selecionar
Notícias por conveniência ou por um registro antigo.

Exemplo de resolução somente leitura, executado na worktree da entrega:

```powershell
# Escolher o caminho da função que será trabalhada; não deduzi-lo da branch.
$previousFeatureDirectory = $env:SPECIFY_FEATURE_DIRECTORY
try {
    $env:SPECIFY_FEATURE_DIRECTORY = 'specs/001-project-foundation'
    ./.specify/scripts/powershell/check-prerequisites.ps1 -PathsOnly -Json
} finally {
    $env:SPECIFY_FEATURE_DIRECTORY = $previousFeatureDirectory
}
```

O exemplo usa a Fundação; outra função exige seu próprio caminho. Sem escolha explícita nem seletor
local válido, o comando deve pedir contexto em vez de assumir uma funcionalidade. `-PathsOnly` não
persiste a seleção. Outros comandos podem gravar `feature.json`; conferir esse estado antes de
reutilizá-lo.

Na ausência de `SPECIFY_FEATURE`, o campo `BRANCH` retornado pelo resolvedor pode ser o nome da
especificação. Conferir a branch Git real com `git branch --show-current`; não criar ou renomear
branches a partir desse campo.

## Ferramentas do ambiente do agente

Git, GitHub CLI, PowerShell e scripts auxiliares ajudam a operar o repositório. Python usado em
manutenção não equivale a um serviço Python do produto. Skills de documentos, planilhas,
apresentações, imagens, navegador, Sites e Notion dependem da sessão e devem ser consultadas quando
aplicáveis; não são requisitos do CAAB. Não instalar bibliotecas do produto para corresponder a
ferramentas do agente.

Ferramentas e conexões variam por sessão e computador. Consultar o que está disponível antes de
usar; uma integração instalada não prova acesso a um espaço nem autorização para publicar, criar
tickets ou enviar mensagens. Evidências de uso pertencem à entrega, não a uma lista fixa neste
documento.

## Formatação e conferência de documentos

`pnpm format:check` usa `.prettierignore`, que exclui `docs/`, `specs/`, `.specify/` e `.agents/`. O
CI atual chama esse comando geral; ele não comprova formatação dos documentos. As exclusões
históricas ficam preservadas para evitar uma reformatação indiscriminada de todos os artefatos e
skills de terceiros.

Para arquivos documentais alterados, executar explicitamente:

```powershell
pnpm format:docs docs/STACK.md docs/TOOLING.md docs/DELIVERY-WORKFLOW.md
pnpm format:docs:check docs/STACK.md docs/TOOLING.md docs/DELIVERY-WORKFLOW.md
git diff --check
```

Os comandos usam o Prettier já instalado e `.gitignore` para proteger arquivos locais/privados, sem
aplicar a exclusão geral das pastas documentais. Sempre passar os arquivos envolvidos na mudança;
não usar `.` numa organização genérica. Incluir caminhos de `specs/` ou `.specify/` quando esses
documentos forem alterados. O comando de escrita é opcional quando a conferência já passa.

Se o pnpm tentar reinstalar dependências antes de executar uma conferência puramente documental,
preservar `node_modules` e usar o formatador existente. Com Prettier já instalado,
`pnpm --config.verify-deps-before-run=false format:docs:check <arquivos>` executa somente essa
conferência. Não aplicar essa opção como dispensa de validação das dependências em build, testes ou
CI.

Conferir também links locais adicionados, correspondência com manifests e código, regras
substituídas e distinção entre evidência técnica e aceite de produto. Registrar quais verificações
foram feitas e seus limites na entrega. Esses comandos são uma verificação explícita de entrega; não
foram adicionados aos workflows GitHub nesta revisão e não devem ser descritos como gate automático
do CI.

## Dependências e implantação

- Manifests e lockfile são a referência de versões do checkout; não presumir a versão publicada.
- Configurações de dependências devem corresponder a pacotes ainda usados. As exceções antigas de
  idade de release do SDK S3 foram removidas porque esse SDK não consta dos manifests nem do
  lockfile revisados.
- Conferir a adoção no manifest e na stack antes de instalar dependências. TanStack/React Hook Form
  continuam propostas não adotadas; FullCalendar já integra o painel.
- Arquivos de Compose, alertas ou proxy não provam que serviços estejam ativos na hospedagem.
- Localhost permanece desativado até ordem explícita, conforme
  [fluxo de entrega](DELIVERY-WORKFLOW.md).

## Referência a tickets Jira

Decisão do usuário em 02/10/2026: em respostas e documentação nova, identificar tickets pelo título
e código, no formato Título (CAAB-N), sem usar links de tickets como referência. Preservar links de
evidências e relações nativas no Jira; não apagar histórico para reformatação.
