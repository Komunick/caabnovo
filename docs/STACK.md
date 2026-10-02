# CAAB — Referência de Stack e Arquitetura

Revisão documental de 02/10/2026, base integrada `748539d`. Arquitetura, dependências e validação
técnica. Estado das entregas: [MODULES](MODULES.md). Regras de produto: [PRD](PRD.md) e specs.
UI/UX: [guia principal](caab-design.md). Regras de execução: [AGENTS](../AGENTS.md). Versões
efetivas são as dos manifests e lockfile da entrega; exemplos não autorizam instalação.

## 1. Contexto e fontes da stack

Este documento distingue implementação, requisitos de operação e opções futuras. Versões exatas vêm
dos manifests de cada checkout e do lockfile; não duplicar uma tabela de versões que envelheça
separadamente das dependências. Configuração no repositório não comprova instalação ou estado da
hospedagem.

| Fonte                                                                                      | Informação verificável                                                               |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| [package.json](../package.json), [.nvmrc](../.nvmrc) e [workspace](../pnpm-workspace.yaml) | Node, pnpm, qualidade e organização do monorepo.                                     |
| [Web](../apps/web/package.json)                                                            | Next.js, React, Better Auth, Payload, Lexical, Tailwind, Radix Dialog, Lucide e Zod. |
| [Worker](../apps/worker/package.json)                                                      | Node/TypeScript, pg-boss, pg, file-type, Pino e OpenTelemetry.                       |
| [Banco](../packages/db/package.json)                                                       | Drizzle ORM/Kit e pg.                                                                |
| [Notícias](../packages/news/package.json)                                                  | Payload e seu adaptador PostgreSQL.                                                  |
| [Compose](../compose.yaml)                                                                 | PostgreSQL, ClamAV e coletor OpenTelemetry para o ambiente configurado.              |
| [Ferramentas e skills](TOOLING.md)                                                         | Processo de trabalho, seleção de especificação e verificação documental.             |

Esta arquitetura atende ao novo painel CAAB e ao portal do parceiro. O desenho contempla contratos
para app/site; alterar esses consumidores ou conectar serviços externos depende de escopo e contrato
autorizados. O estado de cada módulo consta do [mapa de módulos](MODULES.md), sem consultar código
ou telas do legado. A fundação atual deve ser reutilizada, com uma fonte de verdade por domínio.

Os domínios, funções suspensas e pendências são descritos em [MODULES](MODULES.md), sem repetir sua
fila na stack.

## 2. Arquitetura

Arquitetura implementada no repositório:

**Aplicação web Next.js + BFF + Payload CMS, PostgreSQL para dados e arquivos e um worker
dedicado.**

Fluxos principais:

- Navegador interno → BFF Next.js → domínio/PostgreSQL.
- Painel de notícias → Payload → PostgreSQL, incluindo conteúdo binário.
- Contrato para app/site → API versionada → somente conteúdo publicado para o respectivo canal. A
  conexão dos consumidores externos depende de escopo próprio.
- BFF → fila durável → worker → publicação, mídia e exportações. Notificações e novas integrações
  dependem de implementação e autorização específicas.

Usar um monólito modular. Separar serviços somente quando carga, segurança, implantação ou
responsabilidade operacional demonstrarem uma fronteira real.

## 3. Linguagens

- **TypeScript:** aplicação, APIs, componentes, CMS, worker e testes.
- **SQL:** migrations, constraints, índices, views e políticas do banco.
- **CSS via Tailwind:** apresentação baseada em design tokens.
- **Python:** usado como ferramenta auxiliar de manutenção; não integra o runtime do produto. Um
  processamento de produto em Python continua sendo opção futura, sujeita a justificativa concreta.

Não adicionar outra linguagem ao núcleo sem justificativa concreta.

## 4. Aplicação web

- Next.js App Router.
- React.
- TypeScript em modo estrito.
- React Server Components em telas adequadas.
- Client Components apenas para superfícies interativas.
- Route Handlers ou camada de serviço server-side como BFF.

O navegador não acessa diretamente tabelas sensíveis. O BFF aplica autenticação, autorização,
validação, auditoria e regras de negócio.

## 5. Notícias e CMS

### 5.1 Escolha

