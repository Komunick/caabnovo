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

Publicação de serviço definida em 24/09: separar estado ativo do estado de publicação externa e
registrar autor, instante e versão de uma única publicação compartilhada por app e site, sem
lista de destinos configuráveis ou estados/versões publicados independentes por canal.
Novo serviço salvo permanece não
publicado; Publicar persiste dados e publicação atomicamente, inclusive na primeira gravação.
Salvar/publicar serviço previamente salvo reutiliza seu ID. Guardas de catálogo/vagas/comandos
externos de app e site exigem o mesmo estado de publicação, além de oferta ativa e autorização
para a operação. Falha não produz publicação
parcial; preservar integridade/idempotência e histórico. Na edição de serviço publicado,
Salvar alterações persiste uma revisão de rascunho independente da revisão publicada; Publicar
alterações salva e torna vigente a revisão editada atomicamente, mantendo o ID do serviço.
Registrar versões, autoria e instantes do rascunho e da publicação para controle concorrente e
idempotência. Reabrir edição recupera o rascunho; projeções e comandos externos consultam somente
a mesma configuração publicada no app e no site. Publicar e Publicar alterações tornam a revisão
vigente para ambos no mesmo commit; projeções/caches de ambos devem refletir essa revisão.
Erro não substitui nem remove a publicação anterior. Ocupações,
bloqueios e elegibilidade continuam sendo avaliados em seu estado operacional atual, sem serem
congelados na revisão. Publicação preserva snapshots/histórico das reservas existentes e as
guardas contra alterações que invalidem reservas futuras. Este desenho é proposto, sem esquema
físico ou migration aplicados.

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

Revisão aceita de 24/09/2026: remarcação externa segue a aceitação do serviço e libera origem
no envio bem-sucedido. Guardar origem/versão como snapshot histórico da proposta, sem ocupação.
A transação valida destino, retira ocupação original e registra somente destino: confirmado no
fluxo imediato ou retido no manual. Falha na transação preserva origem. No fluxo manual, representar
explicitamente remarcação pendente sem horário confirmado; não conservar status confirmed na
origem nem projetá-la como compromisso ativo. A proposta não é segundo atendimento independente.

Aprovar confirma destino no mesmo identificador; recusar/desistir libera destino e deixa registro
sem horário confirmado, com histórico preservado, sem recuperar origem automaticamente. Nome final
dos estados deve ser conciliado nos contratos. Origem pode estar ocupada por terceiro, cujos dados
não podem ser alterados pela resolução da troca. Manter no máximo uma proposta ativa por reserva;
substituir destino atomicamente sem reocupar origem e conservar proposta/destino anteriores se
falhar. Revalidar prazo sobre início original registrado. Usar versão para impedir decisão sobre
proposta retirada/substituída. Após recusa/desistência, o usuário aceitou continuar no mesmo
agendamento: estado sem horário confirmado referencia tentativas anteriores e não ocupa vaga.
Nova tentativa preserva identidade, beneficiário, contador e início original para prioridade.
Permitir retomada mesmo após início original, sem reaplicar antecedência de remarcação sobre
esse instante nem antecedência de nova reserva. Revalidar destino futuro, horizonte, elegibilidade,
autorização e disponibilidade; retê-lo segundo aceitação vigente. O contador não é zerado e
recusas/tentativas não confirmadas não o incrementam nem criam nova utilização: referenciam
um mesmo ciclo de troca com uma utilização reservada. Confirmação da alternativa converte essa
utilização em confirmada uma vez. Versão do registro e unicidade de proposta ativa coordenam
retomadas concorrentes. Falha mantém estado sem horário e não restaura origem.

Decisão B da rodada 3: a proposta não expira quando chega o início original. A transição de
aprovação dessa proposta pode ocorrer depois; exige destino estritamente futuro no relógio do
servidor e todas as demais guardas, sem reutilizar a guarda de origem futura da criação de
proposta. Preservar início original e versão em eventos; incrementar a contagem só ao efetivar.
Não inferir presença, conclusão ou falta. Destino já iniciado não é aprovável retroativamente,
mas não dispara expiração; a equipe precisa resolver a pendência explicitamente. Cancelamentos
ou decisões concorrentes continuam impedindo reativação. A revisão aceita libera origem no envio
bem-sucedido, mantendo apenas destino retido. A passagem do início original não altera isso.

A prioridade decidida em 24/09 é: remarcações primeiro, pelo início original capturado no envio da troca, crescente;
empates por instante do pedido e identificador estável. O destino não participa desse primeiro
critério. A proposta referencia a versão e o início da reserva a que se aplica; se a origem for
alterada concorrentemente, revalidar a proposta antes de qualquer decisão, sem aprovar dados
obsoletos. Novos pedidos são ordenados por instante de envio após as remarcações.

