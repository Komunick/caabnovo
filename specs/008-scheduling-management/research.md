# Pesquisa e decisões — entrega incremental

## Revisão técnica antes do código — 15/09/2026

Reconsultadas fontes oficiais: [PostgreSQL intervalos](https://www.postgresql.org/docs/current/rangetypes.html),
[locks](https://www.postgresql.org/docs/current/explicit-locking.html) e
[Fresha criação manual](https://www.fresha.com/help-center/knowledge-base/calendar/260-create-appointments-1).
Mantido domínio próprio com intervalos semiabertos e exclusão GiST. Reutilizar lock
de vínculos elimina a leitura obsoleta de titulares em confirmações simultâneas.
Transação armazena resultado da idempotência para replay fiel, inclusive após edição.
Limites de concorrência e simplificação de expediente estão descritos no plano;
sem regras comerciais adicionais, integração com fornecedores ou cópia de código legado.

Consulta: 15/09/2026. Fontes oficiais públicas, sem conta, integração ou teste de
fornecedor. Inspeção da stack local e pesquisa delegada pela skill speckit-plan.
Data de consulta não significa lançamento recente. Não há prova de superioridade
universal de um formato de agenda; as escolhas abaixo são inferências para a CAAB.

## Decisão 1 — começar pelo painel

**Decisão:** catálogo/horários e criar, consultar, remarcar e cancelar no painel;
conexão real ao app/site na segunda etapa. **Fonte:** resposta explícita do usuário.
**Racional:** permite validar a operação completa antes da integração externa.
**Alternativa:** autosserviço desde a primeira entrega foi oferecido e não escolhido.
Não existe autorização de implementar código nesta conversa de planejamento.

## Decisão 2 — lista diária como primeira apresentação

**Observações:** Trinks usa grade por profissional, filtros e criação manual;
Cal.com descreve lista de reservas com ações de cancelar/remarcar. Fresha permite
criar por horário conhecido ou buscar vagas e gerenciar pelo formulário.
**Decisão proposta:** lista diária, filtros e detalhes com formulário de ações.
**Racional:** cumpre a jornada escolhida sem exigir arrastar cartões ou uma grade complexa.
**Alternativas:** calendário diário/semanal completo pode ser acrescentado depois;
FullCalendar documenta visualização em lista, mas não é necessário adicionar uma
dependência para a primeira lista. Isso adia sua seleção anterior em docs/STACK.md.

Fontes: [Trinks — agenda](https://ajuda.trinks.com/menu-agenda),
[Cal.com — gestão de reservas](https://cal.com/scheduling/frequently-asked-questions),
[Fresha — criar agendamentos](https://www.fresha.com/help-center/knowledge-base/calendar/260-create-appointments-1),
[Fresha — gerenciar](https://www.fresha.com/help-center/academy/run-your-business/schedule-appointments/lessons/100253),
[FullCalendar — lista](https://fullcalendar.io/docs/list-view).

## Decisão 3 — horários e catálogo já no básico

**Observações:** SimplyBook.me separa funcionamento do estabelecimento e jornada
profissional; Cal.com separa configuração inicial do atendimento/duração e disponibilidade.
**Decisão proposta:** cadastro mínimo utilizável pela UI, funcionamento semanal,
expediente e almoço na primeira entrega. Agenda extra e indisponibilidades por
período entram em 2A, juntamente com antecedência e janela futura.
**Racional:** uma lista sem capacidade de configurar e reservar não seria funcional.
**Alternativas:** exigir cadastro por banco/seed ou entregar só uma tela vazia foi descartado.

Fontes: [SimplyBook.me — horários](https://help.simplybook.me/index.php?title=Opening_hours_of_the_company_vs_Working_hours_of_provider),
[Cal.com — criar atendimento](https://cal.com/help/event-types/create-first-event),
[Cal.com — disponibilidade](https://cal.com/help/availabilities/edit-availability).
O [inventário local](../002-integrated-modules/horarios-legado-2026-09-15.md) comprova
conceitos no código anterior, não a revisão publicada. Novidades não comprovadas
continuam sugestões. Não copiar políticas/multas do fornecedor.

## Decisão 4 — integridade não é uma função opcional da etapa 3

**Observação técnica:** PostgreSQL documenta intervalos temporais e constraints
de exclusão para impedir sobreposição. **Decisão:** domínio próprio, transações,
restrição por profissional/intervalo, idempotência e versionamento de edição.
**Racional:** prevenção só na UI não cobre disputa entre operadores.
**Alternativas:** fonte de verdade em calendário externo ou checagem seguida de insert
sem proteção foram rejeitadas. Mecanismos são detalhados no plan e data-model.
Fonte: [PostgreSQL — intervalos e exclusão](https://www.postgresql.org/docs/current/rangetypes.html).

Alguns fluxos manuais de fornecedores admitem sobreposição; isso não é regra da CAAB.
Referências: [Cal.com — remarcação](https://cal.com/help/bookings/host-reschedule-busy-slots),
[Fresha — reservas manuais](https://www.fresha.com/help-center/knowledge-base/calendar/260-create-appointments-1).

## Decisão 5 — acesso e identidade

**Fonte:** decisão do usuário de 15/09 e contrato de Associados de 10/09.
**Decisão:** qualquer acesso válido ao painel autoriza Agendamentos; a busca de
beneficiários tem projeção mínima própria. Não modificar permissões dos outros módulos.
Bloqueio próprio e de titular vigente revalidado no servidor; sem punição automática.
**Alternativas:** concessão scheduling extra, exigir members:read ou confiar em
objetos enviados pelo navegador contradizem o escopo ou a integridade.
**Limite:** contrato existente findMemberSummary não resolve titulares; ampliar com
coordenação transacional e testes para inserção/encerramento de vínculos e bloqueios.

## Decisão 6 — equivalência com legado e sugestões

**Decisão:** uma spec responsável pela função, evoluída em cortes. Roadmap separa
capacidades comprovadas, regras pendentes e sugestões. Não copiar código antigo.
**Racional:** evitar grande reescrita de uma vez e expansão silenciosa do escopo.
**Alternativa:** implementar todas as opções de mercado agora foi rejeitada pelo usuário.

Avaliações/lembretes estão na etapa 2. Salas, preparação separada, filas, grupos,
recorrência não comprovada e distribuição automática permanecem sugestões da etapa 3.
Cal.com só poderia ser integrado se nenhuma outra possibilidade existir; pesquisa
não demonstra esse esgotamento. Nenhum SDK, serviço ou integração está planejado.

## Limite da conclusão

Pesquisa sustenta o desenho proposto, não comprova desempenho nem entrega. A estrutura
é tecnicamente planejada usando a base atual; código, migrations, testes e homologação
ainda não existem. Políticas detalhadas da etapa 2 serão fechadas antes de cada incremento.
