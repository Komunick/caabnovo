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
| 2C App/site | Catálogo e disponibilidade públicos nos canais autorizados, reservas do beneficiário, remarcação/cancelamento e histórico próprios. | Painel e canais disputam a mesma vaga; usuário não acessa reserva alheia. |
| 2D Avaliações | Leitura/gestão das avaliações do atendimento conforme funções comprovadas e regras acordadas. | Relação com reserva preservada; nenhuma alteração da opinião pelo administrador por pressuposto. |
| 2E Comunicações e fechamento | Lembretes/notificações legados necessários, limites de uso aceitos, preservação/migração de dados e revisão da cobertura. | Entrega rastreável, sem duplicação de mensagens; matriz de equivalência e migração verificadas. |

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
distribuição automática, fila, turmas/vagas coletivas e recorrências não comprovadas,
calendário automático de feriados e novas ações de avaliações.
Cada item exige seleção, benefício claro, pesquisa e critérios antes de virar tarefa.
Restaurantes continuam apenas possibilidade futura. Cal.com somente se nenhuma outra
possibilidade existir; nenhuma integração planejada.

## Decisões a revisar sem impedir este planejamento

Hipóteses do primeiro recorte: somente reservas individuais futuras de associados/
dependentes existentes; Agendado/Cancelado; lista diária; restrição conservadora de
alterações com reservas afetadas. A prioridade de app/site após a etapa 1 está
confirmada; a ordem dos demais incrementos e seus valores/políticas continuam a definir.
Nenhuma duração, antecedência ou penalidade padrão foi inventada.
