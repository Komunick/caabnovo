# Implementation Plan: Notícias: concessão explícita e exportação

**Branch da entrega**: `docs/project-clarify-20260921` | **Data**: 2026-09-21
**Spec**: [spec.md](spec.md) | **Estado**: desenho concluído; implementação/validação pendentes.

## Summary

Preservar a separação editorial existente, retirar o acesso implícito e exportar as listas/revisões autorizadas.

US1 rascunhos, US2 publicação, US3 programação/distribuição e US4 exportação. Não alterar API pública nem acrescentar aprovação editorial.

## Technical Context

TypeScript 6.0.3, Node 24, Next 16.3.4, React 19.2.8, Zod 4.5.4 e pg8.23.0 do checkout;
PostgreSQL 18 no CI. Monólito modular; banco também armazena arquivos legados. Sem S3/MinIO
novo. Testes Vitest 4.1.11, Playwright 1.62.1 e Axe existentes. UI desktop/390 px, temas,
teclado e tokens compartilhados. Exportação incremental com pg-cursor/ExcelJS propostos
e PDFKit existente, sujeitos a spike/versão fixada no código; nenhum pacote instalado agora.

**Performance/escala**: preservar p95 de 2s das telas comuns; não aplicar esse alvo a
transferência integral arbitrária. Exportações não têm teto funcional de registros/período.
Aplicar o [perfil C1 de100 registros](../002-integrated-modules/export-validation-100.md):
medir tempo/recursos e validar integridade, resposta do painel e recuperação. Sem prova
de estresse/grande volume nesta rodada; manter produto sem teto funcional de registros.
**Restrições**: banco único, autorização atual por ação; sem localhost, deploy, seed real,
limpeza de dados ou implementação nesta fase. Q10/Q11 e módulos futuros continuam adiados.

## Constitution Check

Pré-pesquisa: escopo decorre de Q1–Q11 e complementos, sem política institucional inferida.
Pós-desenho: monólito/fonte única, negação por padrão, auditoria mínima, integridade no
PostgreSQL e UI compartilhada preservados. Constituição 2.0.0 concilia justificativas já
retiradas; autenticação continua sem MFA. Abstração de exportação cobre oito consumidores
reais, sem CRUD genérico. Não há violação de desenho sem justificativa. Aprovações
institucionais/produção permanecem pendentes; compatibilidade do desenho não é execução de gates.

## Phase 0 — Research

Decisões, alternativas e fontes em [research.md](research.md), com pesquisa transversal
[de 21/09](../002-integrated-modules/research-2026-09-21.md). Leitura estática conclui
as escolhas necessárias para este recorte; limitações operacionais viram validações
de implementação, não requisitos indefinidos. Sem consulta a contas/dados de produção.

## Phase 1 — Design

- A view effective_user_permission ainda concede news:read/write/publish a quem não tem user_access; guardas transacionais existentes não eliminam essa exceção. Fundação 001 remove o baseline na migração 0026; preservar grants explícitos e papéis válidos.
- Conferir news/payload/transaction.ts, prévias, uploads, comandos e execução programada. Corrigir somente bypass comprovado; não substituir controles por permissão única. Notícia publicada pública continua consultável sem login.
- Adaptador distingue revisão publicada do rascunho atual segundo a aba; filtros e sort reaproveitam news-service. Exportar não publica, agenda, retira ou duplica notícia.
- Texto rico exportado como texto autorizado, sem executar HTML/embeds; metadados de mídia podem aparecer quando consultáveis, bytes/token de arquivo não. Revisões/arquivadas respeitam o contexto escolhido.

Modelo em [data-model.md](data-model.md), interface em [contracts/exports.md](contracts/exports.md)
e [contrato comum](../002-integrated-modules/contracts/direct-exports.md). UI preserva
rascunhos/filtros e dados em falhas, sem exigir justificativa. Catálogo de colunas é
allowlist por função; servidor não confia no catálogo antigo do navegador.

## Project Structure

