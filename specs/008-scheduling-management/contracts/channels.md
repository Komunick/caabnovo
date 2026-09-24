# Contrato lógico v1 — Agendamentos no app/site (2C)

Data: 24/09/2026. Estado: **proposta documental para implementação**, derivada de
[spec.md](../spec.md), [plan.md](../plan.md) e [data-model.md](../data-model.md).
Nenhuma operação abaixo comprova endpoint, migration, envio ou cliente externo implementados.
O contrato administrativo existente permanece em [admin.md](admin.md).

## 1. Fronteira e versão

App e site consomem a mesma oferta publicada e o mesmo domínio de disponibilidade/reservas.
Operações lógicas abaixo pertencem à versão v1; o vínculo com transporte/rotas deve usar prefixo
explícito de versão ao ser implementado. Caminhos HTTP externos e forma de autenticação serão
fechados após verificar os acessos existentes; não reutilizar endpoints/sessões administrativos
como autorização do associado. Este documento fixa dados, permissões, transições e erros do domínio.

Acesso externo resolve identidade autenticada → pessoa de Associados no servidor. O usuário
informou que titulares e dependentes já têm contas individuais; isso não comprova compatibilidade
com Better Auth administrativo. Seguir [005 FR-010](../../005-members-management/spec.md) e
[contrato de Associados](../../005-members-management/contracts/members.md).
Sem correspondência confiável, negar operação privada, sem criar pessoa/conta ou vincular por nome.

## 2. Contexto e envelopes

- Contexto confiável: identidade/ator resolvidos, pessoa, tipo de acesso, origem app/site/painel,
  permissões e vínculos vigentes, requestId e instante do servidor. Não aceitar papel, elegibilidade,
  causa isenta, contador ou aprovação fornecidos pelo cliente como autoridade.
- IDs de beneficiário/serviço/profissional são seleções a autorizar, nunca prova de acesso.
  Titular opera para si/dependentes vigentes; dependente somente para si.
- Mutações: Idempotency-Key, hash da entrada e, em registros existentes, expectedVersion.
  Repetição autorizada com mesma entrada retorna resultado original; outra entrada na mesma chave
  conflita. Revalidar acesso antes de devolver replay, inclusive após revogação.
- Datas de entrada: ISO com offset; persistência UTC; apresentação America/Bahia. Servidor deriva
  duração/fim da oferta aplicável. Intervalos [início,fim). Nenhuma data do cliente define “agora”.
- Leituras privadas: no-store, projeção mínima e paginação. Usar padrão de lista administrativa
  de 25 itens e máximo 100 como limite técnico proposto, sem truncamento silencioso.
  Disponibilidade consulta um dia por vez; horizonte comercial é validado separadamente.
- Envelope de falha: code, message, fields opcionais e requestId; nunca SQL, tokens ou dados
  de terceiro. Em HTTP, manter convenções 401/403/404/409/413/422 do projeto e corpo até 64 KiB.
  Autenticação/CSRF/origem dependem do transporte real validado, não de um token inventado aqui.

## 3. Projeções

| Projeção | Conteúdo mínimo e limites |
| --- | --- |
| Oferta pública | ID, unidade/serviço/procedimento, descrição, duração, público-alvo, modo de agenda, política de confirmação e revisão publicada. Sem horários disponíveis, PII ou rascunho. |
| Beneficiário selecionável | ID, nome suficiente para distinguir, relação consigo/titular/dependente e ações autorizadas. Sem CPF integral, documentos ou finanças. |
| Opção de horário | Oferta/revisão, início/fim, fuso, profissional quando aplicável e referência de validação. Consulta não retém vaga. |
| Reserva privada | ID, version, beneficiário, oferta, situação, horário confirmado ou destino pendente (distintos), origem histórica, processo de troca/recuperação, contagem voluntária e ações permitidas. |
| Histórico | Eventos paginados com autor, origem, data e alterações mínimas autorizadas. A autoria do titular não muda o beneficiário. |
| Fila administrativa | Reserva/proposta, estabelecimento, equipe responsável, atuação principal/backup, entrada em análise, início original de prioridade, início solicitado de urgência, idade e alertas. |
| Preferências | Aviso interno app/site, e-mail, WhatsApp e version por destinatário; inicialmente todos habilitados. Não expor preferências/contatos de terceiros ao associado. |

