# Roadmap de Agendamentos

**Prioridade vigente — 18/09/2026:** usuário escolheu evoluir o painel com FullCalendar
antes de app/site. Executar apenas CAL01–CAL06 do tasks.md; a prioridade de 15/09 abaixo
é histórica. Os demais incrementos seguem pendentes de detalhamento específico.

Data: 15/09/2026. Ordem confirmada: básico funcional → nível do legado → novidades.
Primeira entrega confirmada pelo usuário: painel; conexão real app/site depois.

**Prioridade posterior confirmada em 15/09/2026:** imediatamente após a etapa 1
validada, o próximo passo será a primeira versão da interface do usuário no app/site.
Ela terá especificação própria; a parte de reservas corresponde ao incremento 2C
desta spec e será detalhada primeiro. A numeração 2A–2E identifica os incrementos,
sem exigir concluir 2A/2B ou toda a equivalência com o legado antes da interface.

## Etapa 1 — básico funcional no painel

**Entrega:** lista por dia, filtros, detalhes, criar, remarcar e cancelar reservas.
Inclui cadastros mínimos de unidades com vários serviços, procedimentos com duração,
profissionais habilitados, funcionamento semanal e almoço. Seleção de associado/
dependente existente, conflitos impedidos, histórico e auditoria.

**Telas candidatas:** Agenda (entrada), Oferta (unidades/serviços/procedimentos/
profissionais) e Horários. Lista diária primeiro; calendário em grade poderá entrar
no amadurecimento da operação. Sem abas de funções ainda indisponíveis.

**Limite:** situações Agendado/Cancelado; não declarar comparecimento ou conclusão
automática. Sem autosserviço, avaliações, lembretes, agenda extra ou bloqueios
operacionais por período nesta entrega. Mudanças cadastrais/horários com impacto
em reservas futuras são recusadas até resolução manual.

**Saída:** configurar no painel → reservar → reencontrar após recarga → remarcar →
cancelar, sem banco manual; disputar uma vaga sem duplicá-la. Ver quickstart.md.

## Etapa 2 — ampliar até cobrir o legado

Não iniciar tudo junto. Cada incremento exige atualização dos contratos, regras e
critérios nesta spec, mantendo o básico funcionando.

| Incremento | Conteúdo | Critério de saída |
| --- | --- | --- |
| 2A Horários completos | Indisponibilidades, agenda extra, antecedência mínima e limite de dias futuros. | Vagas respeitam todas as regras; alterar regra não perde reservas existentes. |
| 2B Operação e estados | Aguardando/confirmado, conclusão, falta, histórico e operações legadas aceitas; grade diária se validada. | Cada transição é explícita e auditada; falta não cria punição presumida. |
| 2C App/site | Cadastro com Salvar (sem publicar) e Publicar (salvar e disponibilizar numa ação). Edição publicada com Salvar alterações (rascunho) e Publicar alterações (salvar e atualizar versão pública numa ação). Cada botão tem descrição curta abaixo explicando seu efeito. Publicação única para app e site, sem escolha de canal; mesmo catálogo publicado visível antes do login; vagas e reservas após autenticação. Confirmação imediata por padrão, desativável por serviço para aprovação; escolha de profissional desativável pelo estabelecimento. Sem profissionais cadastrados, horários e capacidade por serviço. Novas reservas sem antecedência mínima por padrão; horizonte móvel de 90 dias por padrão, ambos configuráveis por serviço, com horizonte desativável; histórico e ações autorizadas. Indisponibilidade do estabelecimento mantém o mesmo agendamento aguardando nova data, com aviso e opção de remarcar/cancelar, sem descontar trocas ou aplicar o prazo da origem; período inviável permanece bloqueado. | Painel e canais usam a mesma disponibilidade e respeitam capacidade e conflitos por beneficiário; situação pendente ou confirmada é explícita e reservas alheias permanecem protegidas. |
| 2D Avaliações | Leitura/gestão das avaliações do atendimento conforme funções comprovadas e regras acordadas. | Relação com reserva preservada; nenhuma alteração da opinião pelo administrador por pressuposto. |
| 2E Comunicações e fechamento | Lembretes/notificações legados necessários, limites de uso aceitos, preservação/migração de dados e revisão da cobertura. | Entrega rastreável, sem duplicação de mensagens; matriz de equivalência e migração verificadas. |

O mínimo de estados e comandos necessário à aprovação por serviço integra o corte 2C caso ainda não
tenha sido entregue em 2B. A solicitação pendente ocupa a vaga até a equipe aprovar ou recusar,
sem expiração automática; sua fila de análise deve ser visível no painel. Na remarcação, o envio
bem-sucedido libera a vaga original e ocupa somente a nova, confirmada ou pendente conforme serviço.
Recusa/desistência não restaura a antiga; preservar histórico e informar essa consequência antes
do envio. Retomada após recusa/desistência continua no mesmo agendamento, mesmo após horário
original, preservando histórico e contagem. Primeiro pedido reserva uma das duas trocas;
alternativas pendentes/recusadas continuam a mesma troca e confirmação consolida essa utilização
uma vez. Só uma nova mudança após confirmação inicia outra troca. A antecedência de novas
reservas necessária a 2C também integra esse corte: sem mínimo por padrão, configurável por serviço,
independente do prazo de remarcação. Horizonte futuro definido em 24/09: janela móvel de 90 dias
por padrão, editável/desativável por serviço. Sua configuração em 2C preserva reservas anteriores.

A proposta anterior de executar 2A–2E em ordem foi substituída: app/site é o próximo
passo após a etapa 1. Os demais incrementos serão priorizados depois; dependências
estritamente necessárias à jornada escolhida devem ser explicitadas no seu plano.
O corte de produção dos canais só acontece depois do plano de transição do legado.
Importar dados não é pré-requisito do primeiro painel; passa a requisito se necessário
para continuidade real. Validar contas, reservas e avaliações a preservar.

Referência: [inventário de horários](../002-integrated-modules/horarios-legado-2026-09-15.md).
API antiga e tela publicada podem divergir. Equivalência não significa copiar atalhos,
falhas de concorrência, punição automática, motivos obrigatórios ou regras financeiras.
Gaps precisam ser classificados: comprovado / ainda não verificado / deliberadamente substituído.

## Etapa 3 — sugestões novas, sem autorização de implementação

Controle de salas, macas e equipamentos, preparação/limpeza separada,
distribuição avançada de carga, fila, turmas coletivas e recorrências não comprovadas,
calendário automático de feriados e novas ações de avaliações.
A atribuição simples de profissional e capacidade por serviço sem equipe cadastrada já integram
o planejamento de 2C, conforme decisões de 24/09/2026. Os demais itens exigem seleção,
benefício claro, pesquisa e critérios antes de virar tarefa.
Restaurantes continuam apenas possibilidade futura. Cal.com somente se nenhuma outra
possibilidade existir; nenhuma integração planejada.

## Decisões a revisar sem impedir este planejamento

Hipóteses do primeiro recorte: somente reservas individuais futuras de associados/
dependentes existentes; Agendado/Cancelado; lista diária; restrição conservadora de
alterações com reservas afetadas. A prioridade de app/site após a etapa 1 está
confirmada; a ordem dos demais incrementos e seus valores/políticas continuam a definir.
Nenhuma duração, antecedência ou penalidade padrão foi inventada.