- `apps/web/modules/news/payload/transaction.ts` (existente).
- `apps/web/modules/news/news-service.ts` (existente).
- `apps/web/modules/news/ui/news-index.tsx` (existente).
- `apps/web/modules/news/http/news-route.ts` (existente).
- `apps/web/tests/integration/user-permissions.test.ts` (existente).
- `apps/web/modules/news/export-adapter.ts` e `export-adapter.test.ts` (novos planejados).
- `apps/web/app/(admin)/news/exportar/page.tsx` (nova planejada).

Leitura estática complementar: packages/news/src/action-runner.ts verifica conta ativa, mas não as permissões efetivas. Corrigir a autorização do worker em toda execução; isso é lacuna comprovada, não apenas hipótese de teste.

## Rollout, migração e rollback

Uma entrega/worktree; mudanças SQL aditivas e numeradas coordenadas pela spec001.
Preparar compatibilidade de leitura de chaves/snapshots antes de ativar migrações e
novos botões. Conta sem acesso não ganha concessão para preservar conveniência.
Diagnosticar conflitos antes da restrição008; parar sem corrigir registros automaticamente.
Rollback da UI/API deve preservar grants convertidos, dados e arquivos; não publicar
binário antigo que dependa exclusivamente de audit:export/reports:export após conversão.
Preferir correção compatível para frente; reversão SQL exige plano e evidência próprios.

## Validation e próximo passo

Conta sem user_access e sem papel não recebe Notícias; leitor/editor/publicador mantêm ações distintas; publicado público continua; três formatos não vazam revisão privada no contexto de publicada.

Executar roteiro [quickstart.md](quickstart.md) na implementação. Evidência anterior
nunca conclui tarefa nova. Pesquisa/plan encerrados; próximo comando desta solicitação:
speckit-tasks, organizado por história, com dependências e critérios independentes.

## Complexity Tracking

Núcleo comum necessário para aplicações repetidas em oito funções; adaptadores mantêm
as regras dos domínios. Sem microserviço, linguagem nova ou nova fonte de verdade.
Estado operacional serve somente à transferência atual; não é fila/histórico obrigatório.

## Histórico anterior — referência, não sequência executável atual

O conteúdo abaixo preserva decisões/evidências anteriores. Em caso de divergência,
valem o desenho de 21/09 acima e a spec vigente; não reabrir branches/PRs já integrados.

<details>
<summary>Plano anterior preservado</summary>

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
restrito ao módulo. `list-query.ts` lê a publicação vigente em `news` e a última revisão
de itens sem publicação para separar as listas. Arquivadas mantêm a localização histórica
no filtro Exibir, conforme a gestão anterior. Filtros JSONB, ordenação e contagem/paginação compartilham uma consulta parametrizada
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

## Plano da padronização de justificativas — 14/09/2026

1. Atualizar contratos de criação/alteração e registrar a distinção no serviço e auditoria.
2. Ajustar formulários e mensagens; manter ações sensíveis, permissões e concorrência.
3. Cobrir contratos negativos, criação sem motivo e motivo persistido em integração/E2E.
4. Executar formatação, lint, typecheck e testes sem serviços locais; CI executa banco,
   navegador e build. Abrir PR somente após validar a branch nova. Esta entrega é uma
   regra compartilhada coesa, coordenada pela spec 001, sem criar spec duplicada.

## Descrição opcional da capa — 14/09/2026

Retirar COVER_ALT_REQUIRED da política compartilhada de publicação imediata e
agendada. Manter o contrato atual que já normaliza descrição ausente para vazia.
Atualizar ajuda do seletor e apresentação da notícia. Validar a publicação direta
com capa sem descrição no E2E existente e a política com texto vazio/ausente.


## Regra vigente: nenhuma justificativa obrigatória — 14/09/2026

Atualizar contratos e serviços desta função para aceitar omissão/vazio; manter o campo opcional no contrato para compatibilidade com clientes antigos. Retirar entradas, estados e bloqueios de justificativa das telas. Normalizar ausência para vazio nas colunas históricas não nulas e para null na auditoria; preservar autoria, resultado e datas. Migration aditiva de política retira somente restrições de texto obrigatório, mantendo consistência das decisões. Não são necessários estados especiais de criação de notícia. Cobrir ausência em contratos, autorização, integração e E2E; executar banco/navegador/build no CI com serviços locais desligados.


