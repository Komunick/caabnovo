# Pesquisa: gestão de Agendamentos pela CAAB

Data da consulta: 15/09/2026. Estado: pesquisa e brainstorming, sem implementação.
Complementa a [pesquisa de 14/09](pesquisa-mercado-agendamentos-2026-09-14.md).

**Correção posterior do usuário:** funções ausentes do site antigo devem permanecer
como sugestões, incluindo controle de salas. Propostas neste relatório não são
requisitos aprovados. O gerenciamento de horários existente foi detalhado no
[inventário do legado](horarios-legado-2026-09-15.md), distinguindo telas, API e limites
da inspeção. Funções ainda não comprovadas no legado não devem ser apresentadas como existentes.

## 1. Decisões fornecidas pelo usuário

- A CAAB gerencia no painel administrativo o serviço de reservas oferecido no app/site.
- Qualquer pessoa com acesso válido ao painel pode consultar e alterar Agendamentos;
  não exigir permissão adicional do módulo nem limitar a edição ao profissional/gestor.
  Autenticação e auditoria permanecem; esta decisão não muda outros módulos.
- Cadastrar unidade, um ou mais serviços dessa unidade, profissionais e procedimentos.
- Configurar quando a unidade estará aberta e as demais funções da agenda a detalhar.
- Consultar e gerenciar avaliações no próprio módulo.
- Cal.com é referência. Não integrar ao projeto salvo se nenhuma outra possibilidade
  for encontrada; não basta a integração parecer conveniente.

Estas definições substituem a hipótese anterior de um produto administrado
independentemente por negócios/profissionais. O exemplo do usuário é um local que
oferece massagens. O recorte multissetorial anterior continua, com restaurantes
somente como possibilidade futura e CAASSH desativado.

## 2. Método e limites

Consulta a documentação pública oficial de Cal.com, Trinks, SimplyBook.me e Fresha.
Não houve contratação, instalação, integração, conta de demonstração, operação de
reservas ou envio de mensagens. A data acima é de consulta, não de lançamento das
funções. A documentação comprova capacidades descritas pelo fornecedor, não sua
disponibilidade em todos os planos, qualidade operacional ou adequação integral à CAAB.

Separação usada neste relatório: **decisão** vem do usuário; **observação** vem da
fonte; **proposta** é inferência para discussão. Regras dos fornecedores sobre papéis,
financeiro, preços, comunicações ou elegibilidade não são políticas da CAAB.

## 3. Catálogo, unidades e profissionais

### Trinks

Observação: o catálogo organiza serviços em categorias e vincula os profissionais
habilitados a realizá-los. O cadastro profissional também define sua participação
na agenda e jornada. Serviços inativos deixam de ser oferecidos para reserva e
continuam nos relatórios históricos.