A opção “Qualquer profissional disponível” deve resultar em profissional apto informado antes da
conclusão. Referência da opção identifica o candidato exibido; se ele não estiver mais disponível,
retornar conflito para revisão, sem trocar silenciosamente. Sem profissionais cadastrados, usar
horários/capacidade do serviço, sem pessoa fictícia. Oferta com profissionais sem vaga não vira
capacidade automaticamente.

## 4. Operações de leitura e preferências

| Operação v1 | Entrada | Autorização e resultado |
| --- | --- | --- |
| listPublishedOffers | filtros públicos e paginação | Pública; mesma revisão em app/site, restrição “exclusivo para titular” visível; sem vagas. |
| listEligibleBeneficiaries | contexto autenticado | Somente pessoas que o ator pode representar; dependente só recebe a si. |
| listEligibleOffers | beneficiaryId, filtros e paginação | Resolver perfil do atendido antes da seleção de serviço/unidade; excluir ofertas incompatíveis. |
| getAvailability | beneficiaryId, oferta, dia, preferência profissional; bookingId autorizado na troca | Validar acesso, público-alvo e políticas; somente opções futuras possíveis. Não excluir reserva alheia dos conflitos. |
| listBookings / getBooking / listBookingHistory | filtros/ID/página | Acesso atual ao beneficiário e à reserva; evitar revelar existência/detalhes de terceiros. |
| getCommunicationPreferences | contexto autenticado | Preferências próprias; não usar autor da reserva como único destinatário. |
| saveCommunicationPreferences | três escolhas, expectedVersion | Alteração pessoal pelo app, versionada/idempotente; não modificar publicação ou ocultar histórico. |
| listApprovalQueue | estabelecimento/filtros/página | Consulta administrativa autorizada; equipe principal e backup seguem matriz abaixo. |

Jornada: beneficiário → serviço/unidade elegível → profissional quando aplicável → data/horário
→ revisão/envio. Trocar beneficiário invalida seleções incompatíveis. Descobrir uma oferta antes
do login não dispensa essa validação nem autoriza titular a reservar serviço exclusivo para dependente.

## 5. Comandos e pós-condições

| Comando | Entrada de negócio | Pré-condição e resultado |
| --- | --- | --- |
| createBooking | beneficiaryId, oferta/opção de horário | Acesso, público-alvo, oferta publicada, elegibilidade, futuro, horizonte, antecedência de nova reserva, expediente e conflitos. Confirmação imediata padrão ou pending_approval conforme serviço; ambos ocupam vaga. |
| requestReschedule | bookingId, opção de destino, expectedVersion | Reserva confirmada futura, prazo de remarcação e menos de duas utilizações voluntárias consolidadas. Validar tudo antes de liberar origem e ocupar só destino na mesma transação; falha mantém origem. Abre ciclo debitável. |
| replacePendingProposal | bookingId, proposalId/version, novo destino, expectedVersion | Uma proposta ativa; regras de prazo aplicáveis ao processo. Troca de retenção atômica, conserva proposta anterior em falha e não cobra nova utilização. |
| withdrawProposal | bookingId, proposalId/version, expectedVersion | Fronteiras de 2C-FR-10/18/20; libera destino, não restaura origem; ciclo permanece aguardando escolha. |
| resumeWithoutTime | bookingId, novo destino, expectedVersion | Mesmo registro/ciclo após recusa/desistência ou recuperação do estabelecimento; não reaplica prazo da origem/nova reserva. Valida destino futuro, horizonte, acesso, elegibilidade e aceitação. |
| approveProposal | bookingId, proposalId/version, expectedVersion | Equipe autorizada, destino ainda futuro e guardas atuais. Confirma o destino já retido, sem duplicar ocupação; conta uma vez apenas no ciclo voluntário. |
| rejectProposal | bookingId, proposalId/version, expectedVersion | Equipe autorizada; libera destino. Pedido novo termina rejeitado; troca/recuperação permanece no mesmo registro sem horário confirmado. |
| cancelBooking | bookingId, expectedVersion | Confirmada ou pedido novo aguardando aprovação: antes do início confirmado/solicitado, sem antecedência mínima nem aprovação da equipe. Pedido novo vai a cancelled, libera vaga e sai da fila/alertas; não conta troca. Registro sem horário após troca/recuperação: guardas de 2C-FR-09/18/20; liberar só retenção própria e preservar histórico. |
| registerProviderUnavailability | bookingId, expectedVersion, referência do recurso/período indisponível | Equipe autorizada; reserva confirmada. Retira confirmação/ocupação, registra/mantém bloqueio efetivo e inicia recuperação isenta no mesmo ID, com aviso devido. Não altera outras reservas por inferência. |

