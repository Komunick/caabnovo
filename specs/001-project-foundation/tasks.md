---

description: "Dependency-ordered implementation tasks for the CAAB Foundation"
---

# Tasks: Fundação do Sistema CAAB

**Input**: Design documents from `/specs/001-project-foundation/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Obrigatórios pela constituição, FR-027 e critérios SC-001–SC-010. Em cada história, criar
os testes indicados e confirmar a falha esperada antes da implementação.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated as
an independent increment after the shared foundation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode executar em paralelo porque usa arquivos distintos e não depende de tarefa incompleta.
- **[Story]**: História de usuário atendida (`US1` a `US5`).
- Todos os itens incluem caminhos exatos para implementação ou evidência.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Inicializar repositório, monorepo, ferramentas e governança obrigatória.

- [ ] T001 Inicializar o repositório Git em `.git/`, criar `main` e `dev` com histórico comum e criar a branch curta `feature/project-foundation` a partir de `dev`
- [ ] T002 Criar o workspace pnpm e fixar Node.js 24 LTS em `package.json`, `pnpm-workspace.yaml`, `.nvmrc` e `pnpm-lock.yaml`
- [ ] T003 Criar os manifests mínimos da aplicação, worker e packages em `apps/web/package.json`, `apps/worker/package.json`, `packages/db/package.json`, `packages/contracts/package.json` e `packages/config/package.json`
- [ ] T004 [P] Configurar TypeScript strict compartilhado em `packages/config/tsconfig.base.json`, `apps/web/tsconfig.json`, `apps/worker/tsconfig.json`, `packages/db/tsconfig.json` e `packages/contracts/tsconfig.json`
- [ ] T005 [P] Configurar Prettier e ESLint com fronteiras de módulo e imports server-only em `prettier.config.mjs`, `eslint.config.mjs` e `packages/config/eslint/boundaries.mjs`
- [ ] T006 [P] Definir configuração tipada e exemplo sem segredos em `.env.example`, `packages/config/src/env.ts` e `packages/config/src/index.ts`
- [ ] T007 [P] Criar serviços locais isolados em `compose.yaml`, `infra/postgres/init.sql`, `infra/storage/init.sh`, `infra/clamav/clamd.conf` e `infra/observability/otel-collector.yaml`
- [ ] T008 [P] Criar CODEOWNERS e templates de PR com segurança, permissões, migrations e rollback em `.github/CODEOWNERS` e `.github/pull_request_template.md`
- [ ] T009 Definir rulesets aplicáveis para `dev` e `main`, incluindo PR obrigatório, checks, bloqueio de push/force-push e promoção humana `dev -> main`, em `infra/github/rulesets/dev.json`, `infra/github/rulesets/main.json` e `infra/github/apply-rulesets.ps1`

**Checkpoint**: workspace instalável, serviços locais definidos e governança Git reproduzível.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infraestrutura comum obrigatória antes de qualquer história de usuário.

**⚠️ CRITICAL**: Nenhuma história começa até esta fase concluir e seus testes-base passarem.

- [ ] T010 Implementar conexão única e runner de migrations em `packages/db/src/client.ts`, `packages/db/src/migrate.ts` e `packages/db/src/index.ts`
- [ ] T011 Criar migration inicial de extensões, enums e identidades em `packages/db/migrations/0001_identity.sql` conforme `data-model.md`
- [ ] T012 Criar migration RBAC para `role`, `permission`, `role_permission` e `user_role` em `packages/db/migrations/0002_rbac.sql`
- [ ] T013 Criar migrations append-only de auditoria/segurança e privilégios runtime em `packages/db/migrations/0003_audit.sql` e `packages/db/migrations/0004_runtime_privileges.sql`
- [ ] T014 Criar migration de arquivos, idempotência, jobs e heartbeat em `packages/db/migrations/0005_operations.sql`
- [ ] T015 [P] Implementar schemas compartilhados de erro, paginação, IDs e correlação em `packages/contracts/src/common.ts`, `packages/contracts/src/errors.ts` e `packages/contracts/src/index.ts`
- [ ] T016 [P] Implementar gerador e validador determinístico OpenAPI 3.1.1 em `packages/contracts/src/openapi.ts`, `packages/contracts/scripts/generate-openapi.ts` e `packages/contracts/tests/openapi.test.ts`
- [ ] T017 Implementar contexto server-only de request, correlation ID e ator em `apps/web/modules/shared/request-context.ts` e `apps/worker/src/request-context.ts`
- [ ] T018 [P] Implementar logs JSON com allowlist/redação de senhas, tokens, cookies e PII em `apps/web/modules/shared/logger.ts`, `apps/worker/src/logger.ts` e `packages/config/src/redaction.ts`
- [ ] T019 Implementar writer transacional append-only de auditoria em `apps/web/modules/audit/audit-writer.ts` e `packages/db/src/repositories/audit-writer.ts`
- [ ] T020 Implementar DAL e guard deny-by-default `requirePermission` em `apps/web/modules/auth/session-dal.ts`, `apps/web/modules/auth/authorize.ts` e `apps/web/modules/auth/permissions.ts`
- [ ] T021 Implementar fábrica pg-boss, configuração explícita de filas e bootstrap do worker em `apps/worker/src/queue.ts`, `apps/worker/src/queues.ts` e `apps/worker/src/main.ts`
- [ ] T022 Implementar persistência comum de `job_execution` e idempotência em `packages/db/src/repositories/job-execution.ts` e `apps/worker/src/job-runtime.ts`
- [ ] T023 [P] Configurar OpenTelemetry para web, worker e Collector em `apps/web/instrumentation.ts`, `apps/worker/src/instrumentation.ts` e `infra/observability/otel-collector.yaml`
- [ ] T024 [P] Criar harness de integração com migrations reais em `packages/db/tests/postgres-container.ts`, `packages/db/tests/migrations.test.ts` e `vitest.workspace.ts`
- [ ] T025 [P] Criar harness E2E/acessibilidade e fixtures sintéticas em `apps/web/playwright.config.ts`, `apps/web/tests/e2e/fixtures.ts` e `apps/web/tests/e2e/accessibility.ts`
- [ ] T026 Criar matriz rastreável OWASP ASVS v5.0.0 L2 para a Fundação em `docs/security/asvs-v5-l2-foundation.md`
- [ ] T027 Criar CI bloqueante para lockfile, format, lint, typecheck, unit, integração, autorização, contrato, build, E2E, acessibilidade e scans em `.github/workflows/ci.yml` e `.github/workflows/promotion.yml`
- [ ] T028 Validar somente migrations do zero, privilégios append-only, geração OpenAPI e smoke dos harnesses fundacionais em `packages/db/tests/migrations.test.ts`, `packages/contracts/tests/openapi.test.ts` e `specs/001-project-foundation/evidence/foundation.md`; reservar o quickstart completo para T094

**Checkpoint**: banco, segurança transversal, contratos, jobs, telemetria e gates prontos; US1 pode
começar. US2, US3 e US5 dependem do núcleo de autenticação entregue pela US1.

---

## Phase 3: User Story 1 - Acesso interno seguro (Priority: P1) 🎯 MVP

**Goal**: Usuários entram com segurança; administradores usam MFA; cada ação observa sessão ativa e
permissão atual.

**Independent Test**: Contas ativa, inativa e administrativa exercitam login, TOTP, logout,
revogação e acesso permitido/negado; a próxima ação após revogação falha.

### Tests for User Story 1

- [ ] T029 [P] [US1] Criar testes de unidade deny-by-default, composição de permissões e estado administrativo/MFA em `apps/web/modules/auth/authorize.test.ts` e `apps/web/modules/auth/admin-mfa-policy.test.ts`
- [ ] T030 [P] [US1] Criar testes de integração Better Auth para sessão persistida, cookie seguro, TOTP, revogação e usuário inativo em `apps/web/tests/integration/auth-session.test.ts`
- [ ] T031 [P] [US1] Criar testes de contrato para `/api/v1/me` e erros 401/403 seguros em `apps/web/tests/contract/current-user.test.ts`
- [ ] T032 [P] [US1] Criar E2E de login, MFA administrativo, logout, sessão revogada e navegação autorizada em `apps/web/tests/e2e/auth-access.spec.ts`

### Implementation for User Story 1

- [ ] T033 [US1] Configurar Better Auth com Drizzle, sessão opaca sem cookie cache e cookies seguros em `apps/web/modules/auth/auth.ts` e `apps/web/app/api/auth/[...all]/route.ts`
- [ ] T034 [US1] Implementar enrollment, confirmação, recovery e exigência TOTP para administradores em `apps/web/modules/auth/mfa-service.ts` e `apps/web/modules/auth/admin-mfa-policy.ts`
- [ ] T035 [P] [US1] Implementar repositório de eventos de segurança redigidos em `packages/db/src/repositories/security-events.ts` e `apps/web/modules/auth/security-events.ts`
- [ ] T036 [US1] Implementar consulta de identidade/permissões atuais e `/api/v1/me` em `apps/web/modules/auth/current-user.ts` e `apps/web/app/api/v1/me/route.ts`
- [ ] T037 [P] [US1] Criar telas acessíveis de login e desafio MFA em `apps/web/app/(auth)/login/page.tsx`, `apps/web/app/(auth)/mfa/page.tsx` e `apps/web/modules/auth/ui/auth-form.tsx`
- [ ] T038 [US1] Criar shell administrativo protegido e navegação filtrada por permissão em `apps/web/app/(admin)/layout.tsx`, `apps/web/app/(admin)/page.tsx` e `apps/web/modules/auth/ui/authorized-nav.tsx`
- [ ] T039 [US1] Implementar logout e revogação de sessões em `apps/web/modules/auth/session-actions.ts` e `apps/web/app/(admin)/sessions/page.tsx`
- [ ] T040 [US1] Executar a validação independente da US1 e registrar resultados SC-001/SC-002 em `specs/001-project-foundation/evidence/us1-access.md`

**Checkpoint**: US1 entrega acesso seguro demonstrável e pode ser apresentada como MVP técnico.

---

## Phase 4: User Story 2 - Administração de usuários e permissões (Priority: P2)

**Goal**: Administrador autorizado gerencia contas e atribuições sem autoelevação, preservando
histórico, justificativa e o último administrador.

**Independent Test**: Criar uma conta sintética, conceder/revogar função permitida, negar concessão
fora da autoridade, desativar conta e comprovar revogação e auditoria atômicas.

### Tests for User Story 2

- [ ] T041 [P] [US2] Criar testes de unidade para concessão, vigência, revogação e prevenção de autoelevação em `apps/web/modules/users/access-policy.test.ts`
- [ ] T042 [P] [US2] Criar testes PostgreSQL para unicidade de atribuição, concorrência do último administrador e rollback com auditoria em `apps/web/tests/integration/user-access.test.ts`
- [ ] T043 [P] [US2] Criar testes de contrato para users, roles, paginação, 409 e 422 em `apps/web/tests/contract/users.test.ts` e `apps/web/tests/contract/roles.test.ts`
- [ ] T044 [P] [US2] Criar E2E de criação, alteração, desativação, concessão/revogação e negações em `apps/web/tests/e2e/user-administration.spec.ts`

### Implementation for User Story 2

- [ ] T045 [US2] Implementar repositórios de usuário, função, permissão e atribuição em `packages/db/src/repositories/users.ts`, `packages/db/src/repositories/roles.ts` e `packages/db/src/repositories/user-roles.ts`
- [ ] T046 [US2] Implementar serviço transacional de contas com soft delete, versão otimista, revogação de sessões, auditoria e evento de segurança redigido em `apps/web/modules/users/user-service.ts`
- [ ] T047 [US2] Implementar serviço de concessão/revogação com autoridade do ator, MFA, lock do último administrador, auditoria e evento de segurança redigido em `apps/web/modules/users/role-assignment-service.ts`
- [ ] T048 [US2] Implementar schemas Zod e handlers `/api/v1/users` e `/api/v1/users/{userId}` em `packages/contracts/src/users.ts`, `apps/web/app/api/v1/users/route.ts` e `apps/web/app/api/v1/users/[userId]/route.ts`
- [ ] T049 [US2] Implementar handlers de roles e atribuições em `packages/contracts/src/roles.ts`, `apps/web/app/api/v1/roles/route.ts` e `apps/web/app/api/v1/users/[userId]/roles/[roleId]/route.ts`
- [ ] T050 [P] [US2] Criar lista/detalhe/formulário acessíveis de usuários em `apps/web/app/(admin)/users/page.tsx`, `apps/web/app/(admin)/users/[userId]/page.tsx` e `apps/web/modules/users/ui/user-form.tsx`
- [ ] T051 [US2] Criar editor de funções/permissões com confirmação e justificativa em `apps/web/modules/users/ui/role-assignment-form.tsx` e `apps/web/modules/users/ui/sensitive-action-dialog.tsx`
- [ ] T052 [US2] Executar validação independente da US2 e registrar atomicidade, negações e SC-005 em `specs/001-project-foundation/evidence/us2-users.md`

**Checkpoint**: US2 administra acesso com menor privilégio sem depender da UI para proteção.

---

## Phase 5: User Story 3 - Investigação por auditoria (Priority: P3)

**Goal**: Auditor autorizado pesquisa e exporta trilha crítica redigida sem poder alterá-la.

**Independent Test**: Gerar eventos conhecidos, pesquisar por todos os filtros, exportar com
permissão e provar que update/delete e acesso não autorizado falham.

### Tests for User Story 3

- [ ] T053 [P] [US3] Criar testes de integração para append-only, filtros, redação, paginação e rollback atômico em `apps/web/tests/integration/audit.test.ts`
- [ ] T054 [P] [US3] Criar testes de contrato de pesquisa/exportação e 401/403 em `apps/web/tests/contract/audit.test.ts`
- [ ] T055 [P] [US3] Criar E2E de auditor read-only, busca combinada e exportação autorizada em `apps/web/tests/e2e/audit.spec.ts`

### Implementation for User Story 3

- [ ] T056 [US3] Implementar consulta paginada allowlisted de auditoria em `packages/db/src/repositories/audit-query.ts` e `apps/web/modules/audit/audit-query-service.ts`
- [ ] T057 [US3] Implementar schemas e handlers de `/api/v1/audit-events` e `/api/v1/audit-exports` em `packages/contracts/src/audit.ts`, `apps/web/app/api/v1/audit-events/route.ts` e `apps/web/app/api/v1/audit-exports/route.ts`
- [ ] T058 [US3] Implementar job idempotente de exportação redigida e entrega privada temporária em `apps/worker/src/jobs/audit-export.ts` e `apps/web/modules/audit/audit-export-service.ts`
- [ ] T059 [P] [US3] Criar página acessível de filtros e detalhe antes/depois em `apps/web/app/(admin)/audit/page.tsx` e `apps/web/modules/audit/ui/audit-table.tsx`
- [ ] T060 [US3] Criar fluxo autorizado de exportação com justificativa e acompanhamento em `apps/web/modules/audit/ui/audit-export-dialog.tsx` e `apps/web/app/(admin)/audit/exports/[jobId]/page.tsx`
- [ ] T061 [US3] Executar validação independente da US3 e registrar SC-003/SC-004 em `specs/001-project-foundation/evidence/us3-audit.md`

**Checkpoint**: US3 permite investigação íntegra, redigida e somente leitura.

---

## Phase 6: User Story 4 - Área administrativa acessível e consistente (Priority: P4)

**Goal**: Autenticação, navegação, usuários e auditoria formam uma experiência WCAG 2.2 AA
consistente em desktop e tablet.

**Independent Test**: Concluir jornadas essenciais por teclado e leitor de tela, sem significado
apenas visual, com Axe e revisão manual registradas.

### Tests for User Story 4

- [ ] T062 [P] [US4] Criar testes de unidade de tokens, variantes e nomes acessíveis dos componentes em `apps/web/components/ui/ui-contracts.test.tsx`
- [ ] T063 [P] [US4] Criar varredura Axe das páginas e estados essenciais em `apps/web/tests/e2e/accessibility.spec.ts`
- [ ] T064 [P] [US4] Criar E2E somente-teclado, foco, zoom/reflow e breakpoints de tablet em `apps/web/tests/e2e/keyboard-responsive.spec.ts`

### Implementation for User Story 4

- [ ] T065 [US4] Definir tokens institucionais, contraste, tipografia, espaçamento, foco e densidade em `apps/web/app/globals.css` e `apps/web/styles/tokens.css`
- [ ] T066 [P] [US4] Criar primitivas locais Button, Input, FormField, Alert e Spinner sobre HTML/Radix em `apps/web/components/ui/button.tsx`, `apps/web/components/ui/input.tsx`, `apps/web/components/ui/form-field.tsx`, `apps/web/components/ui/alert.tsx` e `apps/web/components/ui/spinner.tsx`
- [ ] T067 [P] [US4] Criar Dialog, Menu, Table e Pagination acessíveis com ícones Lucide estáticos em `apps/web/components/ui/dialog.tsx`, `apps/web/components/ui/menu.tsx`, `apps/web/components/ui/table.tsx` e `apps/web/components/ui/pagination.tsx`
- [ ] T068 [US4] Aplicar layout responsivo, skip link, landmarks e feedback global em `apps/web/app/layout.tsx`, `apps/web/components/app-shell.tsx` e `apps/web/components/live-region.tsx`
- [ ] T069 [US4] Executar revisão manual WCAG 2.2 AA e registrar teclado, foco, contraste, reflow e leitor de tela em `specs/001-project-foundation/evidence/us4-accessibility.md`
- [ ] T070 [US4] Corrigir todas as falhas automatizadas/manuais da US4 nos arquivos indicados em `specs/001-project-foundation/evidence/us4-accessibility.md` e anexar resultado final no mesmo arquivo

**Checkpoint**: US4 comprova WCAG 2.2 AA no escopo da Fundação e linguagem visual Lucide única.

---

## Phase 7: User Story 5 - Operação resiliente e observável (Priority: P5)

**Goal**: Operadores acompanham saúde/jobs e arquivos percorrem upload privado, quarentena, scan e
download autorizado sem efeitos duplicados.

**Independent Test**: Repetir jobs/upload, simular falhas de worker/storage/scanner e confirmar
idempotência, estados, correlação, alertas e bloqueio de arquivo não aprovado.

### Tests for User Story 5

- [ ] T071 [P] [US5] Criar testes de unidade das máquinas de estado de job/arquivo e redação de erros em `apps/worker/tests/job-state.test.ts` e `apps/worker/tests/file-state.test.ts`
- [ ] T072 [P] [US5] Criar testes PostgreSQL de idempotência concorrente, retry, heartbeat e redrive em `apps/worker/tests/job-runtime.integration.test.ts`
- [ ] T073 [P] [US5] Criar testes de integração de upload para MIME/signatura divergente, tamanho, checksum, antivírus e scanner indisponível em `apps/worker/tests/file-scan.integration.test.ts`
- [ ] T074 [P] [US5] Criar testes de contrato para upload intent, finalize, download e status de job em `apps/web/tests/contract/files-jobs.test.ts`
- [ ] T075 [P] [US5] Criar E2E de progresso, falha terminal, redrive autorizado e arquivo privado em `apps/web/tests/e2e/operations.spec.ts`

### Implementation for User Story 5

- [ ] T076 [US5] Implementar adapter S3-compatible com quarentena privada, URLs curtas e checksum em `apps/web/modules/files/object-storage.ts` e `apps/worker/src/object-storage.ts`
- [ ] T077 [US5] Implementar serviço transacional de upload intent/finalize/download autorizado em `apps/web/modules/files/file-service.ts`
- [ ] T078 [US5] Implementar schemas e handlers de arquivos/status de jobs em `packages/contracts/src/files.ts`, `packages/contracts/src/jobs.ts`, `apps/web/app/api/v1/files/upload-intents/route.ts`, `apps/web/app/api/v1/files/[fileId]/finalize/route.ts`, `apps/web/app/api/v1/files/[fileId]/download/route.ts` e `apps/web/app/api/v1/jobs/[jobId]/route.ts`
- [ ] T079 [US5] Implementar handler idempotente de detecção MIME/magic bytes, limites e ClamAV fail-closed em `apps/worker/src/jobs/scan-file.ts` e `apps/worker/src/clamav.ts`
- [ ] T080 [US5] Implementar promoção limpa, rejeição, retry e reconciliador DB/storage em `apps/worker/src/jobs/promote-file.ts` e `apps/worker/src/jobs/reconcile-files.ts`
- [ ] T081 [US5] Implementar liveness/readiness web e heartbeat/readiness worker em `apps/web/app/livez/route.ts`, `apps/web/app/readyz/route.ts`, `apps/worker/src/health.ts` e `packages/db/src/repositories/worker-heartbeat.ts`
- [ ] T082 [P] [US5] Definir métricas, traces e alertas de latência, erros, fila, scanner e storage em `apps/web/modules/shared/metrics.ts`, `apps/worker/src/metrics.ts` e `infra/observability/alerts.yaml`
- [ ] T083 [US5] Criar páginas autorizadas de jobs, progresso, falhas e redrive justificado em `apps/web/app/(admin)/operations/jobs/page.tsx`, `apps/web/app/(admin)/operations/jobs/[jobId]/page.tsx` e `apps/web/modules/jobs/ui/redrive-dialog.tsx`
- [ ] T084 [US5] Executar validação independente da US5 e registrar SC-007/SC-010 em `specs/001-project-foundation/evidence/us5-operations.md`

**Checkpoint**: US5 prova jobs observáveis/idempotentes e ciclo de arquivo seguro sem fail-open.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Consolidar qualidade, segurança, documentação e entrega sem ampliar o escopo funcional.

- [ ] T085 [P] Regenerar e validar o contrato final em `specs/001-project-foundation/contracts/openapi.yaml` e registrar ausência de drift em `specs/001-project-foundation/evidence/contracts.md`
- [ ] T086 [P] Criar testes canário contra vazamento de senha, token, cookie, stack e PII em `apps/web/tests/integration/redaction.test.ts` e `apps/worker/tests/redaction.test.ts`
- [ ] T087 [P] Criar testes SC-006 para login, MFA, navegação, listagem/gravação de usuários/permissões e pesquisa de auditoria em `apps/web/tests/performance/foundation.k6.ts` e registrar perfil operacional, dados sintéticos e resultados em `specs/001-project-foundation/evidence/performance.md`
- [ ] T088 Revisar imports e remover abstrações sem três usos reais conforme KISS/DRY/YAGNI em `apps/web/modules/`, `apps/worker/src/` e `packages/`
- [ ] T089 Obter aprovação Jurídico/DPO e implementar inventário, finalidade, acesso, retenção, anonimização/descarte e preservação legal por categoria em `docs/privacy/data-inventory.md`, `docs/privacy/retention-policy.md`, `apps/worker/src/jobs/apply-retention.ts` e `specs/001-project-foundation/evidence/privacy.md`; bloquear PROD enquanto a aprovação ou os controles estiverem incompletos
- [ ] T090 Executar SAST, secret scan, dependency scan e revisão dos controles ASVS; atualizar evidências em `docs/security/asvs-v5-l2-foundation.md` e `specs/001-project-foundation/evidence/security.md`
- [ ] T091 Validar backup/restauração local e rollback de migrations sem apagar dados em `infra/postgres/backup.ps1`, `infra/postgres/restore.ps1` e `specs/001-project-foundation/evidence/recovery.md`
- [ ] T092 [P] Documentar operação, incidentes, credenciais comprometidas, fila esgotada e scanner indisponível em `docs/runbooks/foundation.md`
- [ ] T093 [P] Documentar arquitetura, fronteiras de módulos e decisões finais em `docs/architecture/foundation.md` e `docs/architecture/decisions/001-foundation.md`
- [ ] T094 Executar todos os comandos e cenários de `specs/001-project-foundation/quickstart.md` em checkout limpo e registrar o resultado em `specs/001-project-foundation/evidence/final-validation.md`
- [ ] T095 Aplicar/validar os rulesets remotos `dev`/`main`, demonstrar bloqueio de push direto e promoção inválida e registrar evidências em `specs/001-project-foundation/evidence/branch-protection.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 — Setup**: sem dependências; T001–T003 são sequenciais, depois T004–T008 podem avançar
  em paralelo; T009 depende de T001 e dos arquivos de T008.
