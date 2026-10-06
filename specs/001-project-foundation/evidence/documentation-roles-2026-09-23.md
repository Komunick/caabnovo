# Revisão das responsabilidades documentais — 23/09/2026

Autoria: CODEX. Solicitante: mafaltti, login GitHub Danilo-Komunick, verificado nesta sessão.
Branch: `docs/documentation-roles-20260923`, base `89d2356`. Escopo autorizado: corrigir a revisão
documental e tornar o agentcache um caderno temporário. Não altera código de produto.

## Mudanças

- AGENTS define anotar antes de iniciar, atualizar imediatamente e retirar notas concluídas.
- Caderno principal mantém só contexto de sessão e pendências reais. Histórico anterior preservado
  em [registro datado](../../../docs/history/agentcache-2026-09-23.md); fila de produto encaminhada
  às [tarefas do programa](../../002-integrated-modules/tasks.md), preservando assinaturas.
- Procedimentos locais ficam no [runbook](../../../docs/runbooks/local-workspace.md).
- PRD concilia justificativas, ordem de execução e política de PR; MODULES distingue base entregue
  de adequações restantes. Inventários anteriores foram preservados como histórico.
- STACK separa tecnologias adotadas de propostas e encaminha às suítes/comandos existentes.
- Workflow exige pedido explícito para abrir/reabrir PR e aponta ao guia e runbook corretos.
- Referências ao guia foram acrescentadas; documentos visuais antigos são identificados como
  históricos.
- Guia e sua evidência/JSON são preparados para versionamento. A evidência de 22/09 permanece
  histórica; suas validações não foram executadas novamente. Artefatos locais mencionados nela não
  equivalem a anexos versionados ou nova homologação.

## Validação

- Formatação dos 20 arquivos da entrega aprovada com o Prettier instalado, usando a configuração do
  projeto e `--ignore-path .gitignore`.
- `git diff --check` aprovado. Escopo do diff: documentos e evidência JSON; sem código de produto.
- Conferência de 204 arquivos Markdown: 794 links locais inline, nenhum destino ausente. Duas
  referências de âncoras aos documentos centrais alterados também conferidas. URLs externas e demais
  formas/âncoras Markdown não foram auditadas integralmente.
- Os 21 registros de pedidos/possibilidades foram preservados nas tarefas do programa. O guia
  concluído saiu da fila; a dúvida sobre cargo base permanece anotada e consta do contrato.
- Evidência Markdown e JSON de design copiados integralmente, com conteúdo idêntico à origem.
- A exclusão local de AGENTS foi retirada; os novos documentos têm intenção de inclusão no Git para
  revisão. Não foram publicados e ainda não estão disponíveis por clone da branch remota.
- Regras do caderno aplicadas também ao AGENTS local. Registro desta execução removido do caderno ao
  concluir; resultado permanente é este documento. Sem testes de aplicação, localhost, mudanças de
  dados, commit, PR, push ou deploy nesta revisão.

## Rechecagem — 23/09/2026

CODEX/mafaltti, reutilizando a identidade GitHub já consultada na sessão. Nenhuma nova
inconsistência encontrada no escopo documental conferido da entrega preparada.

- Os 20 arquivos da entrega passam na formatação; diff sem erros de whitespace.
- 204 Markdown / 794 links locais inline na entrega e 20 links dos três documentos de entrada da
  principal: nenhum destino ausente. URLs externas e todas as âncoras não foram revalidadas.
- AGENTS da principal e da entrega idênticos por SHA-256. Seis documentos centrais encaminham ao
  guia de UI/UX. Fluxo de PR exige pedido explícito, conforme o AGENTS.
- Os dez comandos de validação citados na stack existem no package.json. Não foram executadas suítes
  de aplicação, pois o escopo é documental.
- Os 21 registros encaminhados ao programa permanecem preservados; relatório e JSON originais do
  guia continuam idênticos às fontes. Históricos visuais estão identificados como históricos.
- Caderno principal mantém contexto de sessão e duas pendências reais (cargo base e Cores Legado),
  com assinaturas e referências. Esta nota de rechecagem foi retirada da fila ao concluir.
- Limite de distribuição: correções dos documentos versionados continuam na worktree da branch
  docs/documentation-roles-20260923; a dev mantém a versão integrada anterior. Não há commit, PR ou
  publicação dessa entrega. O runbook local identifica a localização correta para retomada.

## Verificação de estabilidade e preservação — 23/09/2026

Autoria: CODEX. Solicitante: mafaltti. Pedido: conferir estabilidade e preservação das informações,
sem reorganização ampla. Base local e da entrega: `89d2356`.

### Preservação documental

- Os quatro backups da consolidação original (AGENTS, WORKSPACE, TASKS e primeiro agentcache)
  conferem por SHA-256 com o manifest. Os doze backups anteriores à correção documental também
  conferem com os hashes registrados: 16 arquivos íntegros.
- MODULES anterior está integralmente preservado no histórico, desconsiderando formatação e ajustes
  de caminhos relativos. O histórico do agentcache conserva o conteúdo anterior; duas referências
  locais foram convertidas em referências históricas explícitas. O guia conserva o conteúdo do
  backup, com ajuste de referências. Relatório e JSON do design são idênticos por SHA-256 aos
  originais na worktree do guia.
