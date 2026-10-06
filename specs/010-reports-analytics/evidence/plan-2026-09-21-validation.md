# Relatórios e exportações — execução de 02/10/2026

Autoria: CODEX. Solicitante GitHub não verificado: consulta única da sessão via gh api user retornou
HTTP401. Windows, Node24.20.0, pnpm11.25.0. Branch `feature/reports-complete-20261002`, worktree
`.cache/pr-reports-complete-20261002`, base dev748539d. Funcionalidade publicada em9995361 e ajuste
E2E em0775bf3; correção de cancelamentos dependente do modelo de Agendamentos preservada
separadamente. Sem PR ou integração; versão local dos arquivos identificada no manifesto desta
pasta.

## Resultado e limites

Código preparado para Exportar detalhe agrupado, resumo e evolução sem os limites antigos (CAAB-44),
parte de Exportar o conjunto completo de dados em Relatórios (CAAB-24). Os nove adaptadores do
detalhe integrado foram preservados; acrescentados oito agrupados, resumo e evolução. Nenhuma
migration, dependência, dado real ou serviço de produto foi alterado. O núcleo de Disponibilizar
motor compartilhado de download direto (CAAB-22) não foi reconstruído: mesmos cursor, snapshot,
writers, revalidação por lote/heartbeat/final, cancelamento e estado operacional.

Não declarar entrega homologada ou pronta para integração: o CI abaixo valida SQL/arquivos reais da
base publicada, mas a correção dependente de Agendamentos, C1 e QA humano ainda não foram validados.
Os resultados da primeira rodada local abaixo são históricos. O usuário confirmou WSL indisponível e
determinou registro no Jira. Nenhuma tentativa de recuperar WSL, iniciar Docker, PostgreSQL ou
servidor local foi feita por esta instância. Autorizações de Agendamentos não foram usadas.

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

## Validações da primeira rodada local

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

### Correção preparada e gates locais da retomada

Aplicado coalesce(starts_at,original_start,created_at) nos dois limites dos avisos de
report-overview-export.ts e report-summary.ts. Helpers preservados. Regressão adicionada em
report-exports.test.ts usa seis reservas sintéticas no schema real, três cancelamentos incluídos,
limites excluídos, fallback/precedência temporal, três formatos, include_bookings omitido/no e
revogação corrente. Não executada: depende das migrations reais de Agendamentos. Nenhuma cópia de
migration, schema artificial, mock ou teste de string SQL foi usado como prova.

Tipos passaram após a regressão. Suíte completa unitários+contratos:589/590,86 arquivos, 73,24s;
falha preexistente Windows/ENOMEM em production-readiness.test.ts reproduzida. Não atribuir
aprovação ao teste isolado. CI37031769176 acompanha9995361 (funcionalidade), sem a correção SQL
dependente do modelo novo. Os resultados remotos devem ser registrados separadamente; não comprovam
uma futura versão combinada.

Gates locais posteriores à regressão: tipos, lint, formato e build54 páginas concluídos; auditoria
de dependências sem high/critical (duas moderadas e uma baixa). Wrappers PowerShell com
redirecionamento registraram NativeCommandError ao receber o anúncio pnpm em stderr, embora as
tarefas internas tenham concluído; lint/formato foram reconferidos diretamente com exit0. Nenhum
serviço de aplicação foi iniciado.

### CI37031769176 — commit9995361