Não exigir justificativa humana livre nesses comandos. “Causa do estabelecimento” é classificação
auditável da operação autorizada, sem reintroduzir motivo obrigatório.
Uma proposta inicial não pertence a ciclo de troca; sua referência de processo pode ser nula e
não reserva utilização voluntária. Reservas sem horário devem continuar encontráveis por situação,
mesmo após o início original; não desaparecer por um filtro exclusivo de próximos intervalos.
Recusa de uma proposta nova pode ser terminal; isso não se confunde com recusa de troca que conserva
o ciclo para outra tentativa. Nenhum processo expira apenas por passagem do tempo. Cancelamento voluntário de pedido novo é
comando explícito do ator autorizado; encerra proposta/fila/alertas, preserva ID/histórico e gera
aviso de cancelamento conforme preferências/destinatários. Não consome utilização de troca.
Cancelamento versus aprovação/recusa exige versão vigente; resultado obsoleto não reabre pedido.
Replay autorizado de cancelamento concluído, inclusive após início, não executa nova liberação.
Solicitações existentes não mudam de estado quando o serviço altera sua política de aceitação.

## 6. Estado e ocupação (valores lógicos propostos)

| Estado | Ocupação | Saídas principais |
| --- | --- | --- |
| pending_approval, pedido novo | Só intervalo solicitado | Aprovar → scheduled; recusar → rejected; cancelar pelo ator autorizado antes do início solicitado → cancelled, sem aprovação da equipe e com liberação imediata. |
| scheduled | Só intervalo confirmado | Cancelar → cancelled; troca válida → pending_approval ou scheduled; indisponibilidade → awaiting_new_time. |
| pending_approval, troca/recuperação | Só destino, nunca origem histórica | Aprovar → scheduled; recusar/retirar → awaiting_new_time; substituir mantém estado; cancelar conforme guarda → cancelled. |
| awaiting_new_time | Zero vagas | Retomar → pending_approval ou scheduled; cancelar → cancelled. |
| rejected / cancelled | Zero vagas | Histórico; nenhum comando de aprovação atrasado reabre registro. |

scheduled/cancelled já aparecem no modelo administrativo; demais valores são desenho de extensão,
sem migration aplicada. Estado lógico é separado da causa/processo e da situação de entrega de aviso.
Recuperação isenta sem horário usa o texto “Aguardando nova data — alteração pelo estabelecimento”.

Contagem: confirmedVoluntaryCount + reservedVoluntaryUse <= 2; reservedVoluntaryUse é 0 ou 1.
Ter no máximo um processo ativo e uma proposta ativa por registro, inclusive recuperação isenta.
Primeiro pedido voluntário reserva uso; alternativas/recusas/retomadas conservam uso; confirmação
consolida uma vez. Recuperação do estabelecimento não reserva nem incrementa uso, inclusive com
duas trocas usadas. Cancelar não restitui trocas já confirmadas. Após recuperar e confirmar, nova
mudança voluntária segue limite/prazo usuais. Servidor define a causa; cliente não pode forjá-la.

