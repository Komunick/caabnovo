# Tasks: Agendamentos — primeira entrega funcional

Data: 15/09/2026. Branch feature/scheduling-management-20260915.
Entrada: spec.md, plan.md, research.md, data-model.md e contracts/admin.md.
**T001–T020 autorizadas em 15/09/2026. Implementação e validação concluídas; evidências em evidence/release-review.md.**
Testes transacionais reunidos em apps/web/tests/integration/scheduling.test.ts para
compartilhar o banco descartável; jornadas US1/US2 em tests/e2e/scheduling.spec.ts.
Testes exigidos pelos cenários da spec e pelo fluxo de entrega, especialmente agenda,
dados, autorização e acessibilidade. Etapas do produto estão em roadmap.md.

## Phase 1 — Setup

## Calendário administrativo — autorizado em 18/09/2026

Decisão atual supera a prioridade anterior de T022. Continuidade na branch ativa
`feature/reports-analytics-20260918`; detalhes para retomada em checkpoint.md.

- [x] CAL01 Registrar escopo, pesquisa oficial, contratos, plano e estratégia de validação.
- [x] CAL02 Escrever testes de intervalo/limites/filtros/autorização e consulta de calendário.
- [x] CAL03 Implementar GET calendar limitado e autenticado, preservando listagem diária.
- [x] CAL04 Integrar FullCalendar mês/semana/dia, URL/filtros, tokens, fuso e estados acessíveis.
- [x] CAL05 Cobrir jornada real de reservas, recarga/navegação, mobile/temas e fuso no E2E.
- [ ] CAL06 Validar conjunto, revisar evidências visuais, atualizar docs/PR34 e conferir dev.

Não marcar CAL06 antes de verificações reais; atualizar checkpoint a cada fase.

- [x] T001 Conferir base/branch sem PR e validar o recorte/hipóteses com a revisão do planejamento em specs/008-scheduling-management/spec.md antes do código.
- [x] T002 Conciliar contratos com os padrões existentes em specs/008-scheduling-management/contracts/admin.md e definir próximo número de migration livre em packages/db/migrations/.

## Phase 2 — Foundational

- [x] T003 Criar migration aditiva de catálogo, horários, reservas, histórico e idempotência em packages/db/migrations/, conforme specs/008-scheduling-management/data-model.md; validar exclusão temporal e FKs.
- [x] T004 Definir contratos/validações de payload, paginação, versões, erros e estados em packages/contracts/src/scheduling.ts e exportar em packages/contracts/src/index.ts.
- [x] T005 Implementar guarda com acesso administrativo válido e proteção de mutações em apps/web/modules/scheduling/http/; sem concessões extras; testes em apps/web/tests/integration/scheduling-auth.test.ts.
- [x] T006 Implementar protocolo transacional de configurações/beneficiários, incluindo bloqueio e mudança de vínculos em apps/web/modules/members/ e packages/db/src/repositories/members.ts, com regressões concorrentes em apps/web/tests/integration/scheduling-eligibility.test.ts.

## Phase 3 — US1: configurar e reservar

Objetivo: cadastro mínimo e primeira reserva persistida. Teste independente:
catálogo vazio → configurar no painel → reservar → consultar após recarga.

- [x] T007 [P] [US1] Criar testes dos contratos e horários semanais/almoço em packages/contracts/src/scheduling.test.ts e apps/web/modules/scheduling/availability.test.ts antes dos serviços.
- [x] T008 [P] [US1] Criar testes de 20 reservas concorrentes, retry, limites adjacentes e corrida com alteração de expediente em apps/web/tests/integration/scheduling-create.test.ts.
- [x] T009 [US1] Implementar catálogo, habilitações, horários e proteção de alterações com reservas futuras em apps/web/modules/scheduling/catalog-service.ts e hours-service.ts.
- [x] T010 [US1] Implementar disponibilidade, busca mínima de beneficiários e criação transacional/idempotente em apps/web/modules/scheduling/availability-service.ts, beneficiary-service.ts e booking-service.ts.
- [x] T011 [US1] Expor catálogo, horários, vagas, beneficiários e criação autenticada em apps/web/app/api/v1/scheduling/ conforme contracts/admin.md.
- [x] T012 [US1] Criar formulários de oferta/horários e reserva com seleção de vaga em apps/web/modules/scheduling/ui/ e apps/web/app/(admin)/scheduling/; não exigir cadastro via banco.
- [x] T013 [US1] Validar jornada sintética de configuração/criação/recarga e erros em apps/web/tests/e2e/scheduling-create.spec.ts.

## Phase 4 — US2: consultar, remarcar e cancelar

Objetivo: operação da reserva existente. Teste independente com fixture sintética:
localizar → remarcar → conferir histórico → cancelar e liberar horário.

