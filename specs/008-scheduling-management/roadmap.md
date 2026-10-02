# Roadmap de Agendamentos

## Complemento de 28/09 — faltas administrativas implementadas localmente

A parcela de faltas de 2B e seus avisos em 2E tem decisões explícitas em [BF-FR-01–06](spec.md):
registro pela equipe, 30 dias corridos desde o registro em todos os serviços, alcance individual,
sete dias desde o registro para justificar/contestar, preservação de reservas durante esse prazo e
análise, e restrição a novas reservas. Sem pedido tempestivo, efetivar bloqueio e cancelar reservas
abrangidas. OK apenas fecha o aviso e mantém os sete dias. Prever Justificar falta/Contestar falta e
acesso posterior no app/site e e-mails no aviso, envio do pedido e decisão. O usuário autorizou
implementar o núcleo T090–T096/T098 em paralelo com o clarify. T088 foi concluída; T099–T102
acrescentaram e validaram as telas administrativas. A implementação preserva períodos próprios de 30
dias e revisão separada por falta, sem soma automática. Cada restrição expira ao completar seus 30
dias mesmo com análise pendente, mantendo outras restrições vigentes e a decisão tardia refletida no
histórico. A observação histórica “falta não cria punição presumida” não anula a nova regra: não
inferir falta pelo relógio. T078–T086 não incluem esta funcionalidade; app/site dependem de
UI01/UI02.

Regra adicional confirmada: registrar falta somente após término previsto de compromisso confirmado.
Cancelamento atinge confirmadas e pendentes com início futuro dentro do período da ocorrência.
Cancelar também reservas posteriores ao bloqueio é somente possibilidade para discussão futura
(T097), sem configuração ou código nesta entrega. Não retroagir sobre atendimentos passados nem
cancelar reservas sem horário.

O projeto intermedeia pedido/comprovantes e registra a decisão da equipe; não define nem automatiza
mérito. Os três e-mails são operacionais, para dependente e titular quando aplicável,
independentemente de comunicados. T089 conserva a integração externa e a entrega de e-mails;
[evidência da UI](evidence/absence-ui-2026-09-28.md).

## Prioridade atual — painel e banco, decisão posterior de 28/09

App/site adiado pelo usuário. Ordem única: T078/T079 (escopo/regras, concluídas) → T080–T086
(persistência, configuração/publicação, pedidos/decisões, remarcação/recuperação, fila/histórico,
intenções de aviso, integração e validação administrativas). Aplicar no painel as mesmas regras de
aprovação, prazo e duas trocas, conforme resposta explícita. Usar sessão de colaborador e
beneficiário em Associados. T041/UI01/UI02 condicionam apenas a futura integração externa. T025–T038
preservam conclusão local; T039 CI continua dependente de publicação autorizada. Nenhuma construção
de app/site ou interface mínima adicional é necessária neste momento. As sequências anteriores
abaixo são históricas quando divergirem desta prioridade.

**Conclusão local:** T078–T086 implementadas e validadas pelo painel. Resultados e limites em
[evidência administrativa](evidence/admin-workflow-2026-09-28.md). Não há consumidor externo ou
entrega real de avisos; publicação/CI permanecem pendentes.

## Registro anterior à mudança de prioridade — sem instrução de execução

Estado de autorização e gates no [checkpoint vigente](checkpoint.md): implementação administrativa
local T025–T039 e testes com Docker/PostgreSQL descartável autorizados; manter sem publicação. 2C
aguarda identidade/UI01/contrato físico. CAL06 encerrada; pré-grant, 0031, disponibilidade por
pessoa, aviso aditivo e exportação implementados localmente. 81 unitários, 37 integrações de agenda
e 20 de exportação aprovados; build/tipos/lint aprovados. Cinco jornadas Chromium e revisão visual
aprovadas; 169 contratos aprovados. Evidência em
[validação administrativa](evidence/plan-2026-09-21-validation.md); CI desta entrega não executado.
Declarações anteriores de ausência de execução ou espera por permissão descrevem a etapa documental
histórica.

## Prioridade vigente — reconciliação de 28/09/2026

1. Conferir base/evidências e encerrar CAL06 quando houver revisão real. FullCalendar está integrado
   pelo PR #34/ed31baf; não reabrir CAL01–CAL05 ou reutilizar a branch integrada.
