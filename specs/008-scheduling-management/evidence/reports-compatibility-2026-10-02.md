# Compatibilidade Agendamentos e Relatórios — 02/10/2026

Autoria: revisão-CODEX-SOLICITANTE_NAO_VERIFICADO. Identidade consultada anteriormente nesta sessão:
GitHub HTTP401. Escopo explícito: revisão e correções no lado de Agendamentos; worktree de
Relatórios somente leitura. Sem copiar sua implementação, integrar branches, iniciar serviços ou
operar WSL.

## Versões comparadas

- Agendamentos: `.cache/pr-scheduling-research-20260923`, branch
  `codex/scheduling-market-research-20260923`, HEAD `4e9abac729418453ed20bbef466cf1ded39711c7`, com
  documentos locais anteriores preservados. Delta deste recorte: uma consulta em
  `packages/db/src/repositories/report-summary.ts` e extensão de regressão em
  `apps/web/tests/integration/scheduling-workflow.test.ts`.
- Relatórios: `.cache/pr-reports-complete-20261002`, branch `feature/reports-complete-20261002`,
  HEAD `748539d28ec7c94af5ff3ca7a37c46c73ae102e4`, com implementação local não commitada de Exportar
  o conjunto completo de dados em Relatórios (CAAB-24), especialmente Exportar detalhe agrupado,
  resumo e evolução sem os limites antigos (CAAB-44).
- [Manifesto comparativo](reports-compatibility-2026-10-02.json): horários UTC, HEAD, status Git e
  SHA-256 por arquivo no início/fim da inspeção. Os 13 caminhos amostrados de Relatórios não mudaram
  durante a comparação; o status final passou a incluir novo manifesto de evidências da outra
  instância. Essa estabilidade é limitada à janela registrada, não congela a entrega concorrente.

## Achados e responsabilidade

1. **Registry:** Agendamentos registra `usersExport`, `...reportExports` e `...schedulingExports`.
   Relatórios registra somente os dois primeiros, pois parte da dev anterior à integração de
   Agendamentos. É uma diferença esperada de conciliação, não motivo para copiar sua implementação.
   Os novos adapters agrupados/summary/executive chegam pela expansão de `reportExports` da frente
   de Relatórios; os quatro datasets de Agendamentos devem permanecer registrados.
2. **ExportScreen:** arquivos byte a byte iguais nos dois snapshots. Mantêm `initialFilters`,
   `renderFilter`, `initial`, `context`, `defaultOrderLabel` e `backLabel`. `initial.filters` tem
   precedência quando informado; Agendamentos usa `initialFilters` e seletores de IDs, Relatórios
   usa `initial` e controles próprios para agrupamento, fontes, ambiente e notas. Hook que retorna
   null/undefined usa o campo padrão. Não há incompatibilidade comprovada nem alteração de UI.
3. **Fonte bookings:** Agendamentos já usa `procedure_id` direto, LEFT JOIN de profissional e
   `coalesce(starts_at,original_start,created_at)` como referência temporal. Representa os cinco
   estados explicitamente. Relatórios ainda usa INNER JOIN de assignment/profissional, starts_at
   como data e ELSE Cancelado. Ao combinar com migrations 0032–0034, isso perderia reservas de
   capacidade e classificaria pedidos/recuperações como cancelamento. Preservar a projeção de
   Agendamentos na futura conciliação. Detalhe, grupos, indicadores e séries reutilizam essa fonte.
4. **Defeito corrigido de responsabilidade de Agendamentos:** o aviso de reservas canceladas em
   `report-summary.ts` ainda filtrava exclusivamente starts_at. O comando provider-unavailability
   remove o intervalo e preserva original_start; cancelar awaiting_new_time mantém starts_at nulo.
   Assim a mesma reserva aparecia no detalhe e nos indicadores pela data de referência, mas não no
   aviso de cancelamento. O filtro agora usa o mesmo coalesce, nos dois limites do período. Não
   altera estados, reservas, profissional, datas persistidas, permissões ou migrations.
5. **Ajuste pertencente a Relatórios:** seu novo `report-overview-export.ts`, linha lógica
   notice:cancelled, repete o filtro por starts_at. Aplicar ali o mesmo coalesce nos dois limites
   para que resumo/evolução exportados concordem com o aviso da tela após conciliar. Não foi editado
   nem copiado para esta branch.

## Filtros, autorização e regras de exportação

Inspeção dos catálogos, páginas de entrada, adapters e núcleo confirma compatibilidade estrutural:
Agendamentos exige scheduling:read + exports:generate sem conceder escrita. Relatórios exige
reports:read + exports:generate e leitura da fonte; bookings/bookingsGrouped dependem de
scheduling:read. Resumo/evolução declara permission no filtro include_bookings; o catálogo o oculta
sem acesso e validateExportSelection recusa filtros fora do catálogo autorizado. Ausência da opção
não inclui a fonte. Reautorização corrente usa o mesmo catálogo antes/entre lotes e no fluxo final.

