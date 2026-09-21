# Contratos v1 de Parceiros

Regra vigente de 14/09/2026: todas as operações dispensam motivo escrito,
incluindo criação, edição, publicação, configuração e moderação. Contratos aceitam
omissão/vazio e preservam limites para texto legado opcional. Permissões, versão,
idempotência, confirmação aplicável e auditoria continuam obrigatórias.

## Diretório, configuração e avaliações

| Rota | Contrato e permissão |
| --- | --- |
| GET /api/v1/partners/units | partners:read; q/status/page, 25 unidades por página, parceiro e link contextual |
| GET /api/v1/partners/categories | partners:read; categorias, versões e contagem de parceiros não arquivados |
| POST /api/v1/partners/categories | partners:write; nome, ativa; id/expectedVersion e motivo para editar |
| GET /api/v1/partners/settings | partners:read; configuração atual e categorias |
| POST /api/v1/partners/settings | partners:publish; expectedVersion, mode all/selected, categoryIds únicos e motivo |
| GET /api/v1/partners/{id}/reviews | partners:read; status/page, 25 opiniões, total e média incluindo ocultas; sem referência privada do autor |
| POST /api/v1/partners/{id}/reviews/{reviewId} | partners:publish; expectedVersion, status published/hidden, motivo; nota/texto/autoria são recusados |
| GET /api/v1/benefits/app/categories | Público, no-store; IDs/nomes de categorias ativas permitidas com parceiro ativo não arquivado |

As mutações do diretório exigem também partners:read, Origin/CSRF e Idempotency-Key,
limite de corpo de 64 KiB e auditoria transacional. Conflitos retornam 409, referências
selecionadas inválidas retornam 422. Repetição retorna estado atual sem duplicar ações.
GET /api/v1/benefits/app aplica a seleção salva mesmo com filtro textual direto;
GET /api/v1/benefits/site permanece independente da seleção. O contrato legado de
categoria textual continua aceito; criação resolve/cria categoria ativa e normaliza
seu nome. Não há conexão de recebimento de avaliações do aplicativo nesta entrega.

Privadas: sessão ativa; partners:read em todas as leituras, partners:write para cadastro/unidades/contratos/rascunhos, partners:publish para aprovar/encerrar contrato e publicar/ocultar benefício. Publicar também precisa de consulta. Arquivos exigem files:read; envio/finalize exige files:create + partners:write. Concessões atuais revalidadas no banco. Administrador recebe novas permissões; demais perfis somente concessão explícita.

| Rota | Contrato |
| --- | --- |
| GET /api/v1/partners | q/category/status/page; paginação 25, hasNextPage, opções de categorias |
| POST /api/v1/partners | profile; justification opcional na criação; retorna PartnerRecord |
| GET /api/v1/partners/{id} | perfil, unidades, contratos, benefícios e version; documentos redigidos sem files:read |
| POST /api/v1/partners/{id}/commands | expectedVersion, action e entrada específica; justification obrigatória em edição/transição e opcional em criação |
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

Perfis de parceiro/unidade aceitam postalCode (oito dígitos, opcional), address,
city e state (UF válida); telefone aceita DDD + oito/nove dígitos, normalizado em
números. E-mail e URL http/https são validados pelo contrato compartilhado. No
comando unit, justification é opcional com ou sem unitId; criação e edição dispensam motivo.
Criação de parceiro/unidade sem motivo registra descrição automática na auditoria.
Novos campos de contato/endereço do parceiro não são incluídos na projeção pública.

CNPJ normalizado em maiúsculas, sem máscara, com DV alfanumérico oficial; datas civis ISO.
Website somente http/https. Rascunho aceita campos de publicação incompletos; publicar revalida
conteúdo e intervalo contido no contrato. Todos os textos são texto simples escapado no React.


## Regra final de justificativas — 14/09/2026

Nenhuma operação desta função exige motivo escrito. Campos de justificativa foram retirados da interface. Contratos aceitam omissão e vazio; texto legado opcional mantém seu limite. As exigências anteriores de justificativa estão substituídas. Histórico permanece preservado, e novos eventos registram autoria, data, ação e alterações automaticamente, sem motivo inventado. Fonte, resultado, autenticação, permissões, versão e dados necessários à operação continuam obrigatórios.
