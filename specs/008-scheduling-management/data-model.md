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

Pendências e reservas confirmadas ocupam o intervalo do beneficiário e do profissional quando
atribuído; sem profissional, ocupam a capacidade do serviço na unidade. Isso inclui disputas entre
painel e app/site. A migration aditiva deve estender as restrições de exclusão e o protocolo
transacional por capacidade para considerar ambas as situações ocupantes; recusa e cancelamento não
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
da própria troca sem dispensar conflitos de terceiros. Permitir no máximo uma proposta pendente
por reserva, garantida também sob concorrência. O ator autorizado pode retirar a proposta e
liberar somente o destino, mantendo a consulta original, ou substituí-la após revalidar prazo e
aceitação. Preservar as propostas anteriores na auditoria; substituir a retenção em transação,
sem acumulá-la e sem perder a proposta anterior em caso de falha. Decisões usam versão da proposta
para impedir aprovação de solicitação retirada ou substituída.

A prioridade decidida em 24/09 é: remarcações primeiro, pelo início atual da reserva crescente;
empates por instante do pedido e identificador estável. O destino não participa desse primeiro
critério. A proposta referencia a versão e o início da reserva a que se aplica; se a origem for
alterada concorrentemente, revalidar a proposta antes de qualquer decisão, sem aprovar dados
obsoletos. Novos pedidos são ordenados por instante de envio após as remarcações.

Adicionar à política do serviço uma antecedência mínima opcional de remarcação, com valor inicial
equivalente a 24 horas (1.440 minutos) e estado explícito de desativação. A representação final
será conciliada com o contrato; valor negativo não é válido. Comparar instantes no servidor no
envio do pedido, usando o início atual da reserva. Registrar o prazo aplicado para auditoria;
exatamente no limite é permitido. Pedido recebido em tempo não expira por atravessar esse limite
durante análise, nem por posterior alteração da configuração. Não confundir o limite de envio
com a chegada do próprio horário de atendimento, cujo tratamento ainda requer decisão.

Cancelamento pelo app/site: permitido para reserva confirmada enquanto o instante validado no
servidor anteceder seu início atual, sem antecedência mínima e sem aprovação da equipe. O
cancelamento explícito da original encerra também sua proposta de troca pendente e libera as
ocupações de origem e destino em uma transação auditada. Coordenar versão/locks com aprovação
para impedir reativação ou retenção órfã. No início exato ou depois, negar esse comando externo.
Essa regra não cria expiração automática. A desistência apenas da troca segue a regra acima e
mantém a reserva original futura, sem aplicar antecedência mínima de remarcação.

Limite definido em 24/09: duas remarcações confirmadas por reserva. Representar a quantidade de
mudanças efetivadas com integridade transacional e trilha de eventos; a forma física será
conciliada com o schema existente. Pedido pendente, recusa, retirada ou substituição ainda não
confirmada não incrementa. Incrementar uma única vez junto da troca efetiva; decisões concorrentes
não podem ultrapassar dois. Cancelamento não apaga ou reduz a contagem do registro antigo; novo
agendamento tem novo identificador e começa em zero. Reconciliar reservas legadas com eventos
confiáveis, sem zerar histórico desconhecido por conveniência.

Eventos são vinculados ao identificador individual do beneficiário; autor pode ser titular,
dependente ou operador. Uma visão consolidada por pessoa pode projetar essa trilha sem duplicar
cadastros ou converter autoria em titularidade do atendimento. Compras/atividades de outros
domínios seguem contrato e autorização próprios no programa 002.

Decisão da rodada 3 de 24/09: o estabelecimento/unidade controla a escolha de profissional pelo
usuário. Acrescentar política própria da unidade à projeção externa; considerar também existência
de profissionais ativos habilitados para a oferta. A opção qualquer disponível e a escolha
desativada com equipe existente resolvem um assignment elegível no servidor, informado antes de
concluir e revalidado no comando. Isso não altera a identidade dos profissionais nem elimina
proteção contra sobreposição.

Decisão seguinte da rodada 3: sem profissionais cadastrados, permitir reserva usando horários
próprios e quantidade de vagas do serviço na unidade. O seletor é omitido. O modelo inicial
exige assignment/professional; planejar extensão aditiva, não tratar a mudança como já aplicada.

- A oferta distingue ocupação por profissional ou por capacidade do serviço. No primeiro modo,
  assignment válido é obrigatório; no segundo, referência à oferta/unidade é obrigatória e não
  há profissional fictício. Preservar modo e referências nas reservas e propostas de troca.
- Modelar expediente do serviço e capacidade simultânea inteira positiva, sem valor ilimitado
  implícito. Considerar a duração completa, [início,fim) e funcionamento da unidade. Ausência de
  configuração não produz vagas; ausência temporária de profissional apto não muda o modo.
- Contar ocupações confirmadas, aguardando aprovação e retenções de destino durante todo o
  intervalo. Na mesma capacidade, a união origem/destino de uma única reserva/proposta consome
  uma vaga no trecho sobreposto; não dispensar ocupações de terceiros. Locks transacionais da
  oferta/capacidade e recontagem devem coordenar comandos e mudanças de configuração; a
  exclusão por profissional existente não basta para garantir capacidade maior que um.
- Aprovar conserva a ocupação, recusar/retirar libera destino, substituir troca a retenção
  atomicamente e cancelar original encerra ambas. Preservar exclusão global por beneficiário,
  idempotência, versões e auditoria. Nenhuma decisão tardia pode recriar ocupação cancelada.
- Adicionar profissionais não converte reservas sem responsável; desativar equipe não elimina
  vínculos históricos. Recusar mudança de horários/capacidade que invalide ocupações futuras
  até resolução explícita. Planejar projeções e consumidores com profissional ausente quando
  esse for o modo registrado, sem exigir que app/site ou calendário inventem nomes.

Esta decisão estende o planejamento de 2C; nenhuma migration foi criada ou aplicada nesta etapa.
