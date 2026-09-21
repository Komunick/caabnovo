# Validação do incremento — Fundação, Colaboradores e infraestrutura de exportação

**Estado de 21/09/2026:** roteiro de validação, não evidência de execução.
Localhost permanece desligado; comandos de infraestrutura dependem de ordem explícita.
Testes usam banco descartável; nunca aplicar seeds ao banco do preview principal.
Reutilizar a entrega ativa conforme mapa local e workflow, não a branch original já integrada.
Prazos/controles de retenção continuam pendentes (T089); não executar descarte nem
afirmar aprovação institucional. Lacunas atuais em [revisão](../002-integrated-modules/code-audit-2026-09-21.md).

## Estado e pré-requisitos

Pré-requisitos de execução futura: Node 24/pnpm do package.json, dependências fixadas,
PostgreSQL 18 descartável/Testcontainers e Chromium no CI. Nunca usar banco do preview
ou contas reais como seed. Localhost continua desligado; os comandos abaixo são roteiro,
não foram executados neste planejamento. Variáveis/segredos seguem `.github/workflows/ci.yml`.

```powershell
corepack pnpm install --frozen-lockfile
corepack pnpm test:unit
corepack pnpm test:contract
corepack pnpm test:integration apps/web/tests/integration/user-access.test.ts
corepack pnpm test:e2e user-administration.spec.ts --project=chromium
corepack pnpm test:a11y --project=chromium
```

O job browser existente prepara ambiente/contas sintéticos; não copiar seus seeds
para o preview principal. Testes de migração/conflito usam banco descartável. Antes
de entrega de código, completar format/lint/typecheck/build/security e evidências
visuais pelo workflow de CI, sem iniciar builds/serviços pesados no computador.

## Jornada independente

Aplicar o [perfil C1 de100 registros](../002-integrated-modules/export-validation-100.md). Medições/aceite definidos ali substituem massas grandes nesta rodada; nenhum teste de estresse ou alegação de capacidade em grande volume. U1 usa fixtures legadas sintéticas e as permissões atuais, conforme [contrato](../010-reports-analytics/contracts/legacy-downloads.md).

Executar os seis cenários de [cargos](contracts/roles.md), incluindo nova permissão disponível ao Administrador com override vazio e Gestor com consulta a todos os módulos, exportação e Relatórios completos, concedendo edição de Associados a terceiro sem possuir essa edição; testar UI/API, revogação e último Administrador.

Perfis Associados+Colaboradores com geral exportam só essas fontes; conversão preserva herança expirada/revogada e override vazio; sem módulo não há elemento nas três superfícies; writer respeita colunas, grande volume, CSRF, revogação e interrupção.

Para cada dataset do contrato, abrir Exportar [módulo], variar filtros, selecionar/reordenar colunas por teclado e baixar Excel/CSV/PDF. Ler arquivos com parsers independentes, confrontar IDs/contagem/conteúdo/ordem com a massa conhecida. Vazio mantém cabeçalho; mais de uma página não corta resultados.

Matriz negativa: anônimo, sessão revogada, sem acesso, leitura sem geral, geral sem
leitura, leitura+geral sem escrita, campo proibido, operação de outro usuário e
revogação entre lotes. Preservar filtros após falha; interrupção não retorna sucesso.
Testar teclado,390 px, desktop e temas. Módulos negados têm zero entradas no menu,
busca e Início; controles pessoais da conta continuam disponíveis.

## Evidência esperada

Registrar comandos, versões/commit, fixtures sintéticas, resultados, arquivos
validados e capturas em `specs/001-project-foundation/evidence/plan-2026-09-21-validation.md`
(arquivo futuro). Nunca marcar tarefas como concluídas por este roteiro.
Requisitos e representações: [modelo](data-model.md), [contrato](contracts/exports.md).

## Roteiro anterior — histórico

Não executar serviços/seeds indicados abaixo no preview principal. O roteiro atual
usa CI/banco descartável; passos substituídos não autorizam reativação local.

<details>
<summary>Roteiro anterior preservado</summary>

# Quickstart Validation Guide: Fundação do Sistema CAAB

Este guia descreve a validação esperada depois da implementação. Os comandos são contratos do plano;
eles serão materializados pelas tarefas de implementação.

Para implantação fora do localhost e mudanças de domínio/repositório, consultar
[configuração de implantação e revisão de ambiente](../../docs/DEPLOYMENT-CONFIG-AUDIT.md).
O compose e os endereços locais deste guia não representam a configuração do site publicado.

## Prerequisites

- Git repository with protected `dev` and `main` branches.
- Node.js 24 LTS and Corepack/pnpm.
- Docker-compatible runtime for PostgreSQL, ClamAV and test containers.
- Local `.env` derived from `.env.example`, containing only development credentials.
- No production secrets or real personal data.

## Repository flow

```powershell
git switch dev
git pull --ff-only
git switch -c feature/project-foundation
```

All work from this branch must enter through a Pull Request to `dev`. A later production promotion
must be a human-approved Pull Request from `dev` to `main`; direct pushes remain blocked.

## Local setup

```powershell
corepack enable
pnpm install --frozen-lockfile
docker compose up -d postgres clamav otel-collector
pnpm db:migrate
pnpm db:seed:dev
pnpm dev
# Em outro terminal:
pnpm dev:worker
```