[Execução no GitHub](https://github.com/Komunick/caabnovo/actions/runs/37031769176): quality e
security aprovados; browser falhou no novo teste por seletor ambíguo de Ambiente (select de filtro e
checkbox de coluna). Corrigido em0775bf3 usando combobox pelo nome; novo CI37032398048 em
acompanhamento. Nenhuma asserção funcional foi removida.

Logs do job quality110920081536 comprovam420/420 unitários (62 arquivos),170 contratos (24
arquivos),257 integrações (27 arquivos),1 ignorada preexistente de grande volume opt-in.
production-readiness.test.ts passou14/14 dentro da suíte completa: ENOMEM local não se reproduziu no
Ubuntu. report-exports.test.ts passou10 testes reais; validou agrupado100, filtros75/25/vazio,
CSV/Excel/PDF, resumo/evolução com métricas/séries/notas equivalentes, revogação antes e entre
lotes, liberação de cursor e retentativa. Build54 páginas concluído. Não inclui a nova regressão de
cancelamentos sem horário nem o modelo de Agendamentos.

No navegador, três testes existentes passaram; o novo caso concluiu agrupado, mas parou antes de
verificar resumo/evolução. A suíte global e o gate a11y separado não rodaram nessa execução.
Capturas/arquivos foram preservados pelo job, ainda sem revisão visual nesta rodada. C1 (30 leituras
do painel, p95 e recursos) e QA humano permanecem pendentes.

A CLI retornou403 para o arquivo agregado de logs. Os logs de jobs foram lidos pelo conector GitHub
autorizado; essa limitação não foi contornada por mudança de permissões.

### CI final da funcionalidade — 0775bf3

[CI37032398048](https://github.com/Komunick/caabnovo/actions/runs/37032398048), SHA
0775bf38a58d5ae0fc6b01ad6083ca2bbfab3a22: quality, browser e security aprovados. 420 unitários/170
contratos/257 integrações;1 ignorada opt-in de grande volume. Quatro jornadas de Relatórios passaram
antes da suíte global;97 E2E globais e6 a11y passaram. Logs dos jobs110922202420/110922202573
confirmados pelo conector GitHub. A falha Windows/ENOMEM não ocorreu nos420 testes completos do
runner, incluindo os14 casos de production-readiness. Formatação, lint, tipos, build e segurança
aprovados.

As integrações executam PostgreSQL e writers reais com parsers independentes. Comprovam 100 grupos,
contagens/filtros, agregados/séries/comentários, permissões, revogação, liberação de cursor e retry
nos limites dos casos descritos acima. O E2E concluiu CSV/Excel/PDF de agrupado/resumo/evolução,
período amplo, erro recuperável, mobile390, temas e Axe. Isso não comprova grande volume, todas as
combinações possíveis ou QA humano.

Artefato reports-synthetic-evidence:11237619588,2.153.641 bytes,
SHA-2565f5c170b774e7e49525c5ca61dd2694c954dd20bb92e12bcad3c5e9679a1418f, expira em09/10/2026.
Conteúdo preservado pelo CI, mas revisão visual manual pendente: CLI retornou401 no download; URL
temporária do conector retornou403, inclusive fora da rede restrita. Nenhuma credencial/permissão
foi alterada. Logs permaneceram acessíveis.

### Limite de publicação e próximo passo

A correção de cancelamentos e seu teste são preservados em commit local separado, sem push, pois
original_start/procedure_id/reservas sem horário não existem na dev748539d. Não publicar essa ponta
como pronta para implantação. Aguarda-se a base de Agendamentos ou decisão explícita de publicar com
dependência pendente. Nenhuma migration foi copiada. O CI verde0775bf3 não valida a correção nem a
futura conciliação T041/T042. PR não aberto.

Pendências de Retomar validações de Relatórios bloqueadas pelo WSL (CAAB-46): regressão real de
cancelamentos e agrupamentos no novo modelo; gates da versão combinada; revisão visual das capturas;
C1 (tempos/primeiro byte/RSS/CPU/conexões e30 leituras de painel/p95); QA humano de Exportar análise
detalhada sem agrupamento (CAAB-43) e Exportar detalhe agrupado, resumo e evolução sem os limites
antigos (CAAB-44). Os testes técnicos da base publicada reduzem o bloqueio anterior, mas não
encerram o aceite de Exportar o conjunto completo de dados em Relatórios (CAAB-24).

Repasse operacional completo ficará no bloco próprio do agentcache principal, conforme pedido do
usuário, com releitura sob abertura exclusiva; demais notas serão preservadas. Sem merge, serviços
locais, alteração de outras worktrees ou de fontes transversais.


## Conciliação com Agendamentos e gates locais — 06/10/2026-CLAUDE-Gabriel-Komunick

Autoria CLAUDE, solicitante Gabriel-Komunick (informado no pedido da sessão; consulta GitHub não
refeita por este registro). Os blocos CODEX acima permanecem como histórico. Este bloco registra a
ponta combinada e não substitui o CI 0775bf3, que valida somente a base anterior à conciliação.

### Branch combinada

Em 06/10/2026 foi criada `feature/reports-complete-combined-20261006` a partir de
`feature/reports-complete-20261002` (c8a2614, preservada), com merge, sem conflito textual, de
`origin/feature/scheduling-administrative-20261002` (PR #43, ffd8997; merge 86bf311) e de
`origin/dev` (b80bf6e, #44; merge 9c47c5e, ponta atual). Motivo: c8a2614 usa original_start
(migration 0032), disponível apenas no PR #43. Worktree `.cache/pr-reports-combined-20261006`.

### T042 — conciliação semântica por leitura e verificação

Concluída sem necessidade de correção de código. Conferido:

- runtime.ts registra usersExport, reportExports e schedulingExports (runtime.ts:17); o catálogo
  recusa chave duplicada (catalog.ts:78-85).
- export-screen.tsx mantém initial, initialFilters, renderFilter, context, defaultOrderLabel e
  backLabel, usados por Agendamentos (scheduling/ui/export-screen.tsx:26-31) e por Relatórios
  (reports/ui/report-export-screen.tsx:9-11).
- reports.ts:50 mantém a projeção bookings (JOIN com procedure, LEFT JOIN com profissional,
  at=coalesce(starts_at, original_start, created_at), cinco estados) junto ao gerador agrupado
  (reports.ts:93-154); profissional nulo vira "Não informado".
- report-summary.ts:97 e report-overview-export.ts:245 usam coalesce(starts_at, original_start,
  created_at) com `>= $1` e `< $2`.
- original_start e procedure_id vêm da migration 0032 (0032:26-28 e :39).
- migrations.test.ts:57-62 e scheduling-workflow.test.ts:482 listam 0030–0034 e 0036. A 0035
  pertence ao PR #45 (`feature/roles-default-collaborator-20261005`); essas duas listas precisarão
  incluí-la quando o PR #45 chegar à dev.

Resultado: conciliação por leitura e gates locais concluídos; validação em PostgreSQL pendente no
CI. Isso não aprova T041, T038 nem T039.

### Gates locais na ponta 9c47c5e

Executados sem serviços locais: typecheck (6 projetos) e lint passaram; Prettier dos 100 arquivos
ts/tsx/mjs/json alterados passou (arquivos .sql não verificados); vitest unitário 72 arquivos/595
testes passaram; contratos 24 arquivos/170 testes passaram.

Rodado isoladamente, apps/worker/tests/production-readiness.test.ts falhou em 1 de 14 testes por
timeout de 5000 ms em "runs the actual promotion entry point from the worker directory"; na rodada
completa passou. Não foi comparado com a dev. Registrado como instável por tempo, sem declarar
causa; a rodada isolada não é usada como aprovação.

### Não validado

SQL real em PostgreSQL; migrations 0031–0036 aplicadas; report-exports.test.ts (inclui a regressão
de seis reservas canceladas, linhas ~272–345); E2E; acessibilidade; navegador; T038/C1; revisão
visual; QA humano. A ponta combinada ainda não tem CI. T041, T038 e T039 permanecem abertas.

### Estado e condição para PR

Não declarar prontidão para PR, QA ou deploy. Exportar detalhe agrupado, resumo e evolução sem os
limites antigos (CAAB-44) segue Em Desenvolvimento, bloqueado por Operar aprovação, remarcação e
recuperação de atendimentos (CAAB-40) / PR #43. Só depois que o PR #43 estiver na dev: atualizar esta
branch com `origin/dev`, repetir os gates e, com pedido explícito do usuário, abrir PR para dev com
o título `feat(relatorios): completa exportações agrupadas, resumo e evolução`. Sem push, PR ou
alteração no Jira nesta etapa.

## Revisão independente e correções — 06/10/2026-CLAUDE-Gabriel-Komunick

Autoria CLAUDE, solicitante Gabriel-Komunick (informado no pedido da sessão; consulta GitHub não
refeita por este registro). Exportar detalhe agrupado, resumo e evolução sem os limites antigos
(CAAB-44). Nada acima foi apagado.

### Revisão independente (somente leitura)

Leu: diff integral, sem specs, contra a base de Agendamentos; os módulos de Relatórios e de
exportação citados; o guia de design só por trechos. Não leu: corpos completos de
report-exports.test.ts, reports.spec.ts e reports-page.tsx, nem http.ts, export-authority, writers
csv/xlsx/pdf, migrations e apps/worker. Não executou testes. Não achou bug de SQL nem de
autorização.

### Achados A1–D4 (conferidos por leitura de código nesta etapa)

- A1 CONFIRMADO, aberto: reports.ts:95 agrupa por COALESCE(valor,'Não informado') e rotula por
  COALESCE(NULLIF(valor,''),'Não informado'); '' e NULL geram dois grupos com o rótulo "Não
  informado", igual à tela (herdado do PR40).
- A2 CONFIRMADO, corrigido em 4b0c515: o adaptador da visão geral não convertia falha em erro 422,
  ao contrário de export-adapter.ts. A falha de SQL por período extremo é PLAUSÍVEL (não
  executada). O período anterior dobra o intervalo para trás; o schema agora limita-o ao ano 1000 e
  o fim ao ano 9999.
- A3 PLAUSÍVEL, aberto: report-overview-export.ts chama reportUsageFunnelSql uma vez por etapa (4
  vezes); o statement_timeout de 30 s (exports/query.ts) vira o teto em bases grandes. Sem medição.
- B1 CONFIRMADO, aberto, comportamento seguro: a fonte revogada deixa o catálogo,
  validateExportSelection rejeita o filtro e o erro é EXPORT_CONFIGURATION_INVALID 422 (operação
  `failed`, código EXPORT_FAILED), em vez de PERMISSION_DENIED. Mexer exigiria o núcleo de
  exportação (CAAB-22).
- C1 CONFIRMADO, corrigido em 4b0c515 só no rótulo: o SQL ordena por id interno com prefixos
  coverage, funnel, inventory, metric, notice, series e usage (ORDER BY final de
  report-overview-export.ts), não por seção. Rótulo agora "Identificador interno da seção e do
  indicador". SQL não alterado por não poder ser testado aqui.
- C2 CONFIRMADO, corrigido em 4b0c515: os oito include\_\* tinham só o nome da fonte; agora ficam em
  fieldset/legend "Fontes incluídas", conforme o guia (agrupar escolhas relacionadas).
- C3 PLAUSÍVEL, aberto: o campo notes (até 2000 caracteres) viajar na URL GET e ir para
  log/histórico não foi verificado por esta etapa; é decisão de produto/segurança.
- D1 CONFIRMADO, corrigido em 4b0c515: o teste de revogação entre lotes só usava
  rejects.toThrow().
- D2 CONFIRMADO, corrigido em 4b0c515: sem casos de grupo vazio. residence_state é NOT NULL DEFAULT ''
  (migration 0023); logo só '' é testável em associados; em reservas, a LEFT JOIN gera NULL.
- D3 CONFIRMADO, corrigido em 4b0c515: paridade entre total agrupado e total da consulta da tela.
- D4 CONFIRMADO, aberto: reports.spec.ts não tem teste de revogação (busca textual); outros specs
  não foram verificados.

### Mudanças em 4b0c515

page.tsx (rótulo), overview-export-adapter.ts e seu teste (try/catch 422, período extremo, códigos
esperados), contracts/src/reports.ts e seu teste (limites de período), export-screen.tsx (argumento
opcional `group` de renderFilter), report-export-screen.tsx e globals.css (`.export-sources`),
report-exports.test.ts (revogação entre lotes, UF vazia, reserva sem profissional, paridade). Os
hashes do manifesto dos arquivos listados foram atualizados.

### Gates locais na ponta 4b0c515

Sem serviços locais: typecheck (6 projetos) passou; lint passou; Prettier dos 9 arquivos alterados
passou; vitest unitário 72 arquivos/596 testes passaram; contratos 24 arquivos/171 testes
passaram. O production-readiness do worker não foi rodado isoladamente; passou no conjunto
unitário completo.

### Sem execução e aberto

report-exports.test.ts (os três testes novos e o reforçado), PostgreSQL real, migrations, E2E,
acessibilidade, navegador e revisão visual do fieldset "Fontes incluídas" nos dois temas e no
celular. A ponta combinada continua sem CI. T042 reaberta; T041, T038 e T039 seguem abertas. Não
declarar prontidão para PR, QA ou deploy.

### Revisão externa (PR #46) e correções — CAAB-44-CLAUDE-Gabriel-Komunick

Atualiza B1 e C3 acima, que ficam como histórico da revisão de 06/10/2026.

- C3 corrigido: o link de exportação não leva mais `notes` na URL (2000 caracteres multibyte geram
  cerca de 18 KB e o parser HTTP responde 431). Transferência por `sessionStorage`, texto integral,
  leitura única, prazo de 5 minutos, falha de storage não bloqueia a tela.
- B1 corrigido: `authorizeExport` devolve PERMISSION_DENIED (403) para filtro, coluna ou ordenação
  restritos cuja permissão foi perdida; o estado final da operação é PERMISSION_DENIED. Alteração
  aditiva e pequena no núcleo (CAAB-22), com `catalog.test.ts` novo; os testes dos outros consumidores
  não especificavam 422 para esse cenário e não foram alterados.
- Locais: typecheck, lint, Prettier, 616 unitários e 171 de contrato passaram. Não executados:
  `report-exports.test.ts` (assert atualizado para PERMISSION_DENIED), E2E e navegador. As correções
  ainda não têm CI; o CI 37473938245 (61d361c) é anterior a elas.

### Integração do PR #43 na dev e atualização da branch — CAAB-44-CLAUDE-Gabriel-Komunick

Em 06/10/2026 o PR #43 (Agendamentos) foi integrado na `dev` por squash (ea0bc3b). A branch combinada
passou a conflitar com o squash e foi atualizada com `origin/dev` por merge. Conflitos: as três
fontes de `specs/008-scheduling-management` (checkpoint, tasks, review-fixes), resolvidas com a
versão da `dev`, sem alteração própria desta frente; e `apps/web/modules/exports/ui/export-screen.tsx`,
resolvido mantendo o quarto argumento opcional de `renderFilter` desta entrega. Delta contra a `dev`
agora só de Relatórios e exportação (23 arquivos fora de `specs`). Gates locais depois do merge:
typecheck, lint, Prettier, 616 unitários e 171 de contrato passaram. A condição "depois do #43 na
dev" das notas anteriores está cumprida; o CI desta ponta ainda não existe e T041, T042, T038 e T039
seguem como descritos acima.

### Integração do PR #45 e correções adicionais — CAAB-44-CLAUDE-Gabriel-Komunick

Em 06/10/2026 o PR #45 (cargo base Colaborador, migration 0035) também foi integrado na `dev` (squash
212c4ea) e esta branch foi atualizada por merge sem conflito (00991bf); as listas de migrations de
`packages/db/tests/migrations.test.ts` e `apps/web/tests/integration/scheduling-workflow.test.ts` já
trazem 0035 entre 0034 e 0036, o que torna obsoleta a nota sobre a 0035 pendente acima.

Terceira revisão externa do PR #46, verificada por leitura:
- **403 sem registro de falha, corrigido.** Em `apps/web/modules/exports/http.ts` a falha só era
  gravada para status 422; a seleção com item restrito, que passou a devolver 403, deixou de ser
  gravada. Agora também é gravada quando o código é PERMISSION_DENIED depois de a operação existir
  (origem e CSRF inválidos continuam sem operação e sem registro). Teste de contrato novo em
  `apps/web/tests/contract/exports.test.ts`.
- **Documentação, corrigida.** `research.md` (teto de 50 mil) e `contracts/exports.md` (dependência do
  #43 e do #45) ganharam atualização datada; a mensagem do teto legado em `apps/worker/src/job-state.ts`
  deixou de mandar agrupar e orienta Exportar dados.
- **PDF de Resultados e evolução sem gráfico nem bloco de análise, ABERTO e sem decisão registrada.**
  O download direto gera tabela, com as notas repetidas como coluna de contexto, e a tela ainda diz
  "Incluída no PDF". Depende de decisão de produto sobre o layout do PDF.
- **"Solicitar novamente", observação.** O link só navega para a tela de exportação, sem o formato; as
  notas vão por sessionStorage e, sem permissão da fonte, o destino é 404. Não testado no navegador.
- **security vermelho no CI**, alerta alto do `sharp` 0.35.4 (patch em 0.35.5), igual na `dev`; fora
  do escopo deste PR, aguardando decisão sobre o override em PR próprio.
