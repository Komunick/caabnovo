# Implementation Plan: Notícias e publicação editorial

Spec: [spec.md](spec.md). Função completa em um PR para dev; alterações futuras permanecem
neste spec. Não alterar main, permissões de outros módulos nem consultar legado.

## Arquitetura e decisões

Next 16.3.4/React 19.2.8, TypeScript 6, Node 24, Payload 3.88.0/PostgreSQL e Lexical 0.41.0.
Monólito modular: packages/news contém configuração CMS, pool, transação, validação de mídia,
publicação/retirada e executor de ação; web e worker existentes consomem o mesmo pacote/tabelas.
CMS Admin, login, endpoints CRUD nativos, jobs nativos, schema push e criação de banco desativados.
Better Auth/loadActiveSession, stored_file/scan, audit-writer, job_execution e pg-boss reutilizados.

Leitura pública aprovada pelo usuário em 09/09/2026. App e site consultam API v1; não precisam
de credencial de leitura nem exigem endpoint externo para o painel publicar. Não presumir
confirmação de recebimento nem envio de push. Revisão fixa e mídia segura também no worker.

## Estrutura implementada

- packages/contracts/src/news*.ts: metadados, comandos, corpo canônico, projeção v1.
- packages/news/src/: configuração única Payload, acesso transacional e publicação compartilhada.
- packages/db/migrations/0007_news.sql, 0008_news_actions.sql, 0009_news_highlights.sql:
  schema versionado, com FKs/checks/índices e permissões runtime; nenhuma alteração automática.
- apps/web/modules/news/: rascunhos, histórico, mídia, publicação, agenda e leitura pública.
- apps/web/app/api/v1/news/: sessão/CSRF/cache privado; apps/web/app/api/v1/content/: leitura aberta.
- apps/web/app/(admin)/news/: gestão editorial; apps/web/app/content/: lista/artigo públicos.
- apps/web/modules/news/ui/: Lexical, capa/imagens, histórico/prévia, publicação e agenda.
- apps/worker/src/jobs/publish-news.ts: inicialização do CMS e execução na fila existente.
- apps/web/tests/integration/news.test.ts: persistência e concorrência; news-worker.test.ts:
  integração web/worker/pg-boss real. Teste cruzado reside no web para não importar fontes do web
  no build de produção do worker.
- apps/web/tests/e2e/news*.spec.ts: rascunhos, mídia, publicação, agenda e acessibilidade.

## Integridade e segurança

Todas as mutações editoriais revalidam sessão/conta, tomam lock de notícia e auditam na mesma
transação. Workers validam conta responsável, cancelamento, revisão e mídia. Retry concluído
produz um efeito. Nova publicação não pode ser retirada por agendamento antigo. Publicar
revisão anterior preserva a edição privada mais recente. Leituras públicas filtram publicação
e canal e projetam allowlist de campos. URLs assinadas de mídia duram até 300 segundos.

Corpo: até 2.000 nós/profundidade 12/100.000 caracteres; JSON HTTP até 1 MiB. PNG/JPEG até 25 MB.
Descrição obrigatória ao publicar; texto/legendas escapados. Sem embeds habilitados. Agenda
em UTC, interface Brasília, futuro até 365 dias. Destaques usam a própria revisão da notícia.

## Compatibilidade e gates

Refinamento FR-013–FR-018: `NewsIndex` compartilha a composição das rotas `/news` e
`/news/drafts`; `NewsList` aplica filtros automaticamente com AbortController, debounce de
350ms e URL persistida. Controles adicionais são expansíveis para reduzir a altura inicial.
Miniatura usa o endpoint privado existente; erro/ausência têm placeholder. Resumo usa clamp
de duas linhas; revisão continua no detalhe. Links de ação usam Button variants e estilo
restrito ao módulo. `list-query.ts` lê a última versão e usa histórico publicado para separar
as listas. Filtros JSONB, ordenação e contagem/paginação compartilham uma consulta parametrizada
na transação com sessão ativa. Nenhuma alteração de schema, API pública ou permissões.


Adapter Payload retém conexão inicial: pool dedicado registra/libera no encerramento. Tipos pg
alinhados em 8.20.0. esbuild do Drizzle alinhado em 0.28.2 por override específico para eliminar
peer incompatível de Vite no contexto Better Auth; peers e geração de migration offline validados.
Geração é somente revisão em .cache/news-schema; nunca aplicada automaticamente.

Gates: format/lint/typecheck, unit/contract, PostgreSQL real e fila, build, security audit,
Playwright/Axe. CI sobe storage e antivírus locais para executar os mesmos cenários de mídia;
o cenário de agenda inicia e encerra o worker real. Não repetir manualmente a validação de Auditoria.
Evidência final e limites em [evidence.md](evidence.md). Checklist de requisitos: 16/16 aprovada.

Refinamento editorial local: manter Lexical integrado ao Payload, com toolbar própria em grupos,
seleção preservada, formatação segura até bitmask 15 e renderer compartilhado para leitura/prévia.
Prévia oferece Site/Mobile/Lado a lado; endereço automático usa título e sufixo curto, com
personalização opcional. Biblioteca de imagens passa a usar miniaturas e envio por arrastar.
O primeiro upload cria o vínculo privado em segundo plano sem navegar nem desmontar o editor.
Publicar/agendar persiste alterações antes da ação usando a revisão retornada; falha de gravação
interrompe a ação. Edição fica bloqueada durante a operação para preservar o conteúdo enviado.
Não há migration nem novo endpoint neste refinamento. Após validar no localhost, o usuário
autorizou finalizar o build e atualizar o PR único de Notícias para dev, com merge manual.

Constituição: conforme. Não houve nova autoridade, serviço externo, conta, storage, revisor ou
permissão de Notícias. Mudança de política pública registrada na spec por orientação do usuário.

Correção de proxy (10/09/2026): centralizar a comparação de origem em
`modules/shared/mutation-origin.ts`, usando a mesma URL pública da autenticação. Aplicar aos
validadores de Notícias/Usuários, Arquivos e Auditoria. Cobrir criação/edição de rascunhos com
URL interna e rejeição de origens externas, preservando CSRF e idempotência. Sem migration.
