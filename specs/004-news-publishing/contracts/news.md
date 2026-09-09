# Contratos — Notícias v1

Contrato HTTP completo: [openapi.yaml](openapi.yaml). Decisão expressa do usuário em 09/09/2026:
qualquer pessoa pode ler notícias publicadas. A política fica centralizada em public-service.ts
e poderá mudar neste mesmo spec. Acesso editorial continua herdado da sessão ativa do painel,
sem news:* ou segunda aprovação. Publicar não envia push.

## Administração

Base /api/v1/news. Todas as operações exigem sessão ativa; escrita exige origem/CSRF. JSON tem
limite de 1 MiB inclusive streaming. Cache private, no-store e noindex. Autor vem da sessão e
é revalidado dentro da transação; estado e autoria enviados pelo cliente são rejeitados.

| Operação | Contrato |
| --- | --- |
| GET /news | page (1–100000), state active/archived/all, search até 200; 25 itens e totalPages |
| POST /news | metadata e body opcional; Idempotency-Key 16–128; retorna 201 |
| GET /news/{id} | Último rascunho, inclusive arquivado |
| PUT /news/{id} | expectedVersion, metadata e body completos; retorna 200 |
| GET /news/{id}/versions | page; histórico paginado da mesma notícia |
| POST /news/{id}/duplicate | expectedVersion e chave idempotente; retorna novo rascunho 201 |
| POST /news/{id}/archive | expectedVersion; retira todos os canais e cancela agenda atomicamente |
| POST /news/{id}/restore | expectedVersion e versionId da mesma notícia; cria rascunho novo |
| POST /news/{id}/publish | expectedVersion e channels; chave idempotente; publicação 200 |
| POST /news/{id}/unpublish | expectedVersion e channels; chave idempotente; último rascunho 200 |
| POST /news/{id}/schedule | expectedVersion, action publish/unpublish, channels, runAt ISO UTC, timezone America/Sao_Paulo; chave idempotente; ação 200 |
| GET /news/{id}/publication | publicação atual ou null e 100 ações recentes com estado do job |
| POST /news/{id}/actions/{actionId}/cancel | Cancela pending; repetição de cancelamento aceita |
| POST /news/{id}/actions/{actionId}/retry | Reenvia ação pendente cujo job falhou; repetição queued/running não reenfileira |

metadata: title até 200, summary até 500, slug vazio no rascunho ou até 180 caracteres
minúsculos/números separados por hífen, category até 80, até 20 tags de 1–80 caracteres,
channels site/app sem repetição, cover null ou {fileId,alt}, highlight null ou {order:1–100}.
Descrição tem até 500 caracteres. Campos omitidos de metadata voltam ao padrão: PUT substitui o
conjunto completo. expectedVersion é inteiro positivo seguro. Rascunho admite conteúdo incompleto.

Publicação exige título, slug exclusivo entre notícias publicadas, conteúdo válido e ao menos
um canal. Publicar substitui o conjunto público de canais pelos escolhidos; retirar remove só
os escolhidos. Cada ação registra autor, revisão de origem/resultante, destinos e correlação.
Edição e recuperação não alteram publicação existente. Duplicar remove slug, mídia, destaque,
canais e agenda; texto/histórico originais são preservados.

Agenda fixa versão Payload, canais e responsável. Horário deve estar no futuro dentro de 365
dias. Retirada exige publicação existente e referencia sua revisão, mesmo havendo rascunho
mais recente. Uma nova publicação cancela a retirada antiga na execução. Edição posterior não
troca conteúdo agendado; o worker preserva o rascunho mais recente ao publicar revisão anterior.
Worker revalida responsável ativo, mídia, arquivamento e cancelamento. Estado pending/succeeded/
cancelled pertence à ação; queued/running/failed/succeeded e tentativas pertencem a job_execution.
Job tem cinco tentativas previstas. Ao esgotá-las, cancelar e criar novo agendamento após corrigir
a causa. Retry manual exige apenas o acesso editorial e usa a mesma infraestrutura/auditoria.

Erros: 401 sessão; 403 origem/CSRF ou permissão existente de arquivos; 404 notícia/versão/ação;
409 versão obsoleta, arquivada, chave reutilizada para outro comando, ação incompatível ou slug
duplicado; 413 corpo grande; 422 estrutura/precondições/horário; 500 erro seguro sem detalhes internos.

## Corpo e mídia