## 7. Tempo, capacidade e concorrência

- Nova reserva: início futuro, sem antecedência mínima por padrão; serviço pode configurar.
- Horizonte: 90 dias corridos por padrão, editável/desativável; início exatamente no limite
  permitido. Não invalidar registros anteriores por redução posterior da janela.
- Troca voluntária de compromisso confirmado: 24 horas por padrão, editável/desativável;
  início original é referência, não destino. Recuperações seguem exceções de 2C-FR-18/20.
- Prazo de análise: 24 horas corridas após entrada em análise, editável/desativável.
- Urgência: 24 horas antes do início solicitado, configurável e independente do atraso.
  Troca usa destino para urgência e origem para prioridade. Nenhum alerta move/cancela a reserva.
- Fila: remarcações antes de novas reservas; origem mais próxima, envio e ID como desempates.
- Compartilhar transação/protocolo de locks com edição de oferta, vínculos, bloqueios e recursos.
  Revalidar após espera e impedir sobreposição global por beneficiário; profissional/intervalo
  ou capacidade finita por serviço/unidade. Slots adjacentes são permitidos.
- Retenções pendentes disputam a mesma capacidade de confirmadas. Não há hold temporário só por
  abrir calendário. Falha antes do commit não libera origem nem reserva utilização.
- Decisão sobre proposta retirada/substituída deve conflitar; nunca restaurar origem ocupada
  por terceiro. O bloqueio real do estabelecimento continua ativo após remover sua reserva.

## 8. Permissões e responsabilidade

| Ator | Leituras e comandos permitidos |
| --- | --- |
| Visitante | Apenas catálogo publicado. |
| Titular externo | Próprios dados de agenda e de dependentes vigentes, conforme ações atuais. |
| Dependente externo | Somente própria agenda, inclusive reservas criadas pelo titular. |
| Equipe vinculada | Responsável principal pelo estabelecimento, com consulta/alteração administrativas exigidas. Vínculo sozinho não concede acesso. |
| Colaborador de apoio | Com permissão de alteração e consulta, pode atuar como backup; atuação/autor auditados. Sem aprovação dupla ou escalonamento automático. |

Titularidade familiar não concede acesso financeiro. Profissional cadastrado não é conta de equipe.
Vínculo de equipe/estabelecimento precisa ser representado e validado na integração administrativa;
não inventar equivalência automática com unidade de Parceiros. Este incremento não retira o acesso
administrativo existente nem cria portal de parceiros implicitamente.

## 9. Publicação administrativa

Salvar: novo serviço interno. Publicar: validar/salvar/publicar uma revisão para app e site.
Salvar alterações: rascunho separado. Publicar alterações: validar/salvar/substituir publicação
atomicamente, sem salvamento prévio. Mesmo ID, expectedVersion do serviço/rascunho/publicação;
erro conserva versão pública e edição. Ativo não implica publicado. Cache de ambos atualiza após commit.

Revisão publicada contém público-alvo e políticas aplicáveis; disponibilidade operacional continua
atual (ocupações, bloqueios, habilitações), sem congelamento pelo rascunho. Não publicar alteração
que invalide reservas existentes sem a resolução prevista. Descrições abaixo de cada botão seguem
2C-FR-19, sem layout novo presumido.

## 10. Avisos e entrega

Eventos previstos: confirmação, recusa, cancelamento e necessidade de remarcar. Uma proposta
aguardando aprovação não dispara confirmação falsa. Aviso interno app/site, e-mail e WhatsApp
inicialmente habilitados; seleção pessoal no app. Não confundir aviso interno com push contratado.

Destinatários: atendimento do titular → ele próprio; do dependente → dependente e titular vigente,
independentemente do autor. Revalidar vínculo, acesso, contatos e preferências em cada envio/reenvio.
Encerramento de vínculo impede novas entregas ao antigo titular; não promete recolher e-mail já enviado.

