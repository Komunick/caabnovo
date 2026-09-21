# Tasks: Fundação, Colaboradores e infraestrutura de exportação — incremento de 21/09/2026

**Input:** [spec](spec.md), [plan](plan.md), [research](research.md), [modelo](data-model.md),
[contrato](contracts/exports.md), [quickstart](quickstart.md). **Branch da entrega:**
`feature/access-export-foundation-20260921`. Lista ativa: T097–T123 e coordenação005 LC01/LC02, 008
LC01. Implementação e gates concluídos conforme checkpoint da spec e
[evidências](evidence/plan-2026-09-21-validation.md). T096 já integrada pelo PR35; não repetir.

## Rastreabilidade e escopo

Evidência final: CI35644236348 (57d6b56) aprovado por completo. T097–T123 e005 LC01/LC02, 008 LC01
concluídos; relatório vinculado acima. Clarify:1 resposta, Gestor não redefine Administrador.
Analyze do recorte:23 requisitos/30 tarefas, cobertura100%, sem achados relevantes. As três
marcações documentais permanecem abertas. Adaptações de outros módulos continuam pendentes.

AX01–AX04 e DX01: detalhados pelas fases de permissões, descoberta, núcleo e Colaboradores abaixo.
T089 continua política institucional adiada.

O histórico abaixo conserva marcadores e evidências originais. IDs provisórios detalhados aqui não
são uma segunda execução; usar a lista ativa. Pendências de política/pesquisa/homologação e funções
suspensas continuam pendentes e não são autorizadas por constarem neste arquivo. Não repetir tarefas
já concluídas.

## Setup

- [x] T098 Validar pg-cursor/ExcelJS/PDFKit sob Node 24 com consumidor lento e célula longa;
      preparar parser de teste independente em `apps/web/tests/helpers/read-export.ts` (novo;
      leitura distinta dos writers), fixar versões aprovadas em `apps/web/package.json`,
      `pnpm-lock.yaml` e registrar RSS/compatibilidade em
      `specs/001-project-foundation/research.md`, sem atualizar a stack inteira.

## Foundational

- [x] T099 Criar testes do contrato comum para datasets/colunas ordenadas, formatos, datas e campos
      proibidos em `packages/contracts/tests/exports.test.ts` (novo), incluindo ausência de teto de
      registros/período.
- [x] T100 Implementar schemas e catálogo tipado de exportação em
      `packages/contracts/src/exports.ts` (novo), exportar em `packages/contracts/src/index.ts` e
      preparar registro finito de adaptadores em `apps/web/modules/exports/catalog.ts` (novo), sem
      SQL livre.
- [x] T101 Cobrir migração de chaves, herança expirada/revogada, override vazio, deduplicação/versão
      e baseline editorial em `apps/web/tests/integration/access-foundation-migrations.test.ts`,
      `apps/web/tests/integration/user-access.test.ts` e
      `apps/web/tests/integration/user-permissions.test.ts`, comparando efetivo antes/depois das
      duas migrações separadamente; acrescentar os seis cenários de
      `specs/001-project-foundation/contracts/roles.md`, incluindo Administrador com override
      vazio/novas permissões e Gestor com consulta global/exportação/Relatórios completos,
      concedendo a terceiro uma escrita que não possui.
- [x] T102 Adicionar conversão idempotente audit:export/reports:export→exports:generate em
      `packages/db/migrations/0025_general_export_permission.sql` (nova); preservar user_role,
      leitura e override, incrementar version só quando array mudar e atualizar
      `apps/web/modules/auth/permissions.ts`.
- [x] T103 Implementar cargos/resolução de I1 em
      `packages/db/migrations/0026_explicit_module_access.sql`: Gestor/Colaborador,
      scheduling:read/write/access:manage, Administrador com todo o catálogo apesar de override,
      Gestor com consulta global/exportação/Relatórios completos apesar de override, e remoção do
      baseline news geral para os demais. Atualizar `packages/contracts/src/user-access.ts` e
      `packages/db/src/repositories/user-roles.ts`; distinguir Gestor do último Administrador,
      preservar vigência/revogação/dependências e não atribuir cargos a contas por inferência.
      Seguir `specs/001-project-foundation/contracts/roles.md`.
- [x] T104 Preparar compatibilidade de autorização antes do rollout em
      `packages/db/src/repositories/report-storage.ts`, `apps/worker/src/jobs/report-export.ts`,
      `apps/worker/src/jobs/audit-export.ts` e `apps/web/modules/files/file-service.ts`; normalizar
      só chaves antigas, mantendo dono/domínios/revogação e arquivos intactos; audit_export exige
      dono/grants atuais também no download genérico/binário, sem fallback apenas files:read. Para
      Relatórios aplicar `specs/010-reports-analytics/contracts/legacy-downloads.md`, complementando
      snapshots antigos com dependências de conteúdo/gerador; não tratar ausência de scheduling:read
      salvo como autorização.
- [x] T105 Criar testes de streaming/abort/reautorização por lote/pool indisponível simulado e
      estados, usando até100 registros conforme C1, em `apps/web/modules/exports/service.test.ts`
      (novo); comprovar interrupção total quando um registro perde acesso, sem omissão silenciosa.
- [x] T106 Criar estado operacional mínimo em `packages/db/migrations/0027_export_operations.sql` e
      `packages/db/src/repositories/export-operations.ts` (novos), com requestId único, dono,
      estados/heartbeat e contagens, sem dados exportados/filtros pessoais ou fila.
- [x] T107 Implementar cursor/snapshot e pipeline cancelável em
      `apps/web/modules/exports/service.ts` e `apps/web/modules/exports/query.ts` (novos), separando
      pools de dados/controle, revalidando sessão/grants/IDs/campos antes de cada lote e fechando
      todos os recursos em falha.
- [x] T108 [P] Implementar CSV incremental em `apps/web/modules/exports/formats/csv.ts` e testes
      adjacentes (novos), com escape, BOM, neutralização de fórmulas e identificadores textuais; sem
      Buffer completo.
- [x] T109 [P] Implementar XLSX incremental em `apps/web/modules/exports/formats/xlsx.ts` e testes
      adjacentes (novos), commit por linha, múltiplas planilhas, continuação Unicode/linhas/células
      e reconstrução exata de múltiplas colunas longas.
- [x] T110 [P] Implementar PDFKit incremental em `apps/web/modules/exports/formats/pdf.ts` e testes
      adjacentes (novos), paginação vertical/faixas horizontais, cabeçalhos e ordem de colunas, sem
      bufferPages ou corte de valores.
- [x] T111 Implementar catálogo, POST de formulário e status próprios em
      `apps/web/app/api/v1/exports/catalog/route.ts`,
      `apps/web/app/api/v1/exports/download/route.ts` e
      `apps/web/app/api/v1/exports/operations/[requestId]/route.ts` (novos); CSRF/Origin,
      attachment/no-store e envelope de erro do frame conforme contrato.
