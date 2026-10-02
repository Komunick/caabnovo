# Relatórios e exportações — execução de 02/10/2026

Autoria: CODEX. Solicitante GitHub não verificado: consulta única da sessão via gh api user retornou
HTTP401. Windows, Node24.20.0, pnpm11.25.0. Branch `feature/reports-complete-20261002`, worktree
`.cache/pr-reports-complete-20261002`, base dev748539d. Alterações locais sem commit, push, PR ou
integração; versão dos arquivos identificada no manifesto desta pasta.

## Resultado e limites

Código preparado para Exportar detalhe agrupado, resumo e evolução sem os limites antigos (CAAB-44),
parte de Exportar o conjunto completo de dados em Relatórios (CAAB-24). Os nove adaptadores do
detalhe integrado foram preservados; acrescentados oito agrupados, resumo e evolução. Nenhuma
migration, dependência, dado real ou serviço de produto foi alterado. O núcleo de Disponibilizar
motor compartilhado de download direto (CAAB-22) não foi reconstruído: mesmos cursor, snapshot,
writers, revalidação por lote/heartbeat/final, cancelamento e estado operacional.

Não declarar entrega homologada ou pronta para integração: SQL/arquivos reais dos novos modos,
testes de banco/navegador e medições C1 não foram executados nesta frente. O usuário confirmou WSL
indisponível e determinou registro no Jira. Nenhuma tentativa de recuperar WSL, iniciar Docker,
PostgreSQL ou servidor local foi feita por esta instância. Autorizações de Agendamentos não foram
usadas.

## Implementação

- Detalhe agrupado usa reportSql/reportExportSql com groupBy validado no catálogo, filtros de
  domínio, colunas group/count, ordenação numérica de quantidade ou textual de grupo e desempate por
  id. Exporta por cursor sem LIMIT/OFFSET; a proteção de memória do worker histórico continua
  isolada.
- Resumo/evolução usam projeções agregadas no mesmo snapshot, com indicadores, comparação, base
  atual, séries, acessos, cobertura, funil, avisos, definições, período, atualização UTC e
  comentários. reportSources, inventário, rótulos/definições e SQL do funil são compartilhados com a
  consulta. Testes PostgreSQL preparados comparam os resultados com reportSummary/reportUsage.
- Filtros include_FONTE aparecem somente com permissão atual; ausência exclui a fonte. O catálogo do
  núcleo revalida a seleção em cada autorização. Consulta, exportação e leitura das fontes
  permanecem separadas. Nenhum filtro do cliente é considerado uma concessão.
- As três abas abrem a tela comum de exportação. Filtros, grupo, ordenação, colunas e comentários
  são transportados; histórico e bytes antigos permanecem. Retentativa de falha antiga abre o fluxo
  direto, sem criar novo job pelo botão.
- reportOverviewFiltersSchema separa período de comparação sem teto dos schemas de tela/legado.
  Detalhe conserva limites de data abertos. Resumo exige datas para uma comparação explícita.

## Validações executadas

| Verificação                                             | Resultado                                                             |
| ------------------------------------------------------- | --------------------------------------------------------------------- |
| Instalação offline/frozen                               | Aprovada; lockfile preservado.                                        |
| `pnpm typecheck`                                        | Aprovado nos seis pacotes.                                            |
| `pnpm lint`                                             | Aprovado.                                                             |
| `pnpm format:check`                                     | Aprovado; documentos conferidos separadamente.                        |
| `pnpm test:contract`                                    | 24 arquivos,170 testes aprovados.                                     |
| Unitários focados de Relatórios, motor e legacy-exports | 9 arquivos,60 testes aprovados.                                       |
| `pnpm test:unit`                                        | 419 aprovados,1 falha em teste preexistente de promoção do worker.    |
| Nova execução completa com `--maxWorkers=2`             | Mesmo erro de ambiente; não dispensado nem marcado como sucesso.      |
| Teste de promoção isolado                               | 14/14 aprovados.                                                      |
| `pnpm build`                                            | Aprovado,54 páginas. Build não iniciou servidor ou worker.            |
| `pnpm audit --audit-level high`                         | Aprovado: zero high/critical; dois moderate e um low, sem supressões. |
| `git diff --check`                                      | Aprovado.                                                             |

A falha da suíte completa foi `uv_os_get_passwd returned ENOMEM`, no subprocesso de tsx que o teste
`apps/worker/tests/production-readiness.test.ts` inicia para conferir a política de retenção. O
teste não recebeu a mensagem esperada da aplicação porque o processo falhou antes. Arquivo de teste
e política não foram alterados; o caso passou isoladamente. Isso não permite declarar o gate
completo verde. Reexecutar no ambiente recuperado/CI autorizado.

Os testes focados cobrem catálogo completo, SQL parametrizado, seleção/ordem, grupos, período amplo,
fontes não autorizadas, revogação de seleção, campos indevidos, links entre abas, coleta HTTP,
proteção de arquivos legados e regressão do núcleo. Os writers reais foram exercitados pelos testes
do núcleo com dados em memória; isso não comprova o SQL nem a massa C1 dos novos adaptadores.

## Validações preparadas, não executadas

- `apps/web/tests/integration/report-exports.test.ts`:100 registros,100 grupos e totais por cidade,
  três formatos/colunas/ordem, período superior a366 dias, vazio, resumo/séries equivalentes,
  comentários, negação inicial, revogação entre lotes, nova tentativa e liberação de snapshot.
