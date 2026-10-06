# Início da implementação — 28/09/2026

## Autorização e entrega

Registro: implement-inicial-CODEX-mafaltti; GitHub autenticado Danilo-Komunick, conferido nesta
sessão. O usuário pediu: “atualize o jira e começe a implementação”. Essa autorização substitui a
espera pelo implement nos checkpoints anteriores; não concede publicação, PR, merge ou ativação de
canais reais. Posteriormente o usuário autorizou Docker/banco para validações locais.

Worktree: C:/Projetos/caabnovo/.cache/pr-scheduling-research-20260923. Branch:
codex/scheduling-market-research-20260923, HEAD 500f84f; base dev/origin/dev 89d2356 conferida após
fetch. Correções documentais anteriores preservadas. Estado local, sem publicação.

## Jira atualizado

| Ticket                                                   | Estado / atualização                                                                    |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| [CAAB-37](https://komunick.atlassian.net/browse/CAAB-37) | Em Desenvolvimento; ordem administrativa → app/site e limites da retomada.              |
| [CAAB-28](https://komunick.atlassian.net/browse/CAAB-28) | Em Desenvolvimento; guardas existentes concluídas, matriz e pré-lock em execução.       |
| [CAAB-26](https://komunick.atlassian.net/browse/CAAB-26) | Plano de overlap corrigido: diagnóstico e migration 0031 a reconferir.                  |
| [CAAB-27](https://komunick.atlassian.net/browse/CAAB-27) | Aviso blocked aditivo, sem substituir exclusão/keep; inatividade isolada não cria veto. |
| [CAAB-30](https://komunick.atlassian.net/browse/CAAB-30) | Contrato existente, decisões 2C e dependências antes da integração.                     |
| [CAAB-23](https://komunick.atlassian.net/browse/CAAB-23) | Apenas recorte Agendamentos atualizado; registry, três formatos e testes próprios.      |

CAAB-17 permanece concluído; nenhum ticket novo ou atribuição de responsável inventada.

## Entrada speckit-implement

- Sem arquivo .specify/extensions.yml: nenhum hook before/after implement configurado.
- check-prerequisites.ps1 -Json -RequireTasks -IncludeTasks passou com SPECIFY_FEATURE_DIRECTORY
  apontando para esta spec. Primeiro comando foi bloqueado pela política de scripts; execução do
  arquivo inspecionado em processo PowerShell com -ExecutionPolicy Bypass, sem alterar política
  persistente. SPECIFY_FEATURE não é a variável desta versão.
- FEATURE_DIR resolvido nesta worktree; disponíveis research.md, data-model.md, contracts/,
  quickstart.md e tasks.md.
- Checklists preservadas, sem mudar marcadores: channels 0/25; requirements histórica 13/14.
  Prosseguimento autorizado pelo pedido atual após o checkpoint que expôs as pendências.
- Guias locais Next de autenticação/testes lidos. Constitution e regras da entrega conferidas.
  Ignores existentes para dependências, ambiente, build e testes adequados; não alterados.
- Dependências instaladas pelo lockfile com pnpm install --offline --frozen-lockfile; nenhum
  pacote/versão/manifests alterado. Na preparação não houve serviço iniciado; a validação posterior
  autorizada está registrada abaixo.

## CAL06 — revisão encerrada

Consulta autenticada ao PR #34 confirmou integração em 21/09, merge ed31baf, head fb218fb, com
quality/browser/security aprovados nas execuções finais
[35392211021](https://github.com/Komunick/caabnovo/actions/runs/35392211021) e
[35392206888](https://github.com/Komunick/caabnovo/actions/runs/35392206888).

Quatro capturas versionadas foram abertas e revisadas nesta sessão:
[semana desktop escuro](calendar-week-desktop-dark.png),
[mês celular claro](calendar-month-mobile-light.png),
[dia celular escuro](calendar-day-mobile-dark.png) e
[cancelamento celular claro](calendar-cancelled-mobile-light.png). A página permanece contida; no
celular o mês usa rolagem dentro da grade. Situação/início do evento permanecem legíveis; detalhes
completos não dependem do texto truncado da grade. Temas, controles, período e Nova reserva estão
presentes. Fonte: capturas introduzidas no merge ed31baf. Comparação com o head final: calendário
preservado, com adição posterior do sinal de exclusão de LC01. Nenhum metadado do PR ou branch
integrada foi alterado.

CAL06 fecha a revisão pendente daquela entrega, sem homologar o código novo deste checkpoint.

## T027 — primeira alteração implementada

access.ts agora verifica os grants persistidos antes de disputar o lock de elegibilidade 5010/1. A
releitura posterior de sessão/grants continua antes do efeito. Consultas não adquirem o lock;
scheduling:write continua dependendo de read. Snapshot de permissões do ator não concede acesso.

Testes adicionados antes da correção:

- 14 casos unitários: matriz de leitura/escrita, negação antes do lock, ordem de autorização,
  revogação durante espera, expiração e sessão inválida.
- 2 casos HTTP: negações GET/POST mantêm 403/no-store e não disparam analytics.
- 7 cenários de integração: quatro combinações de grants, negação/leitura sob lock ocupado,
  revogação observada durante espera real e Gestor consultando bookings sem write.

## Validações executadas e limites

| Validação                                                             | Resultado                                                                                                                |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Guarda antes da correção                                              | 4 falhas esperadas / 10 aprovados: comprovou contenção indevida e ausência de pré-checagem.                              |
| Guarda após correção                                                  | 14/14 aprovados.                                                                                                         |
| Unidade scheduling + workspace/areas + contrato scheduling, um worker | 46 testes em 7 arquivos aprovados.                                                                                       |
| ESLint nos quatro arquivos de código/teste alterados                  | Aprovado.                                                                                                                |
| TypeScript web, --noEmit --incremental false                          | Aprovado.                                                                                                                |
| Integração PostgreSQL                                                 | 31/31 aprovados, incluindo os sete cenários novos. PostgreSQL 18 descartável, 256 MB e 1 CPU, um worker Node com 384 MB. |
| Navegador / build                                                     | Não executados nesta retomada; permanecem gates da entrega.                                                              |
| Docker local (somente consulta)                                       | API indisponível no pipe docker_engine; não foi iniciado.                                                                |

## Validação local autorizada e resultado

Após responder “Manter local por enquanto” à publicação, o usuário autorizou ligar Docker/banco e
executar o necessário localmente. Docker Desktop iniciado oculto; WSL existente com 768 MB/2 CPUs.
Não alteramos containers de outros projetos que iniciaram automaticamente. O helper startPostgres
passou a aceitar quota opcional; somente a suíte scheduling solicita 0,25 GiB/1 CPU. Não muda os
demais consumidores. Testcontainers criou PostgreSQL 18 sintético e removeu o container ao terminar;
nenhum banco persistente do projeto foi usado.

Comando: DOCKER_HOST=npipe:////./pipe/dockerDesktopLinuxEngine,
NODE_OPTIONS=--max-old-space-size=384; node node_modules/vitest/vitest.mjs run --project integration
apps/web/tests/integration/scheduling.test.ts --maxWorkers=1. Resultado: 31 aprovados em um arquivo,
136,35 s total. T027 concluído; AC03 mantém pendências de descoberta/URL/UI e evidências próprias. O
CI do PR #34 não foi usado como prova deste código novo.

## Segunda revisão incorporada

- Corpo ativo de tasks agora inicia T025–T039; 2C depois, sem esconder administração em details.
- T030/0031 é transição explícita do estado administrativo. T045/T048 propõem 0032 posterior, com
  DROP CONSTRAINT nomeado e recriação de pessoa/profissional para scheduled/pending_approval, em uma
  transação, antes de habilitar escrita 2C. A invariante é canônica no data-model.
- Identidade geral → member, UI01/consumidor, NULLs por modo/estado, ator/idempotência externos e
  Relatórios sem perda em inner joins são gates antes de T049/T070/T072. Público só catálogo.
- Checkpoint.md concentra autorização/escopo. Pre-implement é histórico não executável. Constitution
  Check atualizado para 2.1.0. Trechos antigos em details identificados como arquivo histórico.
- Reconciliação permanece local, conforme pedido expresso. A sugestão de PR documental não equivale
  a autorização de publicação; nenhum código ou documento foi enviado a origin/dev.

## Continuidade

Registro inicial superado pela continuação abaixo. A autorização local permanece vigente; T040
apenas verifica gates e 2C não iniciou.

## Conferência final do incremento local

Formatação explícita dos documentos e dos cinco arquivos TypeScript alterados aprovada;
`git diff --check` sem erros. ESLint dos cinco arquivos e typecheck web repetidos após o helper de
quota: aprovados. Verificação documental confirmou T025–T039 antes de 2C, 38 tarefas 2C abertas,
CAL06/T027 concluídas, AC03 aberta e details equilibrados. Jira CAAB-37/28/26/30 recebeu o resultado
e a segunda revisão. Sem commit/push/PR. Nenhuma marca da checklist foi alterada pelo implement;
requirements.md conserva apenas a classificação histórica da revisão anterior.

## Continuação administrativa no mesmo dia

T025/T026/T029–T033/T035/T036 implementados e validados localmente. 0031 criada e aplicada somente
em bancos descartáveis; migrations anteriores preservadas. Aviso de bloqueio aditivo mantém LC01.
Registry mantém usersExport e adiciona bookings/catalog/hours. Exportação usa o núcleo e filtros por
nome nas telas, sem exigir escrita. 81 unitários, 37 integrações Scheduling e 20 integrações de
arquivos aprovados. Build/tipos/lint, cinco jornadas Chromium e revisão visual aprovados; 169
contratos aprovados. Resultados e tentativas em
[validação do recorte](plan-2026-09-21-validation.md). O estado inicial “sem 0031” e os 31 testes
acima referem-se ao primeiro incremento, não ao atual.