- **Phase 2 — Foundational**: depende da Phase 1 e bloqueia todas as histórias. Migrations T011–T014
  são ordenadas; T015/T016, T018, T023–T025 podem avançar em paralelo após seus setups.
- **Phases 3–7 — User Stories**: US1 depende da Phase 2; US2, US3 e US5 dependem da conclusão da US1;
  US4 depende da conclusão de US1, US2 e US3 para validar as telas reais.
- **Phase 8 — Polish**: depende de todas as histórias incluídas na entrega; T094 e T095 são os gates
  finais.

### User Story Dependencies

- **US1 (P1)**: inicia após Phase 2; não depende de outra história e constitui o MVP técnico.
- **US2 (P2)**: inicia após T040, pois seus serviços exigem a sessão e o MFA implementados pela US1;
  não depende da UI da US1 para suas regras.
- **US3 (P3)**: inicia após T040, pois pesquisa/exportação exigem identidade autenticada; não depende
  da US2.
- **US4 (P4)**: inicia após T061, quando as telas reais de autenticação, usuários e auditoria estão
  disponíveis para aplicação e validação dos componentes acessíveis.
- **US5 (P5)**: inicia após T040, pois seus endpoints exigem identidade autenticada; não depende de
  US2, US3 ou US4.

### Within Each User Story

