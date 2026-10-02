# Contrato lógico v1 — Agendamentos no app/site (2C)

## Checkpoint administrativo — 02/10/2026-CODEX-Gabriel-Komunick

O schema administrativo vigente em b676974 é0032_scheduling_administrative_workflow, seguido de
0033/0034 para faltas/autoria de sistema. Aceita pending_approval e campos opcionais conforme o
contrato admin e foi validado no CI37037047877; T107/T039 concluídos tecnicamente. Propostas abaixo
sobre0032_scheduling_channels/schema sem NULL são históricas e não instruções para criar ou
reescrever migrations. App/site permanecem adiados. A correção de fechamento isola novos
comprovantes por owner_type=scheduling_absence_evidence no campo textual existente de stored_file,
sem nova migration. Comprovantes legados vinculados também ficam fora do acervo geral.
[Evidência de revisão e limites](../evidence/closeout-review-2026-10-02.md).

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

## Extensão futura — justificativa e contestação de falta, 28/09/2026

Requisitos BF-FR-04–06 e decisões BF-D01–05 em [spec.md](../spec.md): OK/Justificar falta/Contestar
falta e acesso posterior em área do app/site. Há sete dias corridos desde o registro da falta para
apresentar pedido. Tanto justificativa quanto contestação exigem explicação em texto não vazio e
pelo menos um comprovante anexado; impedir envio incompleto com erro nos campos correspondentes. A
presença do comprovante não implica deferimento. O período de 30 dias começa no registro da falta
pela equipe e atinge somente a pessoa que faltou, inclusive dependente. Preservar reservas durante a
oportunidade de resposta e análise de pedido tempestivo; novas reservas ficam impedidas. A pessoa
pode comparecer e receber atendimento normal nas reservas preservadas durante os sete dias ou a
análise, respeitando outros impedimentos independentes. Sem pedido tempestivo, efetivar bloqueio e
cancelar as reservas abrangidas. Se a equipe rejeitar antes do fim dos 30 dias, cancelar
imediatamente as reservas futuras dentro do período, mantendo o término original da restrição e o
histórico. Submissão não comprova deferimento; cada falta tem período próprio de 30 dias e sete dias
para justificar/contestar separadamente, sem soma automática de prazos. Aceitação/expiração de uma
falta preserva as outras restrições. Ao completar os 30 dias encerrar esta restrição mesmo com
análise pendente; liberar novas reservas apenas sem outros impedimentos vigentes; o resultado
posterior altera histórico, sem prolongar a restrição. Exibir **Falta abonada** tanto para
justificativa aceita quanto para contestação aceita, mantendo o tipo de pedido nos detalhes e a
auditoria original. Enviar e-mail no aviso do bloqueio, confirmação do envio do pedido e decisão da
equipe, com destinatários e exceção operacional definidos abaixo. A futura integração externa adapta
identidade, contratos de canal e transporte, sem reabrir decisões de produto. O contrato 2C abaixo
não implementa esse fluxo. Reutilizar login geral/UI01/UI02 e serviço de e-mail, sem presumir
autorização de envio real.

Regra adicional confirmada: registrar falta somente após término previsto de compromisso confirmado.
Cancelamento atinge confirmadas e pendentes com início futuro dentro do período da ocorrência.
Cancelar também reservas posteriores ao bloqueio é somente possibilidade para discussão futura
(T097), sem configuração ou código nesta entrega. Não retroagir sobre atendimentos passados nem
cancelar reservas sem horário.

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

O painel possui consulta GET /absences e fluxos T099–T101, aguardando T102; isso não cria uma API de
associado. DTO de consulta contém somente metadados e separa situação do pedido de restrição: um
pedido continua em análise após os 30 dias. Identidade/família do consumidor externo precisam ser
revalidadas antes de reaproveitar o domínio; não reutilizar sessão administrativa como login
externo. T089 conserva essa adaptação e integração de entrega como próximos passos.

## Escopo adiado — decisão posterior de 28/09

Construção e integração do app/site adiadas. Regras de domínio deste documento alimentam primeiro o
painel e o banco, conforme admin.md e T078–T086. Gates T041/UI01/UI02 continuam obrigatórios para a
fronteira externa; não impedem operação por colaborador autenticado. Não expor API de associado
usando sessão/identidade administrativa. A próxima migration é administrativa (0032, número a
reconferir), sem ator externo; autoria/identidade de canais será evolução posterior.

## Gate físico e de identidade — revisão de 28/09

Este é um contrato proposto, não uma API pronta. UI01/UI02 em 002 ainda não definem um consumidor
implementado. Antes de T049/T070: T041 deve comprovar conta/sessão geral → member.id com revogação e
separação do painel; UI01/T043 deve definir jornada, responsável e contrato do consumidor. T072/T073
exigem também UI02/consumidor localizado. Better Auth do painel e cadastro de member, isoladamente,
não satisfazem esse gate.

