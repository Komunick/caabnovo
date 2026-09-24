# Modelo de dados — primeira entrega

Migration aditiva 0020_scheduling.sql. Nomes finais conciliados com a base na implementação. Datas
de reservas em UTC; exibição America/Bahia.

| Entidade                      | Campos essenciais                                                                                | Relações/integridade                                                                                                    |
| ----------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| scheduling_unit               | id, nome, endereço/contato mínimos, ativo, version                                               | Unidade física própria da agenda.                                                                                       |
| scheduling_service            | id, unit_id, nome, ativo, version                                                                | Uma unidade tem vários serviços. Sem duplicar catálogo global antecipadamente.                                          |
| scheduling_procedure          | id, service_id, nome, descrição, duration_minutes, ativo, version                                | Duração inteira positiva; máximo cabe no dia operacional inicial.                                                       |
| scheduling_professional       | id, nome, ativo, version                                                                         | Identidade profissional distinta da conta de login.                                                                     |
| scheduling_assignment         | id, unit_id, procedure_id, professional_id, ativo                                                | Combinação única; procedimento pertence a serviço da mesma unidade.                                                     |
| scheduling_unit_hours         | unit_id, weekday, start_local, end_local                                                         | Dia sem faixa é fechado; início menor que fim, sem atravessar meia-noite.                                               |
| scheduling_professional_hours | professional_id, unit_id, weekday, start_local, end_local, lunch_start, lunch_end                | Jornada no funcionamento da unidade; almoço opcional em par e contido.                                                  |
| scheduling_booking            | id, assignment_id, member_id, starts_at, ends_at, duration_snapshot, status, version, created_by | status scheduled/cancelled; impedir sobreposição global por professional_id materializado coerentemente com assignment. |
| scheduling_booking_event      | id, booking_id, action, actor_id, occurred_at, mudanças mínimas                                  | Append-only, mesma transação; integrado à auditoria.                                                                    |
| scheduling_request            | actor_id, operation, key, payload_hash, result jsonb com projeção da resposta                    | Unicidade e resultado persistido da idempotência, sem PII desnecessária.                                                |

FKs sem exclusão cascata de reservas. Arquivar/inativar sem apagar histórico; não invalidar
referências usadas. Nome/endereço seguem padrões de campos do projeto. Snapshots de datas/duração
preservam compromissos após edição de catálogo; nomes atuais podem ser resolvidos, sem alterar a
trilha histórica de comandos.

Estados: criar → scheduled; remarcar mantém scheduled; cancelar → cancelled. Cancelled é terminal na
primeira entrega. Passagem do tempo não altera situação. Correção de registros passados e
completed/no_show/await não fazem parte deste recorte.

Cadastro beneficiário usa member.id existente, nunca user.id. Leitura de titulares vigentes usa
findSchedulingBeneficiary, preservando findMemberSummary; contrato mínimo do módulo, sem copiar
documentos/dados financeiros. Locks de cadastro e vínculos devem coordenar todos os comandos
envolvidos para tornar a checagem válida sob concorrência.

Decisão de 20/09/2026, a implementar em nova migration: reservas scheduled também devem impedir
sobreposição por member_id e intervalo [starts_at, ends_at), entre quaisquer profissionais/unidades.
Associado e cada dependente possuem member.id próprio; dependência não unifica identidade ou
ocupação. Manter a restrição existente por profissional. Não reescrever a migration 0020 nem alterar
reservas antigas automaticamente para viabilizar a nova restrição.

Alteração de jornada/ativação: verificar reservas futuras sob o mesmo lock de escrita de reservas,
recusar se houver incompatibilidade. Cancelar libera ocupação, sem excluir. Recursos físicos,
capacidade de grupo e fila não geram tabelas nesta primeira entrega.

## Modelo vigente do incremento — 21/09/2026

scheduling_booking conserva scheduled/cancelled, member_id individual e intervalo UTC [). Nova
exclusão por pessoa é independente de professional_id e unit_id. eligibilityWarning derivado não
vira coluna de status; sem trigger de cancelamento. Dados de titular no aviso são mínimos, sem
revelar documentos/finanças. Campo opcional beneficiaryId da consulta de disponibilidade é validado
e reautorizado; nenhuma listagem pública. Reserva cancelada não ocupa; intervalos adjacentes são
válidos.

Entidades técnicas/ciclo de vida em
[contrato comum](../002-integrated-modules/contracts/direct-exports.md); sem cópia de domínio.
Regras anteriores de MFA ou motivo obrigatório não são vigentes; a constituição 2.0.0 e contratos de
21/09 prevalecem. Mudanças descritas são planejamento, sem migration executada.

## Ciclo de vida implementado — 21/09/2026

`scheduling_booking.member_deletion_reviewed_at` identifica a ocorrência pela data efetiva da
exclusão; `member_deletion_kept_at` e `member_deletion_kept_by` identificam a decisão.
`kept_after_member_deletion` é um evento de histórico. Manter preserva status/horário e incrementa
version; cancelar reutiliza o comando existente. Nova exclusão não herda decisão anterior. O aviso é
derivado da data efetiva atual do associado e não remove o nome do histórico.

Migration0028 validada no CI descartável; sem aplicação local.

## Extensão proposta para 2C — 23/09/2026

Esta seção planeja a reserva externa e não descreve migration aplicada. O serviço terá política de
confirmação imediata ativada por padrão, desativável pela equipe para novos envios. A alteração da
política não muda a situação das reservas existentes.

Um envio externo pode criar reserva confirmada ou aguardando aprovação. A pendência conserva o mesmo
identificador, beneficiário e intervalo até a decisão da equipe; aprovação altera sua situação sem
criar segunda reserva, e recusa registra uma situação terminal e libera a ocupação. Não há expiração
automática. Os nomes finais dos novos estados e comandos devem ser conciliados com os contratos
existentes antes da migration.

Pendências e reservas confirmadas ocupam o intervalo do profissional e do beneficiário, inclusive
em disputas entre painel e app/site. A migration aditiva deve estender as restrições de exclusão e
o protocolo transacional para considerar ambas as situações ocupantes; recusa e cancelamento não
ocupam. Conferir conflitos preexistentes antes de ativar a restrição, sem alterar dados por
inferência. Decisões de aprovação/recusa exigem permissão de alteração, controle de versão,
revalidação e evento auditado. A fila administrativa precisa expor a idade da pendência para que a
equipe resolva solicitações sem prazo automático.

Decisão de 24/09/2026: remarcação externa também segue a aceitação do serviço. No fluxo manual,
modelar uma proposta de troca vinculada à reserva, com versão de origem e horário pretendido.
A reserva original permanece confirmada até a aprovação; o destino fica retido como pendência.
Aprovar aplica a troca no mesmo identificador e libera o horário anterior em transação; recusar
libera apenas o destino. A proposta não representa outro atendimento independente. O desenho de
ocupação deve proteger origem e destino contra outras reservas e tratar a sobreposição interna
da própria troca sem dispensar conflitos de terceiros. Definir pedidos paralelos, desistência e
concorrência com cancelamento antes de concluir o contrato e a migration. Prioridade na análise
permanece proposta de produto, sem campo ou ordenação final aprovados.
