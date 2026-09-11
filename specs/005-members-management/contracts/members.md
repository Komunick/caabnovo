# API administrativa v1

## Foto de perfil (11/09/2026)

**Entrega administrativa pronta e aceita.** Esta é a foto que o próprio associado colocará
no app, compartilhada com o painel pela referência única `member.photo_file_id`.
As rotas abaixo continuam administrativas. Na integração do app, o servidor deverá resolver
a identidade autenticada para o próprio associado e aplicar autorização de titularidade,
sem conceder permissões administrativas ou aceitar um `ownerId` arbitrário do cliente.
Reutilizar armazenamento privado, validação e referência; registrar a autoria do associado.
O endpoint/fluxo de envio pelo app não é implementado por esta entrega.

No formulário de criação, a seleção é local até o envio do cadastro. Após receber o ID,
a UI envia e vincula a foto pelo mesmo contrato abaixo. Falha na foto não repete a criação:
o cadastro permanece salvo, com opção de retomar a foto ou abrir o perfil.

GET do cadastro passa a retornar `photoFileId: UUID | null`; sem `files:read`, retorna null.
O comando `photo` aceita `{ action: "photo", fileId: UUID | null, expectedVersion, justification }`.
Exige `members:read`, `members:write` e `files:read`. UUID vincula imagem privada JPEG/PNG de
até 5 MB do próprio associado, available/clean e não excluída; null remove o vínculo.
Reutiliza idempotência e controle de versão; preserva profile_version, avaliações e documentos.

`GET /api/v1/members/{id}/files/{fileId}/status` retorna metadados seguros e estado de um
arquivo próprio para acompanhar verificação; exige `members:read` e `files:read`, no-store.
Upload/finalize permanecem nas rotas existentes com `ownerType: "member"` e `ownerId: id`.
Imagem exibida usa download privado existente, nunca URL pública persistida.

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
