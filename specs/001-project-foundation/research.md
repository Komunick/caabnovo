# Research: Fundação do Sistema CAAB

**Date**: 2026-09-04

Todas as decisões abaixo resolvem o contexto técnico do plano. Não restam marcadores `NEEDS
CLARIFICATION`.

## Autenticação, sessões e MFA

**Decision**: usar Better Auth com adaptador Drizzle/PostgreSQL, sessões opacas persistidas e
`session.cookieCache` desabilitado. Ativar TOTP e códigos de recuperação para MFA. Administradores
devem concluir TOTP em toda autenticação, sem dispositivo confiável, e não podem manter papel
administrativo quando o fator deixa de estar habilitado.

**Rationale**: mantém identidade e revogação no PostgreSQL, integra diretamente com Next.js e oferece
fluxo oficial de TOTP. A ausência de cache de sessão preserva a revogação imediata exigida.

**Alternatives considered**:

- Auth.js: integração sólida, porém RBAC e MFA TOTP exigiriam mais código de segurança próprio.
- Keycloak: adequado para SSO/federação futura, mas adiciona serviço e operação sem requisito atual.
- IdP gerenciado: reduz operação, mas desloca autoridade e dados para fornecedor externo.

**Sources**: [Better Auth Next.js](https://better-auth.com/docs/integrations/next),
[Drizzle adapter](https://better-auth.com/docs/adapters/drizzle),
[session management](https://better-auth.com/docs/concepts/session-management),
[2FA](https://better-auth.com/docs/plugins/2fa),
[Next.js authentication](https://nextjs.org/docs/app/guides/authentication).

## Autorização

**Decision**: manter RBAC próprio com permissões concretas em tabelas relacionais e um guard
server-side `requirePermission(resource, action)`. Better Auth autentica e gerencia sessões; o domínio
CAAB é a única autoridade sobre permissões. Cada Server Action, Route Handler e caso de uso chama o
guard; papéis fornecidos pelo cliente nunca são aceitos.

**Rationale**: separa autenticação de regras de domínio, preserva menor privilégio e torna alterações
efetivas na próxima ação. O guard lê conta ativa e atribuições no banco antes da decisão.

**Alternatives considered**:

- ACL do plugin de autenticação como fonte única: rejeitada por acoplar regras CAAB à biblioteca.
- JWT com permissões: rejeitado porque manteria autorizações revogadas até expirar.
- Autorização apenas na UI: rejeitada porque qualquer endpoint pode ser chamado diretamente.

**Sources**: [Next.js data security](https://nextjs.org/docs/app/guides/data-security),
[Next.js Backend for Frontend](https://nextjs.org/docs/app/guides/backend-for-frontend).

## Monólito modular e fronteiras

**Decision**: uma aplicação Next.js e um worker no mesmo repositório. Server Components usam DAL
server-only diretamente; Route Handlers e Server Actions são adaptadores finos. Cada módulo expõe
uma API interna explícita e imports cruzados são limitados por lint.

**Rationale**: evita round-trip HTTP interno, concentra regras no servidor e preserva fronteiras sem
microserviços. Somente módulos da Fundação são criados nesta entrega.

**Alternatives considered**:

- Microserviços por domínio: rejeitados por YAGNI e custo operacional.
- Toda comunicação via HTTP interno: rejeitada por latência e duplicação de segurança.
- Regra de negócio em componentes ou handlers: rejeitada por duplicação e risco de vazamento.

## Persistência e auditoria

**Decision**: PostgreSQL 18 com um único package Drizzle para schema, consultas e migrations; SQL
explícito quando necessário. Mutação crítica e evento de auditoria são atômicos. O papel runtime não
recebe UPDATE/DELETE na tabela append-only. Registros auditáveis usam exclusão lógica.

**Rationale**: banco e aplicação reforçam a mesma invariante; migrations reais reduzem divergência
entre ambientes.

**Alternatives considered**:

- Dois ORMs sobre as mesmas tabelas: rejeitados por drift.
- Auditoria depois do commit: rejeitada porque permite alteração sem trilha.
- Imutabilidade somente na aplicação: rejeitada por proteção insuficiente.

**Sources**: [Drizzle transactions](https://orm.drizzle.team/docs/transactions),
[Drizzle constraints](https://orm.drizzle.team/docs/indexes-constraints),
[PostgreSQL privileges](https://www.postgresql.org/docs/current/ddl-priv.html).

## Jobs duráveis

**Decision**: pg-boss sobre o PostgreSQL existente em `apps/worker`, sem Redis. Configurar retries,
backoff, expiração, heartbeat, retenção e dead-letter explicitamente. Manter `job_execution` próprio
para progresso, correlação e estado estável. Enqueue causal e mutação de domínio compartilham
transação; efeitos externos usam chave idempotente única.

**Rationale**: pg-boss fornece locks, leases, retries e monitoramento sem novo datastore. Como o
processamento é at-least-once, idempotência permanece obrigatória.

**Alternatives considered**:

- Graphile Worker: sólido, mas exige mais modelagem para histórico/progresso e operação de DLQ.
- Jobs do CMS: rejeitados como infraestrutura transversal para não acoplar domínios ao editorial.
- BullMQ/Redis ou fila artesanal: rejeitados por operação extra ou reinvenção de concorrência.

**Sources**: [pg-boss overview](https://github.com/timgit/pg-boss),
[pg-boss queues](https://github.com/timgit/pg-boss/blob/master/docs/api/queues.md),
[Graphile Worker](https://worker.graphile.org/docs).

## Arquivos e antivírus

**Decision**: object storage S3-compatible. Upload entra em prefixo privado de quarentena por URL
assinada curta e chave aleatória. O worker confirma tamanho/checksum, detecta MIME/assinatura,
aplica limites e escaneia com `clamd`; somente arquivos aprovados mudam para `available`. Downloads
privados exigem autorização e URL assinada curta. O scanner nunca falha aberto.

**Rationale**: separa binário do servidor web, impede leitura antes da validação e segue controles
OWASP para uploads não confiáveis.

**Alternatives considered**:

- Upload passando pelo processo web: rejeitado por consumo de memória, CPU e banda.
- Bucket público: rejeitado porque contorna autorização e quarentena.
- GuardDuty Malware Protection: alternativa válida se o ambiente final for AWS, mas cria acoplamento.

**Sources**: [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html),
[S3 presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html),
[S3 Block Public Access](https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-block-public-access.html),
[ClamAV scanning](https://docs.clamav.net/manual/Usage/Scanning.html).

## Observabilidade

**Decision**: OpenTelemetry JS para traces e métricas, exportados por OTLP a um Collector. Logs JSON
em stdout incluem `trace_id`, `span_id`, `request_id`, `correlation_id` e `job_id`, com allowlist e
redação; não dependem da API experimental de logs do SDK. `/livez` verifica apenas processo e
`/readyz` verifica dependências essenciais. O worker mantém heartbeat persistido.

**Rationale**: mantém o código independente de fornecedor, permite correlação web-fila-worker e
evita restart storm por liveness profunda.

**Alternatives considered**:

- Exportação direta para fornecedor: menor configuração, mas aumenta lock-in.
- Stack completa self-hosted: possível depois, porém operação prematura agora.
- Dependência externa em liveness: rejeitada porque causaria reinícios durante falha externa.

**Sources**: [OpenTelemetry JS](https://opentelemetry.io/docs/languages/js/),
[Next.js instrumentation](https://nextjs.org/docs/app/guides/instrumentation),
[OpenTelemetry Collector](https://opentelemetry.io/docs/collector/),
[Kubernetes probes](https://kubernetes.io/docs/concepts/workloads/pods/probes/).

## Contratos e validação

**Decision**: Zod 4 é a fonte dos schemas JSON-safe. O OpenAPI 3.1.1 contém operações e segurança
explícitas e componentes gerados; CI regenera, valida e falha em diff. Server Components chamam DAL;
HTTP `/api/v1` atende chamadas client-side e integrações que realmente precisem de contrato.

**Rationale**: validação runtime e documentação derivam da mesma definição sem introduzir framework
de rotas. Respostas também são validadas em testes de contrato.

**Alternatives considered**:

- OpenAPI totalmente manual: rejeitado por drift.
- Router/decorators adicionais: rejeitados como abstração prematura.
- Cliente gerado sem consumidor atual: adiado por YAGNI.

**Sources**: [Zod JSON Schema](https://zod.dev/json-schema),
[OpenAPI 3.1.1](https://spec.openapis.org/oas/v3.1.1.html),
[Next.js Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers).

## UI e acessibilidade

**Decision**: tokens Tailwind em variáveis CSS; shadcn/ui local sobre Radix; Lucide React como única
biblioteca de ícones. Preferir HTML nativo e usar Radix em widgets complexos. Axe cobre jornadas
essenciais, complementado por revisão manual de teclado, foco, contraste, zoom/reflow e leitor de
tela.

**Rationale**: código local permite revisão, Radix fornece bases acessíveis e Lucide mantém
consistência. Automação isolada não comprova WCAG completa.

**Alternatives considered**:

- Widgets complexos próprios: rejeitados pelo risco de foco/teclado.
- Segunda biblioteca de ícones: proibida pela constituição.
- Somente Axe: rejeitado porque não detecta todos os problemas.

**Sources**: [Radix accessibility](https://www.radix-ui.com/primitives/docs/overview/accessibility),
[Lucide React](https://lucide.dev/guide/react), [WCAG 2.2](https://www.w3.org/TR/WCAG22/),
[Playwright accessibility](https://playwright.dev/docs/accessibility-testing).

## Testes, ASVS e entrega

**Decision**: Vitest para políticas, redação, idempotência e schemas; Testcontainers PostgreSQL para
migrations, privilégios e atomicidade; Playwright para login, MFA, usuários, auditoria, escalada
horizontal/vertical e acessibilidade. Manter matriz de evidências OWASP ASVS v5.0.0 L2. Rulesets
protegem `dev` e `main`; PRs de trabalho vão a `dev` e somente `dev` pode promover a `main`, com
aprovação e merge humanos.

**Rationale**: cobertura orientada a risco prova invariantes reais no banco e nas jornadas. Rulesets
transformam a governança em controle verificável.

**Alternatives considered**:

- Mocks para testes de integridade: rejeitados por não provarem constraints ou privilégios.
- Meta global de cobertura como gate único: rejeitada por não provar autorização/auditoria.
- Dois repositórios DEV/MAIN: rejeitados por fragmentar histórico e fluxo.

**Sources**: [Testcontainers PostgreSQL](https://node.testcontainers.org/modules/postgresql/),
[Playwright assertions](https://playwright.dev/docs/test-assertions),
[OWASP ASVS](https://github.com/OWASP/ASVS),
[GitHub protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches).
