# Contratos v1 de Parceiros

Privadas: sessão ativa; partners:read em todas as leituras, partners:write para cadastro/unidades/contratos/rascunhos, partners:publish para aprovar/encerrar contrato e publicar/ocultar benefício. Publicar também precisa de consulta. Arquivos exigem files:read; envio/finalize exige files:create + partners:write. Concessões atuais revalidadas no banco. Administrador recebe novas permissões; demais perfis somente concessão explícita.

| Rota | Contrato |
| --- | --- |
| GET /api/v1/partners | q/category/status/page; paginação 25, hasNextPage, opções de categorias |
| POST /api/v1/partners | profile + justification; retorna PartnerRecord |
| GET /api/v1/partners/{id} | perfil, unidades, contratos, benefícios e version; documentos redigidos sem files:read |
| POST /api/v1/partners/{id}/commands | expectedVersion, justification, action e entrada específica |
| GET /api/v1/partners/{id}/history | page; histórico contextual sem dados privados desnecessários |
| GET /api/v1/partners/{id}/files | arquivos próprios e estado de verificação |
| GET /api/v1/partners/{id}/files/{fileId} | redirect temporário privado após reautorização |
| GET /api/v1/partners/benefits | q/category/status/channel/page; ofertas administrativas com parceiro e vigência |
| GET /api/v1/benefits/{channel} | público; channel site/app, q/category/page; somente ofertas exibíveis |

Mutações JSON <=64 KiB, Origin/CSRF e Idempotency-Key existentes. Ações: update, status, archive,
restore, unit (criar/editar), contract (registrar), contract-status (aprovar/encerrar), benefit
(salvar rascunho), publish, hide. Cada filho valida pertença ao parceiro; contratos não reescrevem
conteúdo. Respostas privadas no-store, erros seguros 401/403/404/409/413/422 com códigos de domínio.

Projeção pública whitelist: id/título/descrição/condições/público/datas, nome/categoria do parceiro,
unidade/localidade/endereço/abrangência. Sem CNPJ, contatos administrativos, documentos, contrato,
atores, permissões ou identidade de associado. Consulta no-store revalida vigência/estados; a
publicação expressa decisão de exibição, não comprova elegibilidade do consumidor. App/site
consomem este contrato sem exigir alteração dos respectivos frontends nesta entrega.

CNPJ normalizado em maiúsculas, sem máscara, com DV alfanumérico oficial; datas civis ISO.
Website somente http/https. Rascunho aceita campos de publicação incompletos; publicar revalida
conteúdo e intervalo contido no contrato. Todos os textos são texto simples escapado no React.
