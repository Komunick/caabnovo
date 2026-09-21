# Implementation Plan: Fundação, Colaboradores e infraestrutura de exportação

**Branch da entrega**: `feature/access-export-foundation-20260921` | **Data**: 2026-09-21 **Spec**:
[spec.md](spec.md) | **Estado**: desenho concluído; implementação/validação pendentes.

## Summary

Consolidar exports:generate, ocultação por acesso e infraestrutura comum; oferecer exportação de
Colaboradores sem alterar a gestão existente.

US1 autenticação sem MFA; US2 permissões/Colaboradores; US4 navegação; US5 geração observável.
Retenção Q10/T089 continua adiada.

## Technical Context

TypeScript 6.0.3, Node 24, Next 16.3.4, React 19.2.8, Zod 4.5.4 e pg8.23.0 do checkout; PostgreSQL
18 no CI. Monólito modular; banco também armazena arquivos legados. Sem S3/MinIO novo. Testes Vitest
4.1.11, Playwright 1.62.1 e Axe existentes. UI desktop/390 px, temas, teclado e tokens
compartilhados. Exportação incremental com pg-cursor/ExcelJS propostos e PDFKit existente, sujeitos
a spike/versão fixada no código; nenhum pacote instalado agora.

**Performance/escala**: preservar p95 de 2s das telas comuns; não aplicar esse alvo a transferência
integral arbitrária. Exportações não têm teto funcional de registros/período. Aplicar o
[perfil C1 de100 registros](../002-integrated-modules/export-validation-100.md): medir
tempo/recursos e validar integridade, resposta do painel e recuperação. Sem prova de estresse/grande
volume nesta rodada; manter produto sem teto funcional de registros. **Restrições**: banco único,
autorização atual por ação; sem localhost, deploy, seed real, limpeza de dados ou implementação
nesta fase. Q10/Q11 e módulos futuros continuam adiados.

## Constitution Check

Pré-pesquisa: escopo decorre de Q1–Q11 e complementos, sem política institucional inferida.
Pós-desenho: monólito/fonte única, negação por padrão, auditoria mínima, integridade no PostgreSQL e
UI compartilhada preservados. Constituição 2.0.0 concilia justificativas já retiradas; autenticação
continua sem MFA. Abstração de exportação cobre oito consumidores reais, sem CRUD genérico. Não há
violação de desenho sem justificativa. Aprovações institucionais/produção permanecem pendentes;
compatibilidade do desenho não é execução de gates.

## Phase 0 — Research

Decisões, alternativas e fontes em [research.md](research.md), com pesquisa transversal
[de 21/09](../002-integrated-modules/research-2026-09-21.md). Leitura estática conclui as escolhas
necessárias para este recorte; limitações operacionais viram validações de implementação, não
requisitos indefinidos. Sem consulta a contas/dados de produção.

## Phase 1 — Design

I1 resolvido no desenho por decisão do usuário: Administrador recebe todo o catálogo e fornece a
primeira concessão de Agendamentos; não depende de já possuir uma chave individual. A regra Q4 de
conversão continua separada dessa autoridade por cargo.

- Migração aditiva `0025_general_export_permission.sql`: converter audit:export/reports:export nos
  arrays user_access e role_permission; deduplicar, incrementar version somente nos arrays
  alterados, preservar user_role, validade/revogação e override explícito vazio. Capturar matriz
  efetiva antes/depois e exigir mesma leitura de módulos. Não materializar RBAC nem conceder
  exportação a quem não a possuía.
- Migração0026: criar Gestor/Colaborador e scheduling:read/write/access:manage; resolver
  Administrador com todo o catálogo de permissões disponíveis, inclusive novas, independentemente de
  override. Gestor recebe consulta global, exportação geral e todas as ações de Relatórios; concede
  qualquer módulo a terceiros, inclusive alterações que não possui, mas não altera a si nem atribui
  cargos; Colaborador não concede. Remover baseline editorial geral; preservar override dos demais e
  vínculos vigentes. Autoridade de concessão e uso são separadas conforme
  [cargos](contracts/roles.md). Sem contas novas ou atribuição presumida dos novos cargos.