- [x] T112 Implementar tela compartilhada em `apps/web/modules/exports/ui/export-screen.tsx` (nova),
      filtros e ordem de colunas por teclado, três formatos/formulário nativo, polling sem spinner
      infinito e postMessage validado por origem/source/requestId; preservar rascunhos após erro e
      não usar blob integral.

## US1 — Acesso interno seguro

**Objetivo/aceite independente:** Sessões inválidas/revogadas e CSRF recusados; autenticação e
concessão válidas funcionam sem MFA, sem autoelevação ou dados secretos exportados.

- [x] T113 [US1] Validar sessão atual, sem MFA, sem escalada e sem segredo exportado em
      `apps/web/tests/integration/auth-session.test.ts` e `apps/web/tests/contract/exports.test.ts`
      (novo), incluindo CSRF/Origin inválidos, consulta de operação alheia e revogação durante
      stream.

## US2 — Acessos e Colaboradores

**Objetivo/aceite independente:** Administrador possui todo o catálogo; Gestor consulta todos os
módulos, exporta e tem Relatórios completos, concede acessos a terceiros sem mudar os próprios
acessos/cargo; Colaborador não concede; Colaboradores oferece três formatos com campos autorizados,
sem senha/hash/token.

- [x] T114 [US2] Atualizar rótulos e seleção de acessos em
      `apps/web/modules/users/access-labels.ts`, `apps/web/modules/users/ui/user-access-form.tsx` e
      `apps/web/modules/users/user-access-service.ts`; geral independente de módulos, dependências
      válidas e conflito de version sem perda de edição. Aplicar
      `specs/001-project-foundation/contracts/roles.md` também em
      `apps/web/modules/users/role-assignment-service.ts` e
      `packages/db/src/repositories/user-access.ts`: Gestor tem consulta global, exportação geral e
      Relatórios completos; concede a terceiros inclusive alterações que não possui; proibir
      autogestão e atribuição de cargos; Colaborador não concede; Administrador atribui
      cargos/acessos. Gestor consulta/exporta Colaboradores, mas não recebe suas demais mutações por
      gerir acessos. Classificar leitura versus mutação em guardas com chave unificada, incluindo
      `apps/web/modules/messaging/http/routes.ts` e contrato009; cobrir tentativa direta de escrita
      pelo Gestor sem concessão, coordenando M016 sem ativar envio real.
- [x] T115 [US2] Implementar `apps/web/modules/users/export-adapter.ts` e teste adjacente (novos),
      consultando `packages/db/src/repositories/users.ts` e autorizações de acessos existentes;
      excluir senha inicial/hash/tokens e manter ordenação/escopo por campo.
- [x] T116 [US2] Integrar ação e tela em `apps/web/app/(admin)/users/page.tsx` e
      `apps/web/app/(admin)/users/exportar/page.tsx` (nova); cobrir três cargos, perfil parcial e
      três formatos em `apps/web/tests/e2e/direct-exports.spec.ts` e regressões em
      `apps/web/tests/e2e/user-administration.spec.ts`; provar Gestor sem escrita em outro módulo
      concedendo essa escrita a terceiro, autogestão negada e Colaborador sem concessão.

## US4 — Descoberta autorizada

**Objetivo/aceite independente:** Módulo negado não produz sidebar, resultado de busca ou
cartão/contador no Início; revogação vale na próxima ação e Conta/Sessões permanecem.

- [x] T117 [US4] Ajustar `apps/web/modules/workspace/areas.ts`,
      `apps/web/modules/workspace/search.ts` e `apps/web/app/(admin)/page.tsx` para zero
      entradas/cartões/contadores sem consulta; ações de mutação exigem escrita, Conta/Sessões
      preservadas.
- [x] T118 [US4] Cobrir sidebar/busca/Início e revogação em
      `apps/web/modules/workspace/areas.test.ts`, `apps/web/modules/workspace/search.test.ts` e
      `apps/web/tests/e2e/workspace-experience.spec.ts` e
      `apps/web/tests/e2e/direct-exports.spec.ts`, incluindo geral isolada e scheduling sem acesso.

## US5 — Operação observável

**Objetivo/aceite independente:** Distinguir geração, transferência, falha e interrupção com estado
auditável e sem spinner infinito ou afirmação de gravação local.

- [x] T119 [US5] Validar auditoria/estado de início/falha/cancelamento/interrupção e fim do stream
      em `apps/web/tests/integration/export-operations.test.ts` (novo), heartbeat sob backpressure e
      falha de controle sem sucesso falso; nunca afirmar gravação no disco do cliente.

## Polish

- [x] T120 Executar gates aplicáveis e validação com100 registros/arquivos/teclado/390 px/temas no
      CI conforme `specs/002-integrated-modules/export-validation-100.md`, sem prova de
      estresse/grande volume; registrar resultados reais e rollback compatível em
      `specs/001-project-foundation/evidence/plan-2026-09-21-validation.md` (novo), preservando T089
      pendente.

## Pendências anteriores que continuam prioritárias

T096 (cadastro público) foi conciliada nesta entrega e validada no CI de 7d4d507: HTTP negado sem
criação de usuário/credencial/sessão, login/recuperação e provisionamento administrativo cobertos
pelas suítes de integração. PR #35 ainda sem merge. T097 (preservação de erro/versão dos rascunhos)
foi executada nesta entrega; resultado atual no checkpoint e nas evidências. T097 atua em
`apps/web/components/workspace-drafts.tsx` e estados dos editores de Notícias/acessos, com
`apps/web/tests/e2e/workspace-drafts.spec.ts`. Não declarar essas pendências resolvidas por
plan/tasks nem recriar correções já existentes sem confronto.

## Dependências e ordem de execução

Setup → Foundational → histórias → Polish. Dentro de cada história, contratos/testes antecedem
código e jornada; tarefas sem [P] seguem a ordem apresentada. Infraestrutura de 001 (concessões,
schemas, writers, rotas e UI) precede adaptadores/exportações dos demais specs. Migração 0025
precede0026;0027 antes de transferências;0028 depende do diagnóstico de conflitos e não altera dados
automaticamente. Regressões004/006 e regras008 podem avançar após catálogo/migrações mesmo antes do
núcleo de exportação. Aceite transversal002 depende das evidências das funções. Spec009 exige gate
M016. Não há dependência em retenção/P01/canais futuros para o recorte administrativo atual.

## Paralelismo por história

Após pré-requisitos, os adaptadores de domínios diferentes podem avançar em paralelo porque têm
arquivos próprios. Dentro desta função, manter testes→adaptador→UI→E2E sequencial; não dividir
edições no mesmo arquivo. [P] identifica arquivos independentes prontos após a base da fase: writers
separados em001 e relatórios de aceite em002. Para cada história sem par de arquivos independente,
não há paralelismo interno seguro; ela pode avançar junto da história equivalente de outro domínio
após as dependências. Migrações/catálogo/registro central têm um único responsável na spec001, sem
edições simultâneas.