- Os 21 registros encaminhados às tarefas do programa mantêm suas assinaturas. Nenhum identificador
  de requisito do PRD anterior desapareceu. Trechos de estado retirados de PRD/STACK foram
  confrontados com MODULES, tarefas e históricos; regras de produto retiradas do AGENTS possuem
  fontes nas specs, contratos, guia de design e padrão de exportação.
- AGENTS da principal e da entrega são idênticos por SHA-256. Os 20 arquivos da entrega passam na
  formatação; `git diff --check` passou. A verificação de 222 arquivos Markdown listados pelo Git,
  incluindo instruções/skills, encontrou 794 links locais inline e nenhum destino ausente. A
  contagem de arquivos é mais ampla que a revisão anterior; não inclui arquivos locais ignorados,
  todas as âncoras nem URLs externas.
- O índice histórico local `.cache/archive/agentcache-consolidation-20260922.md` ainda contém um
  apontador antigo para `.cache/agentcache.md`. O caderno vigente está em `docs/agentcache.md`; o
  caminho antigo não significa perda do arquivo. Índice histórico não foi reescrito nesta revisão.

### Estabilidade e limites

- Fetch concluído; `dev` e `origin/dev` sem divergência (0/0). Nenhum diff de código, dependências,
  configuração de aplicação ou migrations na entrega documental. Principal contém quatro arquivos
  locais não versionados de orientação/design/caderno; não declarar a pasta completamente limpa.
- Suíte de contratos executada na principal, cujo código é o mesmo da entrega: 24 arquivos e 169
  testes aprovados. Comando:
  `node node_modules/vitest/vitest.mjs run --project contract --maxWorkers 1 --bail 1`.
- Tentativa conjunta de unitários/contratos interrompida após falhas de carregamento. A reprodução
  isolada de `apps/web/modules/exports/dependencies.test.ts` falhou antes dos testes por ausência de
  `exceljs`. A instalação local também não resolve `pdfkit`, `pg-cursor`, `@fullcalendar/react` e
  `temporal-polyfill` no web, nem `pdfkit` e `write-excel-file` no worker. Os manifests não foram
  alterados; não foi realizada instalação de dependências. Estabilidade completa não comprovada.
- Cinco registros Git de worktrees ainda apontam para o Desktop antigo. As cinco pastas existem sob
  `C:/Projetos/caabnovo/.cache`; não foram removidas ou reparadas automaticamente.
- Persistem a ambiguidade do template de tarefas sobre testes opcionais e as pendências de produto
  já registradas. Esta verificação não reorganiza documentos nem homologa funções pendentes.
- Build, integrações com banco e navegador não executados. Aplicação, worker e banco não foram
  iniciados; dados, volumes e backups não foram modificados. Integridade/restauração do banco não
  foi auditada; o dump anteriormente identificado como parcial continua sem validação.
- Correções documentais permanecem locais na entrega, sem commit/PR/publicação. Preservação local
  não equivale a backup remoto. Não foi encontrada perda de informação nas fontes comparadas; os
  backups e históricos permitem recuperar as redações anteriores.

## Correção dos registros de diretório — 23/09/2026

Autoria: CODEX. Solicitante: mafaltti. Pedido explícito: resolver os erros de registro de diretório.
Esta seção encerra as pendências de caminhos registradas na verificação anterior.

- Cinco worktrees existentes foram identificadas por pasta, metadados, branch e commit antes do
  reparo. Backup local: `.cache/local-backups/directory-record-repair-20260923-151340`, com 27
  cópias verificadas por SHA-256 e inventário anterior em `before.json`.
- `git worktree repair` atualizou os vínculos de pr-access-export-foundation-20260921,
  pr-design-guide-20260922, pr-project-clarify-20260921, pr-single-collaborator-role-20260922 e
  preview-latest para as pastas existentes em `C:/Projetos/caabnovo/.cache`.
- As sete pastas registradas (principal e seis worktrees) passaram a ser reconhecidas na raiz atual,
  sem Desktop antigo ou marcação `prunable` na listagem. Cada pasta reparada resolve o diretório Git
  compartilhado correto. Branch, HEAD, hash do índice e status de arquivos permanecem iguais aos
  anteriores; as cinco worktrees estavam e continuam sem alterações locais visíveis ao Git.
- O apontador do índice `.cache/archive/agentcache-consolidation-20260922.md` foi corrigido para
  `../../docs/agentcache.md`, e o runbook local foi atualizado. Evidências anteriores e cópias de
  backup conservam seus caminhos históricos, sem substituição indiscriminada.
- Nenhuma pasta foi movida, removida ou recriada. Não houve instalação, alteração de código,
  inicialização de serviços, commit, push ou PR. Dependências ausentes permanecem fora deste pedido.
- A revisão automática rejeitou a tentativa inicial de executar `merge --ff-only origin/dev`, por
  considerá-la fora do escopo. A chamada foi bloqueada antes da execução; o reparo prosseguiu sem
  atualizar branches. Nenhum merge foi realizado.
- Validação final: seis links do índice histórico válidos, 27 cópias do backup íntegras, formatação
  dos documentos editados e `git diff --check` aprovados. Nota de execução removida do caderno ao
  concluir.
