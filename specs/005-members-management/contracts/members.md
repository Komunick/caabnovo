# API administrativa v1

Sessão ativa e `members:read` em todas as rotas; `members:write` para criar, editar, arquivar, restaurar, vincular e anexar; `members:review` para avaliações e revisões. Arquivos exigem também `files:read`; upload e finalização exigem `members:write` e `files:create`. As concessões são revalidadas no banco; não há MFA, conforme remoção do autenticador na spec 006. Cache private/no-store. Mutações JSON <=64 KiB, Origin pública configurada em BETTER_AUTH_URL, x-csrf-token e Idempotency-Key (16–128), expectedVersion em registros existentes. Erros seguros 401/403/404/409/413/422, sem SQL/CPF.

| Rota | Contrato |
| --- | --- |
| GET /api/v1/members | q/page/archived/registrationStatus/oabState, 25 itens sem CPF; oabState opcional, sigla de UF válida em maiúsculas; filtros combinados e preservados na paginação |
| POST /api/v1/members | perfil e justificativa |
| GET /api/v1/members/{id} | perfil, relações, documentos e avaliações |
| POST /api/v1/members/{id}/commands | action: update/archive/restore/link/unlink/document/review/assess |
| GET /api/v1/members/{id}/history | page, 50 eventos contextuais |
| GET /api/v1/members/{id}/files | page, arquivos próprios |
| GET /api/v1/members/{id}/files/{fileId} | grant privado temporário, arquivo seguro próprio |

Schemas executáveis em packages/contracts/src/members.ts. Upload da fundação com ownerType=member e ownerId=id. Credencial é situação/validade registrada, não cartão autenticável emitido. Caassh segue [handoff](caassh-handoff.md).

Mobile: sem lista pública ou provisionamento nesta entrega; futura identidade vinculada acessará somente projeção própria, sem CPF/documentos/revisões internas nem acesso administrativo automático.

Revisões: cada documento inclui reviews[] com id/result/reason/actorName/createdAt, da mais recente à mais antiga. Respostas sem files:read não incluem evidências documentais. Histórico inclui eventos de vínculos dos quais a pessoa é dependente.
