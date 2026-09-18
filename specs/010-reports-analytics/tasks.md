# Tasks: Relatórios e Análises

## Setup e fundação

- [x] T001 Especificar/pesquisar em specs/010-reports-analytics/{spec,plan,research}.md.
- [x] T002 Criar contratos e testes em packages/contracts/src/reports.ts e tests/reports.test.ts.
- [x] T003 Criar persistência e permissões em packages/db/migrations/0024_reports.sql.

## US1 — Resumo gerencial

Teste independente: totais e comparação conhecidos, mesmos filtros no PDF/CSV.

- [x] T004 [US1] Implementar consultas autorizadas em packages/db/src/repositories/reports.ts.
- [x] T005 [US1] Implementar resumo e série em packages/db/src/repositories/report-summary.ts.
- [x] T006 [US1] Criar HTTP/navegação em apps/web/modules/reports/http.ts e app/(admin)/reports/page.tsx.
- [x] T007 [US1] Criar aba gerencial em apps/web/modules/reports/ui/reports-page.tsx.

## US2 — Análise detalhada e exportações

Teste independente: filtro/coluna/grupo, consulta pessoal versionada e arquivo completo.

- [x] T008 [US2] Persistir consultas/exportações em packages/db/src/repositories/report-storage.ts.
- [x] T009 [US2] Gerar PDF/XLSX/CSV no worker em apps/worker/src/jobs/report-export.ts.
- [x] T010 [US2] Reautorizar downloads e bloquear bypass em apps/web/modules/reports/http.ts e modules/files/file-service.ts.
- [x] T011 [US2] Criar detalhes, consultas e exportações em apps/web/modules/reports/ui/reports-page.tsx.

## US3 — Resultados e evolução

Teste independente: mesma base do resumo, gráfico acessível, comentários e PDF.

- [x] T012 [US3] Criar visão executiva/modo apresentação em apps/web/modules/reports/ui/reports-page.tsx.

## US4 — Acessos e uso

Teste independente: navegação SPA, retry sem duplicação, fonte sem dados e rejeição de coleta inválida.

- [x] T013 [US4] Criar coletor e métricas em packages/db/src/repositories/report-analytics.ts.
- [x] T014 [US4] Instrumentar painel e integração externa em apps/web/modules/reports/collector.tsx e ingest.ts.
- [x] T015 [US4] Expor atividade/jornadas/cobertura em apps/web/modules/reports/ui/reports-page.tsx.

## Validação e entrega

- [x] T016 Validar banco/arquivos/autorização em apps/web/tests/integration/reports.test.ts (inclui o worker real).
- [x] T017 Validar navegador, estados vazios, mobile, temas e acessibilidade em apps/web/tests/e2e/reports.spec.ts.
- [x] T018 Registrar exportação transversal em specs/002-integrated-modules/plan.md e tasks.md.
- [x] T019 Executar gates/CI e revisar artefatos em specs/010-reports-analytics/evidence.md.
- [x] T020 Abrir PR para dev com evidências e rollback, sem merge, e sincronizar principal.

## Dependências e execução

T001 → T002/T003 → T004/T005 → T006/T007. T008 → T009/T010/T011.
US3 reutiliza resumo/exportador. T013 → T014/T015. T016/T017 → T019/T020.
Contratos e pesquisa independentes; exemplos de trabalho paralelo: testes de formato
US2 e estilos US1; não há delegação de implementação nesta execução. Primeiro
incremento verificável é US1; entrega completa inclui US1–US4, sem parar no MVP.
