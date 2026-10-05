# Contratos — painel de Agendamentos

## Retomada e adiamento de e-mail — 02/10/2026-CODEX-SOLICITANTE_NAO_VERIFICADO

O usuário autorizou conciliar a worktree preservada com dev e concluir/validar sobreposição,
bloqueios, permissões, aprovação/remarcação e faltas. Em resposta posterior, informou que o serviço
de e-mail ainda não foi criado e adiou a integração e homologação dos avisos. O código SMTP de
contas é referência técnica, não prova de serviço disponível.

Entregar os avisos operacionais de Agendamentos por e-mail (CAAB-42)/T089 permanece pendente,
dependente de Serviço de e-mail transacional e definição da caixa de entrada (CAAB-2). A pedido
explícito foi criada a subtarefa Homologar os avisos operacionais após disponibilizar o serviço de
e-mail (CAAB-45), bloqueada por CAAB-2. Confirmar ambiente, transporte/remetente, destinatários de
teste autorizados e humano responsável na retomada; registrar versão e evidência que diferencie
intenção, processamento, aceite e entrega. Não criar transporte ou enviar agora. App/site, WAHA e
T097 permanecem adiados. O recorte administrativo segue independentemente.

## Extensão administrativa — falta e bloqueio, 28/09/2026

BF-FR-01–06/BF-D01–05 da [spec](../spec.md) definem o incremento: registro pela equipe inicia os 30
dias corridos; alcance individual em todos os serviços; sete dias desde o registro para
justificar/contestar. Nos dois tipos, exigir explicação em texto não vazio e pelo menos um
comprovante anexado para envio; falta de qualquer requisito impede a apresentação e deve permitir
correção. Anexo presente não significa pedido deferido. Preservar reservas durante a oportunidade de
resposta e análise de pedido tempestivo, impedindo novas reservas. Permitir comparecimento e
atendimento normal nessas reservas preservadas quando chegar a data, sem que esta restrição por
falta impeça o atendimento; preservar outros impedimentos independentes. Sem pedido no prazo,
efetivar bloqueio e cancelar reservas abrangidas com histórico. A aceitação retira este impedimento.
Justificativa e contestação aceitas exibem **Falta abonada** no histórico; detalhes mantêm o tipo de
pedido, decisão, autoria e instantes, sem apagar auditoria ou registro original. Rejeição antes do
fim dos 30 dias cancela imediatamente as reservas futuras dentro do período, libera vagas e preserva
histórico, mantendo o término original da restrição. E-mails no aviso, envio do pedido e decisão
persistem como intenções sem envio real. T093 implementa as operações administrativas do núcleo
confirmado. Registro e submissão administrativa usam scheduling:read/write; aceitar/rejeitar exige
scheduling:read + scheduling:review_absences, sem requerer alteração geral nem conceder a permissão
automaticamente. Revalidar sessão/concessões após adquirir lock. T088 consolidou as decisões de
produto; T089 trata a integração externa e a entrega dos avisos. Cada falta possui período próprio
de 30 dias desde seu registro e sete dias para pedido separado, sem soma automática de períodos.
Aceitação ou expiração retira somente a restrição da respectiva falta. Ao completar 30 dias encerrar
essa restrição mesmo com análise pendente, liberando novas reservas apenas sem outros impedimentos
vigentes; decisão posterior altera histórico, sem prolongar ou reiniciar bloqueio. O bloqueio
cadastral manual não propaga esta penalidade a familiares. Contratos atuais abaixo permanecem como
base; este registro não autoriza operações reais.

Regra adicional confirmada: registrar falta somente após término previsto de compromisso confirmado.
Cancelamento atinge confirmadas e pendentes com início futuro dentro do período da ocorrência.
Cancelar também reservas posteriores ao bloqueio é somente possibilidade para discussão futura
(T097), sem configuração ou código nesta entrega. Não retroagir sobre atendimentos passados nem
cancelar reservas sem horário.