O schema atual não aceita ator externo, assignment/profissional nulos ou pending_approval. Seguir a
[transição física e invariante de ocupação](../data-model.md): 0031 administrativa primeiro, 0032
posterior substitui constraints nomeadas para scheduled/pending_approval, com NULLs por modo/estado
e autoria/idempotência do canal separadas. Não gravar member.id em created_by/actor_id de
colaborador, nem fabricar conta administrativa. Relatórios e DTOs precisam distinguir estados e não
eliminar reservas sem profissional. T040 só confere gates; não cria persistência. GET público
oferece somente catálogo publicado, sem vagas/PII; sessão é obrigatória no restante.

Data: 28/09/2026. Estado: **proposta documental para implementação**, derivada de
[spec.md](../spec.md), [plan.md](../plan.md) e [data-model.md](../data-model.md). Nenhuma operação
abaixo comprova endpoint, migration, envio ou cliente externo implementados. O contrato
administrativo existente permanece em [admin.md](admin.md).

## 1. Fronteira e versão

App e site consomem a mesma oferta publicada e o mesmo domínio de disponibilidade/reservas.
Operações abaixo pertencem à versão v1; os caminhos HTTP propostos estão na seção 1.3. A integração
da sessão geral e a transição dos acessos existentes exigem prova em T041; não reutilizar
endpoints/sessões administrativos como autorização do associado. Este documento fixa dados,
permissões, transições e erros do domínio.

Acesso externo resolve identidade autenticada → pessoa de Associados no servidor. O usuário informou
que titulares e dependentes já têm contas individuais; isso não comprova compatibilidade com Better
Auth administrativo. Seguir [005 FR-010](../../005-members-management/spec.md) e
[contrato de Associados](../../005-members-management/contracts/members.md). Sem correspondência
confiável, negar operação privada, sem criar pessoa/conta ou vincular por nome.

### 1.1. Login geral do app/site — decisão de 28/09

Agendamentos consome a sessão geral do app/site. Não cria segundo login, credencial, recuperação ou
seleção de fornecedor. Ator já autenticado acessa a agenda sem autenticação específica do módulo;
sessão expirada usa o fluxo geral. Resolver identidade→member.id no servidor e revalidar autorização
familiar; sessão externa não concede acesso administrativo. T041 vincula esse contrato à
autenticação transversal de UI01/UI02/Associados.

Importação de históricos antigos de edição/recusa/cancelamento é opcional e de baixa prioridade. Os
cuidados da seção seguinte só condicionam a importação efetivamente escolhida; classificação
detalhada/contador antigo não são gate da spec. Continuidade das reservas futuras é verificada
separadamente. Não apagar registros da origem nem inventar fatos.

### 1.2. Continuidade do legado — evidência de 25/09

[Matriz de equivalência](../legacy-parity.md): o código localizado separa token intermediário de
login e JWT de sessão, com ID individual em User. A fronteira externa de agenda só recebe identidade
cuja sessão foi validada pela solução selecionada. Token legado só pode ser aceito por ponte
explicitamente planejada e comprovada; rejeitar token intermediário e não aceitar identidade do
corpo/header como prova. Revalidar pessoa/vínculo no domínio atual, inclusive em replay. O vínculo
legado aparece por responsavel e por mesma OAB em caminhos diferentes; não inferir equivalência sem
reconciliação. Correspondência origem/User.id → member.id é explícita, sem vincular por nome nem
importar credenciais. Mecanismo/revisão publicada e revogação ainda precisam de validação em T041;
os caminhos propostos estão na seção 1.3.

Histórico importado precisa conservar status/autor/origem verificáveis. reject e CANCELED não
distinguem sozinhos recusa/cancelamento; EDITED não prova uso de troca voluntária. Não inventar
causa/contador nem converter finished/not_appear em scheduled. Essa fronteira de leitura histórica
será conciliada com T045 sem expandir ações operacionais do recorte.

### 1.3. Vinculação HTTP v1 proposta — 28/09

Os caminhos abaixo fixam o desenho para T041/T070; não comprovam endpoints existentes. O contrato
administrativo usa `/api/v1/scheduling`. Seus guards permanecem administrativos. A sessão geral do
app/site entra somente na fronteira de associado, cujo segmento `member` abrange titular e
dependente e não concede papel por si só. T041 verifica sessão, origem/CSRF, revogação e eventual
conflito com rotas existentes antes de criar adaptadores.

