# Tasks: Módulos integrados CAAB

**Input**: spec.md, plan.md, research.md, data-model.md, contracts/interfaces.md. **Tests**:
Obrigatórios por risco conforme especificação. Todos os módulos no escopo, com PR por função pronta.
**Status**: US1 integrada pelo PR #11 e Notícias pelo PR #12. Associados (spec 005) possui incremento
implementado com testes locais, mas ainda não está funcionalmente pronto nem autorizado para PR.
Regras institucionais e emissão de
credencial verificável continuam dependências explícitas. US6 ainda não foi implementada.

Este arquivo acompanha o programa. A execução detalhada de cada funcionalidade ocorre no seu spec
próprio; [003-audit-operations/tasks.md](../003-audit-operations/tasks.md) é o primeiro. Antes de
iniciar uma função nova, criar seu spec/plano/tasks e vincular aqui. Mudanças de funções existentes
atualizam seus artefatos: T009/T010 pertencem ao spec 003. Notícias inicia no
[spec 004](../004-news-publishing/tasks.md), sem duplicar infraestrutura da fundação.

## Phase 1 — Setup

- [x] T001 Comparar módulos existentes e novos e registrar responsabilidades em `docs/MODULES.md`.
- [x] T002 Corrigir dependências do legado e atualizar escopo em `docs/PRD.md`, `docs/STACK.md` e
      `specs/002-integrated-modules/spec.md`.
- [x] T003 Registrar desenho, contratos, decisões e validação em
      `specs/002-integrated-modules/plan.md`, `data-model.md`, `research.md`,
      `contracts/interfaces.md` e `quickstart.md`.

## Phase 2 — Fundação reaproveitada

- [x] T004 Mapear guardas de eventos/jobs/exportações e reaproveitamento de auth/files/worker em
      `specs/002-integrated-modules/research.md`.

A fundação 001 já existe. Não refazer contas, arquivos ou fila. A fase seguinte inicia sem esperar
políticas de créditos, cadastro ou atendimento. Lacunas de domínio são tarefas específicas.

## Phase 3 — US1 Auditoria e Processamentos (P1)

Objetivo: área única, sem ampliar acesso. Teste independente: perfis eventos/jobs/ambos/nenhum, URLs
anteriores, exportação e reenvio autorizado.

- [x] T005 [US1] Criar regressões de catálogo/perfis em `apps/web/modules/workspace/areas.test.ts` e
      ajustar jornada em `apps/web/tests/e2e/operations.spec.ts`.
- [x] T006 [US1] Centralizar áreas/visibilidade/destinos em `apps/web/modules/workspace/areas.ts` e
      consumir em `modules/auth/ui/authorized-nav.tsx`, `components/workspace-controls.tsx` e
      `app/(admin)/page.tsx`.
- [x] T007 [US1] Adicionar subnavegação e canônicas em `apps/web/app/(admin)/audit/layout.tsx`,
      `audit/jobs/page.tsx`, `audit/jobs/[jobId]/page.tsx`; redirecionar `operations/jobs` e
      detalhe.
- [x] T008 [US1] Cobrir negações por perfil, compatibilidade e busca sem duplicata em
      `apps/web/tests/e2e/audit.spec.ts`, `operations.spec.ts` e `workspace-experience.spec.ts`.
- [ ] T009 [US1] Validar leitura antes da mutação de reenvio em
      `apps/web/modules/jobs/job-service.ts` e adicionar regressão em
      `apps/web/modules/jobs/job-service.test.ts`.
- [ ] T010 [US1] Evoluir o spec 003 e paginar/filtrar jobs reaproveitando consultas em
      `packages/db/src/repositories/job-execution.ts`, `apps/web/modules/jobs/job-service.ts`,
      `app/(admin)/audit/jobs/page.tsx` e contrato em `packages/contracts/src/jobs.ts`.
- [x] T011 [US1] Executar verificações das mudanças de US1 e registrar resultados em
      `specs/002-integrated-modules/evidence/us1.md`.