Operações da extensão, sob /api/v1/scheduling, com sessão administrativa válida. Os comandos POST
exigem CSRF e Idempotency-Key, schemas estritos e versão esperada; PUT de horários preserva a
proteção Origin/CSRF e versão/transação existente, sem replay por chave. IDs e autoria não são
aceitos como prova de identidade do cliente.

| Método/caminho                         | Entrada e resultado                                                                                                         | Permissões                                   |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| POST /bookings/:id/absence             | expectedVersion da reserva; cria ocorrência após término de reserva confirmada (scheduled). 201, ou 200 no replay.          | scheduling:read + scheduling:write           |
| GET /absences                          | bookingId/memberId opcionais; q literal, status, page/pageSize. Retorna {items,page,pageSize,total} sem conteúdo do pedido. | scheduling:read                              |
| GET /absences/:id                      | Projeção de prazos, restrição, tipo/resultado do pedido, versão e rótulo do histórico; sem explicação/comprovantes.         | scheduling:read                              |
| POST /absences/:id/appeal              | expectedVersion da ocorrência, kind justification/contestation, explanation e evidenceFileIds com ao menos um UUID.         | scheduling:read + scheduling:write           |
| POST /absences/:id/decision            | expectedVersion, outcome accepted/rejected; não requer scheduling:write.                                                    | scheduling:read + scheduling:review_absences |
| GET /absences/:id/review               | Explicação e lista de comprovantes do pedido dessa ocorrência.                                                              | scheduling:read + scheduling:review_absences |
| GET /absences/:id/evidence?fileId=uuid | URL privada temporária somente para arquivo vinculado, disponível e limpo.                                                  | scheduling:read + scheduling:review_absences |

GET /absences aceita apenas bookingId e memberId UUID, q com até 100 caracteres, status (all padrão,
awaiting_response, under_review, accepted, rejected, unanswered), page a partir de 1 (padrão 1,
máximo técnico 100000) e pageSize entre 1 e 100 (padrão 25). Combinar filtros por interseção; q
busca literal por nome do beneficiário. Ordenação: recordedAt DESC, id DESC. Página vazia conserva
total. Consulta por bookingId com pageSize=1 localiza a ocorrência do detalhe.

SchedulingAbsence inclui id, bookingId, memberId, recordedAt, recordedByName, appealDeadline,
restrictionEndsAt, finalizedAt, version, status, restrictionActive, canSubmitAppeal e historyLabel.
Appeal é nulo ou {kind,submittedAt,submittedByName,outcome,decidedAt,decidedByName}. ListItem
acrescenta memberName, unitName, procedureName, startsAt e endsAt. Datas são ISO; campos opcionais
sem ocorrência usam null. Nenhum campo contém explicação, arquivo, contato ou e-mail. Revisão
protegida é a única via para texto/comprovantes, inclusive quando o leitor tem alteração geral.

Status é situação do processo: awaiting_response sem pedido antes do fim dos sete dias; under_review
enquanto há pedido sem decisão, mesmo após 30 dias; accepted/rejected após decisão; unanswered sem
pedido após sete dias, mesmo antes da execução do worker. RestrictionActive é independente. Aceitos
exibem Falta abonada; a expiração não inventa decisão. FinalizedAt informa a efetivação persistida,
e não entrega de e-mail. Registro duplicado com nova chave retorna
409/SCHEDULING_ABSENCE_ALREADY_RECORDED; replay da mesma chave conserva idempotência.

Janela de pedido: [registro, registro + 7 dias); restrição: [registro, registro + 30 dias). Sem
pedido no prazo, o worker efetiva cancelamento; nenhuma rota pública de cron ou conta humana
fictícia. Seleção de cancelamento: scheduled/pending_approval, início maior que o instante do
processamento e menor que o término da restrição. Processamento repetido não duplica cancelamentos.
Decisão após 30 dias altera histórico, sem reabrir bloqueio.