## Estratégia incremental e MVP

Primeiro invariantes de acesso/migração e descoberta; depois fluxo completo de Relatórios usando
núcleo 001 como prova vertical (três formatos, todos os dados). Isso é marco de validação, não
redução do escopo: completar depois cada função do contrato, incluindo003/004/005/007/008 e
Colaboradores;009 permanece condicionada. Reservas Q1/Q2 seguem incremento independente008 após
permissões. Políticas adiadas, chat/suporte, CAASSH, portal e app/site não são parte do MVP.

## Histórico e backlog anterior — não executar automaticamente

<details>
<summary>Tarefas anteriores, evidências e pendências preservadas</summary>

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

- **[P]**: Pode executar em paralelo porque usa arquivos distintos e não depende de tarefa
  incompleta.
- **[Story]**: História de usuário atendida (`US1` a `US5`).
- Todos os itens incluem caminhos exatos para implementação ou evidência.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Inicializar repositório, monorepo, ferramentas e governança obrigatória.

- [x] T001 Inicializar o repositório Git em `.git/`, criar `main` e `dev` com histórico comum e
      criar a branch curta `feature/project-foundation` a partir de `dev`
- [x] T002 Criar o workspace pnpm e fixar Node.js 24 LTS em `package.json`, `pnpm-workspace.yaml`,
      `.nvmrc` e `pnpm-lock.yaml`
- [x] T003 Criar os manifests mínimos da aplicação, worker e packages em `apps/web/package.json`,
      `apps/worker/package.json`, `packages/db/package.json`, `packages/contracts/package.json` e
      `packages/config/package.json`
- [x] T004 [P] Configurar TypeScript strict compartilhado em `packages/config/tsconfig.base.json`,
      `apps/web/tsconfig.json`, `apps/worker/tsconfig.json`, `packages/db/tsconfig.json` e
      `packages/contracts/tsconfig.json`
- [x] T005 [P] Configurar Prettier e ESLint com fronteiras de módulo e imports server-only em
      `prettier.config.mjs`, `eslint.config.mjs` e `packages/config/eslint/boundaries.mjs`
- [x] T006 [P] Definir configuração tipada e exemplo sem segredos em `.env.example`,
      `packages/config/src/env.ts` e `packages/config/src/index.ts`
- [x] T007 [P] Criar serviços locais isolados em `compose.yaml`, `infra/postgres/init.sql`,
      `infra/storage/init.sh`, `infra/clamav/clamd.conf` e `infra/observability/otel-collector.yaml`
- [x] T008 [P] Criar CODEOWNERS e templates de PR com segurança, permissões, migrations e rollback
      em `.github/CODEOWNERS` e `.github/pull_request_template.md`
- [x] T009 Definir rulesets aplicáveis para `dev` e `main`, incluindo PR obrigatório, checks,
      bloqueio de push/force-push e promoção humana `dev -> main`, em
      `infra/github/rulesets/dev.json`, `infra/github/rulesets/main.json` e
      `infra/github/apply-rulesets.ps1`

**Checkpoint**: workspace instalável, serviços locais definidos e governança Git reproduzível.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infraestrutura comum obrigatória antes de qualquer história de usuário.

**⚠️ CRITICAL**: Nenhuma história começa até esta fase concluir e seus testes-base passarem.

- [x] T010 Implementar conexão única e runner de migrations em `packages/db/src/client.ts`,
      `packages/db/src/migrate.ts` e `packages/db/src/index.ts`
- [x] T011 Criar migration inicial de extensões, enums e identidades em
      `packages/db/migrations/0001_identity.sql` conforme `data-model.md`
- [x] T012 Criar migration RBAC para `role`, `permission`, `role_permission` e `user_role` em
      `packages/db/migrations/0002_rbac.sql`
- [x] T013 Criar migrations append-only de auditoria/segurança e privilégios runtime em
      `packages/db/migrations/0003_audit.sql` e `packages/db/migrations/0004_runtime_privileges.sql`
- [x] T014 Criar migration de arquivos, idempotência, jobs e heartbeat em
      `packages/db/migrations/0005_operations.sql`
- [x] T015 [P] Implementar schemas compartilhados de erro, paginação, IDs e correlação em
      `packages/contracts/src/common.ts`, `packages/contracts/src/errors.ts` e
      `packages/contracts/src/index.ts`
- [x] T016 [P] Implementar gerador e validador determinístico OpenAPI 3.1.1 em
      `packages/contracts/src/openapi.ts`, `packages/contracts/scripts/generate-openapi.ts` e
      `packages/contracts/tests/openapi.test.ts`
- [x] T017 Implementar contexto server-only de request, correlation ID e ator em
      `apps/web/modules/shared/request-context.ts` e `apps/worker/src/request-context.ts`
- [x] T018 [P] Implementar logs JSON com allowlist/redação de senhas, tokens, cookies e PII em
      `apps/web/modules/shared/logger.ts`, `apps/worker/src/logger.ts` e
      `packages/config/src/redaction.ts`
- [x] T019 Implementar writer transacional append-only de auditoria em
      `apps/web/modules/audit/audit-writer.ts` e `packages/db/src/repositories/audit-writer.ts`
- [x] T020 Implementar DAL e guard deny-by-default `requirePermission` em
      `apps/web/modules/auth/session-dal.ts`, `apps/web/modules/auth/authorize.ts` e
      `apps/web/modules/auth/permissions.ts`
- [x] T021 Implementar fábrica pg-boss, configuração explícita de filas e bootstrap do worker em
      `apps/worker/src/queue.ts`, `apps/worker/src/queues.ts` e `apps/worker/src/main.ts`
- [x] T022 Implementar persistência comum de `job_execution` e idempotência em
      `packages/db/src/repositories/job-execution.ts` e `apps/worker/src/job-runtime.ts`
- [x] T023 [P] Configurar OpenTelemetry para web, worker e Collector em
      `apps/web/instrumentation.ts`, `apps/worker/src/instrumentation.ts` e
      `infra/observability/otel-collector.yaml`
- [x] T024 [P] Criar harness de integração com migrations reais em
      `packages/db/tests/postgres-container.ts`, `packages/db/tests/migrations.test.ts` e
      `vitest.workspace.ts`
- [x] T025 [P] Criar harness E2E/acessibilidade e fixtures sintéticas em
      `apps/web/playwright.config.ts`, `apps/web/tests/e2e/fixtures.ts` e
      `apps/web/tests/e2e/accessibility.ts`
- [x] T026 Criar matriz rastreável OWASP ASVS v5.0.0 L2 para a Fundação em
      `docs/security/asvs-v5-l2-foundation.md`