- Canonicalizar chaves antigas apenas nas guardas de downloads/snapshots legados durante transição.
  Novos catálogos e concessões aceitam só exports:generate. Revisar workers/file-service para não
  abrir bypass ou quebrar arquivos legados.
- Reutilizar areas.ts/search.ts para as três superfícies. Ocultar cartão inteiro, contadores,
  resultados/atalhos e ações de escrita não concedidas. Guardas de páginas/APIs permanecem
  obrigatórias; Conta e Sessões pessoais continuam disponíveis.
- Infraestrutura comum em apps/web/modules/exports: catálogo finito de adaptadores, formulário
  acessível, filtros e reordenação por teclado, writers, endpoint e estado operacional conforme
  contrato transversal. Não criar consultas SQL arbitrárias nem uma central obrigatória em
  Relatórios.
- Migração aditiva `0027_export_operations.sql` registra estado mínimo da requisição, sem
  conteúdo/filtros pessoais/arquivo. Aprovação de retenção não é presumida; auditoria append-only
  separada preservada.

Modelo em [data-model.md](data-model.md), interface em [contracts/exports.md](contracts/exports.md)
e [contrato comum](../002-integrated-modules/contracts/direct-exports.md). UI preserva
rascunhos/filtros e dados em falhas, sem exigir justificativa. Catálogo de colunas é allowlist por
função; servidor não confia no catálogo antigo do navegador.

Revisão de viabilidade: separar capacidade dos cursores da capacidade de controle; reautorizar
IDs/campos de cada lote sob estado atual; comunicar falhas anteriores ao stream por mensagem segura
do frame. Writers XLSX incluem marcador no limite físico e preservam Unicode/múltiplas colunas
longas. Detalhes no contrato comum, sem mudança da jornada de produto.

## Project Structure

- `apps/web/modules/auth/permissions.ts` (existente).
- `packages/contracts/src/user-access.ts` (existente).
- `packages/db/src/repositories/user-access.ts` (existente).
- `apps/web/modules/users/access-labels.ts` (existente).
- `apps/web/modules/users/user-access-service.ts` (existente).
- `apps/web/modules/workspace/areas.ts` (existente).
- `apps/web/modules/workspace/search.ts` (existente).
- `apps/web/modules/users/user-service.ts` (existente).
- `apps/web/modules/users/export-adapter.ts` e `export-adapter.test.ts` (novos planejados).
- `apps/web/app/(admin)/users/exportar/page.tsx` (nova planejada).

A revisão de código anterior em specs/002-integrated-modules/code-audit-2026-09-21.md permanece
preservada. T096 (fechar cadastro público) foi conciliada e validada nesta branch no CI de 7d4d507;
sua integração em dev permanece no PR #35; T097 preserva erros/versão de rascunhos. A
compatibilidade de audit_export deve fechar bypass pelo download genérico/binário com files:read
isolada, sem afetar anexos/documentos comuns.

## Rollout, migração e rollback

Uma entrega/worktree; mudanças SQL aditivas e numeradas coordenadas pela spec001. Preparar
compatibilidade de leitura de chaves/snapshots antes de ativar migrações e novos botões. Conta sem
acesso não ganha concessão para preservar conveniência. Diagnosticar conflitos antes da
restrição008; parar sem corrigir registros automaticamente. Rollback da UI/API deve preservar grants
convertidos, dados e arquivos; não publicar binário antigo que dependa exclusivamente de
audit:export/reports:export após conversão. Preferir correção compatível para frente; reversão SQL
exige plano e evidência próprios.

## Validation e próximo passo

Perfis Associados+Colaboradores com geral exportam só essas fontes; conversão preserva herança
expirada/revogada e override vazio; sem módulo não há elemento nas três superfícies; writer respeita
colunas, grande volume, CSRF, revogação e interrupção.

Executar roteiro [quickstart.md](quickstart.md) na implementação. Evidência anterior nunca conclui
tarefa nova. Pesquisa/plan encerrados; próximo comando desta solicitação: speckit-tasks, organizado
por história, com dependências e critérios independentes.

## Complexity Tracking

Núcleo comum necessário para aplicações repetidas em oito funções; adaptadores mantêm as regras dos
domínios. Sem microserviço, linguagem nova ou nova fonte de verdade. Estado operacional serve
somente à transferência atual; não é fila/histórico obrigatório.

