# Pesquisa vigente — 21/09/2026

## Pesquisa para design.md — 22/09/2026

**Problema:** padrões da CAAB estão distribuídos entre CSS, componentes, módulos, decisões e
relatórios históricos. Um arquivo genérico não explica as interações confirmadas nem as
divergências. Pesquisa exclusivamente documental; nenhuma fonte externa recebeu código ou dados do
projeto.

| Fonte oficial consultada                                                                                   | Aprendizado aplicado                                                                                     | Limite                                                                                 |
| ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| [Google Labs: formato DESIGN.md](https://github.com/google-labs-code/design.md/blob/main/docs/spec.md)     | Documento legível; valores e orientação; oito seções visuais em ordem; metadados estruturados opcionais. | Formato em evolução; uso da organização não comprova compatibilidade com importadores. |
| [Google Labs: filosofia](https://github.com/google-labs-code/design.md/blob/main/PHILOSOPHY.md)            | Registrar intenção visual ajuda a manter consistência entre sessões e ferramentas.                       | Não substituir implementação ou validação por narrativa.                               |
| [USWDS: design tokens](https://designsystem.digital.gov/design-tokens/)                                    | Explicitar papéis de cor, tipo e espaçamento reduz decisões locais arbitrárias.                          | Referência de organização, sem importar paleta, biblioteca ou escalas USWDS.           |
| [GOV.UK: critérios de contribuição](https://design-system.service.gov.uk/community/contribution-criteria/) | Padrões precisam ser úteis, consistentes, utilizáveis e documentados com evidência.                      | Um componente existente ou captura não equivale a pesquisa/homologação universal.      |
| [W3C: referência WCAG 2.2](https://www.w3.org/WAI/WCAG22/quickref/)                                        | Transformar acessibilidade em critérios de contraste, teclado, zoom, reflow, nomes e estados.            | Guia documental não é auditoria WCAG completa.                                         |
| [W3C: alvos mínimos](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum)                      | Distinguir alvo de 24 × 24 CSS px no critério AA (com exceções) da altura usual de 44 px da CAAB.        | Altura isolada não prova conformidade de alvo, contraste ou teclado.                   |

**Decisão:** `design.md` canônico na raiz, em português, com títulos visuais reconhecíveis e índice;
fontes relativas, resumo dos valores atuais e padrões de interação. Sem segunda cópia `DESIGN.md`:
capitalização pode representar o mesmo arquivo no Windows e outro em ambientes sensíveis a caixa.
Sem YAML duplicado de cores por tema: o projeto já executa tokens CSS e não pediu exportador.

**Alternativas:** baixar modelo pronto (não representa as decisões CAAB); copiar só screenshot
(perde estados, teclado, permissões e valores); copiar todo CSS (repete regras superadas e aumenta
manutenção); criar biblioteca/template genérico agora (reuso ainda hipotético); documentação apenas
fragmentada (dificulta fornecer contexto). Guia central com links equilibra clareza e manutenção.

**Inventário consultado:** `apps/web/styles/tokens.css`, cascata final de `app/globals.css`,
controles em `components/ui/`, rascunhos em `components/workspace-drafts.tsx`, listagem/formulários
de Parceiros/Associados, lista/exportação de Colaboradores no PR37, padrões de exportação e
evidências sintéticas existentes. A importação do CSS em `app/layout.tsx` ocorre após tokens. Não há
carregamento de fonte Inter nesse layout; a pilha pode renderizar fonte de sistema.
`docs/UI-BUTTONS.md` descreve medidas de 10/09 superadas pela cascata atual. Valores históricos de
cores em relatórios também não são a paleta normativa atual.

**Separação de estado:** regra desejada/confirmada, comportamento observado e lacuna têm rótulos
distintos. Exportação de Colaboradores serve como referência do fluxo direto; a existência de botão
em outros módulos não conclui sua migração. Cores Legado e módulos futuros continuam pendentes.

**Evidência visual:** imagens sintéticas de Parceiros (14/09), Colaboradores (CI35734927572) e
exportação (CI35736033889), conferidas nesta pesquisa em desktop/celular e claro/escuro. Caminhos
operacionais locais ficam no mapa/relatório local; procedência versionada ficará na evidência DS.
Não ligar serviços para documentação, não apresentar essas imagens como nova execução de UI.

**Decisão:** Consolidar exports:generate, ocultação por acesso e infraestrutura comum; oferecer
exportação de Colaboradores sem alterar a gestão existente.

**Fundamento:** Perfis Associados+Colaboradores com geral exportam só essas fontes; conversão
preserva herança expirada/revogada e override vazio; sem módulo não há elemento nas três
superfícies; writer respeita colunas, grande volume, CSRF, revogação e interrupção.

**Alternativas:** rejeitar cópia de cadastro, concessão implícita, exportar pela página visual,
gerar Buffer integral e reintroduzir fila/limites funcionais. Quando a função não implementa
exportação nesta fase, preservar seus controles existentes.

**Evidência local:** `apps/web/modules/auth/permissions.ts`,
`packages/contracts/src/user-access.ts`, `packages/db/src/repositories/user-access.ts`. Desenho
concreto em [plan.md](plan.md). Fontes oficiais, data, limitações e alternativas na
[pesquisa transversal](../002-integrated-modules/research-2026-09-21.md). Essa revisão não homologa
dependências, desempenho ou produto; testes estão no quickstart.

## Pesquisa anterior — contexto histórico

Decisões de fluxo/armazenamento/exportação anteriores são substituídas pelo plan de 21/09 onde
conflitarem; referências antigas não autorizam funções adiadas.

# Research: Fundação do Sistema CAAB

**Date**: 2026-09-04

Todas as decisões abaixo resolvem o contexto técnico do plano. Não restam marcadores
`NEEDS CLARIFICATION`.

## Autenticação, sessões e MFA

**Decision**: usar Better Auth com adaptador Drizzle/PostgreSQL, sessões opacas persistidas e
`session.cookieCache` desabilitado. Ativar TOTP e códigos de recuperação para MFA. Administradores
devem concluir TOTP em toda autenticação, sem dispositivo confiável, e não podem manter papel
administrativo quando o fator deixa de estar habilitado.

**Rationale**: mantém identidade e revogação no PostgreSQL, integra diretamente com Next.js e
oferece fluxo oficial de TOTP. A ausência de cache de sessão preserva a revogação imediata exigida.

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
server-side `requirePermission(resource, action)`. Better Auth autentica e gerencia sessões; o
domínio CAAB é a única autoridade sobre permissões. Cada Server Action, Route Handler e caso de uso
chama o guard; papéis fornecidos pelo cliente nunca são aceitos.

**Rationale**: separa autenticação de regras de domínio, preserva menor privilégio e torna
alterações efetivas na próxima ação. O guard lê conta ativa e atribuições no banco antes da decisão.

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
- GuardDuty Malware Protection: alternativa válida se o ambiente final for AWS, mas cria
  acoplamento.

**Sources**:
[OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html),
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
preservar acessos das contas existentes até edição explícita; nenhuma autoelevação, concessão além
da autoridade do operador ou remoção do último administrador capaz de gerir acessos.

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

## Campos comuns — 11/09/2026

Fontes oficiais: https://www.w3.org/WAI/tutorials/forms/notifications/ e
https://www.w3.org/WAI/tutorials/forms/grouping/ (consultadas em 11/09/2026), e
https://viacep.com.br/ (consultada em 11/09/2026). Usar avisos junto aos campos, associação
acessível e alternativa de preenchimento manual para falha de CEP. Consulta ao ViaCEP envia somente
oito dígitos, sem credenciais/referrer, sem lote. Máscaras auxiliam digitação e não comprovam
identidade, contato ou titularidade. Reutilização exigida pelo usuário: padrões existentes de
Associados são extraídos para componentes comuns, sem introduzir biblioteca nova ou alterar dados em
lote.

# Correção do registro de imagens do CI — 14/09/2026

O job browser do PR #19 falhou antes dos testes: Docker Hub recusou o pull de minio/minio. A
[documentação oficial do MinIO](https://github.com/minio/minio/blob/master/docs/docker/README.md)
usa quay.io/minio/minio. Os manifests oficiais de MinIO RELEASE.2025-09-07T16-13-09Z e mc
RELEASE.2025-08-13T08-35-41Z foram consultados em Quay nesta data. Decisão: mudar apenas o registro
em compose.yaml, mantendo as versões fixadas, serviços, portas, volumes e testes. Sem migração de
storage ou atualização de versão. O registro oficial evita depender de uma imagem de terceiros ou
desativar o gate.

## Pesquisa da ampliação dos campos — 14/09/2026

- https://www.w3.org/WAI/tutorials/forms/validation/ : controles HTML tipados, required e validação
  no cliente complementam a validação obrigatória no servidor.
- https://www.w3.org/WAI/tutorials/forms/notifications/ : erro textual associado ao campo, foco e
  possibilidade de corrigir preservando os valores.
- https://viacep.com.br/ : resposta separa logradouro, bairro, localidade e UF; CEP requer oito
  dígitos. Complemento retornado pode descrever trecho postal (ex.: lado ímpar), portanto não
  representa sala/apartamento do usuário.

Decisão: número/complemento sempre manuais; preservar resposta tardia por campo; conversão de texto
legado explícita, sem parsing especulativo. Não aplicar máscaras a texto livre, senha ou busca
mista. Sem novas dependências.

## JPG nos seletores — 14/09/2026

A [MDN sobre accept](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/accept)
recomenda combinar identificadores de extensão e MIME; o atributo orienta a seleção, sem validar
conteúdo. A [propriedade Blob.type](https://developer.mozilla.org/en-US/docs/Web/API/Blob/type)
depende da identificação do navegador. Decisão: listar `.jpg,.jpeg,.png` junto aos MIME existentes,
explicitar JPG na interface e preservar a inspeção efetiva do servidor. JPEG já é reconhecido pelo
pipeline como `image/jpeg`, com ambas as extensões; nenhum novo formato binário ou permissão é
introduzido.

## Pesquisa: justificativas e auditoria — 14/09/2026

- OWASP Logging Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html
  Preservar quando/onde/quem/o quê e minimizar dados sensíveis. Auditoria da criação independe de
  texto de justificativa do operador.
- OWASP Input Validation:
  https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html Validar no
  servidor antes da mutação, incluindo texto vazio após trim.
- W3C Forms: https://www.w3.org/WAI/tutorials/forms/ — instruções e nomes acessíveis associados aos
  campos necessários à ação atual.

A obrigação de motivo nas alterações é decisão do usuário, não imposição dessas fontes. Não alterar
permissões, inventar motivo humano nem registrar senhas/tokens em auditoria.

## Conteúdo binário no PostgreSQL — 14/09/2026

Fontes oficiais: [bytea](https://www.postgresql.org/docs/18/datatype-binary.html),
[TOAST](https://www.postgresql.org/docs/18/storage-toast.html) e
[OWASP File Upload](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html).
Decisão: bytes parametrizados em bytea, tabela própria no mesmo banco, sem base64 persistido. TOAST
administra valores grandes; listagens seguem consultando apenas metadados. Manter limite de upload,
assinatura/MIME e antivírus, autorização e URLs temporárias. Armazenar no banco simplifica a
infraestrutura por decisão do usuário, mas aumenta o volume de backup/WAL; não foi realizado
dimensionamento da VM. Backups precisam incluir a nova tabela e a restauração deve verificar hashes.
Guia local Next consultado: route handlers aceitam Request/Response e PUT.

## Regra vigente: nenhuma justificativa obrigatória — 14/09/2026

Fonte de negócio: instrução expressa do usuário nesta data para remover motivos de todas as abas. A
[OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html),
consultada em 14/09/2026, orienta registrar contexto da ação e identidade. Decisão do projeto:
rastreabilidade é automática e não depende de justificativa escrita. O inventário encontrou
validações em UI, contratos, serviços e CHECKs SQL; retirar todas as camadas da obrigatoriedade,
preservando histórico e permissões. Não presumir que o usuário forneceu um motivo automático.

## Backend único de arquivos — 15/09/2026

Fontes oficiais consultadas:
[PostgreSQL 18: bytea](https://www.postgresql.org/docs/18/datatype-binary.html) e
[backup por dump](https://www.postgresql.org/docs/18/backup-dump.html). bytea armazena bytes
binários e integra o backup transacional do banco. Decisão: manter a implementação PostgreSQL já
validada, removendo o custo de dois backends após o usuário dispensar a migração de dois arquivos de
teste. Não adicionar banco ou dependências. ClamAV, limites, HMAC e autorização continuam
necessários. A pesquisa não demonstra capacidade da VM; espaço e backup permanecem responsabilidade
operacional. Não se executará limpeza de registros históricos ou volumes para eliminar referências
obsoletas.

## Pesquisa: busca geral por funções — 15/09/2026

Fontes oficiais:
[GitHub Command Palette](https://docs.github.com/en/enterprise-cloud%40latest/get-started/accessibility/github-command-palette)
organiza navegação e ações acessíveis ao usuário;
[Windows Terminal Command Palette](https://learn.microsoft.com/en-us/windows/terminal/command-palette)
oferece busca das ações disponíveis e operação por teclado. Adaptação ao CAAB: catálogo leve de
funções existentes, com destino, contexto e permissões declarados. Busca normaliza acentos e termos;
funções específicas têm prioridade sobre área genérica. Não executar mutações ao selecionar um
resultado. Para funções dependentes de cadastro, abrir a lista e informar que é necessário
selecionar um registro. Reutilizar dialog/links existentes; sem indexador de dados pessoais,
biblioteca nova ou serviço adicional.

## Abertura de telas e navegação — 15/09/2026

Fontes oficiais consultadas:
[Next.js: Linking and Navigating](https://nextjs.org/docs/app/getting-started/linking-and-navigating),
[loading](https://nextjs.org/docs/app/api-reference/file-conventions/loading),
[useLinkStatus](https://nextjs.org/docs/app/api-reference/functions/use-link-status) e os guias
distribuídos com Next 16.3.4 instalado em apps/web/node_modules/next/dist/docs.

Diagnóstico do código45e22b3: nenhuma loading.tsx no painel; rotas dinâmicas aguardam consultas
antes de mostrar o destino. A inicial aguarda Promise.allSettled de publicações, rascunhos e
associados antes de renderizar até os atalhos. Links já usam next/link; não há motivo para
introduzir roteador ou dependência nova. Layout autenticado deve continuar validando acesso antes de
mostrar o painel.

Decisão: limites loading por área, feedback discreto nos links centrais quando ainda não houver
resposta e carregamento independente dos três blocos da inicial via Suspense. Manter prefetch
automático parcial, sem forçar pré-carga completa de dados privados e sem cache persistente de
sessão/permissões. Medir separadamente disponibilidade do conteúdo útil e conclusão das consultas,
sem prometer redução percentual sem medição.

Validação causal em CI com dados sintéticos: bloquear temporariamente leitura de member em transação
do teste; verificar que o destino exibe carregamento e que a inicial mostra atalhos/publicações
antes do desbloqueio. Liberar sempre em finally. Simular espera da resposta RSC para conferir
feedback e interrupção. Nunca aplicar bloqueio ou seed no banco do preview. Revisão visual local é
leve; build/E2E somente no CI.

Limite do diagnóstico local: preview apresentou timeout de conexão na autenticação durante a
primeira observação; não usar essa amostra como baseline de desempenho da aplicação. Worker/scanner
continuam pausados por restrição de memória.

## Contraste transitório — pesquisa de 16/09/2026

Fontes oficiais:
[WCAG 2.2, contraste mínimo](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
define 4,5:1 para texto normal, sem arredondar resultados abaixo do limite;
[CSS Transitions](https://www.w3.org/TR/css-transitions-1/) descreve valores interpolados durante a
transição. Consultado também o guia CSS distribuído com Next em
apps/web/node_modules/next/dist/docs/01-app/01-getting-started/11-css.md.

Diagnóstico local do código e log CI35019277298: o item ativo interpola texto e fundo através de
combinações de baixo contraste; na busca, o texto filho muda imediatamente enquanto o fundo
interpola. Estados finais aprovados não garantem os quadros intermediários. Decisão: retirar
interpolação de texto/fundo desses controles, mantendo borda/movimento e medindo contraste por
quadros em ambos os sentidos. Não alterar paleta nem enfraquecer axe. Limite: regressão automatizada
de cores não substitui toda a avaliação manual de acessibilidade.

Complemento da validação: CI35089210281 aprovou todos os gates de5740428, mas CI35089213112 revelou
interpolação de color herdada de body nos detalhes/histórico de reserva, com contraste2,09–2,26:1
sobre superfícies já claras. Remover também a transição global de texto/fundo e reutilizar o medidor
por quadros na jornada real de Agendamentos.

## Estado ao navegar — 16/09/2026

Os guias locais do Next 16.3.4 (preserving-ui-state e cacheComponents) confirmam que layouts
compartilhados conservam estado; Activity do framework retém somente três rotas e não atende à
preservação geral solicitada. Usar contexto em memória no layout autenticado, separado por
identidade e formulário; manter versões originais para conflito seguro. O padrão do campo UF usa
input/list:
[MDN datalist](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/datalist).
Sugestões não validam sozinhas a seleção; conferir identificador válido antes de enviar.

## Revisão de homologação — 16/09/2026

GitHub documenta rulesets públicos, checks vinculados ao GitHub App e exigência de PR:
https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets
. A API do repositório confirmou acesso administrativo e ruleset ativo de dev nesta data; conferir
main e promoção sem push direto nem merge.

O guia da ANPD identifica os papéis de agentes de tratamento e encarregado:
https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-orientativo-para-definicoes-dos-agentes-de-tratamento-de-dados-pessoais-e-do-encarregado
. Esta pesquisa não define prazos da CAAB nem substitui aprovação nominal exigida pelo projeto.

## Integração de Mensagens — 16/09/2026

A pesquisa de [009-messaging](../009-messaging/research.md) orienta o fluxo novo. O shell reutiliza
os padrões existentes de navegação/permissões; não introduz biblioteca nem novo padrão de layout.

## Senha inicial — pesquisa de 17/09/2026

Fontes oficiais:
[Node.js randomInt](https://nodejs.org/docs/latest-v24.x/api/crypto.html#cryptorandomintmin-max-callback),
[Better Auth database](https://better-auth.com/docs/concepts/database),
[OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).
Consultado guia local Next 16.3.4 de Route Handlers.

Node oferece sorteio criptográfico sem viés de módulo. Reutilizar hashPassword e account/providerId
credential assegura compatibilidade com login; armazenar somente hash adaptativo. Decisão do
usuário: uma palavra + seis dígitos. Palavra de seis ou mais letras com inicial maiúscula atende à
política atual. A entropia é limitada pela lista e um milhão de sufixos; não afirmar que comprimento
implica alta entropia. Preservar rate limiting e troca de senha existentes. Sem dependência nova nem
envio de e-mail automático.

Diagnóstico: criação anterior só inseria user e recuperação exige account.password existente.
Corrigir atomicamente. Reenvio idempotente não pode recuperar senha do hash ou substituí-la. A única
conta legada sem senha poderá receber credencial por ação explícita, com autoridade e concorrência
verificadas. Respostas com no-store; segredo só em memória transitória, fora de
logs/rascunhos/storage. Nenhum dado real na implementação.

Revisão de vocabulário solicitada em 17/09/2026: lista permitida revisada de 252 palavras. Removidos
nomes de animais usados como insultos, referências corporais, palavras ambíguas e termos pouco
familiares. Não identificados termos ofensivos na lista remanescente; variação regional impede
garantia universal. Novas palavras exigem revisão humana. Regressão impede reintroduzir os exemplos
removidos. Não gerar palavras livremente nem consultar dicionário remoto em runtime.

## Revisão I1 após analyze — 21/09/2026

Fonte: decisão explícita do usuário, não nova pesquisa externa. Administrador tem todas as
permissões concretas dos módulos disponíveis, atuais e futuros, incluindo exportação e gestão de
cargos/acessos. Gestor possui consulta a todos os módulos, exportação geral e acesso completo a
Relatórios; pode conceder acessos de qualquer módulo a outros colaboradores, inclusive alterações
que não possui para uso próprio, mas não altera os próprios acessos nem atribui cargos. Colaborador
somente usa os acessos recebidos e não concede cargos ou permissões. Atribuição de cargos permanece
com Administrador.

A guarda atual changeUserAccess exige que o ator possua cada chave; será substituída pela distinção
entre concessão e uso. A view0014 também precisa reconhecer Administrador apesar do override.
Estratégia detalhada em [cargos](contracts/roles.md); nenhuma implementação ou emenda constitucional
necessária para permissões concretas autorizadas pelo produto.

## Preservação de conflitos — 21/09/2026

Conferidos os guias embarcados da versão instalada de Next em
`next/dist/docs/01-app/03-api-reference/01-directives/use-client.md` e `01-app/02-guides/forms.md`.
O cache de rascunhos do layout autenticado já preserva valores e versões; a lacuna era o estado
local de erros. Decisão: reutilizar `useDraftState`, com chave semântica por formulário e cadastro,
sem armazenamento persistente no navegador. Não restaurar estados de carregamento ou recibos de
senha. Para mutações compartilhadas, a chave é explícita; horários incluem recurso/unidade, imagem
editorial inclui finalidade e categoria inclui cadastro. Reset remove a validação visível;
encerramento do layout autenticado descarta os dados. Regressões de componente cobrem versão
original, isolamento e encerramento; E2E preparado para Notícias, Associados e acessos, aguardando
CI.

## Ciclo de vida e credenciais — pesquisa de 21/09/2026

Fontes primárias consultadas:
[PostgreSQL: relógios e intervalos](https://www.postgresql.org/docs/current/functions-datetime.html),
[Better Auth: autenticação e senha](https://better-auth.com/docs/authentication/email-password).
PostgreSQL distingue relógio da transação de clock_timestamp; usar o segundo para a vigência
corrente mesmo após espera por locks. Intervalos escolhidos: 24 horas e 168 horas (sete dias).
Inferência de implementação: avaliar a data persistida nas consultas evita depender de worker ativo
para efetivar a exclusão lógica. Preservar identidades e chaves estrangeiras; nenhuma remoção física
ou cancelamento automático.

Reutilizar hashPassword/verifyPassword da versão instalada e o registro credential existente; o
reset administrativo é transacional, independente do fluxo público por link de recuperação.
Sessões/recuperações antigas são revogadas e a versão impede rotação dupla. Segredo só no recibo
transitório. Cargo é validado novamente sob lock: Administrador/Gestor, sem autogeração nem
redefinição de Administrador por Gestor. Testes de integração usam contas sintéticas, banco
descartável e relógio do banco.

## Implementação do streaming — 21/09/2026

Fontes: [ExcelJS4.4](https://github.com/exceljs/exceljs/tree/v4.4.0),
[pg-cursor](https://node-postgres.com/apis/cursor) e [PDFKit](https://pdfkit.org/docs/text.html);
confrontadas com as versões fixadas instaladas. O StreamBuf interno do ExcelJS ignora backpressure.
O writer usa uma ponte restrita a `_openStream`, com PassThrough limitado, conversão imediata de
StringBuf para bytes e espera após cada commit. Essa ponte exige nova validação quando ExcelJS
mudar; nenhum fork de node_modules. Testes independentes de arquivo, consumidor lento e fronteira
simulada de planilha cobrem a compatibilidade atual.

XLSX inclui uma legenda separada, marcadores de registro/coluna/parte e escape de prefixos naturais.
Não acrescenta coluna de negócio. A virada física acima de um milhão de linhas não é validada nesta
rodada. PDF usa fonte padrão para português; caracteres fora da cobertura são representados
reversivelmente por `\u{hex}` e barras originais são escapadas, com legenda no documento. Não
elimina caracteres. A decisão de fonte não comprova qualidade tipográfica de idiomas fora do
português.

Pools separados de dados e controle têm dois slots cada, somados aos dez slots do pool web existente
(até14 por processo). Aquisição tem timeout operacional de5s e libera conexão tardia após
cancelamento. Cursor usa lotes de100 e snapshot; o limite de lote não é teto de exportação.
Heartbeat de10s revalida autorização mesmo sob backpressure; ausência por60s registra interrupção,
sem prazo de arquivo. A massa de 100 registros continua diagnóstica, sem alegação de escalabilidade
comprovada.

## Cadastro completo de Colaboradores — pesquisa de 21/09/2026

- [W3C WAI — Labeling Controls](https://www.w3.org/WAI/tutorials/forms/labels/) e
  [Form Instructions](https://www.w3.org/WAI/tutorials/forms/instructions/): rótulos associados,
  identificação da obrigatoriedade e instruções próximas aos campos. Decisão: reutilizar os
  controles compartilhados, máscaras/erros locais e complemento explicitamente opcional.
- [OWASP — Input Validation](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html):
  validação no servidor é necessária independentemente do cliente. Decisão: mesmo contrato de
  CPF/telefone/endereço, normalização e constraints/índice no banco; ausência rejeitada na criação.
- Limites: fontes técnicas não definem política institucional de dados. Obrigatoriedade vem do
  usuário; não consultar Receita/OAB, não enriquecer dados pessoais nem presumir retenção.
  Reutilizar CPF e endereço brasileiros já existentes no projeto, sem nova dependência.

## Complemento de22/09 — CEP e validação

[ViaCEP](https://viacep.com.br/) confirma entrada de oito dígitos, HTTP400 para formato inválido e
retorno erro para inexistente. Reutilizar o componente existente, sem consultas em massa, permitindo
endereço manual e ignorando resposta obsoleta.
[OWASP Input Validation](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
reforça validação no servidor além do cliente. Regras de CPF/legado/motivo vêm das decisões do
usuário; sem enriquecimento de dados. Consultadas em22/09/2026. Integração de CEP simulada nos
testes.

## Datas e filtros de Colaboradores — 22/09/2026

Fonte oficial consultada:
[PostgreSQL, Date/Time Types, seção 8.5.3](https://www.postgresql.org/docs/current/datatype-datetime.html).
Nomes completos IANA aplicam regras históricas de fuso/horário de verão; igualdade do deslocamento
atual não garante igualdade para datas antigas. Decisão: usar America/Bahia na lista e exportação,
com limite inicial inclusivo e próximo dia exclusivo. Testar 15/01/2018 02:30 UTC, ainda dia14 na
Bahia. Sem alterar os instantes armazenados. CPF e pendência usam catálogo/SQL compartilhados pelos
três formatos; CPF aceita parte dos dígitos e máscara, mas rejeita conteúdo malformado. Pesquisa
limitada ao comportamento técnico; não modifica política de exclusão ou retenção.

## Consistência das ações — 22/09/2026

Fonte oficial:
[W3C, WCAG 2.2, identificação consistente](https://www.w3.org/WAI/WCAG22/Understanding/consistent-identification.html).
A orientação favorece identificação consistente de funções repetidas entre páginas. Decisão de
interface solicitada pelo usuário: exportação no topo do quadro de filtros, com ícone e estilo
compartilhados; inclusão primária preservada no cabeçalho. A posição é decisão do produto, não uma
exigência literal desse critério WCAG. Validar foco, contraste e adaptação ao celular; não alterar
contratos de exportação neste ajuste visual.