Fontes: [serviços](https://ajuda.trinks.com/meu-estabelecimento/servicos/todos-os-servicos),
[profissionais](https://ajuda.trinks.com/meu-estabelecimento/profissionais/todos-os-profissionais).

Proposta: manter explícito quais procedimentos cada profissional realiza em cada
unidade. A terminologia do fornecedor não deve substituir automaticamente a da CAAB.
No nosso brainstorming, avaliar serviço como agrupamento e procedimento como opção
reservável, com duração própria. Esse significado ainda precisa de confirmação.

### SimplyBook.me

Observação: locais são ligados aos prestadores; os serviços são associados aos
prestadores. A relação entre local e serviço é obtida por esses vínculos.
Fonte: [categorias e locais](https://help.simplybook.me/index.php?title=Categories_and_Locations%2Fen).

Proposta: tornar a relação unidade → serviços diretamente compreensível na tela,
pois o usuário confirmou vários serviços em uma unidade. Não copiar a relação
indireta do fornecedor como regra obrigatória do nosso banco.

### Fresha

Observação: há gestão de várias unidades. A documentação orienta resolver reservas
futuras e outras pendências antes de excluir um local; exclusão permanente não é
indicada para fechamento temporário.
Fonte: [gestão de unidades](https://www.fresha.com/help-center/knowledge-base/workspace-settings/100677-manage-business-locations-1).

Proposta: separar fechamento temporário, indisponibilidade, retirada da oferta e
arquivamento. Mostrar os agendamentos afetados antes de alterar uma configuração
com impacto na operação. A pesquisa não aprova cancelamentos automáticos.

## 4. Funcionamento e disponibilidade

Observação: SimplyBook.me separa horário geral do estabelecimento, jornada do
prestador e horário do serviço, com exceções por data. Os horários específicos
devem caber no funcionamento geral, inclusive nos dias especiais.
Fonte: [horários gerais e específicos](https://help.simplybook.me/index.php?title=Opening_hours_of_the_company_vs_Working_hours_of_provider).

Observação: Trinks documenta feriados, dias de abertura excepcional e horários
especiais; a jornada do profissional também controla sua disponibilidade.
Fonte: [configurações](https://ajuda.trinks.com/configuracoes).

Observação: Cal.com permite substituir a disponibilidade em datas específicas,
por algumas horas ou pelo dia inteiro; mantém configurações distintas para tempo
de preparação/intervalo e antecedência mínima de reserva.
Fontes: [exceções por data](https://cal.com/help/availabilities/date-overrides),
[intervalos antes/depois](https://cal.com/help/event-types/event-buffer),
[antecedência mínima](https://cal.com/help/event-types/min-notice).

Proposta para a CAAB: um horário só é oferecido quando cabem o procedimento e os
intervalos aplicáveis dentro do funcionamento da unidade, da jornada profissional
e das restrições da oferta/recursos, sem conflito com reservas ou bloqueios.
Registrar regras recorrentes e exceções por data separadamente.

Exemplo sintético, sem valores padrão aprovados:

- Unidade aberta das 08h às 18h.
- Profissional atende das 09h às 17h e almoça das 12h às 13h.
- Procedimento dura 50 minutos e requer 10 minutos posteriores de preparação.
- O horário das 11h20 não comporta o procedimento antes do almoço.
- Ter a unidade aberta às 08h não torna esse profissional disponível nesse horário.

A proposta precisa definir se o intervalo ocupa a pessoa, a sala ou ambos, e como
tratar mudança de jornada quando já existem reservas. Capacidade, duração, antecedência,
feriados aplicáveis e janela de abertura futura ainda não têm valores aprovados.

## 5. O que aproveitar como referência do Cal.com

| Observação documentada | Aplicação candidata à CAAB |
| --- | --- |
| Tipos de evento têm nome, duração, local e disponibilidade próprios. | Procedimentos podem ter configuração própria de reserva. |
| Eventos gerenciados permitem administração central e propagação de campos controlados. | CAAB configura a oferta centralmente; não copiar exigência de papel especial do fornecedor. |
| Round robin escolhe entre profissionais disponíveis, com critérios de distribuição. | Avaliar opção de reservar com qualquer profissional habilitado, se houver demanda. |
| Eventos coletivos exigem a presença de vários membros da equipe. | Distinguir atendimento com vários profissionais de aula com vários participantes. |

Fontes: [tipos de evento](https://cal.com/help/event-types/event-types),
[eventos gerenciados](https://cal.com/help/event-types/managed-events),
[distribuição entre profissionais](https://cal.com/help/event-types/round-robin),
[vários profissionais juntos](https://cal.com/help/event-types/collective-events).

Limites: tipos de evento e local de reunião não comprovam o catálogo institucional
unidade/serviço/procedimento ou a gestão de avaliações de que a CAAB precisa.
O artigo de eventos gerenciados informa limitações específicas de Apps/Webhooks na
versão descrita; não assumir equivalência entre todas as versões e integrações.
O índice oficial menciona vagas, mas a página Offer seats retornou apenas navegação
na leitura realizada; não usar essa leitura como comprovação detalhada de turmas.

Conclusão: Cal.com é útil para estudar disponibilidade, configuração e distribuição.
Trinks e Fresha oferecem referências mais diretamente relacionadas à operação de
serviços presenciais e avaliações. Isso é uma inferência de adequação do recorte,
não um ranking de produtos ou uma decisão de contratação.

## 6. Sugestão: salas, equipamentos e capacidade

Observação: Fresha documenta recursos físicos associados a serviços, disponibilidade
própria e capacidade; também descreve reservas somente de recursos, sem profissional.
Fonte: [salas, equipamentos e instalações](https://www.fresha.com/help-center/academy/run-your-business/manage-rooms-equipment-and-facilities/lessons/100616).

Proposta: investigar se massagens dependem de uma cabine/maca compartilhada. Um
profissional livre pode não ser suficiente para confirmar a reserva. Se necessário,
representar pessoa e recurso separadamente. Não exigir cadastro de recurso para
toda oferta, nem incluir locação de espaços automaticamente no escopo.

Turmas de zumba/futevôlei e recorrência permanecem em discussão, conforme pesquisa
anterior. Não tratar capacidade física, número de profissionais e vagas de uma
aula como a mesma informação.

## 7. Operação diária e canais

Observação: Trinks reúne agendamentos online e de balcão na agenda; permite criar,
alterar e acompanhar reservas, com filtros por profissional, serviço e situação.
Fonte: [operação da agenda](https://ajuda.trinks.com/menu-agenda).

Proposta: painel, app e site devem consumir a mesma disponibilidade. Organizar
consulta diária por unidade, data, serviço, procedimento, profissional e situação.
Confirmar quais operações manuais a equipe fará, quais estados serão usados e como
os canais serão atualizados após cada alteração. A definição atual de finalidade
app/site não equivale a implementação desses canais nesta etapa.

## 8. Avaliações

Observação: Trinks apresenta média, quantidade e respostas individuais, com filtros
por período, cliente, serviço e profissional. Distingue pesquisa de satisfação
de avaliações feitas no app e permite configurar a coleta por serviço.
Fonte: [pesquisa de satisfação](https://ajuda.trinks.com/como-funciona-a-pesquisa-de-satisfacao-na-trinks).

Observação: Fresha vincula a avaliação a atendimento concluído e permite respostas,
com opções de visibilidade e edição da própria resposta. A documentação distingue
o comentário do cliente da resposta de quem administra.
Fonte: [respostas às avaliações](https://www.fresha.com/help-center/knowledge-base/personal-account/35-respond-to-your-personal-reviews).

Proposta de área Avaliações:

- Resumo com média, quantidade e período claramente identificados.
- Lista com nota, comentário, data e contexto do agendamento/unidade/serviço/profissional.
- Filtros e abertura do agendamento relacionado.
- Ações de resposta e moderação a definir com o usuário.

Pendente: se a nota se refere à unidade, ao procedimento, ao profissional ou ao
atendimento completo; escala de notas; quem pode avaliar e quando; publicação no
app/site; respostas; ocultação/exclusão e histórico. A gestão foi confirmada, essas
ações específicas ainda não. Não assumir exclusão de críticas nem alteração da
nota/texto do autor. Não exigir motivo obrigatório, conforme decisão geral já vigente.

## 9. Organização candidata do painel

Proposta para discussão, não tela aprovada:

1. **Agenda**: reservas e operação diária, filtros e detalhes.
2. **Unidades**: identificação, serviços oferecidos e horários de funcionamento.
3. **Serviços e procedimentos**: catálogo, descrição e condições da reserva.
4. **Profissionais**: vínculos, procedimentos habilitados e jornada.
5. **Horários**: funcionamento, expediente, almoço, indisponibilidades e agenda extra,
   com antecedência e janela de reservas. A posição no menu é proposta; as funções
   identificadas no legado estão no inventário específico.
6. **Avaliações**: acompanhamento e gestão das opiniões recebidas.

Horários, feriados e indisponibilidades podem ficar no contexto de cada unidade e
profissional; validar se também é necessária uma visão geral. Antes de disponibilizar
uma oferta, uma prévia dos horários e da apresentação no app/site ajudaria a verificar
a configuração. Não definir automaticamente publicação imediata ou segunda aprovação.

Exemplo de nomenclatura para validação:

- Unidade: Espaço de Bem-estar.
- Serviços: Massagens e Fisioterapia.
- Procedimentos de Massagens: Massagem relaxante e Massagem desportiva.
- Profissionais: pessoas habilitadas a executar cada procedimento naquela unidade.

O usuário confirmou unidade com vários serviços; os nomes e a hierarquia detalhada
acima são ilustrações. Confirmar compartilhamento de serviços/procedimentos entre
unidades e profissionais trabalhando em mais de uma unidade, sem duplicar pessoas.

## 10. Direção técnica e condição sobre Cal.com

Avaliar primeiro implementação própria do domínio CAAB com a fundação existente.
Biblioteca de calendário pode ajudar a desenhar a agenda; a disponibilidade e a
confirmação precisam de regras no servidor e proteção contra reservas concorrentes.
Esta é uma direção de avaliação, não prova de viabilidade final ou escolha de biblioteca.

Nenhuma evidência encontrada demonstra que as alternativas ao Cal.com se esgotaram.
Logo, a condição excepcional determinada pelo usuário não está satisfeita e nenhuma
integração é proposta. Se houver impedimento concreto futuro, registrar requisito,
alternativas examinadas, testes e motivo de inviabilidade antes de considerar a exceção.

## 11. Próximas decisões do brainstorming

1. Confirmar significado de serviço/procedimento e compartilhamento entre unidades.
2. Detalhar o fluxo de configuração de uma unidade de massagem e sua apresentação no app/site.
3. Definir jornada, intervalos, exceções, capacidade e impacto sobre reservas existentes.
4. Definir ações e publicação das avaliações.
5. Definir público elegível, dependentes, confirmação, cancelamento, faltas e comunicações.
6. Selecionar primeira entrega e preservar cadastros, reservas e avaliações legadas necessários.

Depois consolidar spec própria, plano, tarefas e critérios de aceite. As tarefas
T022–T026 antigas continuam suspensas. Esta entrega altera apenas documentação.