- [x] T027 Criar CI bloqueante para lockfile, format, lint, typecheck, unit, integração,
      autorização, contrato, build, E2E, acessibilidade e scans em `.github/workflows/ci.yml` e
      `.github/workflows/promotion.yml`
- [x] T028 Validar somente migrations do zero, privilégios append-only, geração OpenAPI e smoke dos
      harnesses fundacionais em `packages/db/tests/migrations.test.ts`,
      `packages/contracts/tests/openapi.test.ts` e
      `specs/001-project-foundation/evidence/foundation.md`; reservar o quickstart completo para
      T094

**Checkpoint**: banco, segurança transversal, contratos, jobs, telemetria e gates prontos; US1 pode
começar. US2, US3 e US5 dependem do núcleo de autenticação entregue pela US1.

---

## Phase 3: User Story 1 - Acesso interno seguro (Priority: P1) 🎯 MVP

**Goal**: Usuários entram com segurança; administradores usam MFA; cada ação observa sessão ativa e
permissão atual.

**Independent Test**: Contas ativa, inativa e administrativa exercitam login, TOTP, logout,
revogação e acesso permitido/negado; a próxima ação após revogação falha.

### Tests for User Story 1

- [x] T029 [P] [US1] Criar testes de unidade deny-by-default, composição de permissões e estado
      administrativo/MFA em `apps/web/modules/auth/authorize.test.ts` e
      `apps/web/modules/auth/admin-mfa-policy.test.ts`
- [x] T030 [P] [US1] Criar testes de integração Better Auth para sessão persistida, cookie seguro,
      TOTP, revogação e usuário inativo em `apps/web/tests/integration/auth-session.test.ts`
- [x] T031 [P] [US1] Criar testes de contrato para `/api/v1/me` e erros 401/403 seguros em
      `apps/web/tests/contract/current-user.test.ts`
- [x] T032 [P] [US1] Criar E2E de login, MFA administrativo, logout, sessão revogada e navegação
      autorizada em `apps/web/tests/e2e/auth-access.spec.ts`

### Implementation for User Story 1

- [x] T033 [US1] Configurar Better Auth com Drizzle, sessão opaca sem cookie cache e cookies seguros
      em `apps/web/modules/auth/auth.ts` e `apps/web/app/api/auth/[...all]/route.ts`
- [x] T034 [US1] Implementar enrollment, confirmação, recovery e exigência TOTP para administradores
      em `apps/web/modules/auth/mfa-service.ts` e `apps/web/modules/auth/admin-mfa-policy.ts`
- [x] T035 [P] [US1] Implementar repositório de eventos de segurança redigidos em
      `packages/db/src/repositories/security-events.ts` e `apps/web/modules/auth/security-events.ts`
- [x] T036 [US1] Implementar consulta de identidade/permissões atuais e `/api/v1/me` em
      `apps/web/modules/auth/current-user.ts` e `apps/web/app/api/v1/me/route.ts`
- [x] T037 [P] [US1] Criar telas acessíveis de login e desafio MFA em
      `apps/web/app/(auth)/login/page.tsx`, `apps/web/app/(auth)/mfa/page.tsx` e
      `apps/web/modules/auth/ui/auth-form.tsx`
- [x] T038 [US1] Criar shell administrativo protegido e navegação filtrada por permissão em
      `apps/web/app/(admin)/layout.tsx`, `apps/web/app/(admin)/page.tsx` e
      `apps/web/modules/auth/ui/authorized-nav.tsx`
- [x] T039 [US1] Implementar logout e revogação de sessões em
      `apps/web/modules/auth/session-actions.ts` e `apps/web/app/(admin)/sessions/page.tsx`
- [x] T040 [US1] Executar a validação independente da US1 e registrar resultados SC-001/SC-002 em
      `specs/001-project-foundation/evidence/us1-access.md`

**Checkpoint**: US1 entrega acesso seguro demonstrável e pode ser apresentada como MVP técnico.

---

## Phase 4: User Story 2 - Administração de usuários e permissões (Priority: P2)

**Goal**: Administrador autorizado gerencia contas e atribuições sem autoelevação, preservando
histórico, justificativa e o último administrador.

**Independent Test**: Criar uma conta sintética, conceder/revogar função permitida, negar concessão
fora da autoridade, desativar conta e comprovar revogação e auditoria atômicas.

### Tests for User Story 2

- [x] T041 [P] [US2] Criar testes de unidade para concessão, vigência, revogação e prevenção de
      autoelevação em `apps/web/modules/users/access-policy.test.ts`
- [x] T042 [P] [US2] Criar testes PostgreSQL para unicidade de atribuição, concorrência do último
      administrador e rollback com auditoria em `apps/web/tests/integration/user-access.test.ts`
- [x] T043 [P] [US2] Criar testes de contrato para users, roles, paginação, 409 e 422 em
      `apps/web/tests/contract/users.test.ts` e `apps/web/tests/contract/roles.test.ts`
- [x] T044 [P] [US2] Criar E2E de criação, alteração, desativação, concessão/revogação e negações em
      `apps/web/tests/e2e/user-administration.spec.ts`

### Implementation for User Story 2

- [x] T045 [US2] Implementar repositórios de usuário, função, permissão e atribuição em
      `packages/db/src/repositories/users.ts`, `packages/db/src/repositories/roles.ts` e
      `packages/db/src/repositories/user-roles.ts`
- [x] T046 [US2] Implementar serviço transacional de contas com soft delete, versão otimista,
      revogação de sessões, auditoria e evento de segurança redigido em
      `apps/web/modules/users/user-service.ts`
- [x] T047 [US2] Implementar serviço de concessão/revogação com autoridade do ator, MFA, lock do
      último administrador, auditoria e evento de segurança redigido em
      `apps/web/modules/users/role-assignment-service.ts`
- [x] T048 [US2] Implementar schemas Zod e handlers `/api/v1/users` e `/api/v1/users/{userId}` em
      `packages/contracts/src/users.ts`, `apps/web/app/api/v1/users/route.ts` e
      `apps/web/app/api/v1/users/[userId]/route.ts`
- [x] T049 [US2] Implementar handlers de roles e atribuições em `packages/contracts/src/roles.ts`,
      `apps/web/app/api/v1/roles/route.ts` e
      `apps/web/app/api/v1/users/[userId]/roles/[roleId]/route.ts`
- [x] T050 [P] [US2] Criar lista/detalhe/formulário acessíveis de usuários em
      `apps/web/app/(admin)/users/page.tsx`, `apps/web/app/(admin)/users/[userId]/page.tsx` e
      `apps/web/modules/users/ui/user-form.tsx`
- [x] T051 [US2] Criar editor de funções/permissões com confirmação e justificativa em
      `apps/web/modules/users/ui/role-assignment-form.tsx` e
      `apps/web/modules/users/ui/sensitive-action-dialog.tsx`