## Correção de publicação e rascunhos — 16/09/2026

Na branch `fix/scheduling-ui-20260916`, estender PUT editorial com
`withdrawPublishedVersion` opcional e inteiro positivo. A operação explícita usa a transação
existente de publicação, valida sessão e revisões, verifica mídia, cancela ações pendentes,
salva com `draft:false`/`_status:draft` e registra retirada e edição atomicamente.
A preparação interna para Publicar/Agendar continua privada até confirmar o destino.
O editor recebe a revisão pública do painel de publicação, bloqueia o salvamento manual até
consultá-la e altera seus rótulos conforme esse estado. Listagem usa o documento público
para conteúdo, busca, ordenação e classificação; após retirada usa a última versão privada.
Validar contrato, rollback de auditoria, revisão obsoleta, worker cancelado, lista/inicial,
consumo app/site, erro recuperável no editor e rótulos específicos no browser do CI.


## Preservação compartilhada — 16/09/2026

Branch fix/scheduling-select-20260916, baseada em dev após PR29. Usar armazenamento temporário
em memória no layout autenticado, por rota/formulário/cadastro, com controles nativos e estado
React preservados. Integrar sucesso/cancelamento aos descartes e testar navegação entre módulos.
Não usar cache público, localStorage ou salvamento automático no banco.

## Plano da homologação — 16/09/2026

1. Conferir DEV, permissões GitHub, configuração versionada e entradas institucionais.
2. Validar as jornadas autorizadas com registros sintéticos isolados; nunca publicar a notícia de teste.
3. Corrigir lacunas técnicas em uma única branch, com testes dos controles e CI remoto.
4. Registrar resultados por ambiente, pendências externas e limites; abrir PR para dev sem merge ou aprovação.

## Acesso concedido a Notícias — Q8 de 21/09/2026

Corrigir a documentação antiga de sessão suficiente: o código já utiliza
news:read/news:write/news:publish no catálogo/gestão e em guardas. Preservar esse modelo. Proteger páginas, prévia, consultas, comandos,
mídia privada e execução agendada; revalidar concessão atual no servidor, incluindo
worker. Ocultar barra lateral, busca e Início quando sem acesso; preservar API e
página de notícias publicadas, sem segunda aprovação editorial. Exportação também
exige permissão geral. Q9 confirma consulta/alteração separadas e preserva a permissão
existente de publicar; não criar permissão única nem alterar concessões por esta
clarificação. AC01–AC03 serão conferência/validação e correção de lacunas encontradas.
Trechos anteriores sem permissão própria eram documentação desatualizada, não prova
do comportamento atual. Localhost desligado; somente documentação e leitura de código.

Evidência de leitura em 21/09: `modules/auth/permissions.ts` e
`modules/users/access-labels.ts` definem consultar/editar/publicar; `user-access.ts`
exige read para write e read/write para publish. `news/payload/transaction.ts`
revalida permissões atuais; `news/access.ts` protege mídia e `workspace/areas.ts`
condiciona Notícias a news:read. Isso corrige o diagnóstico anterior baseado em specs
antigas, sem declarar teste ou revisão completa executados.

## Checkpoint de revisão de código — 21/09/2026

Editor, mídia, publicação, rotas públicas e permissões web separadas existem. Worker de publicação não consulta concessões do solicitante; AC02/AC03 devem cobrir revogação com conta ativa. Início ainda renderiza notícias sem news:read. T027 exige só a evidência HTTP específica, não repetir como ausente a jornada UI comprovada. Exportação própria DX01 pendente; erros de editor coordenados em 001 T097.

Revisão estática da base `ed31baf`; nenhum teste de aplicação ou homologação nesta etapa.
Evidências e limites: [revisão transversal](../002-integrated-modules/code-audit-2026-09-21.md).

Executar adequações e seus testes em retomada de implementação. Preservar dados e decisões adiadas; a revisão atual altera somente documentação.

</details>