2. Concluir pendências administrativas T025–T039: matriz de acesso/ajuste pré-lock, overlap por
   beneficiário, aviso de bloqueio e exportação própria. T028/AC01/AC02 e LC01 já foram entregues
   pelo PR #36/af6f096; preservar esse código, sem repetir migrations 0025/0026/0028.
3. Integrar app/site por T022/T040–T077, com a spec própria UI01/UI02. O contrato
   [channels.md](contracts/channels.md) e o planejamento de 23–28/09 já existem e continuam válidos.

Esta é a sequência única de retomada. Implementação administrativa e validação local autorizadas; 2C
mantém seus gates de identidade/UI/schema; prioridades de 15/18/21 abaixo são contexto histórico,
não filas concorrentes. [Reconciliação e evidências](evidence/reconciliation-2026-09-28.md).

Data: 15/09/2026. Ordem confirmada: básico funcional → nível do legado → novidades. Primeira entrega
confirmada pelo usuário: painel; conexão real app/site depois.

**Prioridade histórica confirmada em 15/09/2026:** imediatamente após a etapa 1 validada, o próximo
passo será a primeira versão da interface do usuário no app/site. Ela terá especificação própria; a
parte de reservas corresponde ao incremento 2C desta spec e será detalhada primeiro. A numeração
2A–2E identifica os incrementos, sem exigir concluir 2A/2B ou toda a equivalência com o legado antes
da interface.

## Etapa 1 — básico funcional no painel

**Entrega:** lista por dia, filtros, detalhes, criar, remarcar e cancelar reservas. Inclui cadastros
mínimos de unidades com vários serviços, procedimentos com duração, profissionais habilitados,
funcionamento semanal e almoço. Seleção de associado/ dependente existente, conflitos impedidos,
histórico e auditoria.

**Telas candidatas:** Agenda (entrada), Oferta (unidades/serviços/procedimentos/ profissionais) e
Horários. Lista diária primeiro; calendário em grade poderá entrar no amadurecimento da operação.
Sem abas de funções ainda indisponíveis.

**Limite:** situações Agendado/Cancelado; não declarar comparecimento ou conclusão automática. Sem
autosserviço, avaliações, lembretes, agenda extra ou bloqueios operacionais por período nesta
entrega. Mudanças cadastrais/horários com impacto em reservas futuras são recusadas até resolução
manual.

**Saída:** configurar no painel → reservar → reencontrar após recarga → remarcar → cancelar, sem
banco manual; disputar uma vaga sem duplicá-la. Ver quickstart.md.

## Etapa 2 — ampliar até cobrir o legado

Não iniciar tudo junto. Cada incremento exige atualização dos contratos, regras e critérios nesta
spec, mantendo o básico funcionando.

| Incremento                   | Conteúdo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Critério de saída                                                                                                                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2A Horários completos        | Indisponibilidades, agenda extra, antecedência mínima e limite de dias futuros.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Vagas respeitam todas as regras; alterar regra não perde reservas existentes.                                                                                                           |
| 2B Operação e estados        | Aguardando/confirmado, conclusão, falta, histórico e operações legadas aceitas; grade diária se validada.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Cada transição é explícita e auditada; falta não cria punição presumida.                                                                                                                |
| 2C App/site                  | Cadastro com Salvar (sem publicar) e Publicar (salvar e disponibilizar numa ação). Edição publicada com Salvar alterações (rascunho) e Publicar alterações (salvar e atualizar versão pública numa ação). Cada botão tem descrição curta abaixo explicando seu efeito. Publicação única para app e site, sem escolha de canal; mesmo catálogo publicado visível antes do login; vagas e reservas após autenticação. Reserva começa pelo beneficiário e filtra serviços, incluindo exclusivos de titular. Confirmação imediata por padrão, desativável por serviço para aprovação pela equipe vinculada, com colaboradores autorizados como backup; alerta de análise após 24 horas corridas, configurável/desativável sem expiração; urgência quando faltarem 24 horas para o atendimento, configurável por serviço e independente do atraso; escolha de profissional desativável pelo estabelecimento. Sem profissionais cadastrados, horários e capacidade por serviço. Novas reservas sem antecedência mínima por padrão; horizonte móvel de 90 dias por padrão, ambos configuráveis por serviço, com horizonte desativável; histórico e ações autorizadas. Indisponibilidade do estabelecimento mantém o mesmo agendamento aguardando nova data, com aviso e opção de remarcar/cancelar, sem descontar trocas ou aplicar o prazo da origem; período inviável permanece bloqueado. | Painel e canais usam a mesma disponibilidade e respeitam capacidade e conflitos por beneficiário; situação pendente ou confirmada é explícita e reservas alheias permanecem protegidas. |
| 2D Avaliações                | Leitura/gestão das avaliações do atendimento conforme funções comprovadas e regras acordadas.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Relação com reserva preservada; nenhuma alteração da opinião pelo administrador por pressuposto.                                                                                        |
| 2E Comunicações e fechamento | Avisos de confirmação, recusa, cancelamento e necessidade de remarcar por app/site, e-mail e WhatsApp, todos ativos por padrão com preferências pessoais selecionáveis no app. Dependente e titular vigente recebem independentemente de autoria. WAHA escolhido/a instalar e e-mail do sistema definido; integração/entrega ainda a validar. Lembretes/notificações legados necessários, limites de uso aceitos, preservação/migração de dados e revisão da cobertura.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Entrega rastreável, sem duplicação de mensagens; matriz de equivalência e migração verificadas.                                                                                         |

