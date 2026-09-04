# CAAB — Referência de Stack e Arquitetura

## 1. Contexto

Esta arquitetura atende ao sistema interno da CAAB. O aplicativo e o site externo permanecem fora do escopo de implementação inicial e consomem notícias por APIs controladas.

Módulos principais:

- Notícias e mídia.
- Unidades, serviços, profissões e profissionais.
- Agendamentos e disponibilidade.
- Associados e verificações da OAB.
- Parceiros e serviços parceiros.
- Colaboradores.
- Usuários, permissões e auditoria.

## 2. Arquitetura

Arquitetura recomendada:

**Aplicação web Next.js + BFF + Payload CMS, PostgreSQL, object storage e um worker dedicado.**

Fluxos principais:

- Navegador interno → BFF Next.js → domínio/PostgreSQL.
- Painel de notícias → Payload → PostgreSQL/object storage.
- App/site → API versionada → somente conteúdo publicado para o respectivo canal.
- BFF → fila durável → worker → publicação, mídia, notificações e integrações.

Usar um monólito modular. Separar serviços somente quando carga, segurança, implantação ou responsabilidade operacional demonstrarem uma fronteira real.

## 3. Linguagens

- **TypeScript:** aplicação, APIs, componentes, CMS, worker e testes.
- **SQL:** migrations, constraints, índices, views e políticas do banco.
- **CSS via Tailwind:** apresentação baseada em design tokens.
- **Python opcional:** somente para processamento isolado que tenha biblioteca claramente superior, como OCR ou análise de arquivos.

Não adicionar outra linguagem ao núcleo sem justificativa concreta.

## 4. Aplicação web

- Next.js App Router.
- React.
- TypeScript em modo estrito.
- React Server Components em telas adequadas.
- Client Components apenas para superfícies interativas.
- Route Handlers ou camada de serviço server-side como BFF.

O navegador não acessa diretamente tabelas sensíveis. O BFF aplica autenticação, autorização, validação, auditoria e regras de negócio.

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

Payload é responsável por conteúdo editorial, mídia e cadastros adequados. Ele não deve se tornar a autoridade das regras de agenda, bloqueio de associados ou permissões críticas sem uma camada explícita de domínio.

### 5.3 Editor

Lexical é o padrão porque já possui integração oficial com Payload. Se o sistema legado exigir editor independente fora do CMS, Tiptap é a alternativa preferencial.

Persistir conteúdo estruturado. HTML renderizado deve ser sanitizado e não pode aceitar scripts ou embeds arbitrários.

## 6. Interface e design system

- Tailwind CSS.
- shadcn/ui.
- Radix UI para primitivas acessíveis.
- Lucide React para ícones.
- TanStack Table para tabelas administrativas.
- TanStack Query para cache, polling e mutations.
- React Hook Form para formulários.
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

O núcleo de agendamentos será implementado no domínio CAAB. Cal.com não será a fonte de verdade inicial.

Cal.com poderá ser integrado no futuro para:

- Sincronização com Google/Outlook.
- Reservas públicas.
- Round-robin.
- Roteamento avançado.
- Lembretes e integrações já suportadas.

Antes de uso self-hosted ou incorporação do código, revisar AGPL e alternativas comerciais.

### 7.2 Integridade

- Intervalos tratados como `[início, fim)`.
- Datas persistidas em UTC.
- Timezone operacional padrão: `America/Bahia`.
- Disponibilidade calculada no servidor.
- Confirmação dentro de transação.
- Constraint de exclusão PostgreSQL por profissional e intervalo para impedir sobreposição.
- Chave de idempotência na criação para evitar duplicação por retry.
- Histórico de transições preservado.

FullCalendar é apenas a camada visual; nunca decide disponibilidade final.

## 8. Banco de dados

- PostgreSQL.
- Migrations versionadas.
- UUID como chave primária.
- Índices definidos a partir das consultas reais.
- Foreign keys e constraints obrigatórias.
- JSONB somente para conteúdo flexível ou snapshots; não substituir modelagem relacional central.
- Valores financeiros futuros em unidade monetária mínima e moeda explícita.
- Exclusão lógica em entidades auditáveis.

ORM recomendado: Drizzle ORM ou o adaptador exigido pelo Payload. Evitar manter dois modelos concorrentes das mesmas tabelas. SQL explícito é aceitável para constraints e consultas críticas.

## 9. Autenticação e autorização