| Método e caminho propostos                                                             | Operação e fronteira                                                                       |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| GET `/api/v1/public/scheduling/offers`                                                 | listPublishedOffers; catálogo público sem vagas/PII.                                       |
| GET `/api/v1/member/scheduling/beneficiaries`                                          | listEligibleBeneficiaries; sessão geral.                                                   |
| GET `/api/v1/member/scheduling/offers`                                                 | listEligibleOffers; beneficiário autorizado.                                               |
| GET `/api/v1/member/scheduling/availability`                                           | getAvailability; beneficiário autorizado.                                                  |
| GET / POST `/api/v1/member/scheduling/bookings`                                        | listBookings / createBooking.                                                              |
| GET `/api/v1/member/scheduling/bookings/{bookingId}`                                   | getBooking.                                                                                |
| GET `/api/v1/member/scheduling/bookings/{bookingId}/history`                           | listBookingHistory.                                                                        |
| PATCH `/api/v1/member/scheduling/bookings/{bookingId}/pending`                         | editPendingBooking, incluindo transferência elegível.                                      |
| POST `/api/v1/member/scheduling/bookings/{bookingId}/reschedules`                      | requestReschedule.                                                                         |
| PATCH / DELETE `/api/v1/member/scheduling/bookings/{bookingId}/proposals/{proposalId}` | replacePendingProposal / withdrawProposal.                                                 |
| POST `/api/v1/member/scheduling/bookings/{bookingId}/resume`                           | resumeWithoutTime.                                                                         |
| POST `/api/v1/member/scheduling/bookings/{bookingId}/cancel`                           | cancelBooking.                                                                             |
| GET / PUT `/api/v1/member/scheduling/communication-preferences`                        | getCommunicationPreferences / saveCommunicationPreferences.                                |
| GET `/api/v1/scheduling/approval-queue`                                                | listApprovalQueue; consulta administrativa.                                                |
| POST `/api/v1/scheduling/bookings/{bookingId}/proposals/{proposalId}/approve`          | approveProposal; equipe autorizada.                                                        |
| POST `/api/v1/scheduling/bookings/{bookingId}/proposals/{proposalId}/reject`           | rejectProposal; equipe autorizada.                                                         |
| POST `/api/v1/scheduling/bookings/{bookingId}/provider-unavailability`                 | registerProviderUnavailability; equipe autorizada.                                         |
| POST `/api/v1/integrations/waha/events`                                                | Recibos técnicos autenticados; sem sessão de associado ou permissão para alterar reservas. |

Corpo e query seguem as entradas lógicas das seções 4/5; o cliente não envia contexto confiável.
Toda mutação de negócio exige Idempotency-Key e, quando existente, expectedVersion. DELETE de
proposta carrega expectedVersion por `If-Match` com a versão vigente; proposalId é obrigatório no
caminho, sem depender de corpo DELETE. Schemas executáveis e serialização exata dos demais campos
serão implementados em T047/T070, preservando esses contratos.

Publicação de oferta continua na fronteira administrativa da seção 9 e do contrato admin. Callbacks
seguem validação própria da seção 10.2, sem Idempotency-Key arbitrária do cliente. Nenhuma dessas
rotas cria login adicional, ponte automática de token legado ou interface nova.

## 2. Contexto e envelopes

- Contexto confiável: identidade/ator resolvidos, pessoa, tipo de acesso, origem app/site/painel,
  permissões e vínculos vigentes, requestId e instante do servidor. Não aceitar papel,
  elegibilidade, causa isenta, contador ou aprovação fornecidos pelo cliente como autoridade.
- IDs de beneficiário/serviço/profissional são seleções a autorizar, nunca prova de acesso. Titular
  opera para si/dependentes vigentes; dependente somente para si.
- Mutações: Idempotency-Key, hash da entrada e, em registros existentes, expectedVersion. Repetição
  autorizada com mesma entrada retorna resultado original; outra entrada na mesma chave conflita.
  Revalidar acesso antes de devolver replay, inclusive após revogação.
- Datas de entrada: ISO com offset; persistência UTC; apresentação America/Bahia. Servidor deriva
  duração/fim da oferta aplicável. Intervalos [início,fim). Nenhuma data do cliente define “agora”.
- Leituras privadas: no-store, projeção mínima e paginação. Usar padrão de lista administrativa de
  25 itens e máximo 100 como limite técnico proposto, sem truncamento silencioso. Disponibilidade
  consulta um dia por vez; horizonte comercial é validado separadamente.
- Envelope de falha: code, message, fields opcionais e requestId; nunca SQL, tokens ou dados de
  terceiro. Em HTTP, manter convenções 401/403/404/409/413/422 do projeto e corpo até 64 KiB.
  Autenticação/CSRF/origem dependem do transporte real validado, não de um token inventado aqui.

## 3. Projeções

| Projeção                  | Conteúdo mínimo e limites                                                                                                                                                                 |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Oferta pública            | ID, unidade/serviço/procedimento, descrição, duração, público-alvo, modo de agenda, política de confirmação e revisão publicada. Sem horários disponíveis, PII ou rascunho.               |
| Beneficiário selecionável | ID, nome suficiente para distinguir, relação consigo/titular/dependente e ações autorizadas. Sem CPF integral, documentos ou finanças.                                                    |
| Opção de horário          | Oferta/revisão, início/fim, fuso, profissional quando aplicável e referência de validação. Consulta não retém vaga.                                                                       |
| Reserva privada           | ID, version, beneficiário, oferta, situação, horário confirmado ou destino pendente (distintos), origem histórica, processo de troca/recuperação, contagem voluntária e ações permitidas. |
| Histórico                 | Eventos paginados com autor, origem, data e alterações mínimas autorizadas. A autoria do titular não muda o beneficiário.                                                                 |
| Fila administrativa       | Reserva/proposta, estabelecimento, equipe responsável, atuação principal/backup, entrada em análise, início original de prioridade, início solicitado de urgência, idade e alertas.       |
| Preferências              | Aviso interno app/site, e-mail, WhatsApp e version por destinatário; inicialmente todos habilitados. Não expor preferências/contatos de terceiros ao associado.                           |