## Phase 4 — US2 Conteúdo (P1)

Objetivo: jornada editorial completa. Teste independente: rascunho/prévia/publicação/agendamento,
versão pública preservada, canal autorizado e retry sem duplicação.

- [x] T012 [US2] Concluir integrações de mídia/canais e instalação do CMS em
      `specs/004-news-publishing/contracts/news.md` e `research.md`; acesso editorial confirmado
      pelo usuário. CMS, imagens, destaques e API pública por canal concluídos; leitura aberta
      confirmada. Consumidores externos integram o contrato v1; nenhum embed habilitado.
- [x] T013 [US2] Modelar conteúdo/versões/destaques/publicação e contratos em
      `packages/db/migrations/`, `packages/contracts/src/news.ts` e `apps/web/modules/news/`.
- [x] T014 [US2] Testar publicação, XSS, acesso a rascunhos e arquivos em `apps/web/modules/news/`,
      `apps/web/tests/integration/news.test.ts` e `packages/contracts/tests/news.test.ts`; contratos
      e precondições, persistência/concorrência, APIs pública/privada, conteúdo/mídia e worker
      validados. Evidência completa no spec 004.
- [x] T015 [US2] Implementar editor, mídia, prévia e gestão de versões em
      `apps/web/app/(admin)/news/` e `apps/web/modules/news/ui/` sem duplicar usuários/storage.
      Concluído no spec 004: imagens com descrição/legenda/ordenação, histórico, recuperação e
      Desfazer. E2E novo passou, incluindo acessibilidade mobile.
- [x] T016 [US2] Implementar distribuição/agendamento idempotente em
      `apps/worker/src/jobs/publish-news.ts` e `apps/web/app/api/v1/news/`; validar consumidor
      contratual em `apps/web/tests/e2e/news-publication.spec.ts`; 7 E2E de Notícias passaram.

## Phase 5 — US3 Pessoas (P1)

Objetivo: cadastro/vínculos/análise e situações explicáveis. Teste independente: dependente,
correção documental e avaliação conforme política sem bloqueio geral presumido.

- [ ] T017 [US3] Definir campos/documentos/vínculos/fontes e matriz de elegibilidade em
      `specs/002-integrated-modules/contracts/members.md` com os responsáveis.
- [x] T018 [US3] Modelar beneficiários/vínculos/análises/verificações/situação de credencial em
      `packages/db/migrations/` e `packages/contracts/src/members.ts` com identificadores e
      constraints definidos.
- [x] T019 [US3] Testar duplicidade, concorrência, autorização documental e efeitos de decisões em
      `apps/web/tests/integration/members.test.ts` e `apps/web/modules/members/http/routes.test.ts`.
- [x] T020 [US3] Implementar serviços/API/cadastro/fila documental em `apps/web/modules/members/`,
      `app/api/v1/members/` e `app/(admin)/members/`, reutilizando files/audit.
- [x] T021 [US3] Validar correção pontual, vínculo e situações independentes em
      `apps/web/tests/e2e/members.spec.ts`.

Execução detalhada e evidências: [spec 005](../005-members-management/tasks.md). T017 continua
pendente quanto às políticas institucionais; o incremento entregue registra decisões manuais com
fonte e motivo, sem inventar a matriz. Credencial nesta entrega é situação/validade, sem emissão.

## Phase 6 — US4 Atendimentos (P2)

Objetivo: oferta e operação sem conflitos. Teste independente: concorrência pela capacidade,
exceções, remarcação/desfecho e avaliação preservada.

- [ ] T022 [US4] Definir oferta/capacidade/jornada/cancelamento/falta e integração de elegibilidade
      em `specs/002-integrated-modules/contracts/scheduling.md`.
- [ ] T023 [US4] Modelar unidades próprias/ofertas/recursos/disponibilidade/reservas/eventos em
      `packages/db/migrations/` e `packages/contracts/src/scheduling.ts`.
- [ ] T024 [US4] Implementar testes de reserva concorrente/retry/exceções em
      `apps/web/modules/scheduling/scheduling-service.test.ts` com PostgreSQL real.