Corpo Lexical canônico: root, paragraph, heading h2/h3, list/listitem, text simples/negrito/itálico,
linebreak e news-image no nível superior. Limites: 2.000 nós, profundidade 12, 100.000 caracteres.
Imagem: {type:"news-image",version:1,fileId:UUID,alt:string,caption:string}; descrição/legenda
até 500 caracteres. Texto é escapado, nunca interpretado como HTML. Provedores de embed não
habilitados; links, embeds e uploads nativos do CMS são rejeitados.

Upload reutiliza /api/v1/files/upload-intents, PUT assinado e finalize. Primeiro salvar a notícia
para obter ownerId; ownerType=news. PNG/JPEG até 25 MB. Permissões files:read/create existentes
são preservadas. Capa/corpo devem pertencer à notícia. Rascunho aceita mídia em verificação;
prévia/publicação exigem available, clean, private, não excluída e MIME detectado PNG/JPEG.
Descrição pode estar vazia no rascunho e é obrigatória ao publicar. Remover vínculo não apaga arquivo.

GET /news/{id}/media lista 25 itens (items,page,hasNextPage) com id,name,status,mime,usable.
GET /news/{id}/media/{fileId} exige files:read, revalida propriedade e liberação, retorna 307
privado temporário. Prévia exige sessão e não é indexável. Nenhum segundo storage é criado.

## Leitura pública para site e aplicativo

Base /api/v1/content/{channel}/news; channel é site ou app. Sem login/credencial nesta fase.
Mesmo contrato v1 em DEV/homologação/produção; consumidor configura somente a origem HTTPS do
ambiente (DEV local http://localhost:3000). Não inventar origens de ambientes não implantados.
Respostas têm Cache-Control: no-store, CORS * e nosniff; consumidores não devem persistir cópias
para exibição após retirada sem revalidar. Rascunhos, arquivados e canal não selecionado retornam 404.

- GET na base: page e search; items até 25 sem body, page e hasNextPage. Ordem: destaque crescente,
  depois publicação mais recente e id; itens sem destaque vêm por último. Não aceita state.
- GET /{id}: documento publicado v1 com schemaVersion, id, revision, channel, publishedAt, title,
  summary, slug, category, tags, highlight, cover e body. Sem autoria administrativa, sessão,
  histórico, notas internas ou objectKey. Exemplo: [delivery-example.json](delivery-example.json).
- GET /{id}/media/{fileId}: 307 somente se a imagem estiver referenciada nessa publicação e
  continuar liberada e pertencente à notícia. Nova consulta após retirada/exclusão retorna 404.
  URL já assinada dura no máximo 300 segundos. Bucket permanece privado; não usar a rota de
  mídia administrativa no aplicativo. Ler bytes pelo redirecionamento; descrição vem do documento.

Página pública: /content/{channel}/news e /content/{channel}/news/{id}/{slug}; caminho só com id
redireciona para o endereço legível atual. Renderer reutiliza a gramática segura do painel.

Transporte escolhido: consulta (pull). A publicação e a seleção de canais são atômicas no banco;
o painel mostra disponibilidade, não confirmação de recebimento. Falha de conexão do site não
despublica o app. Consumidores repetem GET com segurança. Os apps externos precisam integrar
este contrato em seus próprios repositórios; isso não é uma credencial pendente do painel.
Não existem adaptadores fictícios de push, webhooks de recebimento nem tabela paralela de entrega.
# Consulta administrativa

`GET /api/v1/news` mantém `page`, `search` e `state=active|archived|all`. Acrescenta:
`collection=all|published|drafts`, `category` (trecho, até 80 caracteres), `channel=all|app|site`
(destino previsto da revisão), `highlight=all|yes|no`, `cover=all|yes|no`,
`updatedWithin=all|7|30|90` e `sort=updated-desc|updated-asc|created-desc|created-asc|title-asc|title-desc`.
Valores padrão: página 1, não arquivadas, todas as coleções, demais filtros vazios/`all`,
atualização decrescente. Ordenação ocorre antes da paginação de 25 itens com desempate por ID.
`published` significa publicação existente no histórico; novas edições/retiradas não movem
essas notícias para rascunhos. `drafts` nunca teve publicação, incluindo agendamentos pendentes.
As páginas fixam suas coleções mesmo se a query string pedir outra. API privada, sessão ativa,
`private, no-store`; parâmetros inválidos retornam 422. API pública mantém apenas page/search.

# Erros por campo

Falhas de validação e pré-requisitos editoriais retornam `fields: [{ path, code }]` além do erro
geral. `path` identifica o controle (`metadata.slug`, `title`, `cover.alt`, `content`, etc.).
Conflito de endereço publicado retorna 409 com campo `metadata.slug`. Mensagens internas e dados
de exceção não são expostos; a interface traduz os códigos e mantém o texto editado.