A opção “Qualquer profissional disponível” deve resultar em profissional apto informado antes da
conclusão. Referência da opção identifica o candidato exibido; se ele não estiver mais disponível,
retornar conflito para revisão, sem trocar silenciosamente. Sem profissionais cadastrados, usar
horários/capacidade do serviço, sem pessoa fictícia. Oferta com profissionais sem vaga não vira
capacidade automaticamente.

## 4. Operações de leitura e preferências

| Operação v1                                    | Entrada                                                                             | Autorização e resultado                                                                                               |
| ---------------------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| listPublishedOffers                            | filtros públicos e paginação                                                        | Pública; mesma revisão em app/site, restrição “exclusivo para titular” visível; sem vagas.                            |
| listEligibleBeneficiaries                      | contexto autenticado                                                                | Somente pessoas que o ator pode representar; dependente só recebe a si.                                               |
| listEligibleOffers                             | beneficiaryId, filtros e paginação                                                  | Resolver perfil do atendido antes da seleção de serviço/unidade; excluir ofertas incompatíveis.                       |
| getAvailability                                | beneficiaryId, oferta, dia, preferência profissional; bookingId autorizado na troca | Validar acesso, público-alvo e políticas; somente opções futuras possíveis. Não excluir reserva alheia dos conflitos. |
| listBookings / getBooking / listBookingHistory | filtros/ID/página                                                                   | Acesso atual ao beneficiário e à reserva; evitar revelar existência/detalhes de terceiros.                            |
| getCommunicationPreferences                    | contexto autenticado                                                                | Preferências próprias; não usar autor da reserva como único destinatário.                                             |
| saveCommunicationPreferences                   | três escolhas, expectedVersion                                                      | Alteração pessoal pelo app, versionada/idempotente; não modificar publicação ou ocultar histórico.                    |
| listApprovalQueue                              | estabelecimento/filtros/página                                                      | Consulta administrativa autorizada; equipe principal e backup seguem matriz abaixo.                                   |

Jornada: beneficiário → serviço/unidade elegível → profissional quando aplicável → data/horário →
revisão/envio. Trocar beneficiário invalida seleções incompatíveis. Descobrir uma oferta antes do
login não dispensa essa validação nem autoriza titular a reservar serviço exclusivo para dependente.

## 5. Comandos e pós-condições

| Comando                        | Entrada de negócio                                                                                                                    | Pré-condição e resultado                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| createBooking                  | beneficiaryId, oferta/opção de horário                                                                                                | Acesso, público-alvo, oferta publicada, elegibilidade, futuro, horizonte, antecedência de nova reserva, expediente e conflitos. Confirmação imediata padrão ou pending_approval conforme serviço; ambos ocupam vaga.                                                                                                                                                                                                                            |
| editPendingBooking             | bookingId, expectedVersion, data/horário/profissional conforme opções habilitadas; beneficiaryId apenas na transferência a dependente | Ator autorizado, pedido pendente, serviço compatível, destino futuro e vaga sem conflito. Pedido inicial pode ser editado mesmo após o horário anterior, respeitando políticas de nova reserva no destino. Troca voluntária segue FR-08/10, retomada/recuperação FR-18/20. Mantém serviço, ID, política de aceite, pendência e ciclo/contador. Atualiza versão/ocupação atomicamente; falha conserva tudo. Não transfere reserva já confirmada. |
| requestReschedule              | bookingId, opção de destino, expectedVersion                                                                                          | Reserva confirmada futura, prazo de remarcação e menos de duas utilizações voluntárias consolidadas. Validar tudo antes de liberar origem e ocupar só destino na mesma transação; falha mantém origem. Abre ciclo debitável.                                                                                                                                                                                                                    |
| replacePendingProposal         | bookingId, proposalId/version, novo destino, expectedVersion                                                                          | Uma proposta ativa; regras de prazo aplicáveis ao processo. Troca de retenção atômica, conserva proposta anterior em falha e não cobra nova utilização.                                                                                                                                                                                                                                                                                         |
| withdrawProposal               | bookingId, proposalId/version, expectedVersion                                                                                        | Fronteiras de 2C-FR-10/18/20; libera destino, não restaura origem; ciclo permanece aguardando escolha.                                                                                                                                                                                                                                                                                                                                          |
| resumeWithoutTime              | bookingId, novo destino, expectedVersion                                                                                              | Mesmo registro/ciclo após recusa/desistência ou recuperação do estabelecimento; não reaplica prazo da origem/nova reserva. Valida destino futuro, horizonte, acesso, elegibilidade e aceitação.                                                                                                                                                                                                                                                 |
| approveProposal                | bookingId, proposalId/version, expectedVersion                                                                                        | Equipe autorizada, destino ainda futuro e guardas atuais. Confirma o destino já retido, sem duplicar ocupação; conta uma vez apenas no ciclo voluntário.                                                                                                                                                                                                                                                                                        |
| rejectProposal                 | bookingId, proposalId/version, expectedVersion                                                                                        | Equipe autorizada; libera destino. Pedido novo termina rejeitado; troca/recuperação permanece no mesmo registro sem horário confirmado.                                                                                                                                                                                                                                                                                                         |
| cancelBooking                  | bookingId, expectedVersion                                                                                                            | Confirmada ou pedido novo aguardando aprovação: antes do início confirmado/solicitado, sem antecedência mínima nem aprovação da equipe. Pedido novo vai a cancelled, libera vaga e sai da fila/alertas; não conta troca. Registro sem horário após troca/recuperação: guardas de 2C-FR-09/18/20; liberar só retenção própria e preservar histórico.                                                                                             |
| registerProviderUnavailability | bookingId, expectedVersion, referência do recurso/período indisponível                                                                | Equipe autorizada; reserva confirmada. Retira confirmação/ocupação, registra/mantém bloqueio efetivo e inicia recuperação isenta no mesmo ID, com aviso devido. Não altera outras reservas por inferência.                                                                                                                                                                                                                                      |

