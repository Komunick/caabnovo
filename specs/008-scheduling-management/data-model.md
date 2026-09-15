# Modelo de dados proposto — primeira entrega

Documento de design, sem tabelas/migrations criadas. Nomes finais serão conciliados
com a base na implementação. Datas de reservas em UTC; exibição America/Bahia.

| Entidade | Campos essenciais | Relações/integridade |
| --- | --- | --- |
| scheduling_unit | id, nome, endereço/contato mínimos, ativo, version | Unidade física própria da agenda. |
| scheduling_service | id, unit_id, nome, ativo, version | Uma unidade tem vários serviços. Sem duplicar catálogo global antecipadamente. |
| scheduling_procedure | id, service_id, nome, descrição, duration_minutes, ativo, version | Duração inteira positiva; máximo cabe no dia operacional inicial. |
| scheduling_professional | id, nome, ativo, version | Identidade profissional distinta da conta de login. |
| scheduling_assignment | id, unit_id, procedure_id, professional_id, ativo | Combinação única; procedimento pertence a serviço da mesma unidade. |
| unit_weekly_hours | unit_id, weekday, start_local, end_local | Dia sem faixa é fechado; início menor que fim, sem atravessar meia-noite. |
| professional_weekly_hours | professional_id, unit_id, weekday, start_local, end_local, lunch_start, lunch_end | Jornada no funcionamento da unidade; almoço opcional em par e contido. |
| scheduling_booking | id, assignment_id, member_id, starts_at, ends_at, duration_snapshot, status, version, created_by | status scheduled/cancelled; impedir sobreposição global por professional_id materializado coerentemente com assignment. |
| scheduling_booking_event | id, booking_id, action, actor_id, occurred_at, mudanças mínimas | Append-only, mesma transação; integrado à auditoria. |
| scheduling_request | actor_id, operation, key, payload_hash, result_id/result_version | Unicidade e resultado persistido da idempotência, sem PII desnecessária. |

FKs sem exclusão cascata de reservas. Arquivar/inativar sem apagar histórico;
não invalidar referências usadas. Nome/endereço seguem padrões de campos do projeto.
Snapshots de datas/duração preservam compromissos após edição de catálogo; nomes
atuais podem ser resolvidos, sem alterar a trilha histórica de comandos.

Estados: criar → scheduled; remarcar mantém scheduled; cancelar → cancelled.
Cancelled é terminal na primeira entrega. Passagem do tempo não altera situação.
Correção de registros passados e completed/no_show/await não fazem parte deste recorte.

Cadastro beneficiário usa member.id existente, nunca user.id. Leitura de titulares
vigentes precisa ampliar findMemberSummary de forma compatível; usar contrato mínimo
do módulo, sem copiar documentos/dados financeiros. Locks de cadastro e vínculos
devem coordenar todos os comandos envolvidos para tornar a checagem válida sob concorrência.

Alteração de jornada/ativação: verificar reservas futuras sob o mesmo lock de escrita
de reservas, recusar se houver incompatibilidade. Cancelar libera ocupação, sem excluir.
Recursos físicos, capacidade de grupo e fila não geram tabelas nesta primeira entrega.