Expected outcome:

- Web and worker become ready without creating schema at runtime.
- `/livez` responds when the web process is alive.
- `/readyz` succeeds only when required dependencies are usable.
- Seed data contains synthetic users, roles and permissions only.

## Gate suite

```powershell
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm test:integration
pnpm test:contract
pnpm test:e2e
pnpm test:a11y
pnpm build
pnpm security:scan
```

Every command must exit successfully before a Pull Request can merge. Contract validation regenerates
OpenAPI and fails if [openapi.yaml](./contracts/openapi.yaml) drifts from runtime schemas.

## Scenario 1: Authentication and permissions

1. Sign in with an active ordinary test user and confirm only permitted navigation/actions appear.
2. Call a forbidden operation directly and confirm safe `403`, no protected data and a security event.
3. Sign in with an administrator test user using e-mail/password; confirm no MFA challenge
   and deny actions outside the granted permissions.
4. Revoke the session and repeat the next protected request; confirm immediate `401`.
5. Disable the user and confirm all sessions are revoked.

Expected evidence: automated tests for SC-001/SC-002, redacted security events and no session cache.

## Scenario 2: Roles and least privilege

1. Create a synthetic user with a non-administrative role, without a written justification.
2. Verify the user receives exactly the role's active permissions.
3. Attempt to grant a permission the acting administrator cannot manage; confirm denial.
4. Grant then revoke an allowed role and confirm the next request observes the change.
5. Attempt to remove/disable the last active administrator; confirm conflict and preserved access.

Expected evidence: user/role changes and audit events commit atomically; no self-escalation is possible.

## Scenario 3: Append-only audit

1. Perform representative critical changes for users, roles, files and job redrive.
2. Search by actor, action, entity and period as an auditor.
3. Try UPDATE and DELETE using the runtime database role; both must fail at database level.
4. Force audit insertion failure in an integration test; confirm the critical mutation rolls back.
5. Scan audit, application logs and errors for seeded secrets/PII canaries; none may appear.

Expected evidence: SC-003/SC-004 pass and each event carries request/correlation IDs.

## Scenario 4: Secure file lifecycle

1. Request an upload intent as an authorized user and upload to quarantine.
2. Finalize with the expected checksum and observe queued scan progress.
3. Confirm download remains denied until type/signature/size and antivirus checks pass.
4. Upload a MIME-mismatch sample, an antivirus test file and an oversized file; all remain unavailable.
5. Stop ClamAV and retry; status becomes retryable/error and never `available`.

Expected evidence: only clean files transition to `available`; private download URLs are short-lived
and authorized. See [data-model.md](./data-model.md) for transitions.

## Scenario 5: Job idempotency and observability

1. Submit the same idempotency key and fingerprint concurrently.
2. Confirm one domain job/effect and a stable status reference.
3. Simulate a retryable failure; confirm finite retries, monotonic progress and correlation continuity.
4. Exhaust retries; confirm safe terminal failure and visible queue age/depth metrics.
5. Redrive as an authorized operator without a written justification; confirm audit and no duplicate business effect.

Expected evidence: SC-007/SC-010 pass and the [jobs contract](./contracts/jobs.md) is honored.

## Scenario 6: Accessibility and responsiveness

1. Complete login, navigation, user administration and audit search using keyboard only.
2. Run automated Axe checks on each essential page and important error/loading state.
3. Manually verify focus order/visibility, accessible names, contrast, zoom/reflow and a screen reader.
4. Check that no state is communicated by color or icon alone and all UI icons use Lucide React.
5. Repeat essential flows at supported desktop and tablet widths.

Expected evidence: SC-008 passes with automated report plus signed manual checklist.

## Branch protection validation

Verify repository rules before merging:

- `dev`: PR required without mandatory approving review, resolved conversations, current branch,
  unique required checks, no direct/force push or deletion, rules applied to administrators.
- `main`: update restricted to maintainers, PR head must be `dev`, CODEOWNER/maintainer approval,
  complete gates, no automated bypass and no force push/deletion.
- CI rejects a PR to `main` whose head is not `dev`.

Expected evidence: SC-009 passes, including a deliberately blocked direct push and invalid promotion.

## Privacy and retention validation

1. Confirm the Jurídico/DPO-approved inventory lists every personal-data category, purpose, access,
   retention period, disposal/anonymization action and legal-preservation exception.
2. Run retention with synthetic expired data and confirm the approved action and audit evidence.
3. Apply a legal-preservation exception and confirm disposal is blocked and escalated without data
   loss.
4. Confirm no production promotion is possible while the policy, approval or automated controls are
   missing.

Expected evidence: FR-030 passes without inventing a retention period in code or configuration.

## Final acceptance

The Foundation is ready for merge to `dev` only when:

- All commands in the gate suite pass from a clean checkout.
- All scenarios above have retained evidence.
- The approved permission matrix and ASVS v5.0.0 L2 evidence matrix are attached to the PR.
- The personal-data inventory and retention/disposal policy are approved by Jurídico/DPO, their
  controls pass with synthetic data and unresolved items block production promotion.
- Security/privacy-sensitive changes have a named human reviewer.
- Rollback and migration notes contain no destructive shortcut or real personal data.

</details>