O mínimo de estados e comandos necessário à aprovação por serviço integra o corte 2C caso ainda não
tenha sido entregue em 2B. A solicitação pendente ocupa a vaga até a equipe aprovar ou recusar, sem
expiração automática; sua fila de análise deve ser visível no painel. Na remarcação, o envio
bem-sucedido libera a vaga original e ocupa somente a nova, confirmada ou pendente conforme serviço.
Recusa/desistência não restaura a antiga; preservar histórico e informar essa consequência antes do
envio. Retomada após recusa/desistência continua no mesmo agendamento, mesmo após horário original,
preservando histórico e contagem. Primeiro pedido reserva uma das duas trocas; alternativas
pendentes/recusadas continuam a mesma troca e confirmação consolida essa utilização uma vez. Só uma
nova mudança após confirmação inicia outra troca. A antecedência de novas reservas necessária a 2C
também integra esse corte: sem mínimo por padrão, configurável por serviço, independente do prazo de
remarcação. Horizonte futuro definido em 24/09: janela móvel de 90 dias por padrão,
editável/desativável por serviço. Sua configuração em 2C preserva reservas anteriores.

A proposta de executar 2A–2E automaticamente em ordem foi substituída. App/site segue as pendências
administrativas na sequência vigente acima. Demais incrementos serão priorizados depois;
dependências estritamente necessárias à jornada escolhida devem ser explicitadas no seu plano. O
corte de produção dos canais só acontece depois do plano de transição do legado. Em 24/09 o usuário
confirmou acessos individuais existentes para titulares e dependentes; integração/mapeamento ainda a
verificar. A existência de reservas futuras em uso ficou por conferir (C): não presumir agenda
vazia, registrar inventário e preservar histórico. Importar dados não é pré-requisito do primeiro
painel; passa a requisito se necessário para continuidade real. Validar contas, reservas e
avaliações a preservar.

Referência: [inventário de horários](../002-integrated-modules/horarios-legado-2026-09-15.md). API
antiga e tela publicada podem divergir. Equivalência não significa copiar atalhos, falhas de
concorrência, punição automática, motivos obrigatórios ou regras financeiras. Gaps precisam ser
classificados: comprovado / ainda não verificado / deliberadamente substituído.

## Etapa 3 — sugestões novas, sem autorização de implementação

Controle de salas, macas e equipamentos, preparação/limpeza separada, distribuição avançada de
carga, fila, turmas coletivas e recorrências não comprovadas, calendário automático de feriados e
novas ações de avaliações. A atribuição simples de profissional e capacidade por serviço sem equipe
cadastrada já integram o planejamento de 2C, conforme decisões de 24/09/2026. Os demais itens exigem
seleção, benefício claro, pesquisa e critérios antes de virar tarefa. Restaurantes continuam apenas
possibilidade futura. Cal.com somente se nenhuma outra possibilidade existir; nenhuma integração
planejada.

## Decisões a revisar sem impedir este planejamento

Hipóteses do primeiro recorte: somente reservas individuais futuras de associados/ dependentes
existentes; Agendado/Cancelado; lista diária; restrição conservadora de alterações com reservas
afetadas. A prioridade atual está no início deste roadmap; os contratos e políticas já definidos
para 2C permanecem. Apenas expansões fora desse recorte seguem a definir. Nenhuma duração,
antecedência ou penalidade padrão foi inventada.