Arquivos vêm do pipeline privado existente, com permissões próprias de upload; a revisão de faltas
não concede acesso geral aos documentos da pessoa. Submissão exige arquivo pertencente ao membro e
enviado pelo operador, disponível após varredura limpa. URLs e conteúdo dos comprovantes não entram
na auditoria. Erros de estado/prazo/comprovante retornam erro corrigível; conflito de versão exige
recarregar. O botão OK apenas fecha o aviso, sem chamada de efetivação/cancelamento.

T099–T101 acrescentam os formulários de falta no detalhe da reserva, a lista Faltas e exportação de
metadados; implementadas e validadas localmente em T102
([evidência](../evidence/absence-ui-2026-09-28.md)). Consumidor externo e entrega real de e-mail
continuam pendentes. Os destinatários estão definidos; a futura integração resolve contatos,
deduplicação, transporte e recibos. Backend aprovado não substitui a revisão visual.

Decisão de destinatários confirmada nesta continuação: quando a falta for de dependente, aviso,
protocolo e decisão devem ir ao próprio dependente e ao titular. Isso não propaga bloqueio à
família. Os três e-mails são avisos operacionais e devem ser enviados mesmo com
comunicados/campanhas desativados, conforme resposta explícita do usuário. Nenhuma entrega real foi
ativada.

Delimitação confirmada pelo usuário: o projeto atua como intermediário e não define nem executa a
análise de mérito dos comprovantes. Receber pedido e arquivos, disponibilizar à equipe responsável
com permissão específica e registrar/comunicar a decisão humana. Validação de campos e segurança dos
arquivos é técnica; não constitui aceitação da justificativa. Critérios institucionais de mérito
ficam fora do escopo de definição deste projeto.

## Evolução autorizada — painel e banco primeiro

Decisão de 28/09: app/site adiado; implementar as regras 2C pelo painel. O colaborador autenticado é
autor, o member.id é beneficiário. Mesmas regras de aceitação, prazo e duas trocas também para
pedidos da equipe; recuperação do estabelecimento isenta. Nenhum override genérico ou conta externa
simulada. Novas operações preservam scheduling:read/write, CSRF, idempotência e versão. T078–T086 em
tasks.md são o plano ativo. O contrato de canais conserva as regras de domínio, mas suas
dependências de login/UI externos não impedem a fronteira administrativa.

Operações implementadas localmente; resultados e limites em
[validação administrativa](../evidence/admin-workflow-2026-09-28.md):

| Caminho relativo a /api/v1/scheduling  | Método     | Entrada/resultado                                                                                                                                                                        |
| -------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| services/:id/policy                    | GET / POST | Política rascunho/publicada; POST expectedVersion, policy, publish.                                                                                                                      |
| services                               | POST       | Cadastro existente, policy/publish opcionais; initialProcedure opcional permite configurar o primeiro procedimento, profissional ou horários por capacidade e publicar em uma transação. |
| services/:id                           | PATCH      | Salvar/Publicar alterações; expectedVersion. Rascunho não substitui published_revision.                                                                                                  |
| services/:id/hours                     | GET / PUT  | Horários por capacidade dentro do expediente da unidade; mesmo contrato de dias/versão.                                                                                                  |
| units/:id/team                         | GET / POST | Equipe responsável; POST expectedVersion e userIds já autorizados. Não concede permissão.                                                                                                |
| team-candidates                        | GET        | Nomes/IDs mínimos, somente colaboradores ativos com read/write; busca/paginação.                                                                                                         |
| approval-queue                         | GET        | Página de pendências e registros sem horário; unitId/q, prioridade pela origem e envio, sinais de idade/atraso/urgência e principal/backup.                                              |
| bookings/:id/pending                   | POST       | expectedVersion, startsAt, assignmentId/procedureId; memberId opcional somente na transferência elegível de pedido inicial.                                                              |
| bookings/:id/approve, reject, withdraw | POST       | expectedVersion da proposta vigente; decisão ou retirada explícita.                                                                                                                      |
| bookings/:id/resume                    | POST       | expectedVersion, destino por assignmentId/procedureId, startsAt; mesmo ID/ciclo sem restaurar origem.                                                                                    |
| bookings/:id/provider-unavailability   | POST       | expectedVersion; bloqueia o recurso/período da reserva, remove sua ocupação e inicia recuperação isenta.                                                                                 |