Persistir intenção de entrega com o evento de domínio; processamento assíncrono independente do
sucesso da reserva. Reutilizar [contrato de jobs da fundação](../../001-project-foundation/contracts/jobs.md)
e worker existentes, com payload mínimo de IDs, handlers permitidos e retry/reenvio auditados;
não criar uma segunda infraestrutura de filas. Chave única por evento/pessoa/canal, correlação, versão e tentativas observáveis.
Distinguir não elegível/preferência desativada, contato ausente, pendente, enviado, entregue com
comprovação, falha e resultado incerto. Resposta de aceite do provedor não prova leitura/entrega.
Em timeout após envio possível, reconciliar pelo identificador do provedor antes de repetir;
não prometer entrega exatamente uma vez fora do controle transacional do domínio.

Preferências por canal ainda precisam ser implementadas: o protótipo de Mensagens só contém
bloqueio geral e channelConfigured=false. SMTP de autenticação existe como candidato técnico,
não como prova de envio da agenda configurado. Escopo não inclui contratar/configurar provedor,
reutilizar credenciais sem validação, campanhas, SMS ou push móvel.

## 11. Falhas recuperáveis

| Código lógico proposto | Efeito e recuperação |
| --- | --- |
| AUTH_REQUIRED / ACCESS_DENIED / NOT_FOUND | Sem dados privados; autenticar novamente ou acesso negado conforme contexto. |
| BENEFICIARY_INELIGIBLE / OFFER_UNPUBLISHED | Sem reserva; revisar beneficiário/oferta e preservar campos não sensíveis. |
| SLOT_CONFLICT / CAPACITY_EXCEEDED | Sem alteração parcial; atualizar opções e pedir nova escolha. |
| VERSION_CONFLICT / IDEMPOTENCY_CONFLICT | Sem sobrescrever ou duplicar; recarregar estado autorizado. |
| RESCHEDULE_LIMIT / NOTICE_WINDOW / HORIZON_LIMIT | Aplicar somente à operação/causa elegível; recuperação isenta não recebe erro de limite voluntário. |
| PROPOSAL_STALE / TARGET_NOT_FUTURE | Não aprovar versão antiga nem horário passado; manter estado até resolução explícita. |
| DELIVERY_UNAVAILABLE / DELIVERY_UNKNOWN | Agendamento permanece válido; resultado de comunicação rastreável para operação. |

Códigos não são enums já exportados. Adaptadores concretos deverão preservar essas distinções e
compatibilidade das APIs existentes, sem acoplar erro de provedor ao commit de agendamento.

## 12. Dependências para vincular e homologar o contrato

1. Inspecionar mecanismo dos acessos individuais e correspondência a Associados, revogação e
   transporte; fechar caminhos/versionamento HTTP e schemas executáveis com evidência.
2. Representar equipe vinculada/backup sem ampliar permissões; coordenar novos estados/constraints
   com contratos e migrations existentes.
3. Definir provedores, textos, tentativas finitas/backoff/timeouts e operação de entrega/reenvio;
   validar preferências e confirmação de envio. Inventariar finalidade de preferências/supressões
   antigas antes de qualquer conversão; padrão ativo não apaga registros existentes nem comprova
   contato validado. Não reativar campanhas antigas bloqueadas ao disponibilizar um canal.
4. Inventariar reservas futuras/histórico e contas legadas. Existência de reservas futuras ainda
   desconhecida; isso bloqueia corte, não autoriza esvaziar agenda ou dispensar reconciliação.
5. Implementar e validar com fixtures sintéticas conforme [quickstart](../quickstart.md);
   guia de design precisa estar disponível antes do desenho visual.

T022/T023/T024 permanecem abertos. Este contrato lógico permite revisão de regras e desenho de
testes; não equivale à homologação das dependências nem à conclusão do Spec Kit completo.
