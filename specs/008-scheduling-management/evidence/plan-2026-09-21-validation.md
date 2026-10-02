# Validação do recorte administrativo — execução local de 28/09/2026

Autor: CODEX; solicitante autenticado: mafaltti (Danilo-Komunick). Branch
codex/scheduling-market-research-20260923, alterações locais sobre 500f84f, base integrada
dev/origin/dev 89d2356. Nenhum push/PR/merge. Esta evidência não homologa a etapa 2C.

## Integridade e autorização

- T027: grants atuais antes do lock 5010/1 e sessão/grants novamente após espera. GET sem lock.
- T029: diagnóstico somente leitura relata pares de IDs/intervalos, sem dados pessoais ou reparo.
- T030: nova 0031, scheduling_beneficiary_no_overlap por pessoa e intervalo [), status scheduled.
  Preflight sob lock da tabela impede alteração concorrente antes do EXCLUDE. Conflitos antigos
  causam falha integral, com orientação para diagnóstico; teste preserva reservas e versões.
  Migrations 0020/0028/0029/0030 intactas. Aplicação somente em bancos descartáveis.
- Transição explícita: schema atual aceita scheduled/cancelled. T045/T048 precisam substituir
  atomicamente as exclusões de pessoa/profissional para incluir pending_approval antes dos canais.
- T031/T032: disponibilidade aceita beneficiaryId opcional, valida vínculo do excludeBookingId e
  consulta conflitos em qualquer unidade. Criação/remarcação usam a pessoa real; erro 409 próprio
  preserva formulário e reserva original. Vinte chamadas concorrentes têm uma vencedora; testes de
  SQL cobrem parcial, adjacente, cancelada e titular/dependente simultâneos.
- T033: projeção em lote do bloqueio próprio/titular vigente. Lista/calendário/detalhe não alteram
  reserva, ocupação, versão ou histórico. Exclusão e bloqueio coexistem; keep permanece autorizado.

## Exportação

T025: catálogo exato em contracts/exports.md, conferido contra telas/consultas existentes.
T026/T035/T036: fixtures isoladas de 100 registros, três adapters ao lado de usersExport,
allowlists, filtros parametrizados, desempate por ID e cursor incremental do núcleo. Sem teto
funcional da lista/calendário e sem exigir scheduling:write/members:read.

Teste independente scheduling-export.test.ts gera CSV/XLSX/PDF para bookings/catalog/hours com 100
linhas por dataset e arquivos vazios. Parsers CSV, XML/XLSX e PDF independentes conferem
conjunto/IDs, valores, colunas, ordem e cabeçalhos. Intervalo de um ano aceito; filtros combinados,
texto literal, descrição longa, cinco cadastros e duas fontes de horários conferidos. Revogação do
grant entre lotes e da sessão recusam continuidade; CPF não entra na projeção. PDF tem extração de
texto por linha visual: valores multiline são conferidos por linha para preservar a intercalação das
colunas, além da ordem dos IDs.

## Resultados obtidos

| Gate                                                                   | Resultado                                                                                                                                                                                                                                    |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Regressão antes da correção de pessoa                                  | Três falhas esperadas: duas reservas aceitas, disponibilidade oferecida e remarcação conflitante aceita.                                                                                                                                     |
| Unitários Scheduling + exports + workspace/areas + contrato scheduling | 81/81, 11 arquivos, um worker.                                                                                                                                                                                                               |
| Integração Scheduling                                                  | 37/37, 131,59 s, PostgreSQL 18 descartável, 256 MB/1 CPU.                                                                                                                                                                                    |
| Integração exportação Scheduling                                       | 20/20, 27,68 s, mesmo perfil descartável.                                                                                                                                                                                                    |
| TypeScript web                                                         | Aprovado com --noEmit --incremental false.                                                                                                                                                                                                   |
| ESLint dos arquivos alterados                                          | Aprovado, incluindo os seletores por nome.                                                                                                                                                                                                   |
| Contratos transversais                                                 | 169/169 em 24 arquivos.                                                                                                                                                                                                                      |
| Build Next 16.3.4                                                      | Aprovado após os seletores por nome, incluindo TypeScript e geração de páginas.                                                                                                                                                              |
| E2E Chromium                                                           | 5/5 em 1,9 min: acesso, três datasets/formatos e regressão users, jornada completa/LC01/bloqueio, vazio/retry e erro/limite do calendário. Exportação repetida para comprovar contexto da unidade e capturas sem foco transitório: aprovada. |
| CI da entrega                                                          | Não executado: usuário determinou manter local. Checks de PRs anteriores não validam este código.                                                                                                                                            |