- [ ] T025 [US4] Implementar disponibilidade e comandos transacionais em
      `apps/web/modules/scheduling/` e `app/api/v1/scheduling/`.
- [ ] T026 [US4] Implementar operação diária/configuração/agenda/avaliação em
      `apps/web/app/(admin)/scheduling/` e validar em `apps/web/tests/e2e/scheduling.spec.ts`.

## Phase 7 — US5 Benefícios (P2)

Objetivo: parceiros/contratos/ofertas confiáveis. Teste independente: vigência, ocultação e
moderação.

- [ ] T027 [US5] Definir condições/exposição/moderação e contrato em
      `specs/002-integrated-modules/contracts/partners.md`.
- [ ] T028 [US5] Modelar parceiro/unidades/contratos/ofertas/categorias/avaliações em
      `packages/db/migrations/` e `packages/contracts/src/partners.ts`.
- [ ] T029 [US5] Implementar testes de vigência/autorização/moderação em
      `apps/web/modules/partners/partner-service.test.ts`.
- [ ] T030 [US5] Implementar serviços/API/UI usando arquivos existentes em
      `apps/web/modules/partners/`, `app/api/v1/partners/` e `app/(admin)/partners/`.
- [ ] T031 [US5] Validar oferta, contrato, ocultação e opinião preservada em
      `apps/web/tests/e2e/partners.spec.ts`.

## Phase 8 — US6 Acesso existente; cadastro de equipe retirado do escopo

Decisão do usuário em 11/09/2026: Colaboradores no legado corresponde a Usuários.
Parceiros são externos; não haverá módulo separado de equipe interna/RH.

- T032–T035: **canceladas por alteração de escopo**, não implementadas.
- Contas, permissões, sessões e recuperação permanecem nos recursos existentes.
- Dependências de US6 nas fases seguintes significam reutilizar Usuários/RBAC,
  sem aguardar ou criar cadastro funcional, vínculo colaborador-conta ou módulo employees.

## Phase 9 — US7 Mensagens (P2)

Objetivo: público correto e entrega rastreável. Teste independente: exclusão, falha/retry e estados.

- [ ] T036 [US7] Definir público/preferências/canais/contratos e política de envio em
      `specs/002-integrated-modules/contracts/messaging.md`.
- [ ] T037 [US7] Modelar campanha/modelo/público/execução/entrega em `packages/db/migrations/` e
      `packages/contracts/src/messages.ts`.
- [ ] T038 [US7] Implementar testes de exclusão/idempotência/eventos duplicados em
      `apps/web/modules/messaging/messaging-service.test.ts`.
- [ ] T039 [US7] Implementar serviços/adaptadores/worker em `apps/web/modules/messaging/`,
      `app/api/v1/messages/` e `apps/worker/src/jobs/send-message.ts`.
- [ ] T040 [US7] Implementar prévia/programação/acompanhamento em `apps/web/app/(admin)/messages/` e
      validar em `apps/web/tests/e2e/messages.spec.ts`.

## Phase 10 — US8 Créditos (P2)

Objetivo: programa configurado e extrato consistente. Teste independente: concessão/lote/correção
sob política explícita, sem duplicidade nem edição direta de saldo.

- [ ] T041 [US8] Definir finalidade/unidade/conversão/limites/validade/uso/correção/aprovador em
      `specs/002-integrated-modules/contracts/credits.md`.
- [ ] T042 [US8] Modelar política/conta/lote/lançamento/correção em `packages/db/migrations/` e
      `packages/contracts/src/credits.ts`.
- [ ] T043 [US8] Testar concorrência/idempotência/correção/ausência de política em
      `apps/web/modules/credits/credit-service.test.ts`.
- [ ] T044 [US8] Implementar concessões/extrato/API/worker/UI em `apps/web/modules/credits/`,
      `app/api/v1/credits/`, `app/(admin)/credits/` e `apps/worker/src/jobs/grant-credits.ts`.
