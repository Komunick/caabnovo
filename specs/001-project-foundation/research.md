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

## Campos comuns — 11/09/2026

Fontes oficiais: https://www.w3.org/WAI/tutorials/forms/notifications/ e
https://www.w3.org/WAI/tutorials/forms/grouping/ (consultadas em 11/09/2026), e
https://viacep.com.br/ (consultada em 11/09/2026). Usar avisos junto aos campos,
associação acessível e alternativa de preenchimento manual para falha de CEP.
Consulta ao ViaCEP envia somente oito dígitos, sem credenciais/referrer, sem lote.
Máscaras auxiliam digitação e não comprovam identidade, contato ou titularidade.
Reutilização exigida pelo usuário: padrões existentes de Associados são extraídos
para componentes comuns, sem introduzir biblioteca nova ou alterar dados em lote.
# Correção do registro de imagens do CI — 14/09/2026

O job browser do PR #19 falhou antes dos testes: Docker Hub recusou o pull de
minio/minio. A [documentação oficial do MinIO](https://github.com/minio/minio/blob/master/docs/docker/README.md)
usa quay.io/minio/minio. Os manifests oficiais de MinIO RELEASE.2025-09-07T16-13-09Z
e mc RELEASE.2025-08-13T08-35-41Z foram consultados em Quay nesta data.
Decisão: mudar apenas o registro em compose.yaml, mantendo as versões fixadas,
serviços, portas, volumes e testes. Sem migração de storage ou atualização de versão.
O registro oficial evita depender de uma imagem de terceiros ou desativar o gate.

## Pesquisa da ampliação dos campos — 14/09/2026

- https://www.w3.org/WAI/tutorials/forms/validation/ : controles HTML tipados,
  required e validação no cliente complementam a validação obrigatória no servidor.
- https://www.w3.org/WAI/tutorials/forms/notifications/ : erro textual associado
  ao campo, foco e possibilidade de corrigir preservando os valores.
- https://viacep.com.br/ : resposta separa logradouro, bairro, localidade e UF;
  CEP requer oito dígitos. Complemento retornado pode descrever trecho postal
  (ex.: lado ímpar), portanto não representa sala/apartamento do usuário.

Decisão: número/complemento sempre manuais; preservar resposta tardia por campo;
conversão de texto legado explícita, sem parsing especulativo. Não aplicar máscaras
a texto livre, senha ou busca mista. Sem novas dependências.

## JPG nos seletores — 14/09/2026

A [MDN sobre accept](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/accept) recomenda combinar identificadores de extensão e MIME; o atributo orienta a seleção, sem validar conteúdo. A [propriedade Blob.type](https://developer.mozilla.org/en-US/docs/Web/API/Blob/type) depende da identificação do navegador. Decisão: listar `.jpg,.jpeg,.png` junto aos MIME existentes, explicitar JPG na interface e preservar a inspeção efetiva do servidor. JPEG já é reconhecido pelo pipeline como `image/jpeg`, com ambas as extensões; nenhum novo formato binário ou permissão é introduzido.

## Pesquisa: justificativas e auditoria — 14/09/2026

- OWASP Logging Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html
  Preservar quando/onde/quem/o quê e minimizar dados sensíveis. Auditoria da criação
  independe de texto de justificativa do operador.
- OWASP Input Validation: https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html
  Validar no servidor antes da mutação, incluindo texto vazio após trim.
- W3C Forms: https://www.w3.org/WAI/tutorials/forms/ — instruções e nomes acessíveis
  associados aos campos necessários à ação atual.

A obrigação de motivo nas alterações é decisão do usuário, não imposição dessas fontes.
Não alterar permissões, inventar motivo humano nem registrar senhas/tokens em auditoria.

## Conteúdo binário no PostgreSQL — 14/09/2026

Fontes oficiais: [bytea](https://www.postgresql.org/docs/18/datatype-binary.html),
[TOAST](https://www.postgresql.org/docs/18/storage-toast.html) e
[OWASP File Upload](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html).
Decisão: bytes parametrizados em bytea, tabela própria no mesmo banco, sem base64 persistido.
TOAST administra valores grandes; listagens seguem consultando apenas metadados. Manter
limite de upload, assinatura/MIME e antivírus, autorização e URLs temporárias. Armazenar no
banco simplifica a infraestrutura por decisão do usuário, mas aumenta o volume de backup/WAL;
não foi realizado dimensionamento da VM. Backups precisam incluir a nova tabela e a restauração
deve verificar hashes. Guia local Next consultado: route handlers aceitam Request/Response e PUT.


## Regra vigente: nenhuma justificativa obrigatória — 14/09/2026

Fonte de negócio: instrução expressa do usuário nesta data para remover motivos de todas as abas. A [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html), consultada em 14/09/2026, orienta registrar contexto da ação e identidade. Decisão do projeto: rastreabilidade é automática e não depende de justificativa escrita. O inventário encontrou validações em UI, contratos, serviços e CHECKs SQL; retirar todas as camadas da obrigatoriedade, preservando histórico e permissões. Não presumir que o usuário forneceu um motivo automático.

## Backend único de arquivos — 15/09/2026

Fontes oficiais consultadas: [PostgreSQL 18: bytea](https://www.postgresql.org/docs/18/datatype-binary.html)
e [backup por dump](https://www.postgresql.org/docs/18/backup-dump.html). bytea armazena
bytes binários e integra o backup transacional do banco. Decisão: manter a implementação
PostgreSQL já validada, removendo o custo de dois backends após o usuário dispensar a
migração de dois arquivos de teste. Não adicionar banco ou dependências. ClamAV, limites,
HMAC e autorização continuam necessários. A pesquisa não demonstra capacidade da VM;
espaço e backup permanecem responsabilidade operacional. Não se executará limpeza de
registros históricos ou volumes para eliminar referências obsoletas.

## Pesquisa: busca geral por funções — 15/09/2026

Fontes oficiais: [GitHub Command Palette](https://docs.github.com/en/enterprise-cloud%40latest/get-started/accessibility/github-command-palette)
organiza navegação e ações acessíveis ao usuário; [Windows Terminal Command Palette](https://learn.microsoft.com/en-us/windows/terminal/command-palette)
oferece busca das ações disponíveis e operação por teclado. Adaptação ao CAAB: catálogo leve de funções
existentes, com destino, contexto e permissões declarados. Busca normaliza acentos e termos; funções
específicas têm prioridade sobre área genérica. Não executar mutações ao selecionar um resultado.
Para funções dependentes de cadastro, abrir a lista e informar que é necessário selecionar um registro.
Reutilizar dialog/links existentes; sem indexador de dados pessoais, biblioteca nova ou serviço adicional.

## Abertura de telas e navegação — 15/09/2026

Fontes oficiais consultadas: [Next.js: Linking and Navigating](https://nextjs.org/docs/app/getting-started/linking-and-navigating), [loading](https://nextjs.org/docs/app/api-reference/file-conventions/loading), [useLinkStatus](https://nextjs.org/docs/app/api-reference/functions/use-link-status) e os guias distribuídos com Next16.3.4 instalado em apps/web/node_modules/next/dist/docs.

Diagnóstico do código45e22b3: nenhuma loading.tsx no painel; rotas dinâmicas aguardam consultas antes de mostrar o destino. A inicial aguarda Promise.allSettled de publicações, rascunhos e associados antes de renderizar até os atalhos. Links já usam next/link; não há motivo para introduzir roteador ou dependência nova. Layout autenticado deve continuar validando acesso antes de mostrar o painel.

Decisão: limites loading por área, feedback discreto nos links centrais quando ainda não houver resposta e carregamento independente dos três blocos da inicial via Suspense. Manter prefetch automático parcial, sem forçar pré-carga completa de dados privados e sem cache persistente de sessão/permissões. Medir separadamente disponibilidade do conteúdo útil e conclusão das consultas, sem prometer redução percentual sem medição.

Validação causal em CI com dados sintéticos: bloquear temporariamente leitura de member em transação do teste; verificar que o destino exibe carregamento e que a inicial mostra atalhos/publicações antes do desbloqueio. Liberar sempre em finally. Simular espera da resposta RSC para conferir feedback e interrupção. Nunca aplicar bloqueio ou seed no banco do preview. Revisão visual local é leve; build/E2E somente no CI.

Limite do diagnóstico local: preview apresentou timeout de conexão na autenticação durante a primeira observação; não usar essa amostra como baseline de desempenho da aplicação. Worker/scanner continuam pausados por restrição de memória.

## Contraste transitório — pesquisa de 16/09/2026

Fontes oficiais: [WCAG 2.2, contraste mínimo](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) define 4,5:1 para texto normal, sem arredondar resultados abaixo do limite; [CSS Transitions](https://www.w3.org/TR/css-transitions-1/) descreve valores interpolados durante a transição. Consultado também o guia CSS distribuído com Next em apps/web/node_modules/next/dist/docs/01-app/01-getting-started/11-css.md.

Diagnóstico local do código e log CI35019277298: o item ativo interpola texto e fundo através de combinações de baixo contraste; na busca, o texto filho muda imediatamente enquanto o fundo interpola. Estados finais aprovados não garantem os quadros intermediários. Decisão: retirar interpolação de texto/fundo desses controles, mantendo borda/movimento e medindo contraste por quadros em ambos os sentidos. Não alterar paleta nem enfraquecer axe. Limite: regressão automatizada de cores não substitui toda a avaliação manual de acessibilidade.