- [x] T052 [US2] Executar validação independente da US2 e registrar atomicidade, negações e SC-005
      em `specs/001-project-foundation/evidence/us2-users.md`

**Checkpoint**: US2 administra acesso com menor privilégio sem depender da UI para proteção.

---

## Phase 5: User Story 3 - Investigação por auditoria (Priority: P3)

**Goal**: Auditor autorizado pesquisa e exporta trilha crítica redigida sem poder alterá-la.

**Independent Test**: Gerar eventos conhecidos, pesquisar por todos os filtros, exportar com
permissão e provar que update/delete e acesso não autorizado falham.

### Tests for User Story 3

- [x] T053 [P] [US3] Criar testes de integração para append-only, filtros, redação, paginação e
      rollback atômico em `apps/web/tests/integration/audit.test.ts`
- [x] T054 [P] [US3] Criar testes de contrato de pesquisa/exportação e 401/403 em
      `apps/web/tests/contract/audit.test.ts`
- [x] T055 [P] [US3] Criar E2E de auditor read-only, busca combinada e exportação autorizada em
      `apps/web/tests/e2e/audit.spec.ts`

### Implementation for User Story 3

- [x] T056 [US3] Implementar consulta paginada allowlisted de auditoria em
      `packages/db/src/repositories/audit-query.ts` e
      `apps/web/modules/audit/audit-query-service.ts`
- [x] T057 [US3] Implementar schemas e handlers de `/api/v1/audit-events` e `/api/v1/audit-exports`
      em `packages/contracts/src/audit.ts`, `apps/web/app/api/v1/audit-events/route.ts` e
      `apps/web/app/api/v1/audit-exports/route.ts`
- [x] T058 [US3] Implementar job idempotente de exportação redigida e entrega privada temporária em
      `apps/worker/src/jobs/audit-export.ts` e `apps/web/modules/audit/audit-export-service.ts`
- [x] T059 [P] [US3] Criar página acessível de filtros e detalhe antes/depois em
      `apps/web/app/(admin)/audit/page.tsx` e `apps/web/modules/audit/ui/audit-table.tsx`
- [x] T060 [US3] Criar fluxo autorizado de exportação com justificativa e acompanhamento em
      `apps/web/modules/audit/ui/audit-export-dialog.tsx` e
      `apps/web/app/(admin)/audit/exports/[jobId]/page.tsx`
- [x] T061 [US3] Executar validação independente da US3 e registrar SC-003/SC-004 em
      `specs/001-project-foundation/evidence/us3-audit.md`

**Checkpoint**: US3 permite investigação íntegra, redigida e somente leitura.

---

## Phase 6: User Story 4 - Área administrativa acessível e consistente (Priority: P4)

**Goal**: Autenticação, navegação, usuários e auditoria formam uma experiência WCAG 2.2 AA
consistente em desktop e tablet.

**Independent Test**: Concluir jornadas essenciais por teclado e leitor de tela, sem significado
apenas visual, com Axe e revisão manual registradas.

### Tests for User Story 4

- [x] T062 [P] [US4] Criar testes de unidade de tokens, variantes e nomes acessíveis dos componentes
      em `apps/web/components/ui/ui-contracts.test.tsx`
- [x] T063 [P] [US4] Criar varredura Axe das páginas e estados essenciais em
      `apps/web/tests/e2e/accessibility.spec.ts`
- [x] T064 [P] [US4] Criar E2E somente-teclado, foco, zoom/reflow e breakpoints de tablet em
      `apps/web/tests/e2e/keyboard-responsive.spec.ts`

### Implementation for User Story 4

- [x] T065 [US4] Definir tokens institucionais, contraste, tipografia, espaçamento, foco e densidade
      em `apps/web/app/globals.css` e `apps/web/styles/tokens.css`
- [x] T066 [P] [US4] Criar primitivas locais Button, Input, FormField, Alert e Spinner sobre
      HTML/Radix em `apps/web/components/ui/button.tsx`, `apps/web/components/ui/input.tsx`,
      `apps/web/components/ui/form-field.tsx`, `apps/web/components/ui/alert.tsx` e
      `apps/web/components/ui/spinner.tsx`
- [x] T067 [P] [US4] Criar Dialog, Menu, Table e Pagination acessíveis com ícones Lucide estáticos
      em `apps/web/components/ui/dialog.tsx`, `apps/web/components/ui/menu.tsx`,
      `apps/web/components/ui/table.tsx` e `apps/web/components/ui/pagination.tsx`
- [x] T068 [US4] Aplicar layout responsivo, skip link, landmarks e feedback global em
      `apps/web/app/layout.tsx`, `apps/web/components/app-shell.tsx` e
      `apps/web/components/live-region.tsx`
- [x] T069 [US4] Executar revisão manual WCAG 2.2 AA e registrar teclado, foco, contraste, reflow e
      leitor de tela em `specs/001-project-foundation/evidence/us4-accessibility.md`
- [x] T070 [US4] Corrigir todas as falhas automatizadas/manuais da US4 nos arquivos indicados em
      `specs/001-project-foundation/evidence/us4-accessibility.md` e anexar resultado final no mesmo
      arquivo

**Checkpoint**: US4 comprova WCAG 2.2 AA no escopo da Fundação e linguagem visual Lucide única.

---

## Phase 7: User Story 5 - Operação resiliente e observável (Priority: P5)

**Goal**: Operadores acompanham saúde/jobs e arquivos percorrem upload privado, quarentena, scan e
download autorizado sem efeitos duplicados.

**Independent Test**: Repetir jobs/upload, simular falhas de worker/storage/scanner e confirmar
idempotência, estados, correlação, alertas e bloqueio de arquivo não aprovado.

### Tests for User Story 5

- [x] T071 [P] [US5] Criar testes de unidade das máquinas de estado de job/arquivo e redação de
      erros em `apps/worker/tests/job-state.test.ts` e `apps/worker/tests/file-state.test.ts`
- [x] T072 [P] [US5] Criar testes PostgreSQL de idempotência concorrente, retry, heartbeat e redrive
      em `apps/worker/tests/job-runtime.integration.test.ts`
- [x] T073 [P] [US5] Criar testes de integração de upload para MIME/signatura divergente, tamanho,
      checksum, antivírus e scanner indisponível em
      `apps/worker/tests/file-scan.integration.test.ts`
- [x] T074 [P] [US5] Criar testes de contrato para upload intent, finalize, download e status de job
      em `apps/web/tests/contract/files-jobs.test.ts`
- [x] T075 [P] [US5] Criar E2E de progresso, falha terminal, redrive autorizado e arquivo privado em
      `apps/web/tests/e2e/operations.spec.ts`

### Implementation for User Story 5

- [x] T076 [US5] Implementar adapter S3-compatible com quarentena privada, URLs curtas e checksum em
      `apps/web/modules/files/object-storage.ts` e `apps/worker/src/object-storage.ts`