- Payload CMS.
- Adaptador PostgreSQL.
- `@payloadcms/richtext-lexical` para conteúdo rico.

Motivos:

- Integração nativa com Next.js e TypeScript.
- Licença MIT.
- Controle de acesso configurável.
- Drafts, versões, autosave e restauração.
- Publicação agendada.
- Uploads e Admin UI extensível.
- Jobs e hooks para distribuição.

### 5.2 Limites do CMS

Payload é responsável por conteúdo editorial, mídia e cadastros adequados. Ele não deve se tornar a
autoridade das regras de agenda, bloqueio de associados ou permissões críticas sem uma camada
explícita de domínio.

### 5.3 Editor

Lexical está implementado no editor de Notícias, integrado ao Payload. Qualquer alternativa deve ser
justificada pelas necessidades do projeto novo e pela compatibilidade com a fundação; o legado não é
fonte de requisito nem de implementação.

Persistir conteúdo estruturado. HTML renderizado deve ser sanitizado e não pode aceitar scripts ou
embeds arbitrários.

## 6. Interface e design system

O [guia principal de UI/UX](caab-design.md) governa padrões e revisão visual. Esta seção registra
somente a implementação técnica: React, Tailwind, componentes locais, Radix Dialog, Lucide e Zod. Os
componentes usam convenções de shadcn/ui; não presumir pacote ou CLI adicional instalado.
FullCalendar está adotado no painel, com temporal-polyfill, locale pt-BR e America/Bahia; a lista
diária permanece disponível. Versões no [manifest web](../apps/web/package.json), critérios na
[spec008](../specs/008-scheduling-management/spec.md).

TanStack Table/Query e React Hook Form foram propostas não adotadas. Não constam dos manifests
atuais; não instalar para reproduzir uma lista antiga. Tabelas e formulários usam a implementação
existente. Tokens e medidas são mantidos no guia e no código, sem catálogo paralelo nesta stack.

## 7. Agenda

### 7.1 Decisão

Planejamento incremental em [spec 008](../specs/008-scheduling-management/plan.md): primeira entrega
usou lista diária com componentes existentes. O incremento autorizado em 18/09/2026 adiciona
FullCalendar Standard como camada visual, sem mudar a autoridade do servidor sobre vagas e reservas.
App/site continua pendente.

Implementação: núcleo próprio de Agendamentos no domínio CAAB. Decisão do usuário em 15/09/2026:
Cal.com é referência de pesquisa e **não deve ser integrado, salvo se nenhuma outra possibilidade
for encontrada**. A abertura anterior para integração futura foi substituída por essa condição;
conveniência não a satisfaz.

A pesquisa não demonstrou esgotamento de alternativas. Não instalar SDK, incorporar código, subir
serviço ou integrar API/iframe do Cal.com nesta etapa. Registrar requisitos, alternativas e
impedimentos se a exceção vier a ser investigada. Detalhes em
[pesquisa de Agendamentos](../specs/002-integrated-modules/pesquisa-gestao-agendamentos-2026-09-15.md).

### 7.2 Integridade

- Intervalos tratados como `[início, fim)`.
- Datas persistidas em UTC.
- Timezone operacional padrão: `America/Bahia`.
- Disponibilidade calculada no servidor.
- Confirmação dentro de transação.
- Constraint de exclusão PostgreSQL por profissional e intervalo para impedir sobreposição.
- Chave de idempotência na criação para evitar duplicação por retry.
- Histórico de transições preservado.

FullCalendar é a camada visual adotada; a disponibilidade final permanece no domínio e no banco.

## 8. Banco de dados

- PostgreSQL.
- Migrations versionadas.
- UUID como chave primária.
- Índices definidos a partir das consultas reais.
- Foreign keys e constraints obrigatórias.
- JSONB somente para conteúdo flexível ou snapshots; não substituir modelagem relacional central.
- Valores financeiros futuros em unidade monetária mínima e moeda explícita.
- Exclusão lógica em entidades auditáveis.

Drizzle ORM já é usado em `packages/db` e pelo adaptador de autenticação Better Auth. Notícias
utiliza o adaptador PostgreSQL do Payload. Há consultas SQL explícitas com pg. Preservar o
proprietário de cada tabela; não criar modelos concorrentes das mesmas tabelas. SQL explícito
continua apropriado para constraints e consultas críticas.