- `CAAB_EXPORT_PROFILE=1` habilita telemetria diagnóstica no teste: primeiro byte, duração, RSS
  antes/pico/depois, CPU e conexões. Nenhuma medição atual de banco foi obtida.
- Reexecutar também reports.test.ts e export-operations.test.ts para downloads legados, sessão,
  interrupção e compatibilidade. Nenhum seed deve atingir banco de uso do usuário.
- `apps/web/tests/e2e/reports.spec.ts`: fluxos novos e legado preservado, três formatos,
  falha/retentativa, comentários/filtros, Axe, capturas desktop1280/móvel390 e temas. Verificar
  teclado,320px/zoom e leitura manual na retomada. Não houve capturas nem a11y real nesta entrega.
- C1 ainda exige30 aberturas de tela comum durante exportação e p95/recursos observados. A
  telemetria preparada não substitui essa medição. Nenhum teste de grande volume/estresse foi
  executado.

## Revisão pelo guia de design

Guia canônico lido na principal: docs/caab-design.md. Preservados PanelHeading,
Button/buttonVariants, Download, posição dentro do quadro acima dos filtros, FormField,
seleção/reordenação por setas, rascunhos, formatos juntos, estados de erro/progresso e tokens.
Extensão local usa selects rotulados para fontes/agrupamento/ambiente e textarea para comentários;
não apresenta Todos quando a escolha é incluir/excluir ou exige agrupamento. Sem mudança de
paleta/CSS.

Revisão estática não mede contraste, foco, reflow ou compreensão. Evidência visual e revisão humana
continuam pendentes. A seleção de contexto/definições segue a mesma regra de colunas dos três
formatos.

## Coordenação com Agendamentos

Comparada a versão conciliada4e9abac e alterações locais da worktree de Agendamentos. Esta instância
não escreveu nessa worktree, não usou seu runtime e não alterou suas migrations0031–0034.

- runtime.ts permanece idêntico à dev nesta entrega. Na integração conjunta, preservar usersExport,
  reportExports e schedulingExports da frente prioritária.
- export-screen.tsx reutiliza exatamente initialFilters/renderFilter da versão de Agendamentos; o
  componente ReportExportScreen especializa os controles sem nova alteração do núcleo de
  transferência.
- reports.ts altera tipo/gerador de exportação, não a linha reportSources.bookings. Na conciliação,
  preservar o modelo de Agendamentos com procedure_id, original_start e profissional opcional.
  Aplicar somente a linha antiga de reservas sobre o modelo novo seria incorreto.
- MODULES/PRD/STACK/TOOLING não foram modificados; a terceira frente consolida o estado a partir
  daqui.

## Aceite e Jira

Exportar análise detalhada sem agrupamento (CAAB-43): implementação integrada preservada, testes
unitários reexecutados; banco/navegador desta versão e QA humano ainda pendentes. As evidências do
PR40 permanecem históricas e não foram atribuídas a este código novo.

Por pedido explícito do usuário, criada e relida Retomar validações de Relatórios bloqueadas pelo
WSL (CAAB-46), subtarefa de Exportar o conjunto completo de dados em Relatórios (CAAB-24). Critérios
incluem ambiente autorizado, dados sintéticos, integrações, arquivos, revogação, E2E/a11y/C1 e QA
humano separado. Ticket em Backlog, sem responsável inferido.

Comentários confirmados por releitura: Exportar o conjunto completo de dados em Relatórios
(CAAB-24), id10099; Exportar análise detalhada sem agrupamento (CAAB-43), id10100; Exportar detalhe
agrupado, resumo e evolução sem os limites antigos (CAAB-44), id10101. Descrições, responsáveis e
estados dos três itens preservados; não houve transição para QA/concluído nem publicação de código.

## Retomada e rollback

Conferência final: dev/origin/dev confirmadas em748539d, divergência0/0, com os quatro documentos
locais não rastreados da principal preservados. Gitleaks8.28.0 examinou os26 arquivos
alterados/novos da entrega (261.424 bytes), incluindo arquivos não commitados, sem achados. Não
equivale a novo scan de todo o histórico. Os28 links locais dos documentos alterados foram
conferidos, sem ausências. export-screen.tsx é byte a byte idêntico à versão conciliada de
Agendamentos consultada; runtime.ts permanece sem diff. A identidade exata dos arquivos está no
[manifesto SHA-256](reports-complete-2026-10-02-manifest.json).

Retomar as tarefas abertas em tasks.md quando houver ambiente disponível e autorização
correspondente. Conferir versão pelo manifesto e alterações posteriores antes de executar.
Agendamentos tem prioridade na conciliação e nos recursos. A recuperação do ambiente não implica
autorização para abrir PR ou integrar. Rollback de código não exige migration nem apagar dados:
preservar núcleo e arquivos históricos.

## Retomada para publicação — 02/10/2026

Usuário autorizou commits coesos, push para CI existente e PR para dev após gates; não autorizou
merge nem serviços locais. Fetch confirmou dev/origin/dev748539d,0/0. Os hashes amostrados da
revisão reports-compatibility-2026-10-02 da spec008 continuam idênticos nos dois lados. Snapshot
dos25 arquivos do manifesto verificado e preservado localmente antes da correção.

A base748539d não contém original_start e mantém starts_at obrigatório. A correção de cancelamentos
exige o modelo de Agendamentos, cujas migrations não serão copiadas isoladamente. Conciliação futura
deve preservar bookings de Agendamentos, helpers de report-summary e gerador agrupado desta entrega.
Validações da base antiga não aprovam a versão combinada.