1. Escrever os testes listados e confirmar que falham pelo motivo esperado.
2. Implementar persistência/repositórios que ainda sejam específicos da história.
3. Implementar políticas e serviços antes dos handlers.
4. Implementar contratos/handlers antes da UI que os consome.
5. Executar o teste independente e registrar evidência antes do checkpoint.

### Parallel Opportunities

- T004–T008 usam arquivos distintos e podem avançar em paralelo após o workspace-base.
- T015/T016, T018, T023–T025 podem ser divididas entre contratos, logging, observabilidade e testes.
- Após T028, US1 começa; após T040, US2, US3 e US5 podem avançar em paralelo; US4 começa após T061.
- Dentro de cada história, todas as tarefas de testes marcadas [P] podem ser preparadas em paralelo.
- T066/T067 e T081/T082 trabalham em componentes diferentes e podem avançar em paralelo.
- T085–T087 e T092/T093 são frentes finais independentes antes dos gates T094/T095.

---

## Parallel Examples

### User Story 1

```text
Task T029: Unit authorization/MFA policy tests
Task T030: Better Auth integration tests
Task T031: /api/v1/me contract tests
Task T032: Authentication E2E tests
```

### User Story 2

```text
Task T041: Access-policy unit tests
Task T042: PostgreSQL concurrency/atomicity tests
Task T043: User/role contract tests
Task T044: User administration E2E tests
```

