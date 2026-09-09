# Modelo de domínio — Notícias

Payload é a autoridade única de conteúdo/versões em news/_news_v. A identidade é projeção
somente leitura da tabela user; não há segundo login, tabela de usuários ou Admin do CMS.

## Conteúdo e revisões

Notícia: UUID, metadata, body canônico Lexical, revision crescente, archived, editorUserId,
createdAt/updatedAt e _status draft/published. O registro principal guarda a publicação;
as versões guardam também o rascunho mais recente. schema push e criação de banco desabilitados.
Metadados e limites: [contracts/news.md](contracts/news.md).

highlight é null ou {order:1–100}, armazenado na revisão. Destinos e capa pertencem à mesma
notícia; nenhum cadastro paralelo de slide. Publicar torna o destaque visível, remover e
republicar o retira. Ordenação usa order, publishedAt e id. Migração 0009 acrescenta somente
colunas JSON de destaque e índice de consulta pública, preservando versões anteriores.

Criar/editar/duplicar/recuperar compara revisão sob lock da notícia. Toda gravação e auditoria
compartilham a transação Payload/PostgreSQL. Autoria vem da sessão ativa revalidada sob lock;
retry de criação/duplicação/publicação/retirada usa idempotency_record existente. Fingerprint
incompatível retorna 409. Duplicar zera slug/canais/capa/imagens/destaque; restauração não publica.

## Publicação e retirada

Publicar valida corpo e mídias sob lock compartilhado dos arquivos e serializa slug concorrente
com advisory lock. Slug público duplicado é rejeitado. expectedVersion fixa a origem; resultado
usa latestRevision+1. Ao publicar revisão agendada antiga, grava a publicação e recoloca o
rascunho mais recente como outra revisão na mesma transação. Retirada parcial preserva demais
canais e conteúdo privado. Arquivar retira todos os canais e cancela ações pendentes atomicamente.

## Mídia

Referências UUID em capa e news-image apontam stored_file com owner_type=news e owner_id da
notícia. Rascunho aceita pending; uso exige available/clean/private, deleted_at nulo e MIME real
PNG/JPEG. Upload, quarentena, antivírus, storage e cinco minutos de URL assinada são da fundação.
Nenhum arquivo é apagado pela remoção de vínculo editorial. Acesso público exige referência na
revisão principal publicada e canal selecionado, revalidando estado/propriedade antes de assinar.

## Ação agendada e processamento

Migração 0008: news_action(id,news_id,version_id,source_revision,action,channels,run_at,timezone,
status,requested_by,idempotency_key,fingerprint,job_id,request_id,correlation_id,created_at,
completed_at,cancelled_by,result_revision). FKs para news, _news_v, user e job_execution; chave
única por usuário/idempotency_key e job_id; checks de ação, canais, fuso e conclusão coerente.
Não copia conteúdo. O serviço verifica que a versão pertence à notícia e corresponde à revisão.

Ação pending → succeeded/cancelled; falha transitória permanece pending e aparece em job_execution
como failed, com código seguro. Fila news-publication usa pg-boss existente, cinco tentativas,
backoff e dead letter. Inserção de ação/job/fila/auditoria é transacional. Retry usa o mesmo
job_execution e comando; lock serializa cancelamento/arquivamento/execução. Ação já concluída
não repete publicação nem auditoria. Responsável deve continuar ativo no momento da execução.
Retirada referencia revisão publicada e é cancelada se houver publicação posterior.

## Leitura para consumidores

public-service aplica política de leitura aberta definida pelo usuário, com filtros obrigatórios
_status published, archived false e canal. Não aceita estado de rascunho no contrato público.
DTO v1 contém somente campos editoriais; consulta e página pública não expõem autor/histórico/
sessão/storage. Disponibilidade é distinta de confirmação de consumo, que não é presumida.
