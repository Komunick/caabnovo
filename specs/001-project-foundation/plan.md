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

## Harmonização administrativa — 11/09/2026

A experiência administrativa existente passa a usar azul, branco e vermelho, com cores
equivalentes no modo escuro. Cabeçalhos, abas, buscas, filtros, botões e formulários seguem
componentes e estilos compartilhados; ações de adicionar têm ícone `+` e alvo de 48 px.
O atalho visível da busca é `Ctrl + K`. A logo preserva a transparência original e o botão
de recolher acompanha o menu fixo durante a rolagem.

A inicial apresenta atalhos autorizados, quatro notícias publicadas mais recentes,
rascunhos e cadastros sem análise. Próximos módulos aparecem como planejamento, sem
indicadores fictícios. A versão pública é usada nas notícias, sem expor revisões privadas.

Colaboradores é o nome da gestão de Usuários existente, conforme
[decisão de escopo](../../docs/EMPLOYEES-BOUNDARIES.md). Não existe nova área de RH.
Parceiros continua representando externos. Toda a linha das listas de pessoas abre o
perfil por link nativo, inclusive por teclado.

Implementação: componentes `ModuleNavigation`, `SearchField` e `FilterToggle` em
`apps/web/components/ui`; tokens e estilos globais; integração nas páginas existentes.
Validação: inspeção nos temas claro/escuro e 390 px, testes de navegação/autorização,
integração da seleção de notícias e gates do repositório. Evidências e limites em
`docs/VISUAL-REVIEW-2026-09-11.md`.

## Acessos individuais de Colaboradores — 11/09/2026

Solicitação confirmada: selecionar módulos e ações individualmente no perfil do colaborador,
incluindo consultar Associados e editar Notícias; atualizar o PR #16 existente.

Critérios: matriz agrupada por módulo com rótulos simples, justificativa e confirmação de
salvamento; seleção efetiva após recarregar; negativa também em rotas/serviços e navegação;
preservar acessos das contas existentes até edição explícita; nenhuma autoelevação, concessão
além da autoridade do operador ou remoção do último administrador capaz de gerir acessos.

Plano: migration aditiva `user_access` com conjunto explícito e versão. Sem configuração
individual, manter RBAC existente e acesso editorial anterior. Uma view de permissões efetivas
unifica leitura da sessão, identidade e serviços; com seleção individual, apenas as ações
selecionadas são concedidas. Perfis legados permanecem para histórico e compatibilidade.
Notícias passa a distinguir leitura, edição e publicação, com revalidação transacional.
Serviço de atualização bloqueia conta/concorrência, revalida o operador, valida dependências,
grava conjunto e auditoria na mesma transação e protege o último administrador.

Pesquisa: OWASP Authorization Cheat Sheet, consultada em 11/09/2026:
https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
Aplicar menor privilégio, negação por padrão para a seleção explícita e checagem no servidor
em cada requisição. UI isolada não autoriza. Alternativas rejeitadas: esconder somente menu;
criar um perfil compartilhado por combinação; alterar permissões de um perfil que afeta outras
contas. Compatibilidade editorial é limitada às contas sem seleção explícita, nunca um fallback
após uma permissão individual removida.

Validação: testes de contrato, rota/CSRF, banco descartável (revogação, autoridade, concorrência,
auditoria atômica, administrador), notícias somente leitura e E2E de seleção/recarregamento;
inspeção visual claro/escuro e 390 px. Não usar contas ou dados pessoais reais para mutações.