A escolha final do provedor depende do sistema existente. Requisitos independentes do provedor:

- Cookies de sessão `HttpOnly`, `Secure` e `SameSite` apropriado.
- MFA para administradores.
- Expiração e revogação de sessões.
- Desativação imediata de usuário.
- RBAC com permissões concretas por ação.
- Autorização no BFF e serviços de domínio.
- Testes de escalada horizontal, vertical e isolamento.

O usuário autenticado nunca fornece o próprio papel ou escopo como fonte confiável.

## 10. Arquivos e mídia

- Storage S3-compatible.
- Metadados no PostgreSQL.
- Buckets públicos e privados separados quando necessário.
- URLs assinadas e curtas para conteúdo privado.
- Nome físico gerado pelo sistema.
- Allowlist de extensões.
- Verificação de MIME e assinatura real.
- Limites de tamanho e resolução.
- Checksum para integridade e duplicidade.
- Antivírus antes de disponibilizar o arquivo.
- Imagens processadas em worker com biblioteca atualizada.
- Vídeos grandes processados fora do request web.

Não guardar binários no PostgreSQL e não servir uploads diretamente de uma pasta executável da aplicação.

## 11. Validação e APIs

- Zod nas fronteiras de entrada.
- OpenAPI para APIs consumidas por app/site e integrações.
- Prefixo de versão, por exemplo `/api/v1`.
- Paginação e limites máximos.
- Rate limiting por identidade e rota.
- Erros padronizados sem detalhes internos.
- Idempotência em publicação, agendamento e integrações.
- Webhooks assinados, com proteção contra replay.

Conteúdo externo deve retornar apenas registros publicados, vigentes e destinados ao canal solicitante.

## 12. Verificação da OAB

Fonte oficial atual: Cadastro Nacional da OAB/ConfirmADV.

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
- Geração de thumbnails.
- Exportações.
- Notificações futuras.
- Sincronizações autorizadas.

Fila recomendada para a primeira versão: fila PostgreSQL compatível com o runtime escolhido, evitando Redis sem necessidade comprovada.

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
- Motivo exigido em ações sensíveis.

### 14.2 Logs técnicos

Logs estruturados para erros, latência, falhas de job e integrações. Nunca registrar senhas, tokens, cookies, arquivos completos ou dados pessoais sem necessidade operacional aprovada.

Auditoria de negócio e logs técnicos possuem finalidades e retenções distintas.

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

## 17. Estrutura sugerida

```text
apps/
  web/
    app/
    components/
    modules/
      news/
      scheduling/
      members/
      partners/
      employees/
      audit/
  worker/
packages/
  domain/
  db/
  ui/
  contracts/
  config/
infra/
  app/
  worker/
  postgres/
  storage/
  caddy/
docs/
```

Começar com poucos packages. Criar nova separação apenas quando houver fronteira real de reutilização ou implantação.

## 18. Infraestrutura

Modelo inicial:

- Containers Docker para web, worker e serviços necessários.
- PostgreSQL gerenciado ou self-hosted com operação madura.
- Storage S3-compatible.
- Caddy como reverse proxy quando self-hosted.
- Ambientes separados: local, DEV e PROD.
- Banco e credenciais separados por ambiente.

Self-hosting só deve ir para produção com backup, monitoramento, atualização e restauração sob responsabilidade definida.

## 19. Observabilidade e operação

- Health checks de web, worker, banco e storage.
- Métricas de latência, erro e saturação.
- Profundidade e idade da fila.
- Falhas e tentativas de distribuição.
- Alertas de backup e restauração.
- Runbooks para indisponibilidade, rollback e comprometimento de credenciais.

## 20. Ferramentas de qualidade

- ESLint.
- Prettier.
- TypeScript strict.
- Lockfile obrigatório.
- Renovate ou Dependabot com revisão.
- CI para lint, typecheck, testes, build, auditoria de dependências e migrations.

## 21. Decisão resumida

- Next.js + React + TypeScript.
- PostgreSQL.
- Payload CMS + Lexical para notícias.
- Tailwind + shadcn/ui + Radix UI.
- Lucide React para ícones.
- TanStack Table/Query.
- React Hook Form + Zod.
- FullCalendar Standard para a interface da agenda.
- Agenda própria; Cal.com apenas após prova de adequação e revisão de licença.
- Object storage S3-compatible.
- Worker e fila durável.
- OWASP ASVS nível 2, auditoria append-only e LGPD desde o desenho.

