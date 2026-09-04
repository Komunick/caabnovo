# Implementation Plan: Fundação do Sistema CAAB

**Branch**: `feature/project-foundation` | **Date**: 2026-09-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-project-foundation/spec.md`

**Note**: This template is filled in by the `$speckit-plan` command; its definition describes the execution workflow.

## Summary

Entregar a base segura do sistema administrativo CAAB como monólito modular com aplicação web e
worker no mesmo repositório. A fundação abrange autenticação com MFA administrativo, autorização por
permissão, usuários, auditoria append-only, arquivos em quarentena, jobs idempotentes,
observabilidade, UI acessível e fluxo protegido `feature/* -> dev -> main`. A abordagem usa
PostgreSQL como autoridade, adaptadores server-side finos e contratos versionados, mantendo os
demais domínios fora do escopo até suas próprias especificações.

## Technical Context

**Language/Version**: Node.js 24 LTS; TypeScript 6.x em modo `strict`; SQL PostgreSQL

**Primary Dependencies**: Next.js 16.x, React 19.x, Better Auth, Drizzle ORM, Zod 4, pg-boss,
Tailwind CSS, shadcn/ui, Radix UI, Lucide React, OpenTelemetry JS e cliente S3-compatible; versões
patch serão fixadas pelo lockfile e atualizadas somente por PR

**Storage**: PostgreSQL 18 para dados operacionais, permissões, jobs e auditoria; object storage
S3-compatible para arquivos; bucket/prefixo privado de quarentena separado do conteúdo liberado

**Testing**: Vitest para unidade/integração, Testcontainers com PostgreSQL real, Playwright para E2E,
`@axe-core/playwright` mais revisão manual WCAG, testes de contrato OpenAPI e scanners de
dependências, código e segredos

**Target Platform**: Containers Linux para aplicação web e worker; navegadores nas duas versões
estáveis mais recentes de Chrome, Edge, Firefox e Safari; interface desktop-first responsiva para
tablets

**Project Type**: Aplicação web administrativa e worker, organizados como monólito modular em um
único repositório

**Performance Goals**: 95% das execuções de login, MFA, navegação, listagem/gravação de usuários e
permissões e pesquisa de auditoria apresentam resposta perceptível em até 2 segundos sob perfil
operacional aprovado; operações longas retornam aceite e progresso; falhas operacionais são
correlacionáveis em até 5 minutos conforme SC-006 e SC-010

**Constraints**: OWASP ASVS v5.0.0 nível 2, LGPD, WCAG 2.2 AA, MFA para administradores,
autorização server-side em toda ação, auditoria append-only, revogação imediata sem cache de sessão,
sem Redis na primeira versão, sem dados pessoais reais em testes e merge em `main` somente humano

**Scale/Scope**: Carga administrativa interna; cinco jornadas, 30 requisitos e nove entidades-base.
O teste de carga usará o perfil operacional aprovado e demonstrará os objetivos da especificação;
nenhuma população externa ou volume não confirmado será presumido

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Pre-Phase 0**: PASS

- **KISS/DRY/YAGNI**: PASS — uma aplicação, um worker e packages compartilhadas somente quando já
  exigidas; sem microserviços, Redis, multi-tenancy ou abstrações genéricas.
- **Monólito modular**: PASS — a Fundação implementa somente autenticação, usuários, auditoria,
  arquivos e jobs; módulos futuros não recebem casos de uso antecipados.
- **PostgreSQL como autoridade**: PASS — sessões, RBAC, auditoria e estado dos jobs residem no banco;
  storage mantém somente binários e não decide autorização.
- **Segurança e privacidade**: PASS — MFA administrativo, deny-by-default, ASVS L2, validação de
  entrada, uploads em quarentena, redação e minimização estão no desenho.
- **Auditoria e histórico**: PASS — mudanças críticas e auditoria entram na mesma transação;
  aplicação não possui privilégios de UPDATE/DELETE sobre eventos.
- **Integrações e jobs**: PASS — jobs possuem chave idempotente, correlação, retries finitos e estado
  terminal; nenhum scraping/OAB pertence a esta feature.
- **Acessibilidade**: PASS — WCAG 2.2 AA, Radix, Lucide, Axe e revisão manual são gates.
- **Qualidade e entrega**: PASS — lint, typecheck, testes, build, autorização e rulesets `dev/main`
  são obrigatórios.

**Post-Phase 1**: PASS — o modelo de dados, contratos e guia de validação preservam todos os gates;
nenhuma exceção constitucional ou complexidade não justificada foi introduzida.

## Project Structure

### Documentation (this feature)

```text
specs/001-project-foundation/
├── plan.md              # This file ($speckit-plan command output)
├── research.md          # Phase 0 output ($speckit-plan command)
├── data-model.md        # Phase 1 output ($speckit-plan command)
├── quickstart.md        # Phase 1 output ($speckit-plan command)
├── contracts/           # Phase 1 output ($speckit-plan command)
└── tasks.md             # Phase 2 output ($speckit-tasks command - NOT created by $speckit-plan)
```

### Source Code (repository root)
```text
apps/
├── web/
│   ├── app/
│   │   ├── (auth)/
│   │   ├── (admin)/
│   │   └── api/v1/
│   ├── components/ui/
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── audit/
│   │   ├── files/
│   │   └── jobs/
│   └── tests/
│       ├── contract/
│       ├── integration/
│       └── e2e/
└── worker/
    ├── src/jobs/
    └── tests/

packages/
├── db/
│   ├── src/
│   └── migrations/
├── contracts/
│   └── src/
└── config/

infra/
├── app/
├── worker/
├── postgres/
├── storage/
└── observability/
```

**Structure Decision**: monorepo com aplicação e worker como executáveis do mesmo monólito. `db`
existe porque web e worker compartilham transações, schema e migrations; `contracts` existe porque
HTTP e payloads de jobs exigem validação comum; `config` centraliza configurações consumidas pelos
projetos. Componentes visuais permanecem em `apps/web`, pois ainda não há terceiro uso que justifique
`packages/ui`. Subpastas internas de módulo só serão criadas quando tiverem conteúdo real.

## Complexity Tracking

Nenhuma violação constitucional foi identificada; não há exceções a justificar.