### User Story 3

```text
Task T053: Append-only/filter integration tests
Task T054: Audit contract tests
Task T055: Auditor E2E tests
```

### User Story 4

```text
Task T062: UI primitive contract tests
Task T063: Axe page-state scans
Task T064: Keyboard/responsive E2E tests
```

### User Story 5

```text
Task T071: Job/file state unit tests
Task T072: Job idempotency integration tests
Task T073: Secure upload/scan integration tests
Task T074: File/job contract tests
Task T075: Operations E2E tests
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and apply local repository conventions.
2. Complete Phase 2 and prove every foundational gate.
3. Complete US1 tasks T029–T040.
4. Stop and validate SC-001/SC-002 independently.
5. Open a Pull Request from `feature/project-foundation` to `dev`; do not merge or push to `main`.

### Incremental Delivery

1. Setup + Foundational establish the secure platform.
2. US1 adds authenticated, authorized access with administrative MFA.
3. US2 adds governed user/permission administration.
4. US3 exposes immutable audit investigation.
5. US4 completes accessible, consistent administrative UX.
6. US5 completes files, jobs and operational visibility.
7. Polish/hardening proves cross-cutting criteria before promotion.

### Parallel Team Strategy

After Phase 2, assign an owner to US1. After T040, owners for US2, US3 and US5 may work concurrently;
US4 starts after T061 so it can validate the real screens. Owners must preserve module boundaries and
coordinate shared-contract changes. A single integration owner regenerates OpenAPI and runs T094.
Only a human maintainer applies T095 and later merges `dev` into `main`.

---

## Notes

- `[P]` means safe file-level parallelism, not permission to ignore stated dependencies.
- `[USn]` maps directly to the five prioritized stories in `spec.md`.
- Tasks intentionally avoid modules de notícias, agenda, associados, parceiros e colaboradores.
- Testes de banco usam PostgreSQL real; mocks não comprovam constraints, privilégios ou concorrência.
- Nunca usar dados pessoais reais, segredos ou credenciais de PROD em local/CI/evidências.
- Cada tarefa ou grupo coeso deve resultar em diff pequeno e revisável para PR em `dev`.