Decisão adicional da rodada 3 de 24/09: antecedência mínima de nova reserva externa desativada
por padrão, configurável por serviço. Planejar um campo de duração independente do de remarcação,
com ausência/zero representando sem antecedência e valor positivo representando o prazo exigido;
normalizar a representação no contrato, recusando valores negativos. Comparar início e instante
real do servidor, mantendo início estritamente futuro mesmo sem prazo. Configuração e comando
compartilham o protocolo de locks/revalidação para não aceitar regra obsoleta nem início passado.
A alteração alcança novos pedidos; não expira pendências nem cancela reservas existentes. Não
usar esse campo para mudar a antecedência relativa ao horário original de uma remarcação.

Horizonte futuro aceito na rodada 3: campo de dias positivos por serviço com padrão 90 e
estado de desativação explícito (não representar zero como janela vazia acidental). A janela
usa dias corridos de 24 horas a partir do instante do servidor, com limite inclusivo para o
início. É calculada na leitura/comando, sem materializar infinitas vagas ou depender de worker.
Consulta e envio de nova reserva/destino de troca aplicam a política vigente sob revalidação;
reservas e propostas recebidas antes da mudança conservam sua validade quanto ao horizonte.
Preservar versão/configuração necessária à auditoria, sem migrar datas ou expirar reservas por
redução da janela. O limite é independente dos campos de antecedência mínima e remarcação.
Nenhuma migration foi aplicada por esta decisão documental.

Adicionar à política do serviço uma antecedência mínima opcional de remarcação, com valor inicial
equivalente a 24 horas (1.440 minutos) e estado explícito de desativação. A representação final
será conciliada com o contrato; valor negativo não é válido. Comparar instantes no servidor no
envio do pedido, usando o início atual da reserva. Registrar o prazo aplicado para auditoria;
exatamente no limite é permitido. Pedido recebido em tempo não expira por atravessar esse limite
durante análise, nem por posterior alteração da configuração. Não confundir o limite de envio
com a chegada do próprio horário de atendimento: a proposta permanece pendente (2C-FR-17).

Cancelamento pelo app/site: permitido para reserva confirmada enquanto o instante validado no
servidor anteceder seu início atual, sem antecedência mínima e sem aprovação da equipe. O
encerramento de troca pendente libera somente destino, pois origem foi liberada no envio.
Para essa ação externa, manter a fronteira baseada no início original registrado. Coordenar versão/locks com aprovação
para impedir reativação ou retenção órfã. No início exato ou depois, negar esse comando externo.
Essa regra não cria expiração automática. A desistência apenas da troca segue a regra acima e
usa o início original registrado como fronteira, sem aplicar antecedência mínima de remarcação;
libera destino e mantém histórico sem horário confirmado, sem restaurar origem.

Contagem esclarecida em 24/09: duas trocas por agendamento, com utilização reservada no primeiro
pedido e consolidação somente na confirmação. Modelar ciclo de troca com identificador estável,
reserva de utilização e referência às tentativas. Ter no máximo um ciclo ativo, em análise de
proposta ou aguardando nova escolha após recusa/desistência, e no máximo uma proposta pendente.
A reserva da utilização não é retenção de horário: aguardando escolha ocupa zero vagas, mas
conserva a mesma troca em andamento. Original permanece apenas como snapshot histórico.

Invariante: confirmadas + ciclos ativos <= 2. Abrir ciclo e liberar origem/reter destino ocorrem
na mesma transação. Substituir, recusar ou retomar não cria outro ciclo nem incrementa contador.
Aprovar fecha ciclo e incrementa confirmadas exatamente uma vez, transferindo a utilização já
reservada; não somar pedido e confirmação como duas trocas. Uma solicitação posterior a uma
confirmação cria outro ciclo. Cancelar definitivamente fecha ciclo sem contar confirmação;
trocas confirmadas anteriores permanecem. Cancelamento do registro sem horário é possível mesmo
após início original, sem reativar origem ou alterar atendimento confirmado retroativamente.
Usar versão, idempotência, locks e integridade de ciclo/proposta para concorrência e retry.
Reconciliar legado com evidência; não inferir contador pelo total de eventos/pedidos nem zerar
histórico desconhecido. Expor contagem de confirmadas e em andamento separadamente.

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
  intervalo. Troca remove origem e inclui somente destino em transação, mesmo com sobreposição
  parcial; após commit, apenas destino conta. Origem histórica não bloqueia profissional,
  beneficiário ou capacidade, e pode ser reservada por terceiro. Locks transacionais da
  oferta/capacidade e recontagem devem coordenar comandos e mudanças de configuração; a
  exclusão por profissional existente não basta para garantir capacidade maior que um.
- Aprovar conserva a ocupação, recusar/retirar libera destino, substituir troca a retenção
  atomicamente e encerrar troca libera só destino, sem recuperar origem. Preservar exclusão global por beneficiário,
  idempotência, versões e auditoria. Nenhuma decisão tardia pode recriar ocupação cancelada.
- Adicionar profissionais não converte reservas sem responsável; desativar equipe não elimina
  vínculos históricos. Recusar mudança de horários/capacidade que invalide ocupações futuras
  até resolução explícita. Planejar projeções e consumidores com profissional ausente quando
  esse for o modo registrado, sem exigir que app/site ou calendário inventem nomes.

Esta decisão estende o planejamento de 2C; nenhuma migration foi criada ou aplicada nesta etapa.