Novos comandos administrativos POST exigem sessão, read/write, Origin/CSRF e Idempotency-Key; replay
revalida acesso. Versão da reserva identifica a proposta atual; eventos guardam anteriores. DTO
distingue scheduled, pending_approval, rejected, cancelled e awaiting_new_time. Intervalo é nulo
quando aguardando nova data; modo capacidade tem assignment/professional nulos e procedureId
explícito. Contagem confirmada/reservada, tipo de processo, origem e entrada em análise são campos
separados. Não aceitar contador/causa/autor confiável do cliente. Contagem histórica desconhecida
recebe zero na migration 0036 por decisão explícita do usuário em 05/10/2026, substituindo o
bloqueio anterior por conciliação. Eventos históricos e contadores conhecidos permanecem intactos; a
transição não afirma que não houve remarcações anteriores.

Disponibilidade aceita procedureId ou assignmentId; cada vaga traz o assignmentId/nome do
profissional escolhido quando aplicável. No comando profissional, exigir o ID apresentado, sem
substituição silenciosa. beneficiaryId filtra elegibilidade da oferta; holderId restringe a seleção
administrativa de dependentes vigentes para transferência. Painel atende as mesmas políticas do
domínio, conforme decisão explícita.

Catálogos aceitam catalogView=booking para seleção operacional: nomes, duração e ativação de
serviço/procedimento usam a revisão publicada quando existente. Sem esse parâmetro, a gestão
consulta o rascunho. Serviços ainda não publicados continuam utilizáveis internamente. Salvar um
rascunho inativo não retira a oferta publicada; publicar valida a nova configuração e preserva
reservas futuras. Unidade, profissional, habilitação, horários, bloqueios e elegibilidade são
controles operacionais atuais. Nenhuma dessas rotas expõe catálogo ou dados sem sessão
administrativa.

Histórico e intenção mínima dos quatro eventos são persistidos na mesma transação. Estado pending de
uma intenção não comprova contato, destinatários finais ou entrega; dispatch/preferências e
integrações reais permanecem tarefas futuras. Somente domínio e persistência podem ser
compartilhados com canais futuros: sessão administrativa não autoriza acesso de associado. O texto
abaixo descreve a base anterior e suas evidências.

Cada evento do histórico retorna notifications com kind e status reais da persistência. O painel
rotula pending como envio pendente, sem registrar sucesso de comunicação. Não há dispatcher nesta
entrega. Relatórios usam coalesce(starts_at,original_start,created_at) como data de referência para
reter registros sem horário; não apresentar essa referência como horário confirmado. Exportação
conserva startsAt/endsAt nulos nesses registros.

## Escopo administrativo existente e extensão proposta 2C

O conteúdo abaixo registra o contrato administrativo inicial e suas adequações históricas. As novas
decisões de 24/09 sobre confirmação manual, equipe vinculada/backup, publicação e recuperação estão
propostas em [channels.md](channels.md), sem afirmar implementação destas rotas. A evolução do
painel deve chamar o mesmo domínio/guardas e preservar compatibilidade dos consumidores
administrativos. “Sem escopo por unidade” abaixo descreve a etapa inicial, não elimina a
responsabilidade por estabelecimento definida para 2C. Nenhuma permissão é concedida apenas por
cadastro de profissional ou vínculo com equipe.

## Contrato vigente na base integrada

Base: /api/v1/scheduling. Autorização implementada de todas as rotas (Q8 de 21/09): sessão
administrativa ativa e acesso concedido a Agendamentos, revalidado no servidor. Sessão sozinha não
basta; ausência/revogação da concessão retorna 403. Q9 exige consulta nas leituras e
consulta+alteração nas mutações; alteração sem consulta é recusada. scheduling:read/write, catálogo,
layout, descoberta e mutações já implementados no PR #36/af6f096 (AC01/AC02/T028), conferidos em dev
89d2356 em 28/09. T027/AC03 validadas localmente em PostgreSQL e navegador. Sem escopo por unidade,
API anônima, token Cal.com ou autenticação do app neste contrato administrativo. A integração
externa está em channels.md.

