# Ativação e bloqueio administrativo

Decisão do usuário em 10/09/2026: desbloqueio manual; integração com Agenda registrada para
entrega própria. Comparação com o sistema antigo em [LEG-002](../../../docs/LEGACY-REUSE.md).

## Comandos e autorização

`POST /api/v1/members/:id/commands`, mesma sessão, origem, CSRF e Idempotency-Key existentes.
Exige `members:read` e `members:review`, revalidados no banco. Nenhuma nova permissão concedida
a outros perfis. Corpo estrito: `{ action, expectedVersion, justification }`, justificativa
com 3–1000 caracteres após trim.

| Ação | Origem | Destino |
| --- | --- | --- |
| activate | inactive (Não ativado) | active (Ativo) |
| block | active | blocked (Bloqueado) |
| unblock | blocked | active |

Sem transições automáticas ou ação activate para contornar bloqueio. Arquivado recusa as
três ações. Restaurar não ativa/desbloqueia. Comandos não mudam avaliações ou profile_version.
Versão desatualizada retorna `MEMBER_VERSION_CONFLICT` (409); transição inválida retorna
`MEMBER_INVALID_STATUS_TRANSITION` (409). Falha de auditoria reverte toda a operação.
Mesmo comando/idempotência não duplica evento; nova intenção precisa de nova chave.

## Leitura

Detalhe e comandos retornam `administrativeStatus` e `administrativeDecision` (null até
primeira ativação; depois reason, changedAt ISO e actorName). Lista aceita filtro opcional
administrativeStatus=inactive|active|blocked e inclui o estado em cada item. Paginação e
demais filtros preservam a seleção. Histórico inclui motivo, autor, data e estados anterior/
posterior em after.previousAdministrativeStatus e after.administrativeStatus.

Resumo compartilhado recebe somente administrativeStatus, sem justificativa interna ou ator.
Agenda precisa de consulta complementar para titulares vigentes; contrato de integração em
[caassh-handoff.md](caassh-handoff.md). Expor estado não comprova aplicação da regra por Agenda.

## Migração e reversão

0013 acrescenta campos com CHECK e FK; cadastros existentes começam Não ativado sem inferir
aprovação. Migrations anteriores não são editadas, banco não é resetado nem semeado.
Rollback de aplicação pode ocultar as ações preservando campos/decisões/auditoria. Não apagar
a migration aplicada nem executar reversão destrutiva. Integração futura deve manter leitura
da restrição até uma decisão explícita de liberação.