IDs/filtros/colunas/ordem passam pelas allowlists e validação dos adapters. Filtros textuais de
Relatórios continuam parametrizados e escapados, status é igualdade de rótulo; o agrupamento usa
campos do catálogo. Não introduzir members:read para acesso aos dados mínimos da agenda. A data de
referência de Relatórios não é horário confirmado: exportação scheduling.bookings conserva
startsAt/endsAt nulos. XLSX/CSV/PDF, seleção/ordem de colunas, cursores e ausência de teto funcional
permanecem no núcleo existente. Essas conclusões estáticas não validam execução SQL nem revogação
concorrente no banco.

## Instruções de conciliação por arquivo

| Arquivo                                                                 | Resultado esperado                                                                                                                                                                       |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| apps/web/modules/exports/runtime.ts                                     | Manter import schedulingExports e registry com usersExport, reportExports e schedulingExports. Não substituir pelo arquivo da base de Relatórios.                                        |
| apps/web/modules/exports/ui/export-screen.tsx                           | Mesmo conteúdo nos snapshots; preservar os parâmetros acima e hooks das duas telas.                                                                                                      |
| packages/db/src/repositories/reports.ts                                 | Manter reportSources.bookings de Agendamentos e incorporar, pela frente responsável, ReportExportQuery.groupBy e reportExportSql agrupado de Relatórios. Não substituir arquivo inteiro. |
| packages/db/src/repositories/report-summary.ts                          | Preservar a extração de reportInventory/reportMetricLabel/reportMetricDefinition de Relatórios e aplicar a correção do filtro de cancelamentos deste recorte.                            |
| packages/db/src/repositories/report-overview-export.ts                  | Responsabilidade de Relatórios: notice:cancelled deve usar coalesce(starts_at,original_start,created_at) >= $1 e < $2, mantendo include_bookings/autorização e demais filtros.           |
| apps/web/modules/reports/export-adapter.ts e overview-export-adapter.ts | Preservar novos datasets, permissões de fonte, allowlists e parâmetros groupBy/include_bookings. Nenhuma cópia realizada nesta entrega.                                                  |
| apps/web/tests/integration/scheduling-workflow.test.ts                  | Preservar regressão estendida de cancelamento sem horário, fora do período e sem acesso à fonte; executar com banco descartável na retomada.                                             |

Antes da conciliação real, reconferir os hashes/estado de Relatórios porque sua instância permanece
ativa. Revalidar agrupamento por estado/profissional nulo e datas de referência, com quantidade e
conjunto completo conhecidos. Não tratar autorização de revisão como autorização de integração.

## Validações realizadas e limites

- **107/107 testes em 12 arquivos**, unitários/contratos, 35,00 s. Comando:
  `node node_modules/vitest/vitest.mjs run --project unit --project contract --maxWorkers=1 apps/web/modules/exports apps/web/modules/reports apps/web/modules/scheduling/export-adapter.test.ts apps/web/modules/users/export-adapter.test.ts packages/contracts/tests/exports.test.ts packages/contracts/tests/reports.test.ts apps/web/tests/contract/exports.test.ts`.
  Log `.cache/compatibility-tests.log`; NODE_OPTIONS heap384/ipv4first. Testes executados na
  worktree de Agendamentos, não representam execução da implementação agrupada/overview da outra
  branch.
- **TypeScript aprovado:**
  `node node_modules/typescript/bin/tsc --noEmit -p apps/web/tsconfig.json`, heap1024, log
  `.cache/compatibility-typecheck.log`.
- **ESLint e Prettier dos dois arquivos de código aprovados.** Revisão do diff delimita uma consulta
  alterada e extensão do cenário de integração existente. Nenhum teste artificial de string SQL ou
  mock foi criado para alegar validação de PostgreSQL.
- **Regressão PostgreSQL acrescentada, não executada:** caso já existente de reserva de capacidade
  passa por indisponibilidade, cancela mantendo horário nulo, exige incremento do aviso de
  cancelamento no período, exclusão fora dele e ausência de aviso sem scheduling:read.
- **T107 continua aberto:** integrações PostgreSQL, concorrência, execução dos três formatos com
  dados reais sintéticos, jornadas de navegador, revisão visual e compatibilidade da futura versão
  combinada permanecem pendentes. Não houve tentativa de WSL, serviços ou QA humano neste recorte.

Os 727 testes e build anteriormente aprovados pertencem ao código de 4e9abac. Após esta alteração,
não comprovam o novo filtro SQL nem a regressão ampliada. As 107 verificações e tipos acima cobrem
somente a versão local descrita; build completo não foi repetido e a correção SQL não foi
homologada. Migrations0031–0034 e scheduling:review_absences permanecem intactos.
Integração/homologação de e-mail segue adiada em Entregar os avisos operacionais de Agendamentos por
e-mail (CAAB-42) e Homologar os avisos operacionais após disponibilizar o serviço de e-mail
(CAAB-45), dependentes de Serviço de e-mail transacional e definição da caixa de entrada (CAAB-2).
Sem commit, push, PR ou integração neste recorte.

Jira atualizado por acréscimo de comentários em Agendamentos (CAAB-37) e Exportar detalhe agrupado,
resumo e evolução sem os limites antigos (CAAB-44), sem transição ou remoção de informações.