Incremento de 18/09: GET `/calendar?start=YYYY-MM-DD&end=YYYY-MM-DD` retorna
`{items: SchedulingBooking[]}`. Start inclusivo/end exclusivo, dias em America/Bahia, até 42 dias.
Filtros opcionais: q, unitId, professionalId, status. Inclui reservas que intersectam o intervalo
(`ends_at > start`, `starts_at < end`), ordenadas por início/id. Até 1.000 itens; acima disso
422/SCHEDULING_CALENDAR_LIMIT sem resposta parcial. Intervalo inválido retorna 422; sessão inválida
401/403 como nas rotas existentes. Resposta privada sem cache. Não altera `/bookings?date=...` nem
seus consumidores.

| Interface                                                    | Operações                                          | Campos/resultado                                                                                                        |
| ------------------------------------------------------------ | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| /units, /services, /procedures, /professionals, /assignments | GET, POST; PATCH /:id                              | Catálogo mínimo paginado; versões para edição.                                                                          |
| /units/:id/hours, /professionals/:id/hours                   | GET, PUT                                           | Semana, unidade, almoço e version; validação de reservas afetadas.                                                      |
| /beneficiaries                                               | GET q/page                                         | Projeção mínima de associados/dependentes para seleção; sem CPF integral, documentos ou finanças.                       |
| /availability                                                | GET assignmentId/date                              | Inícios/fins possíveis, timezone; leitura não retém vaga.                                                               |
| /bookings                                                    | GET date/unitId/professionalId/status/q/page; POST | Lista diária e criação.                                                                                                 |
| /bookings/:id                                                | GET                                                | Detalhes e histórico paginado.                                                                                          |
| /bookings/:id/reschedule                                     | POST                                               | Nova habilitação, início e expectedVersion.                                                                             |
| /bookings/:id/cancel                                         | POST                                               | expectedVersion; confirmação é apresentada na UI, sem motivo obrigatório.                                               |
| /bookings/:id/keep                                           | POST                                               | expectedVersion e deletionEffectiveAt; decisão autorizada de manter após exclusão, com idempotência e auditoria (LC01). |

Criação: memberId, assignmentId, startsAt ISO com offset; fim/duração derivados no servidor. POSTs
de criação/remarcação/cancelamento usam Idempotency-Key. Não aceitar id de ator, situação de
bloqueio ou papéis enviados pelo cliente. Conferir Origin/CSRF com o padrão do projeto em todas as
mutações.

Respostas: 201 criação; 200 leitura/alteração/replay; 422 formato inválido; 401 sessão
ausente/inválida; 403 acesso administrativo negado; 404 registro inexistente; 409 conflito de
horário, versão ou chave reutilizada; 422 combinação/horário/ beneficiário impedido; 413 corpo maior
que 64 KiB. Envelope {code,message,fields?,requestId}; fields contém path/code. Sem stack SQL.
Listas: {items,page,pageSize,total}; 25 padrão e até 100. Intervalos fora da faixa e data inválida
são recusados; nenhuma consulta sem limite.

POST/PATCH de catálogo também exigem Idempotency-Key. PUT de horários exige expectedVersion; retorna
{version,rows}. Cada linha: weekday (0 domingo a 6 sábado), start/end HH:mm e lunchStart/lunchEnd
nulos ou HH:mm (somente profissionais). Catálogos: id/name/active/version e referências
correspondentes; procedimentos incluem description/durationMinutes; unidades incluem address/phone
opcionais. Serviços, procedimentos e habilitações incluem os nomes das referências de catálogo, para
distinguir ofertas homônimas de unidades diferentes na listagem e na edição. Detalhes:
{booking,history:{items,page,pageSize,total}}. Histórico usa created, rescheduled, cancelled e
kept_after_member_deletion, actorName, occurredAt e snapshots before/after. DTO já inclui
memberDeleted, memberDeletionEffectiveAt, keptAfterMemberDeletion e memberDeletionKeptAt/By;
preservar todos na evolução. Disponibilidade aceita excludeBookingId para remarcação; confirmar
revalida a vaga.