- [x] T014 [P] [US2] Criar testes de rollback da remarcação, versão desatualizada, idempotência/cancelamento e preservação histórica em apps/web/tests/integration/scheduling-manage.test.ts.
- [x] T015 [US2] Implementar listagem/detalhes, remarcação atômica e cancelamento em apps/web/modules/scheduling/booking-service.ts e apps/web/app/api/v1/scheduling/bookings/.
- [x] T016 [US2] Implementar lista diária paginada, filtros na URL, detalhes, ações e confirmação em apps/web/modules/scheduling/ui/ e apps/web/app/(admin)/scheduling/.
- [x] T017 [US2] Integrar navegação/busca e eventos humanos de auditoria em apps/web/modules/workspace/ e apps/web/modules/audit/, sem liberar dados de outros módulos.
- [x] T018 [US2] Validar gestão por teclado, mobile claro/escuro e estados vazios/erro em apps/web/tests/e2e/scheduling.spec.ts; capturas sintéticas em specs/008-scheduling-management/evidence/.

## Phase 5 — Polish e saída da etapa 1

- [x] T019 Executar roteiro e gates do CI (contratos, integração, E2E, a11y, lint, tipos, build e segurança), registrar resultados reais em specs/008-scheduling-management/evidence/ e atualizar quickstart.md.
- [x] T020 Conferir limites da etapa 1, ausência de chamadas a Cal.com/legado/canais e integridade do rollback; registrar revisão em specs/008-scheduling-management/evidence/release-review.md antes de preparar PR.

## Phase 6 — US3: planejamento dos incrementos da etapa 2

**Somente preparação posterior à validação da etapa 1, não execução automática de funcionalidades.**
Teste independente de cada incremento: critérios da linha correspondente em roadmap.md
devem virar cenários concretos e tarefas antes da implementação.

- [ ] T022 [US3] Primeiro após T019–T020: detalhar 2C app/site, identidade, contratos versionados e plano de transição/migração do legado em specs/008-scheduling-management/contracts/channels.md, coordenado com a spec própria da primeira interface do usuário no app/site (UI01/UI02 do programa 002).
- [ ] T021 [US3] Após a primeira interface app/site, detalhar 2A horários completos e 2B estados/operação a partir do inventário em specs/008-scheduling-management/spec.md e contracts/; reconciliar políticas antigas com decisões atuais.
- [ ] T023 [US3] Detalhar 2D avaliações e 2E comunicações/limites em specs/008-scheduling-management/spec.md e contracts/, após validar ações, provedores e políticas.
- [ ] T024 [US3] Criar matriz de equivalência validada com o legado em specs/008-scheduling-management/legacy-parity.md; manter sugestões novas separadas em roadmap.md.

## Dependencies & Execution Order

T001–T002 → T003–T006 → US1 (T007–T013) → US2 (T014–T018) → T019–T020.
US2 pode ser testada com fixture de reserva, mas sua entrega depende dos serviços US1.
Primeira entrega contratada contém US1 + US2; não encerrar após mostrar apenas o catálogo.
T019–T020 → UI01/T022 → UI02 (primeira interface app/site) → demais incrementos.
T021–T024 são detalhamento posterior; T022 tem prioridade confirmada pelo usuário em
15/09/2026. Seus resultados gerarão tarefas próprias para 2A–2E, sem duplicar a spec
da interface do usuário. Manter os identificadores existentes para rastreabilidade.
Nenhuma tarefa da etapa 3 enquanto o usuário não selecionar sugestões.

## Parallel Opportunities

Depois da fundação, T007 e T008 trabalham em arquivos distintos. Em US2, T014 pode
ser preparado independentemente da UI, depois de definido o contrato. T021–T024 são
sequenciais para evitar concorrência nos mesmos documentos. Paralelismo é possibilidade
técnica; não exige múltiplos agentes nem muda a política de branch.

## Implementation Strategy

Uma entrega pequena e completa primeiro; testes de invariantes antes dos serviços;
revisão do resultado antes de ampliar. Preservar dados, histórico e disponibilidade
ao adicionar funcionalidades. Não usar demo, fixture ou página vazia como entrega.

## Correção UI/UX e inclusão — 16/09/2026

- [x] UI01 Comparar padrão local e registrar pesquisa, requisitos e plano da correção na nova branch.
- [x] UI02 Padronizar cabeçalho/abas e expor as inclusões específicas por cadastro.
- [x] UI03 Padronizar catálogo, agenda, formulários, horários, detalhes e estados vazios preservando operações reais.
- [x] UI04 Validar jornada de inclusão, edição, filtros/URL, teclado/390px/temas e contraste no CI; revisar capturas.
- [x] UI05 Concluir evidências e abrir novo PR para dev após checks aprovados; não aprovar/integrar.

Evidências desta correção: [validação e revisão visual](evidence/ui-2026-09-16.md).


## Navegação sem perda de edição — 16/09/2026

- [x] DP01 Integrar a preservação compartilhada às abas e formulários desta função.
- [x] DP02 Validar retorno, sucesso, cancelamento e isolamento; registrar [evidências](evidence/drafts-2026-09-16.md) no PR.