## 9. Autenticação e autorização

A fundação do projeto novo já utiliza Better Auth, sessões e autorização no domínio. Reutilizar essa
implementação, sem criar provedores ou tabelas de autenticação por módulo. Requisitos:

- Cookies de sessão `HttpOnly`, `Secure` e `SameSite` apropriado.
- E-mail e senha para administradores, com permissões e auditoria. Autenticador removido em
  10/09/2026 por reclamações, conforme motivo confirmado pelo usuário em 17/09/2026; ver
  `specs/006-account-settings/authenticator-removal.md`.
- Expiração e revogação de sessões.
- Desativação imediata de usuário.
- RBAC com permissões concretas por ação.
- Autorização no BFF e serviços de domínio.
- Testes de escalada horizontal, vertical e isolamento.

O usuário autenticado nunca fornece o próprio papel ou escopo como fonte confiável.

## 10. Arquivos e mídia

- Conteúdo bytea e metadados no mesmo PostgreSQL, em tabelas separadas (decisão de 14/09/2026).
- PostgreSQL é o único backend; arquivos de teste legados devem ser reenviados quando necessários.
- Quarentena e conteúdo liberado separados por chave e estado, com autorização no painel.
- URLs assinadas e curtas para conteúdo privado.
- Nome físico gerado pelo sistema.
- Allowlist de extensões.
- Verificação de MIME e assinatura real.
- Limites de tamanho e resolução.
- Checksum para integridade e duplicidade.
- Antivírus antes de disponibilizar o arquivo.
- Imagens processadas em worker com biblioteca atualizada.
- Vídeos grandes processados fora do request web.

Guardar binários no PostgreSQL foi autorizado pelo usuário em 14/09/2026. Não servir uploads de uma
pasta executável. Incluir os bytes nos backups e validar restauração por checksum. Configuração e
transição: [armazenamento no banco](DATABASE-FILE-STORAGE.md).

## 11. Validação e APIs

- Zod nas fronteiras de entrada.
- OpenAPI para APIs consumidas por app/site e integrações.
- Prefixo de versão, por exemplo `/api/v1`.
- Paginação e limites máximos.
- Rate limiting por identidade e rota.
- Erros padronizados sem detalhes internos.
- Idempotência em publicação, agendamento e integrações.
- Webhooks assinados, com proteção contra replay.

Conteúdo externo deve retornar apenas registros publicados, vigentes e destinados ao canal
solicitante.

## 12. Verificação da OAB

Consulta institucional implementada: OAB-BA/Implanta, relatório STATUS CAAB, conforme
[contrato da spec005](../specs/005-members-management/contracts/oab-query.md) e
[registro LEG-001](LEGACY-REUSE.md). CNA/ConfirmADV são referências oficiais para conferência
nacional; não substituem automaticamente o relatório CAAB.

Regras:

- Integrar somente por API ou convênio oficial documentado.
- Não usar scraping nem contornar CAPTCHA.
- Manter fluxo manual quando não houver integração.
- Registrar fonte, data, método, operador e resultado.
- Não interpretar automaticamente uma consulta pública como decisão interna de bloqueio.
- Minimizar e proteger dados pessoais conforme LGPD.

## 13. Jobs e processos assíncronos

Usar worker Node.js separado para:

- Publicação e despublicação agendada.
- Distribuição de notícia por canal.
- Processamento e antivírus de mídia.
- Geração de thumbnails quando houver handler implementado; não presumir esse recurso pela
  existência do worker.
- Exportações.
- Notificações futuras.
- Sincronizações autorizadas.

Reutilizar a fila pg-boss, o worker e os registros de execução/idempotência já implementados sobre
PostgreSQL. Cada módulo acrescenta seus handlers; não criar filas ou centrais concorrentes.

Princípios:

- Idempotência.
- Retry com backoff.
- Dead-letter ou estado terminal de falha.
- Progresso persistido.
- Mensagem de erro útil e segura.
- Identificador de correlação.

## 14. Auditoria e logging

### 14.1 Auditoria de negócio

Tabela append-only com:

- Ator e identidade efetiva.
- Ação.
- Entidade e ID.
- Antes e depois, com campos sensíveis redigidos.
- Data UTC.
- Origem e request ID.
- Solicitações de exclusão de Colaboradores/Associados exigem motivo não vazio e autor/data por
  ocorrência. Demais ações dispensam justificativa humana. Preservar motivos históricos sem
  preencher ausências retroativamente, conforme o princípio V da constituição.

### 14.2 Logs técnicos

Logs estruturados para erros, latência, falhas de job e integrações. Nunca registrar senhas, tokens,
cookies, arquivos completos ou dados pessoais sem necessidade operacional aprovada.

Auditoria de negócio e logs técnicos possuem finalidades e retenções distintas.

A experiência reúne Eventos e Processamentos na área Auditoria. A fusão não mistura tabelas nem
permissões de leitura/operação: `audit:read`, `jobs:read` e `jobs:redrive`. `audit:export` é uma
chave legada; a permissão geral `exports:generate` combinada com leitura já integra a autorização da
cadeia existente. A migração do fluxo visual para download direto continua nas tarefas da spec003.
URLs existentes podem permanecer compatíveis. Jobs e exportações reutilizam os serviços atuais.

## 15. Segurança

Baseline: OWASP ASVS nível 2.

Controles mínimos:

- TLS obrigatório.
- CSP restritiva.
- Headers de segurança.
- CSRF nas operações baseadas em cookie.
- Sanitização contra XSS.
- Queries parametrizadas.
- Rate limiting e proteção de login.
- Segredos em secret manager ou variáveis protegidas.
- Dependency scanning e atualização planejada.
- SAST e secret scanning no CI.
- Backup criptografado e restauração testada.
- Revisão de permissão em toda nova rota.

## 16. Testes

Os comandos vigentes estão no [package.json](../package.json). A seleção das suítes está em
[vitest.workspace.ts](../vitest.workspace.ts), e os fluxos de navegador em
[playwright.config.ts](../apps/web/playwright.config.ts). Executar a partir da raiz da entrega.

| Alteração / risco                      | Verificação                                                                          | Comando e fonte                                                                                      |
| -------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| Documentação                           | Formato dos arquivos alterados, links e consistência entre fontes                    | `pnpm format:docs:check <arquivos>`, `git diff --check`; [TOOLING](TOOLING.md)                       |
| Código TypeScript                      | Formato, lint, tipos e build                                                         | `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm build`                                     |
| Regras e componentes                   | Casos normais, limites e falhas                                                      | `pnpm test:unit`; projetos unit do Vitest                                                            |
| Contratos e schemas                    | Entradas, saídas, compatibilidade e campos proibidos                                 | `pnpm test:contract`; [contratos](../packages/contracts/tests/) e [web](../apps/web/tests/contract/) |
| Persistência, permissões, concorrência | Constraints, migrations, negação, escalada horizontal/vertical, transições e retries | `pnpm test:integration`; [banco](../packages/db/tests/) e [web](../apps/web/tests/integration/)      |
| Jornadas críticas afetadas             | Percurso completo e falhas de operação                                               | `pnpm test:e2e`; [E2E](../apps/web/tests/e2e/)                                                       |
| Interface e acessibilidade             | Axe, teclado/foco, temas, responsividade e roteiro manual do guia                    | `pnpm test:a11y`, E2E afetados e [caab-design](caab-design.md)                                       |
| Autorização, uploads e conteúdo rico   | Matriz de acesso, XSS, arquivos inválidos/maliciosos e isolamento                    | Suítes unit/contract/integration/E2E pertinentes e critérios da spec                                 |
| Exportações                            | Filtros, três formatos, colunas, completude, permissões e recuperação                | Suítes pertinentes e [perfil aprovado](../specs/002-integrated-modules/export-validation-100.md)     |

Para recorte local de Vitest, usar
`pnpm exec vitest run --project <unit|contract|integration> <arquivo>`; isso não substitui os gates
completos da entrega. Evidências registram comandos reais, versão, resultado e limitações. Não
marcar teste como aprovado só por existir uma tarefa concluída.

Integrações usam banco efêmero/Testcontainers conforme o teste; navegador exige ambiente sintético,
banco, migrations e serviços configurados. A configuração Playwright pode construir e iniciar o
servidor: não executar contra preview/banco de uso nem ligar localhost sem autorização. Consultar
[CI](../.github/workflows/ci.yml) e [runbook local](runbooks/local-workspace.md) para preparação,
recursos e restrições. Não copiar credenciais de produção nem aplicar seeds no banco do usuário.