Clarificação de 20/09/2026 (implementada localmente em 28/09): criação/remarcação também recusa com
409 a sobreposição de reservas scheduled do mesmo memberId, inclusive entre profissionais/unidades.
memberId é o beneficiário atendido, associado ou dependente individual, nunca seu titular ou o
operador. A mensagem deve identificar conflito da pessoa, conservar os campos e permitir escolher
outro horário. Preservar o contrato de conflito profissional e o rollback integral da remarcação.

Remarcação preserva id e usa rollback integral no conflito; cancelamento repetido retorna estado já
cancelado sem duplicar efeito. Chave igual com payload diferente é 409. Erros de edição mantêm
valores do formulário. Alterações de catálogo invalidam leituras relevantes após sucesso, não criam
confirmação otimista falsa.

Contrato visual: /scheduling abre lista por dia, data de hoje, filtros persistidos na URL, Novo
agendamento e links Oferta/Horários. Formulário: beneficiário → unidade → serviço → procedimento →
profissional → vaga; campos dependentes são limpos quando a seleção anterior muda. Sem vagas,
explicar e permitir trocar dia/profissional. Detalhes preservam Remarcar/Cancelar nas condições
existentes e Manter reserva após exclusão conforme LC01 e permissão de escrita; exclusão impede
remarcação. Histórico mostra datas/autores e ações humanas. Não exibir atalhos inoperantes para
avaliações/app.

## Incremento local de 28/09 — ainda não integrado em dev

- T029/T030: diagnóstico read-only e nova 0031 com preflight e scheduling_beneficiary_no_overlap,
  por member_id/[)/scheduled; conflitos antigos interrompem sem alterar reservas. 0020 e 0028
  lifecycle preservadas. Transição futura para pending_approval exige T045/T048 antes de habilitar
  escrita do canal; 0031 não afirma essa cobertura.
- T031: availability aceita beneficiaryId opcional UUID; filtra conflitos do profissional e da
  pessoa entre unidades. Sem ele, mantém consulta por profissional; excludeBookingId resolve o
  beneficiário original e deve coincidir com o informado. Criação/remarcação usam a pessoa real.
  Conflito por pessoa retorna 409/SCHEDULING_BENEFICIARY_CONFLICT, com formulário preservado.
- T033/T034: DTO acrescenta eligibilityWarning: 'blocked' | null às reservas futuras scheduled,
  projetado em lote pelo bloqueio próprio/titular vigente. Lista/calendário/detalhe mostram aviso
  textual; desbloqueio efetivo remove aviso. Não altera situação, versão, horário ou histórico.
  Preserva memberDeletion*, memberDeleted, /keep e ambos os avisos quando coexistirem.
- T027: read/write verificados antes de 5010/1 em escrita e novamente após espera; GET sem lock.
- Exportação própria: adapters/tela em [exports.md](exports.md), arquivos e navegador aprovados
  localmente. reports.bookings permanece scheduling:read sem scheduling:write.

## Proteção dos comprovantes — fechamento de02/10/2026-CODEX-Gabriel-Komunick

Novos uploads do formulário de falta usam owner_type=scheduling_absence_evidence e owner_id da
pessoa, desde a intenção, reutilizando armazenamento/quarentena/scanner privados. Exigir permissões
próprias de upload de Associados/arquivos e scheduling:read/write; finalizar revalida essa
fronteira. Não criar concessões implícitas. Lista/download geral de Associados/arquivos não
disponibilizam esses comprovantes, inclusive antes do protocolo. Arquivos legados member já
vinculados em scheduling_absence_evidence também são excluídos da lista/status/download gerais.
Documento comum não vinculado conserva seu acesso. Status do upload restrito é consultável apenas
pelo próprio operador com read/write de Agendamentos e leitura de Associados/arquivos, sem revelar
conteúdo.