## Operação e limites

No Windows, localhost do Testcontainers apresentou ECONNRESET/timeouts. Com
TESTCONTAINERS_HOST_OVERRIDE=127.0.0.1, DOCKER_HOST=npipe:////./pipe/dockerDesktopLinuxEngine e
NODE_OPTIONS=--max-old-space-size=384 as duas suítes passaram. Pool de Scheduling limitado a cinco
conexões, mantendo vinte chamadas simultâneas. Não houve evento Docker de OOM no período consultado.

Tsc isolado excedeu heaps de 384/768 MB; validação com limite padrão passou. Isso não alterou os
limites do preview (384 MB, duas CPUs, prioridade baixa), PostgreSQL ou WSL. Build foi executado sem
preview concorrente. E2E usa base própria no container caab-scheduling-e2e-20260928, sem seed no
banco de uso. Containers preexistentes de outro projeto foram preservados.

## Revisão visual pelo guia CAAB

Guia canônico local: C:/Projetos/caabnovo/docs/caab-design.md, versão documental 1.1. Capturas
conferidas em 390/1280 px e temas claro/escuro: exportações, agenda e reserva com os dois avisos.
Ações de exportação usam PanelHeading acima dos filtros, secundárias com Download; Nova reserva
permanece no cabeçalho da página. Seletores por nome, componentes/tokens existentes, reordenação
acessível e mensagens preservadas. Sem overflow horizontal da página nos testes. WCAG 2.2 AA
automatizado aprovado nas jornadas; confirmação visual não presume teste manual com leitor de tela.
Primeiras capturas de exportação tinham foco/rolagem transitórios e foram refeitas; nenhum ajuste de
CSS do produto foi necessário.

T034/T037/T038/AC03 concluídos localmente. T039 mantém somente a pendência de CI autorizado.
UI01/identidade geral e migration 2C permanecem pré-requisitos da etapa seguinte; WAHA/canais reais
não foram instalados ou ativados. T040 conferiu esses gates sem iniciar schema/canais.

Capturas preservadas:

- [Reservas, celular claro](administrative-2026-09-28/scheduling-export-bookings-390-light.png) e
  [desktop claro](administrative-2026-09-28/scheduling-export-bookings-1280-light.png).
- [Cadastros, celular escuro](administrative-2026-09-28/scheduling-export-catalog-390-dark.png) e
  [horários, desktop escuro](administrative-2026-09-28/scheduling-export-hours-1280-dark.png).
- [Bloqueio e exclusão com reserva mantida](administrative-2026-09-28/scheduling-deleted-member-kept-mobile.png)
  e [agenda, celular](administrative-2026-09-28/scheduling-agenda-mobile-light.png).

Jira atualizado: CAAB-37/26/27/28 com resultados administrativos, CAAB-23 com a parcela de
Agendamentos (sem concluir outros módulos), CAAB-30 com gates externos remanescentes. Itens não
declarados publicados/integrados. Fetch final confirmou dev=origin/dev (0/0); alterações permanecem
na worktree, sem commit. Nenhuma migration foi aplicada ao banco de uso.

Encerramento operacional: preview de teste sem listener em 3107; container descartável da tarefa
parado/removido após conferência do label. Containers preexistentes preservados; Docker Desktop
permanece disponível. Formatação explícita de documentos/código e git diff --check aprovados. O
filtro memberId da URL da lista também é preservado na entrada da exportação; build final revalidado
após esse ajuste, sem nova alteração visual.