Edição antes do aceite inclui transferência a dependente autorizado, conforme decisão de 28/09.
Dependente não pode representar outra pessoa. Serviço exclusivo de titular não é transferível.
Conflitos e elegibilidade usam o novo beneficiário; trocar pessoa não contorna capacidade, prazo ou
contador. Aprovação/recusa contra versão anterior conflita; não aprovar silenciosamente pedido
alterado. Histórico conserva autor e mudança, com projeção por acesso ao beneficiário de cada
evento; receber pedido transferido não revela histórico privado do antigo atendido. Recalcular
destinatários de eventos seguintes e revalidar intenções antigas antes de envio, sem atribuir evento
passado à pessoa errada. Pendência inicial não vira ciclo debitável por edição; ciclo voluntário já
aberto mantém contagem, consolidada uma vez apenas ao confirmar.

Decisão de 28/09: pedido inicial em análise pode escolher nova data mesmo após passar o horário
anterior, sem prazo de 24h relativo à origem. Destino deve ser estritamente futuro, disponível,
elegível e dentro do horizonte/antecedência de nova reserva configurados. Manter entrada original em
análise e prioridade; atualizar urgência pelo destino vigente. Não aprovar retroativamente. Guardas
são compartilhadas por operação/processo: a rota de edição não dispensa FR-08/10 numa troca
voluntária nem remove as exceções aprovadas de FR-18/20. Após edição inicial, cancelamento segue o
início solicitado vigente conforme FR-09, sem alteração de contador.

Não exigir justificativa humana livre nesses comandos. “Causa do estabelecimento” é classificação
auditável da operação autorizada, sem reintroduzir motivo obrigatório. Uma proposta inicial não
pertence a ciclo de troca; sua referência de processo pode ser nula e não reserva utilização
voluntária. Reservas sem horário devem continuar encontráveis por situação, mesmo após o início
original; não desaparecer por um filtro exclusivo de próximos intervalos. Recusa de uma proposta
nova pode ser terminal; isso não se confunde com recusa de troca que conserva o ciclo para outra
tentativa. Nenhum processo expira apenas por passagem do tempo. Cancelamento voluntário de pedido
novo é comando explícito do ator autorizado; encerra proposta/fila/alertas, preserva ID/histórico e
gera aviso de cancelamento conforme preferências/destinatários. Não consome utilização de troca.
Cancelamento versus aprovação/recusa exige versão vigente; resultado obsoleto não reabre pedido.
Replay autorizado de cancelamento concluído, inclusive após início, não executa nova liberação.
Solicitações existentes não mudam de estado quando o serviço altera sua política de aceitação.

## 6. Estado e ocupação (valores lógicos propostos)

| Estado                              | Ocupação                           | Saídas principais                                                                                                                                                                                                                      |
| ----------------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| pending_approval, pedido novo       | Só intervalo solicitado            | Editar/transferir a dependente elegível → mesma pendência versionada; aprovar → scheduled; recusar → rejected; cancelar pelo ator autorizado antes do início solicitado → cancelled, sem aprovação da equipe e com liberação imediata. |
| scheduled                           | Só intervalo confirmado            | Cancelar → cancelled; troca válida → pending_approval ou scheduled; indisponibilidade → awaiting_new_time.                                                                                                                             |
| pending_approval, troca/recuperação | Só destino, nunca origem histórica | Aprovar → scheduled; recusar/retirar → awaiting_new_time; substituir mantém estado; cancelar conforme guarda → cancelled.                                                                                                              |
| awaiting_new_time                   | Zero vagas                         | Retomar → pending_approval ou scheduled; cancelar → cancelled.                                                                                                                                                                         |
| rejected / cancelled                | Zero vagas                         | Histórico; nenhum comando de aprovação atrasado reabre registro.                                                                                                                                                                       |

scheduled/cancelled já aparecem no modelo administrativo; demais valores são desenho de extensão,
sem migration aplicada. Estado lógico é separado da causa/processo e da situação de entrega de
aviso. Recuperação isenta sem horário usa o texto “Aguardando nova data — alteração pelo
estabelecimento”.