A revisão dedicada aceita arquivos restritos e legados vinculados à ocorrência correta, da pessoa
correta, privados/disponíveis/limpos. Após adquirir o lock do arquivo, revalidar sessão pelo relógio
atual e permissões persistidas antes de emitir grant. Submissão também revalida autoridade e janela
de sete dias após a espera; não usar instante anterior ao lock para aceitar pedido vencido.

O grant privado já emitido conserva o comportamento bearer temporário de até300s do pipeline
existente. Não prometer revogação imediata de URLs emitidas nem confundir com reautorização por lote
de exportações. Política de revogação de conteúdo exige decisão explícita se for alterada. Uploads
antigos sem protocolo/classificação não têm finalidade inferível; não reclassificar
indiscriminadamente documentos comuns.

## Correções da revisão — 05/10/2026-CODEX-mafaltti

- Indisponibilidade do prestador exige reserva confirmada com início futuro e nenhuma falta
  registrada. Em capacidade, só a reserva afetada entra em recuperação; as demais confirmadas são
  preservadas. Bloqueio impede novas ocupações, destinos alterados e aprovação de pedidos ainda
  pendentes. Manter reserva após exclusão do associado não altera ocupação e não é recusado pelo
  bloqueio superveniente.
- Nova submissão aceita apenas owner_type=scheduling_absence_evidence. A compatibilidade member
  limita-se à leitura de provas já vinculadas; documento comum não é convertido nem retirado do
  acervo por nova submissão.
- Intenção de upload revalida autoridade de Agendamentos depois de esperas por membro/idempotência,
  tanto no INSERT como no replay. Finalização mantém sua revalidação existente.
- GET de revisão e de comprovante exige scheduling:read + scheduling:review_absences; dispensa lock
  global de elegibilidade e registra scheduling.absence.reviewed/evidence_granted, com ator,
  ocorrência, correlação e fileId quando pertinente. Não grava justificativa, nome, conteúdo, chave
  de storage nem URL. Comandos de decisão continuam usando lock global.
- Diretório e equipe exigem scheduling:read e pelo menos scheduling:write ou users:read. A UI não
  monta o diretório sem essa autorização; revogação é refletida pelo provider compartilhado.
- Finalização consulta vencidas antes de esperar pelo lock global, revalida cada ocorrência após
  adquiri-lo e usa savepoint por item. Sucessos são commitados antes de reportar as falhas
  individuais ao mecanismo de retry do worker; repetição continua idempotente. Falha de
  conexão/transação impede afirmar commit.
- Falhas individuais preservam occurrenceId (absenceId no erro) e causa original em memória;
  SCHEDULING_ABSENCE_FINALIZATION_FAILED contém as causas em AggregateError. O handler registra
  evento scheduling.absence.finalization_failed, correlationId da ocorrência, SQLSTATE validado (ou
  UNKNOWN_ERROR) e mensagem fixa por categoria. A serialização para pg-boss contém apenas
  identificadores e códigos, sem causa, mensagem SQL bruta, parâmetros, detalhes ou stack.

### Política legada e roteiro de rollout

A policy vazia de serviços legados usa os defaults atuais: horizonte de 90 dias para novos destinos
e antecedência de 24 horas para troca voluntária. Essa aplicação não exige opt-in no código atual e
não cancela reservas existentes. Antes de ativar, inventariar serviços/reservas futuras, apresentar
esses limites ao responsável e ajustar/publicar políticas por serviço quando necessário. Recuperação
isenta mantém suas exceções; não confundir antecedência de nova reserva com remarcação. Este
registro atende ao achado de rollout, sem afirmar aceite operacional ou alterar silenciosamente a
política.

0031–0034 ficam intactas. Aplicar 0036 em sequência pelo runner, preservando a 0035 independente de
cargo base quando presente. Backup/restore testado, janela e executor único, diagnóstico de
sobreposição, revisão humana e compatibilidade app/worker continuam gates antes do rollout.
Migration nova incrementa versão de reservas cujo contador era NULL; telas antigas precisam
recarregar em conflito de versão. Não executar neste banco de uso.