O [workflow de entrega](DELIVERY-WORKFLOW.md) define os gates e aprovações obrigatórios. O CI
executa suas verificações mesmo quando a revisão local teve escopo documental; esta matriz não
altera workflows, proteções ou critérios de merge. Alteração apenas documental requer as
verificações documentais, sem iniciar serviços para simular validação de código inalterado.

## 17. Estrutura existente

```text
apps/
  web/
    app/
    components/
    modules/       # auth, users, news, members, partners, scheduling,
                   # messaging, audit, files, jobs, shared e workspace
  worker/
packages/
  db/
  news/
  contracts/
  config/
infra/
  postgres/
  clamav/
  observability/
  github/
docs/
specs/
```

Começar com poucos packages. Criar nova separação apenas quando houver fronteira real de
reutilização ou implantação.

## 18. Infraestrutura

Configuração encontrada no repositório:

- Docker Compose declara PostgreSQL, ClamAV e coletor OpenTelemetry.
- Web e worker são aplicações Node; a forma de hospedá-los deve ser conferida no ambiente de
  destino.
- Arquivos, imagens, documentos e exportações são armazenados no PostgreSQL.
- MinIO/S3 não são backend atual e não possuem fallback; registros antigos são históricos.
- Caddy foi uma opção de desenho, não um componente cuja implantação foi comprovada nesta revisão.

Requisitos operacionais: separar local, DEV e PROD, com bancos e credenciais próprios. O estado
remoto precisa de evidência do ambiente; não pode ser inferido do Compose. Localhost permanece
desligado até ordem explícita; ao ligar, usar a versão mais recente do repositório local, conforme
[fluxo de entrega](DELIVERY-WORKFLOW.md).

Self-hosting só deve ir para produção com backup, monitoramento, atualização e restauração sob
responsabilidade definida.

## 19. Observabilidade e operação

- Health checks de web, worker, banco e antivírus.
- Métricas de latência, erro e saturação.
- Profundidade e idade da fila.
- Falhas e tentativas de distribuição.
- Alertas de backup e restauração.
- Runbooks para indisponibilidade, rollback e comprometimento de credenciais.

## 20. Ferramentas de qualidade

- ESLint.
- Prettier para código; documentos alterados têm verificação explícita por `format:docs:check`,
  descrita em [TOOLING.md](TOOLING.md). O comando geral não os inclui automaticamente.
- TypeScript strict.
- Lockfile obrigatório.
- Renovate/Dependabot: opções para automação futura; não há configuração encontrada nesta revisão.
- CI para lint, typecheck, testes, build, auditoria de dependências e migrations.

## 21. Componentes adotados

Relatórios (spec 010, 18/09/2026) reutiliza PostgreSQL, pg-boss e arquivos privados no banco. PDFKit
gera PDF paginado e gráficos vetoriais sem Chromium; write-excel-file gera XLSX com células tipadas,
e CSV usa UTF-8 BOM e neutralização de fórmulas. Esses exportadores de Relatórios são dependências
do worker para os caminhos legados, com versões fixadas no lockfile. Relatórios já usa o caminho
direto no detalhe sem agrupamento; a migração dos demais modos pertence à spec010. O núcleo de
exportação direta no web usa pg-cursor, ExcelJS e PDFKit. Não confundir o núcleo integrado com a
migração de todos os módulos ao download direto. Coleta própria usa eventos permitidos e HMAC; não
adiciona provedor ou serviço de analytics externo.

- Next.js + React + TypeScript.
- PostgreSQL.
- Payload CMS + Lexical para notícias.
- Tailwind + shadcn/ui + Radix UI.
- Lucide React para ícones.
- React e Zod; React Hook Form permanece opção histórica não incorporada.
- FullCalendar Standard para a interface da agenda.
- Núcleo próprio de Agendamentos implementado; expansões seguem a spec008. Cal.com permanece
  restrito à condição de esgotamento das alternativas, conforme a seção 7.
- Conteúdo de arquivos exclusivamente no PostgreSQL; adaptadores legados retirados.
- Worker e fila durável.
- OWASP ASVS nível 2, auditoria append-only e LGPD desde o desenho.