Contagem: confirmedVoluntaryCount + reservedVoluntaryUse <= 2; reservedVoluntaryUse é 0 ou 1. Ter no
máximo um processo ativo e uma proposta ativa por registro, inclusive recuperação isenta. Primeiro
pedido voluntário reserva uso; alternativas/recusas/retomadas conservam uso; confirmação consolida
uma vez. Recuperação do estabelecimento não reserva nem incrementa uso, inclusive com duas trocas
usadas. Cancelar não restitui trocas já confirmadas. Após recuperar e confirmar, nova mudança
voluntária segue limite/prazo usuais. Servidor define a causa; cliente não pode forjá-la.

## 7. Tempo, capacidade e concorrência

- Nova reserva: início futuro, sem antecedência mínima por padrão; serviço pode configurar.
- Horizonte: 90 dias corridos por padrão, editável/desativável; início exatamente no limite
  permitido. Não invalidar registros anteriores por redução posterior da janela.
- Troca voluntária de compromisso confirmado: 24 horas por padrão, editável/desativável; início
  original é referência, não destino. Recuperações seguem exceções de 2C-FR-18/20.
- Prazo de análise: 24 horas corridas após entrada em análise, editável/desativável.
- Urgência: 24 horas antes do início solicitado, configurável e independente do atraso. Troca usa
  destino para urgência e origem para prioridade. Nenhum alerta move/cancela a reserva.
- Fila: remarcações antes de novas reservas; origem mais próxima, envio e ID como desempates.
- Compartilhar transação/protocolo de locks com edição de oferta, vínculos, bloqueios e recursos.
  Revalidar após espera e impedir sobreposição global por beneficiário; profissional/intervalo ou
  capacidade finita por serviço/unidade. Slots adjacentes são permitidos.
- Retenções pendentes disputam a mesma capacidade de confirmadas. Não há hold temporário só por
  abrir calendário. Falha antes do commit não libera origem nem reserva utilização.
- Decisão sobre proposta retirada/substituída deve conflitar; nunca restaurar origem ocupada por
  terceiro. O bloqueio real do estabelecimento continua ativo após remover sua reserva.

## 8. Permissões e responsabilidade

| Ator                 | Leituras e comandos permitidos                                                                                                           |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Visitante            | Apenas catálogo publicado.                                                                                                               |
| Titular externo      | Próprios dados de agenda e de dependentes vigentes, conforme ações atuais.                                                               |
| Dependente externo   | Somente própria agenda, inclusive reservas criadas pelo titular.                                                                         |
| Equipe vinculada     | Responsável principal pelo estabelecimento, com consulta/alteração administrativas exigidas. Vínculo sozinho não concede acesso.         |
| Colaborador de apoio | Com permissão de alteração e consulta, pode atuar como backup; atuação/autor auditados. Sem aprovação dupla ou escalonamento automático. |

Titularidade familiar não concede acesso financeiro. Profissional cadastrado não é conta de equipe.
Vínculo de equipe/estabelecimento precisa ser representado e validado na integração administrativa;
não inventar equivalência automática com unidade de Parceiros. Este incremento não retira o acesso
administrativo existente nem cria portal de parceiros implicitamente.

## 9. Publicação administrativa

Salvar: novo serviço interno. Publicar: validar/salvar/publicar uma revisão para app e site. Salvar
alterações: rascunho separado. Publicar alterações: validar/salvar/substituir publicação
atomicamente, sem salvamento prévio. Mesmo ID, expectedVersion do serviço/rascunho/publicação; erro
conserva versão pública e edição. Ativo não implica publicado. Cache de ambos atualiza após commit.

Revisão publicada contém público-alvo e políticas aplicáveis; disponibilidade operacional continua
atual (ocupações, bloqueios, habilitações), sem congelamento pelo rascunho. Não publicar alteração
que invalide reservas existentes sem a resolução prevista. Descrições abaixo de cada botão seguem
2C-FR-19, sem layout novo presumido.

## 10. Avisos e entrega

Eventos previstos: confirmação, recusa, cancelamento e necessidade de remarcar. Uma proposta
aguardando aprovação não dispara confirmação falsa. Aviso interno app/site, e-mail e WhatsApp
inicialmente habilitados; seleção pessoal no app. Não confundir aviso interno com push contratado.

**Exceção específica BF-FR-06:** aviso de bloqueio por falta, confirmação do pedido e decisão da
equipe são e-mails operacionais. Não suprimi-los por preferência de comunicados/campanhas. Para
dependente, resolver dependente e titular vigente; a restrição continua individual. A exceção não
remove preferências dos quatro eventos gerais acima nem habilita WhatsApp, app/site ou envio real de
faltas. Contato válido, acesso, vínculo, deduplicação e comprovação de entrega continuam exigidos.

Destinatários: atendimento do titular → ele próprio; do dependente → dependente e titular vigente,
independentemente do autor. Revalidar vínculo, acesso, contatos e preferências aplicáveis em cada
envio/reenvio. Encerramento de vínculo impede novas entregas ao antigo titular; não promete recolher
e-mail já enviado.