- [ ] T045 [US8] Validar lote e correção referenciada em `apps/web/tests/e2e/credits.spec.ts`.

## Phase 11 — US9 Portal (P3)

Objetivo: solicitações no escopo do parceiro. Teste independente: organizações A/B e QR sem
liquidação presumida.

- [ ] T046 [US9] Definir tarefas/estados da solicitação e vínculo com créditos em
      `specs/002-integrated-modules/contracts/partner-portal.md`.
- [ ] T047 [US9] Modelar vínculo conta-organização/solicitação/QR em `packages/db/migrations/` e
      `packages/contracts/src/partner-requests.ts`.
- [ ] T048 [US9] Testar isolamento inclusive arquivos/exportações em
      `apps/web/modules/partner-portal/partner-portal.test.ts`.
- [ ] T049 [US9] Implementar serviços/API/layout/UI restritos em `apps/web/modules/partner-portal/`,
      `app/api/v1/partner-requests/` e `app/(partner)/`.
- [ ] T050 [US9] Validar solicitações/QR e isolamento A/B em
      `apps/web/tests/e2e/partner-portal.spec.ts`.

## Phase 12 — US10 Meu trabalho e relatórios (P3)

Objetivo: pendências e informação útil dos domínios. Teste independente: dados conhecidos, filtros e
escopos.

- [ ] T051 [US10] Definir indicadores/relatórios/campos/público em
      `specs/002-integrated-modules/contracts/reports.md`.
- [ ] T052 [US10] Implementar consultas e exportações reutilizando jobs/files em
      `apps/web/modules/reports/`, `app/api/v1/reports/` e `apps/worker/src/jobs/export-report.ts`.
- [ ] T053 [US10] Implementar pendências/relatórios em `apps/web/app/(admin)/page.tsx` e
      `app/(admin)/reports/`, sem métricas fictícias.
- [ ] T054 [US10] Validar filtros, contagens e exportações autorizadas em
      `apps/web/tests/e2e/reports.spec.ts`.

## Phase 13 — Validação integrada

- [ ] T055 Completar matriz de permissões/contratos OpenAPI e documentação em
      `packages/contracts/src/openapi.ts`, `docs/MODULES.md` e `docs/PRD.md`.
- [ ] T056 Validar jornadas cruzadas, acessibilidade, banco/concorrência, segurança e build;
      registrar resultados em `specs/002-integrated-modules/evidence/integrated.md`.
- [ ] T057 Conferir todas as histórias completas e conferir os PRs por função concluída para dev,
      com riscos/rollback e pendências T089/T095 explícitas em
      `specs/002-integrated-modules/evidence/delivery.md`.

## Dependencies & Execution Order

T001–T004 → US1. US2/US3/US5/US6 usam fundação e suas decisões próprias. US4 depende de US3 e
cadastros/oferta da própria história; US7 depende de contatos e eventos (US2/US3/US5); US8 depende
de US3 e, para parceiros, US5; US9 depende de US5/US6 e só depende de US8 se a política vincular
solicitação a crédito. US10 depende dos domínios; T055–T057 dependem de todas as histórias.

## Oportunidades de trabalho independente

Execução atual é sequencial. Se houver autorização futura de trabalho paralelo, modelos e testes
podem ser preparados independentemente por US2/US3/US5/US6 depois dos contratos; US4 testes de
concorrência versus UI após serviço; US7 adaptador versus editor após contrato; US8 testes versus UI
após contrato; US9 isolamento versus layout; US10 consultas versus apresentação. US1 catálogo e
rotas se encontram nos testes. Migrations e catálogo compartilhados exigem coordenação e integração
sequencial. Essas possibilidades não são instrução para abrir PRs ou criar agentes adicionais.

## Implementation Strategy

Incrementos locais completos, começando por US1. O usuário pediu planejamento de todos os módulos e
início imediato, não conclusão instantânea nem telas demonstrativas. Marcar [x] apenas trabalho
executado/verificado. Manter decisões de negócio pendentes visíveis, avançando nas tarefas
independentes.