- [x] T077 [US5] Implementar serviço transacional de upload intent/finalize/download autorizado em
      `apps/web/modules/files/file-service.ts`
- [x] T078 [US5] Implementar schemas e handlers de arquivos/status de jobs em
      `packages/contracts/src/files.ts`, `packages/contracts/src/jobs.ts`,
      `apps/web/app/api/v1/files/upload-intents/route.ts`,
      `apps/web/app/api/v1/files/[fileId]/finalize/route.ts`,
      `apps/web/app/api/v1/files/[fileId]/download/route.ts` e
      `apps/web/app/api/v1/jobs/[jobId]/route.ts`
- [x] T079 [US5] Implementar handler idempotente de detecção MIME/magic bytes, limites e ClamAV
      fail-closed em `apps/worker/src/jobs/scan-file.ts` e `apps/worker/src/clamav.ts`
- [x] T080 [US5] Implementar promoção limpa, rejeição, retry e reconciliador DB/storage em
      `apps/worker/src/jobs/promote-file.ts` e `apps/worker/src/jobs/reconcile-files.ts`
- [x] T081 [US5] Implementar liveness/readiness web e heartbeat/readiness worker em
      `apps/web/app/livez/route.ts`, `apps/web/app/readyz/route.ts`, `apps/worker/src/health.ts` e
      `packages/db/src/repositories/worker-heartbeat.ts`
- [x] T082 [P] [US5] Definir métricas, traces e alertas de latência, erros, fila, scanner e storage
      em `apps/web/modules/shared/metrics.ts`, `apps/worker/src/metrics.ts` e
      `infra/observability/alerts.yaml`
- [x] T083 [US5] Criar páginas autorizadas de jobs, progresso, falhas e redrive justificado em
      `apps/web/app/(admin)/operations/jobs/page.tsx`,
      `apps/web/app/(admin)/operations/jobs/[jobId]/page.tsx` e
      `apps/web/modules/jobs/ui/redrive-dialog.tsx`
- [x] T084 [US5] Executar validação independente da US5 e registrar SC-007/SC-010 em
      `specs/001-project-foundation/evidence/us5-operations.md`

**Checkpoint**: US5 prova jobs observáveis/idempotentes e ciclo de arquivo seguro sem fail-open.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Consolidar qualidade, segurança, documentação e entrega sem ampliar o escopo funcional.

- [x] T085 [P] Regenerar e validar o contrato final em
      `specs/001-project-foundation/contracts/openapi.yaml` e registrar ausência de drift em
      `specs/001-project-foundation/evidence/contracts.md`
- [x] T086 [P] Criar testes canário contra vazamento de senha, token, cookie, stack e PII em
      `apps/web/tests/integration/redaction.test.ts` e `apps/worker/tests/redaction.test.ts`
- [x] T087 [P] Criar testes SC-006 para login, MFA, navegação, listagem/gravação de
      usuários/permissões e pesquisa de auditoria em `apps/web/tests/performance/foundation.k6.ts` e
      registrar perfil operacional, dados sintéticos e resultados em
      `specs/001-project-foundation/evidence/performance.md`
- [x] T088 Revisar imports e remover abstrações sem três usos reais conforme KISS/DRY/YAGNI em
      `apps/web/modules/`, `apps/worker/src/` e `packages/`
- [ ] T089 Obter aprovação Jurídico/DPO e implementar inventário, finalidade, acesso, retenção,
      anonimização/descarte e preservação legal por categoria em `docs/privacy/data-inventory.md`,
      `docs/privacy/retention-policy.md`, `apps/worker/src/jobs/apply-retention.ts` e
      `specs/001-project-foundation/evidence/privacy.md`; bloquear PROD enquanto a aprovação ou os
      controles estiverem incompletos
- [x] T090 Executar SAST, secret scan, dependency scan e revisão dos controles ASVS; atualizar
      evidências em `docs/security/asvs-v5-l2-foundation.md` e
      `specs/001-project-foundation/evidence/security.md`
- [x] T091 Validar backup/restauração local e rollback de migrations sem apagar dados em
      `infra/postgres/backup.ps1`, `infra/postgres/restore.ps1` e
      `specs/001-project-foundation/evidence/recovery.md`
- [x] T092 [P] Documentar operação, incidentes, credenciais comprometidas, fila esgotada e scanner
      indisponível em `docs/runbooks/foundation.md`
- [x] T093 [P] Documentar arquitetura, fronteiras de módulos e decisões finais em
      `docs/architecture/foundation.md` e `docs/architecture/decisions/001-foundation.md`
- [x] T094 Executar todos os comandos e cenários de `specs/001-project-foundation/quickstart.md` em
      checkout limpo e registrar o resultado em
      `specs/001-project-foundation/evidence/final-validation.md`
