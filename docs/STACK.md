# CAAB — Referência de Stack e Arquitetura

## Desenho vigente após clarify — 21/09/2026

Permissão geral `exports:generate` intersecta consulta de módulo/dados; sem acesso,
zero descoberta no menu/busca/Início. Notícias preserva read/write/publish, mas a
concessão implícita da view será removida; Agendamentos terá read/write explícitos.
Exportações novas usam filtros/colunas e Excel/CSV/PDF diretos, sem teto funcional
ou prazo/histórico obrigatório; dados/arquivos legados preservados. Desenho e tarefas
em [programa002](../specs/002-integrated-modules/plan.md).
Mensagens tem finalidade confirmada (comunicados/campanhas), mas continua protótipo
sob revisão de aderência; canais reais, chat interno e suporte futuro permanecem adiados.
Retenção institucional e critérios/documentos de dependentes ficam para depois.
Estados e propostas anteriores abaixo são históricos quando divergirem desta revisão;
nenhum código foi implementado pelo plan/tasks e localhost permanece desligado.


**Revisão de 21/09/2026:** arquitetura e opções não equivalem a implementação.
Estado por módulo e controles pendentes em [MODULES](MODULES.md) e na
[revisão de código](../specs/002-integrated-modules/code-audit-2026-09-21.md).
O calendário FullCalendar está integrado; conflito por beneficiário e concessões
de Agendamentos ainda não. Relatórios existe, com adaptações de autorização e
exportação direta pendentes. Não interpretar bibliotecas apenas recomendadas como instaladas.

## Estado consolidado — 17/09/2026

**Decisão vigente — 21/09/2026:** Mensagens prepara comunicados/campanhas aos associados, com público e programação. Finalidade confirmada; protótipo sem homologação, aderência/continuidade em M016 e meios/envio real adiados.

Colaboradores é a gestão atual de contas e permissões, nas rotas `/users`; não há cadastro separado
de RH. Um módulo futuro chamado **Recursos Humanos** permanece como possibilidade, pendente de
definição de finalidade, escopo e autorização de construção. Essa possibilidade não reativa os
requisitos antigos COL-001–COL-005 nem autoriza duplicar contas ou permissões.

Agendamentos já possui uma primeira versão administrativa implementada; app/site e expansões
continuam pendentes. As seções históricas não reabrem autorizações nem substituem este estado.

## Agendamentos — implementação da etapa 1 em 15/09/2026

A primeira versão do painel está implementada na branch feature/scheduling-management-20260915:
oferta, horários semanais/almoço, reservas futuras, consulta, remarcação, cancelamento
e histórico. O código ainda aceita sessão ativa sem concessão; isso é lacuna. Q8/Q9 exigem consultar/alterar separadas, em 008 AC01–AC03.
Validação e limites na [spec 008](../specs/008-scheduling-management/spec.md) e nas
[evidências](../specs/008-scheduling-management/evidence/release-review.md).
Esta atualização substitui o estado anterior de “somente pesquisa” para esse recorte.
Exceções, avaliações e demais estados permanecem posteriores. Calendário administrativo foi priorizado em 18/09 e está integrado, com CAL06 pendente;
a primeira interface do usuário no app/site continua pendente; CAASSH continua desativado.

## 1. Contexto e fontes da stack

Revisão de 17/09/2026: este documento distingue implementação, requisitos de operação e opções
futuras. Versões exatas vêm dos manifests de cada checkout e do lockfile; não duplicar uma tabela de
versões que envelheça separadamente das dependências. Configuração no repositório não comprova
instalação ou estado da hospedagem.

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
autorizados. Todos os módulos constam da [entrega integrada](MODULES.md), sem consultar código ou
telas do legado. A fundação atual deve ser reutilizada, com uma fonte de verdade por domínio.

Módulos principais:

- Notícias e mídia.
- Unidades, serviços, profissões e profissionais.
- Agendamentos e disponibilidade.
- Associados e verificações da OAB.
- Parceiros e serviços parceiros.
- Colaboradores.
- Usuários, permissões e auditoria.
- Dependentes, documentação, credencial e elegibilidade em Pessoas.
- Campanhas, segmentos e modelos de mensagens em Comunicação.
- Caassh e extrato em Créditos; portal restrito usando os mesmos cadastros de parceiros.
- Avaliações contextuais e relatórios dos domínios.
- Operações incorporadas à navegação de Auditoria como Processamentos.

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

Atualização de 18/09/2026, entrega em validação: FullCalendar Standard 7.1.0 adotado
no painel de Agendamentos (mês/semana/dia), com temporal-polyfill 1.0.1, locale pt-BR,
America/Bahia e tokens existentes. Lista diária preservada. Decisão e limites na
[spec 008](../specs/008-scheduling-management/spec.md); evidências em
[calendário](../specs/008-scheduling-management/evidence/calendar-2026-09-18.md).
TanStack Table/Query e React Hook Form abaixo continuam escolhas históricas não
adotadas nesta entrega; componentes e formulários próprios permanecem implementados.