## Histórico anterior — referência, não sequência executável atual

O conteúdo abaixo preserva decisões/evidências anteriores. Em caso de divergência, valem o desenho
de 21/09 acima e a spec vigente; não reabrir branches/PRs já integrados.

<details>
<summary>Plano anterior preservado</summary>

# Implementation Plan: Fundação do Sistema CAAB

**Branch**: `feature/project-foundation` | **Date**: 2026-09-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-project-foundation/spec.md`

**Note**: This template is filled in by the `$speckit-plan` command; its definition describes the
execution workflow.

## Summary

Entregar a base segura do sistema administrativo CAAB como monólito modular com aplicação web e
worker no mesmo repositório. A fundação abrange autenticação por e-mail/senha, sem MFA, autorização
por permissão, usuários, auditoria append-only, arquivos em quarentena, jobs idempotentes,
observabilidade, UI acessível e fluxo protegido `feature/* -> dev -> main`. A abordagem usa
PostgreSQL como autoridade, adaptadores server-side finos e contratos versionados, mantendo os
demais domínios fora do escopo até suas próprias especificações.

## Technical Context

**Language/Version**: Node.js 24 LTS; TypeScript 6.x em modo `strict`; SQL PostgreSQL

**Primary Dependencies**: Next.js 16.x, React 19.x, Better Auth, Drizzle ORM, Zod 4, pg-boss,
Tailwind CSS, shadcn/ui, Radix UI, Lucide React, OpenTelemetry JS; armazenamento binário no
PostgreSQL; versões patch serão fixadas pelo lockfile e atualizadas somente por PR

**Storage**: PostgreSQL 18 para dados operacionais, permissões, jobs, auditoria e arquivos bytea;
sem adaptador S3/legado; chave privada de quarentena separada do conteúdo liberado

**Testing**: Vitest para unidade/integração, Testcontainers com PostgreSQL real, Playwright para
E2E, `@axe-core/playwright` mais revisão manual WCAG, testes de contrato OpenAPI e scanners de
dependências, código e segredos

**Target Platform**: Containers Linux para aplicação web e worker; navegadores nas duas versões
estáveis mais recentes de Chrome, Edge, Firefox e Safari; interface desktop-first responsiva para
tablets

**Project Type**: Aplicação web administrativa e worker, organizados como monólito modular em um
único repositório

**Performance Goals**: 95% das execuções de login, navegação, listagem/gravação de usuários e
permissões e pesquisa de auditoria apresentam resposta perceptível em até 2 segundos sob perfil
operacional aprovado; operações longas retornam aceite e progresso; falhas operacionais são
correlacionáveis em até 5 minutos conforme SC-006 e SC-010

**Constraints**: OWASP ASVS v5.0.0 nível 2, LGPD, WCAG 2.2 AA, autenticação por e-mail/senha,
autorização server-side em toda ação, auditoria append-only, revogação imediata sem cache de sessão,
sem Redis na primeira versão, sem dados pessoais reais em testes e merge em `main` somente humano

**Scale/Scope**: Carga administrativa interna; cinco jornadas, 30 requisitos e nove entidades-base.
O teste de carga usará o perfil operacional aprovado e demonstrará os objetivos da especificação;
nenhuma população externa ou volume não confirmado será presumido

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

**Pre-Phase 0**: registro do desenho inicial; não é aprovação da implementação atual.

- **KISS/DRY/YAGNI**: PASS — uma aplicação, um worker e packages compartilhadas somente quando já
  exigidas; sem microserviços, Redis, multi-tenancy ou abstrações genéricas.
- **Monólito modular**: PASS — a Fundação implementa somente autenticação, usuários, auditoria,
  arquivos e jobs; módulos futuros não recebem casos de uso antecipados.
- **PostgreSQL como autoridade**: PASS — sessões, RBAC, auditoria e estado dos jobs residem no
  banco; storage mantém somente binários e não decide autorização.
- **Segurança e privacidade**: DESENHO — autenticação por e-mail/senha, deny-by-default, ASVS L2,
  validação de entrada, uploads em quarentena, redação e minimização estão no desenho.
- **Auditoria e histórico**: PASS — mudanças críticas e auditoria entram na mesma transação;
  aplicação não possui privilégios de UPDATE/DELETE sobre eventos.
- **Integrações e jobs**: PASS — jobs possuem chave idempotente, correlação, retries finitos e
  estado terminal; nenhum scraping/OAB pertence a esta feature.
- **Acessibilidade**: PASS — WCAG 2.2 AA, Radix, Lucide, Axe e revisão manual são gates.
- **Qualidade e entrega**: PASS — lint, typecheck, testes, build, autorização e rulesets `dev/main`
  são obrigatórios.

**Post-Phase 1**: avaliação histórica do desenho. A revisão de 21/09 registra lacunas de autorização
e gates institucionais pendentes; não representa certificação de segurança.

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
projetos. Componentes visuais permanecem em `apps/web`, pois ainda não há terceiro uso que
justifique `packages/ui`. Subpastas internas de módulo só serão criadas quando tiverem conteúdo
real.

## Complexity Tracking

Nenhuma violação constitucional foi identificada; não há exceções a justificar.

## Harmonização administrativa — 11/09/2026

A experiência administrativa existente passa a usar azul, branco e vermelho, com cores equivalentes
no modo escuro. Cabeçalhos, abas, buscas, filtros, botões e formulários seguem componentes e estilos
compartilhados; ações de adicionar têm ícone `+` e alvo de 48 px. O atalho visível da busca é
`Ctrl + K`. A logo preserva a transparência original e o botão de recolher acompanha o menu fixo
durante a rolagem.

A inicial apresenta atalhos autorizados, quatro notícias publicadas mais recentes, rascunhos e
cadastros sem análise. Próximos módulos aparecem como planejamento, sem indicadores fictícios. A
versão pública é usada nas notícias, sem expor revisões privadas.

Colaboradores é o nome da gestão de Usuários existente, conforme
[decisão de escopo](../../docs/EMPLOYEES-BOUNDARIES.md). Não existe nova área de RH. Parceiros
continua representando externos. Toda a linha das listas de pessoas abre o perfil por link nativo,
inclusive por teclado.

Implementação: componentes `ModuleNavigation`, `SearchField` e `FilterToggle` em
`apps/web/components/ui`; tokens e estilos globais; integração nas páginas existentes. Validação:
inspeção nos temas claro/escuro e 390 px, testes de navegação/autorização, integração da seleção de
notícias e gates do repositório. Evidências e limites em `docs/VISUAL-REVIEW-2026-09-11.md`.

## Acessos individuais de Colaboradores — 11/09/2026

Solicitação confirmada: selecionar módulos e ações individualmente no perfil do colaborador,
incluindo consultar Associados e editar Notícias; atualizar o PR #16 existente.

Critérios: matriz agrupada por módulo com rótulos simples, confirmação de salvamento; seleção
efetiva após recarregar; negativa também em rotas/serviços e navegação; preservar acessos das contas
existentes até edição explícita; nenhuma autoelevação, concessão além da autoridade do operador ou
remoção do último administrador capaz de gerir acessos.

Plano: migration aditiva `user_access` com conjunto explícito e versão. Sem configuração individual,
manter RBAC existente e acesso editorial anterior. Uma view de permissões efetivas unifica leitura
da sessão, identidade e serviços; com seleção individual, apenas as ações selecionadas são
concedidas. Perfis legados permanecem para histórico e compatibilidade. Notícias passa a distinguir
leitura, edição e publicação, com revalidação transacional. Serviço de atualização bloqueia
conta/concorrência, revalida o operador, valida dependências, grava conjunto e auditoria na mesma
transação e protege o último administrador.

Pesquisa: OWASP Authorization Cheat Sheet, consultada em 11/09/2026:
https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html Aplicar menor
privilégio, negação por padrão para a seleção explícita e checagem no servidor em cada requisição.
UI isolada não autoriza. Alternativas rejeitadas: esconder somente menu; criar um perfil
compartilhado por combinação; alterar permissões de um perfil que afeta outras contas.
Compatibilidade editorial é limitada às contas sem seleção explícita, nunca um fallback após uma
permissão individual removida.

Validação: testes de contrato, rota/CSRF, banco descartável (revogação, autoridade, concorrência,
auditoria atômica, administrador), notícias somente leitura e E2E de seleção/recarregamento;
inspeção visual claro/escuro e 390 px. Não usar contas ou dados pessoais reais para mutações.

## Plano dos campos comuns — 11/09/2026

Branch fix/common-field-validation, PR próprio para dev. Extrair a máscara já usada por Associados
para components/ui/masked-contact-input; reutilizar CPF e telefone e acrescentar CNPJ/CEP.
ValidatedTextField compartilha FormField, contrato, limites, validade nativa e aviso acessível.
BrazilianAddressFields cuida de consulta pontual ao ViaCEP com timeout/cancelamento e proteção de
alterações manuais. Contratos de contato em packages/contracts/src/brazilian-contact.ts; usados em
Associados, Colaboradores e Configurações. Login/recuperação mantêm autorização e não enviam dados
malformados. Revisar os campos existentes sem acrescentar endereço onde o domínio não o possui.
Parceiros consome esta branch em composição local; seu endereço/formulário específico fica no PR 18.
Validar contratos, máscara/edição, E2E dos formulários afetados, integração, build, acessibilidade e
CI.

# Ajuste de infraestrutura necessário ao CI — 14/09/2026

Trocar minio/minio e minio/mc pelo namespace oficial quay.io/minio, preservando as tags fixadas.
Validar manifests/pull e sintaxe do Compose, sem recriar serviços ou volumes locais. Reexecutar o CI
do mesmo PR; nenhum gate é dispensado.

## Ampliação dos campos — 14/09/2026

Evoluir FormField para apresentar validação nativa acessível de input/select/textarea, preservando
validadores específicos e descrições existentes. Substituir wrappers repetidos nos módulos e revisar
atributos contra contratos de cada domínio. Compartilhar contrato de endereço e formatação em
brazilian-address.ts; componente controla partes independentes, revisão manual por campo e conversão
explícita de legado. Parceiros consome os componentes pelo PR #18 dependente; schemas JSONB,
formulários e projeção preservam compatibilidade sem migration SQL. Implementação comum e OAB ficam
no PR #19; adaptações exclusivas de Parceiros ficam no PR #18. Validar unitários/contratos,
integrações afetadas, build, E2E de todos os módulos, acessibilidade e CI; compor preview 3107 após
validação isolada, sem seed real.

## Complemento JPG — 14/09/2026

Compartilhar constantes de seleção de imagens/documentos nos contratos e aplicá-las a fotos de
Associados, documentos, capas e imagens do corpo das Notícias. Anexos de contratos consomem a mesma
constante no PR #18. Validar JPEG real em upload e inspeção, preservando PNG e rejeição de conteúdo
incompatível.

## Histórico superado: padronização inicial de justificativas — 14/09/2026

1. Atualizar contratos de criação/alteração e registrar a distinção no serviço e auditoria.
2. Ajustar formulários e mensagens; manter ações sensíveis, permissões e concorrência.
3. Cobrir contratos negativos, criação sem motivo e motivo persistido em integração/E2E.
4. Executar formatação, lint, typecheck e testes sem serviços locais; CI executa banco, navegador e
   build. Abrir PR somente após validar a branch nova. Esta entrega é uma regra compartilhada coesa,
   coordenada pela spec 001, sem criar spec duplicada.

## Histórico superado: proposta inicial de migração PostgreSQL — 14/09/2026

Adicionar tabela de conteúdo bytea ligada a stored_file; manter metadados separados das listagens.
Prefixar novas chaves com database/ para selecionar o backend por arquivo, inclusive após troca de
configuração. Implementar grants HMAC com prazo de cinco minutos, rota binária com leitura limitada
e confirmação transacional de estado/checksum, adaptadores web/worker e exportação no banco.
Reaproveitar autorização e inspeção existentes. Fornecer cópia S3 → PostgreSQL com verificação de
tamanho/hash, sem apagar origem e sem mudar IDs/vínculos. Validar migração, concorrência, grants,
uploads, publicação e downloads no CI sem S3 para arquivos novos; manter testes legados do adaptador
S3.

## Regra vigente: nenhuma justificativa obrigatória — 14/09/2026

Atualizar contratos e serviços desta função para aceitar omissão/vazio; manter o campo opcional no
contrato para compatibilidade com clientes antigos. Retirar entradas, estados e bloqueios de
justificativa das telas. Normalizar ausência para vazio nas colunas históricas não nulas e para null
na auditoria; preservar autoria, resultado e datas. Migration aditiva de política retira somente
restrições de texto obrigatório, mantendo consistência das decisões. Não são necessários estados
especiais de criação de notícia. Cobrir ausência em contratos, autorização, integração e E2E;
executar banco/navegador/build no CI com serviços locais desligados.

## Plano de retirada do MinIO — 15/09/2026

1. Retirar adaptadores S3 e roteamento legado de web/worker; fixar as chaves novas em database/.
2. Persistir exportações somente na mesma transação PostgreSQL e preservar sua idempotência.
3. Retirar serviço/init/declaração de volume MinIO do Compose, SDKs, variáveis S3 e CLI de cópia. A
   retirada da declaração não apaga volumes existentes. Não alterar migrations históricas.
4. Adaptar testes para backend único, ausência controlada de conteúdo legado e exportação com
   bytes/privacidade/idempotência verificados; manter regressões de upload/scan/permissões.
5. Atualizar documentação operacional e contratos. Validar tipos/lint/formatação/unitários
   localmente; integração/E2E/build/segurança no CI, mantendo serviços locais desligados.
6. Entregar na branch ativa feature/admin-cycle-20260915; informar efeito nos dois arquivos de teste
   e distinguir remoção do projeto de desligamento remoto sem acesso à VM.
7. Retirar contadores exclusivos do adaptador S3, observar respostas HTTP do conteúdo PostgreSQL e
   substituir o alerta sem consumidores por falhas reais de jobs. Manter alertas de scanner, fila e
   heartbeat; não incluir chaves ou capacidades de download nos atributos de métricas.

## Plano: busca geral por funções — 15/09/2026

1. Inventariar rotas e permissões dos módulos existentes; derivar áreas do catálogo atual.
2. Acrescentar catálogo de funções com rótulos, sinônimos, descrição de contexto e destino real.
3. Filtrar por todas as permissões necessárias, normalizar palavras e priorizar a função específica.
4. Atualizar busca geral para Buscar no site, com setas/Enter/Escape e resultados contextualizados.
5. Validar destinos OAB/benefícios, negações, ausência de acentos, teclado/mobile e atualização do
   preview.

## Plano de navegação — 15/09/2026

1. Registrar diagnóstico e práticas do Next instalado; manter guardas e sem cache persistente de
   autorização.
2. Criar fallback compartilhado de página e limites loading por área; usar feedback nativo de Link
   no menu/abas/atalhos.
3. Separar os três blocos de consultas da inicial com Suspense, preservando tratamentos
   independentes de falhas e regras de exibição.
4. Cobrir espera real de consulta em banco sintético, resposta RSC atrasada, interrupção,
   acessibilidade e persistência do shell no CI.
5. Validar qualidade/segurança/build/navegador e revisar capturas sintéticas do CI. Usuário pediu
   desligar localhost e depois autorizou parar o banco local; manter ambos desligados e adiar
   preview. Abrir PR somente com a entrega validada; permitir correções na mesma branch enquanto o
   PR estiver aberto; após merge, não reutilizá-la.

Sem schema, migration, dependência ou configuração nova de cache. Reverter componentes/limites
restaura a renderização anterior sem mudança de dados.

## Correção do browser/push do PR #28 — 16/09/2026

1. Usar o log CI35019277298: contraste transitório 4:1 no item ativo e 4,24:1 no texto da busca;
   falha nas três tentativas do cenário de Agendamentos.
2. Aplicar texto/fundo de tema simultaneamente nos links do menu e controles superiores, preservando
   transições de borda e movimento.
3. Ampliar a regressão por quadros existente e executar os gates completos em CI, incluindo o fluxo
   de Agendamentos; não executar build/E2E no PC.
4. Corrigir na mesma branch/worktree do PR #28, conforme regra vigente de 15/09; sem aprovação ou
   merge. Registrar o resultado remoto em evidence/theme-contrast-2026-09-16.md.

5. Remover a transição global herdada de body identificada no CI do PR e compartilhar o medidor de
   contraste entre a regressão do shell e a jornada real de reserva.

## Preservação compartilhada — 16/09/2026

Branch fix/scheduling-select-20260916, baseada em dev após PR29. Usar armazenamento temporário em
memória no layout autenticado, por rota/formulário/cadastro, com controles nativos e estado React
preservados. Integrar sucesso/cancelamento aos descartes e testar navegação entre módulos. Não usar
cache público, localStorage ou salvamento automático no banco.

### Padrão para formulários do painel

- `WorkspaceDrafts` vive no layout autenticado; a identidade, a rota e a aba de catálogo delimitam
  as edições. `DraftScope` separa registros editáveis dentro da mesma página.
- Campos nativos usam `DraftForm` com chave estável e `DraftInput`, `DraftSelect` ou
  `DraftTextarea`. Valores controlados, conteúdo estruturado e seleções usam `useDraftState` com
  chave própria; estados de envio, erros e confirmações continuam locais.
- Guardar a versão original com a edição permite ao servidor detectar concorrência. A gravação
  confirmada ou o cancelamento limpa somente o formulário correspondente. Na inclusão sucessiva de
  documentos, a categoria continua reutilizável, como antes.
- Filtros GET usam navegação cliente (`DraftSearchForm`), preservando edições em outras rotas.
  Logout desmonta o armazenamento em memória. Não há gravação automática, localStorage,
  sessionStorage ou promessa de recuperação após fechar/recarregar a página inteira.

## Plano da homologação — 16/09/2026

1. Conferir DEV, permissões GitHub, configuração versionada e entradas institucionais.
2. Validar as jornadas autorizadas com registros sintéticos isolados; nunca publicar a notícia de
   teste.
3. Corrigir lacunas técnicas em uma única branch, com testes dos controles e CI remoto.
4. Registrar resultados por ambiente, pendências externas e limites; abrir PR para dev sem merge ou
   aprovação.

## Mensagens no shell — 16/09/2026

Registrar a nova área por messages:access, seus atalhos de busca e título do cabeçalho; preservar
layout, temas e estado compartilhado. Validação junto à jornada E2E de 009-messaging.

## Ordem de módulos — 16/09/2026

Pedido explícito do usuário: Notícias primeiro (após Início), Mensagens penúltimo imediatamente
antes de Auditoria; manter utilidades da conta. Compartilhar ordem entre navegação e catálogo de
áreas. Agendamentos de Mensagens na busca de funções.

## Senha inicial — 17/09/2026

Gerador server-only com crypto.randomInt e lista local; hashPassword do Better Auth. Inserir
account/credential na transação de criação. Resposta exclusiva de criação com initialPassword
string/null; reenvio idempotente retorna null. Recibo transitório em memória com controles
compartilhados. Ação no detalhe para cadastro sem senha: lock da conta, sessão/permissões
revalidadas e comparação da autoridade. Não sobrescrever credenciais existentes. Sem migration ou
backfill. Specs 001/006 compartilham o código. Testes leves locais e integração/E2E/build no CI;
banco/preview pausados, nenhum merge automático.

## Clarify de acesso e exportação — 21/09/2026

Usar a autorização efetiva do catálogo compartilhado para omitir módulos, atalhos e cartões nas três
superfícies: barra lateral, menu de busca e Início. Preservar a negação no servidor para URL/API
direta e revalidar após mudança de permissões. Uma permissão geral de exportação combina-se com
leitura do módulo e dos dados; não cria acesso nem revela módulos. Coordenar substituição das
permissões antigas de exportação com specs 003/010 e programa 002. Q4 autoriza converter
automaticamente quem já possui alguma permissão de exportação na permissão geral, mantendo leitura
dos módulos inalterada. A ampliação da exportação aos módulos já acessíveis é explícita; não
conceder a quem não tinha exportação. Conversão idempotente, sem duplicar concessões. Validar perfis
com e sem exportação, acesso parcial e revogação. Só documentação neste clarify; AX01–AX03
pendentes. Conciliação de MFA/motivo registrada na revisão de código; preservar a revisão
transversal; decisões posteriores vigentes não serão perguntadas novamente.

## Exportação direta — Q6 de 21/09/2026

Fundação acompanha a regra transversal de 002 FR-015/FR-016: exportar dados de Colaboradores e das
demais funções disponíveis por ação nomeada, filtros e download Excel/CSV/PDF direto, sem prazo ou
teto funcional de período/registros. Preservar auditoria e controles de acesso. Não alterar
anexos/documentos por extensão implícita: a mensagem incompleta sobre downloads foi retirada pelo
usuário.

Q7 complementa o padrão: seleção e ordem de colunas autorizadas na tela de exportação, com seleção
inicial por módulo; Excel/CSV/PDF respeitam a configuração. Coordenar DX01 com 002 EXP06/EXP07,
incluindo recusa de campos restritos no servidor.

## Acesso explícito a Notícias e Agendamentos — Q8 de 21/09/2026

Preservar Notícias no catálogo/gestão e adequar Agendamentos ao mesmo padrão, substituindo sua
liberação automática por sessão. Negar acesso privado e ocultar barra lateral/busca/Início quando
sem concessão. Coordenar consulta/alteração separadas e transição técnica com 004/008 AC01, sem
inferir concessões da conversão de exportação. Não alterar leitura pública de notícias.

Q9: preservar consultar/alterar por módulo e a publicação separada já existente em Notícias. A
leitura de código confirmou catálogo, dependências e guardas de Notícias; não criar controle
duplicado. Agendamentos ainda precisa alinhar guardas/catálogo ao padrão. Nada concedido ou
implementado no clarify.

## Retenção institucional adiada — Q10 de 21/09/2026

Manter T089 pendente e o descarte automático desligado até definição/aprovação institucional dos
prazos e implementação dos controles. Preservar configuração PENDING e gates atuais; não preencher
datas, aprovadores ou prazos por suposição. Decisão apenas documental, distinta do download direto
das exportações.

## Checkpoint de revisão de código — 21/09/2026

Contas, permissões individuais, senha inicial e sessões estão implementadas; MFA foi retirado.
Encontradas lacunas A01/A03/A05/A06/A11 de autorização/visibilidade e preservação de erros.
AX01–AX04/DX01 e T089/T095 permanecem pendentes. Cadastro público ainda permitido na base integrada;
correção existente fora de dev deve ser conciliada em T096. T097 cobre erros de concorrência.

Revisão estática da base `ed31baf`; nenhum teste de aplicação ou homologação nesta etapa. Evidências
e limites: [revisão transversal](../002-integrated-modules/code-audit-2026-09-21.md).

Executar adequações e seus testes em retomada de implementação. Preservar dados e decisões adiadas;
a revisão atual altera somente documentação.

</details>

## Complemento I1: base do Gestor — 21/09/2026

Consulta global, exports:generate e todas as permissões de Relatórios são base do cargo Gestor;
alterações em outros módulos exigem concessão adicional. Resolver a base antes do override; não
materializar em arrays individuais. Catalogar operações por finalidade, inclusive chaves unificadas
de Mensagens, para separar consulta/mutação sem liberar escrita implicitamente. Atualizar
guards/UI/testes em T101/T103/T114/T116; coordenação009 mantém M016 e nenhum envio real.

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

## Ampliação do ciclo de vida — 21/09/2026

Executar na entrega ativa após levantamento dos fluxos existentes. Reutilizar PATCH versionado para
reativar colaborador; acrescentar evento explícito user.reactivated. Implementar POST
/api/v1/users/:id/reset-password com versão obrigatória, validação CSRF/origem, nova verificação
transacional de sessão/cargo/permissões após locks, substituição atômica do hash e incremento de
versão. Reutilizar geração e recibo de senha inicial, sem persistir segredo em rascunhos. Testar
login novo/antigo, revogação, concorrência, rollback, acesso negado e interface. Persistir data de
vigência da exclusão (24 horas após solicitação), bloquear a conta e encerrar sessões imediatamente;
permitir desfazer durante o intervalo e restaurar explicitamente depois, preservando histórico; não
confundir desativar com apagar silenciosamente.