Persistir intenção de entrega com o evento de domínio; processamento assíncrono independente do
sucesso da reserva. Reutilizar
[contrato de jobs da fundação](../../001-project-foundation/contracts/jobs.md) e worker existentes,
com payload mínimo de IDs, handlers permitidos e retry/reenvio auditados; não criar uma segunda
infraestrutura de filas. Chave única por evento/pessoa/canal, correlação, versão e tentativas
observáveis. Distinguir não elegível/preferência desativada quando aplicável, contato ausente,
pendente, enviado, entregue com comprovação, falha e resultado incerto. Resposta de aceite do
provedor não prova leitura/entrega. Em timeout após envio possível, reconciliar pelo identificador
do provedor antes de repetir; não prometer entrega exatamente uma vez fora do controle transacional
do domínio.

Preferências por canal ainda precisam ser implementadas: o protótipo de Mensagens só contém bloqueio
geral e channelConfigured=false. E-mail usará o serviço já definido para o sistema, conforme decisão
de 28/09; identificar seu contrato/remetente não é seleção de outro fornecedor nem prova de envio da
agenda já configurado. Escopo não inclui contratar/configurar provedor, reutilizar credenciais sem
validação, campanhas, SMS ou push móvel.

Inspeção de 25/09: SMTP de contas e jobs são referências reutilizáveis; cliente Evolution encontrado
no router conversacional retorna boolean e não comprova entrega. WAHA e e-mail do sistema foram
definidos em 28/09; o provedor antigo precisa ser identificado para a transição, sem impor sua
reutilização. Adaptador de agenda precisa persistir correlação/resultado, distinguir timeout incerto
e reconciliar antes de retry, mantendo destinatário/vínculo/preferência atuais. Não usar
persistência de conversa ou campanha bloqueada como comprovante de envio. Fontes e blobs em
[research.md](../research.md#inspeção-das-integrações-existentes--25092026).

### 10.1. WhatsApp via WAHA — decisão de 28/09

WAHA é o transporte escolhido e ainda será instalado, conforme resposta de 28/09. Evolução do código
antigo e comparações com Meta/360dialog não são seleção pendente. Planejar preparação e registrar
versão/motor, ambiente e validação futura; instância/sessão reais dependem de instalação posterior
autorizada. Não declarar instalação ou homologação concluídas.

Contrato proposto a conferir no OpenAPI da versão usada: envio por POST /api/sendText, captura do ID
de mensagem e correlação por instância/sessão/messageId. Receber message.ack: SERVER representa
chegada ao servidor, DEVICE ao dispositivo, READ leitura quando observada; retorno HTTP não prova
entrega. Estado ausente permanece desconhecido. Não pressupor idempotência nativa nem reenviar
cegamente após timeout. Reconciliar pelos recursos disponíveis na versão/motor, com tentativas
finitas e observabilidade.

Validar origem/autenticidade dos callbacks pelo mecanismo configurado, deduplicar eventos e tolerar
chegada fora de ordem sem retroceder entrega já comprovada. Sessão desconectada deve ficar
identificada como indisponibilidade de comunicação; reserva permanece válida. Textos dos quatro
eventos são versionados no CAAB, com link autenticado e dados mínimos.

Preferência inicial ligada é distinta de contato/permissão de comunicação; preservar opt-out. Regras
de templates aprovados, janela e tarifas específicas da Cloud API descritas na pesquisa comparativa
não viram requisitos técnicos do WAHA por analogia. Não confundir as duas interfaces.

Fontes oficiais consultadas em 28/09: [envio](https://waha.devlike.pro/docs/how-to/send-messages/),
[eventos](https://waha.devlike.pro/docs/how-to/events/) e
[motores](https://waha.devlike.pro/docs/how-to/engines/).

### 10.2. Limites operacionais propostos — 28/09

Decisões técnicas deste plano, sujeitas à prova do adaptador em T044/T069; não são uma regra
universal do mercado nem configuração já aplicada. Reutilizar o worker/fila PostgreSQL existente.

| Parâmetro                       | Desenho explícito                                                                                                                                                                                                                                                                   |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Orçamento de envio por intenção | No máximo 5 tentativas automáticas: uma inicial e até 4 novas tentativas seguras. O contador persistido não reinicia por reentrega do job.                                                                                                                                          |
| Espera de retry                 | Configuração já usada pelo worker: retryLimit 4, retryDelay 30 s, retryBackoff true, retryDelayMax 900 s. Respeitar Retry-After quando comprovado pelo adaptador; reagendar sem antecipar o limite.                                                                                 |
| Chamada externa                 | Timeout de 10 s por chamada; após possível aceite, timeout é resultado incerto.                                                                                                                                                                                                     |
| Execução da fila                | expireInSeconds 900, heartbeatSeconds 60; perda de heartbeat/claim após envio possível também exige reconciliação antes de novo envio.                                                                                                                                              |
| Retenção operacional            | Revisar explicitamente as definições existentes: retentionSeconds 1.209.600, deleteAfterSeconds 604.800 e dead-letter caab-dead-letter, retryLimit 0/deleteAfterSeconds 0. Aplicam-se aos registros técnicos da fila, sem apagar eventos, intenções, histórico ou dados de negócio. |
| Reconciliação incerta           | Até 3 consultas sem envio, após 1, 5 e 15 minutos do resultado incerto, quando houver correlação e consulta suportada. Sem suporte/identificador suficiente, ou após esgotamento, revisão operacional; não reenviar automaticamente.                                                |
| Reenvio manual                  | Permissão do processamento existente, auditoria e revalidação de acesso/preferência/contato; resultado incerto precisa ser esclarecido antes de autorizar novo efeito externo. Sem motivo escrito obrigatório.                                                                      |

Só repetir envio quando o adaptador comprovar ausência de aceite/efeito. Um 5xx ou queda de conexão
isoladamente não oferece essa prova. Contato inválido é falha definitiva; acesso revogado suprime o
envio. Preferência desligada suprime os avisos a que ela se aplica, mas não os três e-mails
operacionais de faltas definidos em BF-FR-06. Ao esgotar tentativas seguras, registrar falha e
encaminhar ao tratamento operacional/dead-letter existente. Não desfazer o agendamento. Distinguir
retry do job, nova chamada de envio, consulta de reconciliação e repetição do webhook: reentrega de
qualquer um não reinicia orçamento nem gera novo evento de negócio.

Para callbacks WAHA, planejar HMAC SHA-512 sobre o corpo bruto, conferido antes de processamento,
com segredo fora de logs e comparação segura. A documentação define X-Webhook-Hmac e
X-Webhook-Hmac-Algorithm; não presumir assinatura dos headers de timestamp/requestId. Deduplicar por
instância/sessão/mensagem e evento normalizado; tolerar chegada fora de ordem. Assinar somente os
eventos necessários, message.ack e session.status, validando suporte do motor selecionado. Fonte:
[eventos WAHA](https://waha.devlike.pro/docs/how-to/events/), consultada em 28/09/2026.

Os valores da fila foram conferidos em [queues.ts](../../../apps/worker/src/queues.ts), blob
`4fb73ae728afea0457fe7a272d138ae726603427`. T044 verifica compatibilidade com a versão instalada, o
serviço de e-mail e o motor WAHA antes de aplicar a configuração; divergência exige atualização
deste contrato e dos testes. Não ativar limpeza de dados de negócio por analogia com a fila.

## 11. Falhas recuperáveis

| Código lógico proposto                           | Efeito e recuperação                                                                                |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| AUTH_REQUIRED / ACCESS_DENIED / NOT_FOUND        | Sem dados privados; autenticar novamente ou acesso negado conforme contexto.                        |
| BENEFICIARY_INELIGIBLE / OFFER_UNPUBLISHED       | Sem reserva; revisar beneficiário/oferta e preservar campos não sensíveis.                          |
| SLOT_CONFLICT / CAPACITY_EXCEEDED                | Sem alteração parcial; atualizar opções e pedir nova escolha.                                       |
| VERSION_CONFLICT / IDEMPOTENCY_CONFLICT          | Sem sobrescrever ou duplicar; recarregar estado autorizado.                                         |
| RESCHEDULE_LIMIT / NOTICE_WINDOW / HORIZON_LIMIT | Aplicar somente à operação/causa elegível; recuperação isenta não recebe erro de limite voluntário. |
| PROPOSAL_STALE / TARGET_NOT_FUTURE               | Não aprovar versão antiga nem horário passado; manter estado até resolução explícita.               |
| DELIVERY_UNAVAILABLE / DELIVERY_UNKNOWN          | Agendamento permanece válido; resultado de comunicação rastreável para operação.                    |

Códigos não são enums já exportados. Adaptadores concretos deverão preservar essas distinções e
compatibilidade das APIs existentes, sem acoplar erro de provedor ao commit de agendamento.

## 12. Dependências para vincular e homologar o contrato

1. Integrar autenticação geral do app/site, identidade de Associados e revogação de acesso; validar
   a vinculação HTTP da seção 1.3 e implementar schemas, sem login próprio do módulo.
2. Representar equipe vinculada/backup sem ampliar permissões; coordenar novos estados/constraints
   com contratos e migrations existentes.
3. Planejar instalação/validação WAHA e integrar e-mail do sistema; versionar textos e validar a
   política da seção 10.2/recibos; validar preferências e confirmação de envio. Inventariar
   finalidade de preferências/supressões antigas antes de qualquer conversão; padrão ativo não apaga
   registros existentes nem comprova contato validado. Não reativar campanhas antigas bloqueadas ao
   disponibilizar um canal.
4. Conferir reservas futuras necessárias ao corte e identidade geral. Histórico antigo detalhado é
   importação opcional; não bloqueia a função nova. Não presumir agenda vazia ou apagar fontes.
5. Implementar e validar com fixtures sintéticas conforme [quickstart](../quickstart.md); guia de
   design precisa estar disponível antes do desenho visual.

T022/T023/T024 permanecem abertos. Este contrato lógico permite revisão de regras e desenho de
testes; não equivale à homologação das dependências nem à conclusão do Spec Kit completo.