- Tailwind CSS.
- shadcn/ui.
- Radix UI para primitivas acessíveis.
- Lucide React para ícones.
- TanStack Table para tabelas administrativas.
- TanStack Query para cache, polling e mutations.
- React Hook Form: opção histórica não incorporada; formulários atuais usam React e validação Zod.
- Zod para validação compartilhada.
- FullCalendar Standard para visualizações de agenda.

Design tokens mínimos:

- Cores institucionais e semânticas.
- Tipografia.
- Espaçamento.
- Raios e sombras.
- Estados de foco, hover, disabled e erro.
- Densidade confortável e compacta para tabelas.

Não usar ícones de múltiplas bibliotecas. Logos e símbolos institucionais devem ser assets próprios.

## 7. Agenda

### 7.1 Decisão

Planejamento incremental em [spec 008](../specs/008-scheduling-management/plan.md):
primeira entrega usou lista diária com componentes existentes. O incremento autorizado
em 18/09/2026 adiciona FullCalendar Standard como camada visual, sem mudar a autoridade
do servidor sobre vagas e reservas. App/site continua pendente.

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

Se FullCalendar vier a ser adotado, será apenas camada visual; a disponibilidade final permanece no
domínio e no banco.

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
- Ações sensíveis autorizadas e auditadas, sem motivo escrito obrigatório; preservar motivos históricos.

### 14.2 Logs técnicos

Logs estruturados para erros, latência, falhas de job e integrações. Nunca registrar senhas, tokens,
cookies, arquivos completos ou dados pessoais sem necessidade operacional aprovada.

Auditoria de negócio e logs técnicos possuem finalidades e retenções distintas.

A experiência reúne Eventos e Processamentos na área Auditoria. A fusão não mistura tabelas nem
permissões de leitura/operação: `audit:read`, `jobs:read` e `jobs:redrive`. `audit:export` é legado; sua substituição pela permissão geral combinada com leitura está pendente em 003 EX01. URLs
existentes podem permanecer compatíveis. Jobs e exportações reutilizam os serviços atuais.

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

- Vitest para unidade e integração.
- Playwright para jornadas críticas.
- Testcontainers ou banco efêmero para constraints reais.
- Axe em testes essenciais de acessibilidade.

Cobertura obrigatória por risco:

- Matriz de permissões.
- XSS no conteúdo de notícias.
- Upload inválido/malicioso.
- Publicação por canal e agendamento.
- Concorrência e conflito de horários.
- Transições de agendamento.
- Bloqueio/desbloqueio de associado.
- Redação de dados nos logs.

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

## 21. Decisão resumida

Relatórios (spec 010, 18/09/2026) reutiliza PostgreSQL, pg-boss e arquivos privados
no banco. PDFKit gera PDF paginado e gráficos vetoriais sem Chromium; write-excel-file
gera XLSX com células tipadas, e CSV usa UTF-8 BOM e neutralização de fórmulas.
São dependências do worker, com versões fixadas no lockfile. Coleta própria usa
eventos permitidos e HMAC; não adiciona provedor ou serviço de analytics externo.

- Next.js + React + TypeScript.
- PostgreSQL.
- Payload CMS + Lexical para notícias.
- Tailwind + shadcn/ui + Radix UI.
- Lucide React para ícones.
- TanStack Table/Query.
- React e Zod; React Hook Form permanece opção histórica não incorporada.
- FullCalendar Standard para a interface da agenda.
- Agenda própria em avaliação; Cal.com somente se nenhuma outra possibilidade for encontrada.
- Conteúdo de arquivos exclusivamente no PostgreSQL; adaptadores legados retirados.
- Worker e fila durável.
- OWASP ASVS nível 2, auditoria append-only e LGPD desde o desenho.

## Estado vigente — Agendamentos e CAASSH, consolidado em 17/09/2026

A primeira versão administrativa de **Agendamentos** está implementada (US1/US2 da
[spec 008](../specs/008-scheduling-management/spec.md)): oferta, horários, criação, consulta,
remarcação, cancelamento e histórico. A interface do usuário no app/site e as expansões restantes
continuam pendentes. O brainstorming anterior é histórico e não significa que o painel atual esteja
apenas em pesquisa.

**CAASSH: desativado — pendente de revisão.** As propostas de créditos abaixo/acima são referências
históricas, sem ativação ou implementação autorizada no ciclo atual. A revisão deverá confirmar
finalidade, escopo e eventuais dependências antes da retomada.