- [ ] T095 Aplicar/validar os rulesets remotos `dev`/`main`, demonstrar bloqueio de push direto e
      promoção inválida e registrar evidências em
      `specs/001-project-foundation/evidence/branch-protection.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 — Setup**: sem dependências; T001–T003 são sequenciais, depois T004–T008 podem avançar
  em paralelo; T009 depende de T001 e dos arquivos de T008.
- **Phase 2 — Foundational**: depende da Phase 1 e bloqueia todas as histórias. Migrations T011–T014
  são ordenadas; T015/T016, T018, T023–T025 podem avançar em paralelo após seus setups.
- **Phases 3–7 — User Stories**: US1 depende da Phase 2; US2, US3 e US5 dependem da conclusão da
  US1; US4 depende da conclusão de US1, US2 e US3 para validar as telas reais.
- **Phase 8 — Polish**: depende de todas as histórias incluídas na entrega; T094 e T095 são os gates
  finais.

### User Story Dependencies

- **US1 (P1)**: inicia após Phase 2; não depende de outra história e constitui o MVP técnico.
- **US2 (P2)**: inicia após T040, pois seus serviços exigem a sessão e o MFA implementados pela US1;
  não depende da UI da US1 para suas regras.
- **US3 (P3)**: inicia após T040, pois pesquisa/exportação exigem identidade autenticada; não
  depende da US2.
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

After Phase 2, assign an owner to US1. After T040, owners for US2, US3 and US5 may work
concurrently; US4 starts after T061 so it can validate the real screens. Owners must preserve module
boundaries and coordinate shared-contract changes. A single integration owner regenerates OpenAPI
and runs T094. Only a human maintainer applies T095 and later merges `dev` into `main`.

---

## Notes

- `[P]` means safe file-level parallelism, not permission to ignore stated dependencies.
- `[USn]` maps directly to the five prioritized stories in `spec.md`.
- Tasks intentionally avoid modules de notícias, agenda, associados, parceiros e colaboradores.
- Testes de banco usam PostgreSQL real; mocks não comprovam constraints, privilégios ou
  concorrência.
- Nunca usar dados pessoais reais, segredos ou credenciais de PROD em local/CI/evidências.
- Cada tarefa ou grupo coeso deve resultar em diff pequeno e revisável para PR em `dev`.

## Harmonização administrativa — 11/09/2026

- [x] Padronizar temas, cabeçalhos, abas, buscas, filtros e ações de adicionar.
- [x] Atualizar início com dados autorizados e notícias publicadas; preservar rascunhos privados.
- [x] Adotar Colaboradores para a gestão de contas existente e remover proposta de RH.
- [x] Conferir visualmente desktop/390 px, teclado e temas claro/escuro.
- [x] Abrir [PR #16](https://github.com/Komunick/caabnovo/pull/16), dependente de Associados #15.
- [x] Conciliar o registro histórico: PR #16 integrado; validação atual consolidada em
      [evidence/readiness-2026-09-16.md](evidence/readiness-2026-09-16.md).

## Seleção individual de acessos e ajustes da marca — 11/09/2026

- [x] Confirmar seleção de módulos e ações individualmente e registrar plano/pesquisa no spec
      existente.
- [x] Implementar conjunto individual versionado, permissões efetivas, rota protegida e auditoria
      atômica.
- [x] Revalidar permissões em Associados e distinguir consulta, edição/publicação e mídia em
      Notícias.
- [x] Implementar matriz no perfil com dependências, justificativa, limites de autoridade e retorno
      de salvamento.
- [x] Validar contrato, rota, revogação, concorrência, rollback de auditoria e último administrador
      em banco descartável.
- [x] Corrigir cores do login e centralizar Gestão Interna abaixo da logo, preservando a imagem
      original.
- [x] Concluir inspeção do painel autenticado nos dois temas.
- [x] Conciliar a entrega do PR #16 já integrado, sem reabrir a branch; CI posterior do painel
      documentado em [evidence/readiness-2026-09-16.md](evidence/readiness-2026-09-16.md).

## Campos comuns — revisão de 11/09/2026

- [x] CF01 Inventariar formulários existentes e extrair máscaras/contratos/avisos compartilhados.
- [x] CF02 Aplicar aos campos de Associados, Colaboradores, login, recuperação e Configurações;
      preservar autorização e dados.
- [x] CF03 Testar telefone fixo/celular, CPF/CNPJ, CEP/falhas/concorrência, e-mail/site inválidos e
      teclado; concluir gates e PR próprio.

Validação local em 14/09/2026: [evidências dos campos comuns](evidence/common-fields.md).

- [x] CF-CI Corrigir pull de MinIO/mc no CI usando o registro oficial Quay com as mesmas tags;
      validar imagens, Compose e repetir os checks do PR 19.

## Ampliação autorizada do PR #19 — 14/09/2026

- [x] CF04 Inventariar todos os controles e padronizar mensagens/limites em abas, filtros e diálogos
      de todos os módulos.
- [x] CF05 Separar endereço compartilhado em rua/bairro/número/complemento, preservar legado e
      consulta CEP concorrente; integrar consumidores no PR #18.
- [x] CF06 Aplicar OAB numérica até seis caracteres em todos os campos específicos e contratos,
      preservando busca mista e dados existentes.
- [x] CF07 Validar contratos, integração, E2E por módulo, teclado/Axe, temas/responsividade e build;
      atualizar PRs sem merge e preview com dados preservados.

- [x] CF08 Explicitar JPG em todos os seletores e mensagens de imagens, preservar formatos
      existentes e validar upload real/inspeção no PR #19.

## Padronização de justificativas — 14/09/2026

- [x] JP01 Inventariar criação/alteração e registrar regra, pesquisa e plano.
- [x] JP02 Implementar contrato, serviço, auditoria e formulário desta área.
- [x] JP03 Validar criação sem motivo, edição recusada sem motivo e auditoria preservada.
- [x] JP04 Concluir gates e evidências da entrega compartilhada em branch nova antes do PR.

Validação de justificativas e resultado OAB:
[evidências de 14/09/2026](evidence/justification-oab.md).

## Armazenamento PostgreSQL — 14/09/2026

- [x] DBF01 Criar migration aditiva e repositório de conteúdo no banco principal.
- [x] DBF02 Implementar upload/download pelo painel, grants limitados e proteção de quarentena.
- [x] DBF03 Adaptar worker, exportações e leitura legada; fornecer cópia verificável do S3.
- [x] DBF04 Validar integridade, concorrência, permissões e regressões de imagens no CI.
- [x] DBF05 Documentar configuração, transição, backup e resultados da entrega.

Resultados e limites: [evidências do armazenamento](evidence/database-files.md).

## Regra vigente: nenhuma justificativa obrigatória — 14/09/2026

- [x] RM01 Remover exigências de justificativa nos contratos, serviços e persistência desta função.
- [x] RM02 Retirar campos e bloqueios de motivo em todas as telas da função.
- [x] RM03 Validar fluxos sem motivo, auditoria preservada e controles de autorização; registrar
      evidências da entrega compartilhada.

Evidências RM03:
[validação final de 15/09/2026](../001-project-foundation/evidence/reason-removal-2026-09-14.md).

## Retirada do MinIO — 15/09/2026

- [x] SR01 Retirar backend/adaptadores/CLI/SDKs S3, mantendo PostgreSQL e proteção dos arquivos.
- [x] SR02 Atualizar Compose, configuração, documentação e testes para o backend único.
- [x] SR03 Validar gates, documentar limitações de implantação e concluir evidências.

## Busca geral por funções — 15/09/2026

- [x] BS01 Catalogar rotas/funções existentes e suas permissões, incluindo OAB e benefícios.
- [x] BS02 Busca por palavras sem acentos, resultados com contexto e navegação por teclado.
- [x] BS03 Validar destinos, permissões, teclado/celular e evidências; atualizar localhost limitado.

## Abertura de telas e navegação — 15/09/2026

- [x] NV01 Recuperar diagnóstico, pesquisar guias oficiais e definir escopo/plano.
- [x] NV02 Implementar limites de carregamento e feedback dos links centrais.
- [x] NV03 Carregar blocos da inicial independentemente preservando conteúdo/permissões.
- [x] NV04 Validar atraso controlado, interrupção, shell, acessibilidade e regressões no CI.
- [x] NV05 Revisar capturas sintéticas do build remoto, registrar evidências e preparar PR. Preview
      local adiado por pedido posterior do usuário: web e banco desligados; não reativar. Código
      7c07626 aprovado no CI34990339186: 276 unitários,94 contratos,152 integrações, 66 E2E e6 a11y;
      evidências em evidence/navigation-speed-2026-09-15.md.

## Contraste do shell durante troca de tema — 16/09/2026

- [x] TH01 Diagnosticar browser/push do PR #28 e registrar pesquisa e critérios de aceite.
- [x] TH02 Corrigir transições do menu/busca e ampliar a regressão por quadros.
- [x] TH03 Conciliar validação de contraste já integrada: CI do PR #30 aprovado, incluindo
      navegador/acessibilidade; ver
      [evidence/readiness-2026-09-16.md](evidence/readiness-2026-09-16.md). Não reaplicar documentos
      da branch histórica.

## Navegação sem perda de edição — 16/09/2026

- [x] DP01 Integrar a preservação compartilhada às abas e formulários desta função.
- [x] DP02 Validar retorno, sucesso, cancelamento e isolamento; registrar
      [evidências](evidence/drafts-2026-09-16.md) no PR.

## Homologação e prontidão — 16/09/2026

- [x] HV01 Executar a verificação aplicável e registrar resultados reais, inclusive impedimentos;
      ver [evidências](evidence/readiness-2026-09-16.md).
- [x] HV02 Corrigir e testar as lacunas técnicas/documentais; retenção executável e OAB publicada
      continuam dependências externas explícitas.
- [x] HV03 Registrar resultados e impedimentos externos sem aprovações fictícias; CI final acompanha
      o PR.

## Integração de Mensagens — 16/09/2026

- [x] MG01 Registrar a área autorizada, atalhos e cabeçalho conforme spec 009; conferir as capturas
      de navegador no mesmo ciclo.

## Ordem de módulos — 16/09/2026

Pedido explícito do usuário: Notícias primeiro (após Início), Mensagens penúltimo imediatamente
antes de Auditoria; manter utilidades da conta. Compartilhar ordem entre navegação e catálogo de
áreas. Agendamentos de Mensagens na busca de funções.

## Senha inicial — 17/09/2026

- [x] IP001 Registrar pesquisa e contratos do formato palavra + seis dígitos.
- [x] IP002 Criar hash/credencial atomicamente e proteger idempotência.
- [x] IP003 Exibir recibo de senha e permitir geração inicial para cadastro sem senha.
- [x] IP004 Testar login, recuperação, autorização, concorrência, rollback e não exposição.
- [x] IP005 Validar interface desktop/mobile, acessibilidade, gates e preparar PR para dev.

## Clarify de acesso e exportação — 21/09/2026

- [ ] AX01 Adequar catálogo e gestão de permissões à permissão geral de exportação, combinada com
      acesso ao módulo/dados; converter automaticamente quem já possui alguma permissão de
      exportação, sem conceder a quem não a possui e sem alterar leitura dos módulos; garantir
      idempotência e validar ambos os perfis.
- [ ] AX02 Conferir e ajustar ocultação completa dos módulos sem acesso na barra lateral, busca e
      Início; manter autorização de URL/API e atualização após revogação.
- [ ] AX03 Validar por interface/API perfis sem acesso, acesso parcial, com/sem exportação e
      revogação; zero cartões, atalhos ou resultados dos módulos negados. Registrar evidências
      reais.

- [ ] DX01 Detalhar/adequar exportação de Colaboradores conforme 002 EXP06/EXP07, com filtros,
      seleção e ordenação de colunas autorizadas e download direto Excel/CSV/PDF integral; preservar
      autorização e validar os três formatos sem prazo ou limite funcional de período/registros.

- [ ] AX04 Integrar Notícias/Agendamentos à gestão de acesso por módulo e catálogo, coordenando
      consulta/alteração separadas e transição técnica com 004/008 AC01; validar ocultação e acesso
      privado negado sem concessão, sem alterar leitura pública.

Q10 de 21/09/2026: T089 permanece pendente por definição institucional posterior; descarte
automático desligado. Não marcar a política ou seus controles como concluídos pelo adiamento e não
alterar o gate de produção.

## Phase 9: Convergence — revisão de 21/09/2026

- [x] T096 Fechar cadastro público por e-mail, conciliando a correção preparada; HTTP negado e
      provisionamento administrativo validados no
      [CI de 7d4d507](https://github.com/Komunick/caabnovo/actions/runs/35617770034), incluindo
      auth-session, account-auth-hardening e initial-password. Sem reaplicar infraestrutura
      retirada. Implementado na branch de entrega; merge em dev pendente no PR #35. Origem:
      US1/FR-001–FR-004, Constituição IV; achado A03.
- [x] T097 Preservar mensagens de conflito e versão original ao navegar entre abas/módulos em todos
      os formulários; começar por NewsEditor e UserAccessForm, ampliar inventário dos estados de
      erro e validar retorno/salvar/cancelar/sair. Origem: decisão transversal de edição de 16/09 e
      DP01/DP02; A11 (partial).

Detalhamento de AX02/AX03: ocultar também a seção de notícias publicadas do Início sem news:read,
mantendo a leitura pública externa. Agendamentos no catálogo atual é incondicional. Não considerar
somente menus como cobertura do requisito (A06).

</details>

## Consolidação de segurança — 21/09/2026

Correção preparada em 17/09 incorporada nesta entrega: cadastro público por e-mail bloqueado,
provisionamento sintético dos testes sem endpoint de cadastro e atualizações de dependências
preservadas. Payload foi alinhado em 3.89.0 no worker, web e packages/news, preservando os usos
existentes e evitando duas versões incompatíveis. Nenhuma migration ou alteração de infraestrutura
retirada anteriormente foi reintroduzida. As decisões do clarify e as 108 tarefas novas continuam
planejadas, sem execução implícita. No CI de 7d4d507 passaram formatação, lint, tipos, 363 testes
unitários, 122 de contrato, 220 de integração, build e segurança. Suíte completa de
navegador/acessibilidade ainda em andamento neste checkpoint; acompanhar o PR #35. Localhost
permanece desligado. Evidências:
[segurança](../001-project-foundation/evidence/security-hardening-2026-09-17.md).

## Ampliação autorizada: ciclo de vida — 21/09/2026

- [x] T121 Especificar e implementar exclusão de colaboradores lógica após 24 horas, com bloqueio e
      revogação imediatos, conforme decisão confirmada; proteger último administrador, vínculos,
      sessões, concorrência, permissões e auditoria; validar API e interface.
- [x] T122 Expor Reativar colaborador no detalhe desativado usando PATCH versionado; registrar
      evento e validar reativação sem restaurar sessões antigas.
- [x] T123 Implementar nova senha administrativa pelo fluxo de primeira senha, com endpoint
      separado, confirmação, versão, cargo Administrador/Gestor atual, sem concessão individual nem
      Gestor sobre Administrador, segredo em memória transitória, revogação atômica e testes de
      contrato/integração/interface. Ver spec006.

Retenção confirmada: colaborador com bloqueio imediato e exclusão lógica após 24 horas. Associados
têm prazo de sete dias (spec005 LC01) e reservas exigem decisão explícita do responsável (spec008
LC01). T097 e T098–T120 permanecem no escopo previamente autorizado e não são concluídas por esta
ampliação.
