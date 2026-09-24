# Pesquisa de mercado — Agendamentos (revisão integral de 23/09/2026)

**Estado:** pesquisa documental nova; recomendações para discussão, sem aprovação de escopo, compra, integração ou implementação. **Fontes:** documentação e guias oficiais consultados em 23/09/2026. Produtos podem variar por plano, região e configuração. Não houve demonstração em conta real, teste de usabilidade ou validação de preços. O código e a spec da CAAB serviram apenas para definir o contexto, não como prova das práticas de mercado.


## Complemento — remarcação e prioridade (24/09/2026)

O usuário autorizou remarcação/cancelamento no app/site para reservas futuras confirmadas e
explicitou que a remarcação deve seguir a aceitação configurada no serviço. Definiu prioridade
para remarcações pelo horário atual da reserva mais próximo, antes dos novos pedidos. A data
pretendida não define urgência; a data de envio só desempata. Também definiu antecedência mínima
de 24 horas para solicitar remarcação, editável e desativável. São decisões do produto CAAB.

Fontes oficiais conferidas em 24/09: a
[Jane](https://jane.app/guide/jane-s-mobile-app-for-clients-managing-appointments) oferece remarcação
nas reservas do usuário, sujeita à antecedência da clínica. A documentação do
[SimplyBook.me](https://help.simplybook.me/index.php?mobileaction=toggle_view_mobile&title=Client_Rescheduling_custom_feature)
informa que seu recurso de remarcação pelo cliente é incompatível com o recurso de aprovação de
reservas. Isso evidencia uma limitação daquele produto; não comprova que priorizar remarcações
reduza cancelamentos na CAAB.

**Decisão vigente e implicações:** a prioridade considera o início atual da reserva: quem precisa
adiar uma consulta de amanhã precede quem quer alterar uma consulta do próximo mês, mesmo com
pedido mais recente. Isso substitui a recomendação inicial de usar antiguidade como critério
principal. A spec preserva a reserva atual até aceitar a troca e retém o destino conforme a
política escolhida. A precedência na análise não toma vagas já ocupadas/retidas nem dispensa a
aprovação exigida pelo serviço. Na confirmação imediata, não há fila de análise a priorizar.

**Recomendação ainda pendente:** limitar a uma troca pendente por reserva. Como origem e destino
ficam ocupados durante a análise, acompanhar seu tempo e a idade dos demais pedidos continua
relevante. Validar o incentivo medindo remarcações concluídas, cancelamentos, tempo de análise e
duração das retenções; não prometer redução antes de observar dados da CAAB.

## Pergunta e método

Como desenhar hoje um módulo de agendamentos para a CAAB, que administra oferta no painel e futuramente atende associados e dependentes no app/site? Comparei seis referências por jornada de quem reserva, operação da equipe, disponibilidade, múltiplas unidades, famílias, capacidade e capacidade de integração. “Melhor” aqui significa referência mais útil em cada aspecto documentado, não um ranking absoluto de qualidade, adoção ou custo.

## Referências selecionadas

| Produto | Evidência observada nos guias oficiais | Melhor uso como referência para a CAAB | Limite |
| --- | --- | --- | --- |
| [Fresha](https://www.fresha.com/help-center/knowledge-base/calendar/260-create-appointments-1) | A equipe cria pela grade ou encontra a próxima vaga; cliente, serviço, profissional e horário são revistos antes de salvar. Há [atribuição de profissional disponível](https://www.fresha.com/help-center/knowledge-base/calendar/102178-set-up-new-appointment-assignment), [bloqueios](https://www.fresha.com/help-center/knowledge-base/calendar/18-set-up-and-manage-blocked-time), [lista de espera](https://www.fresha.com/help-center/knowledge-base/calendar/259-set-up-and-manage-your-waitlist) e [otimização das vagas](https://www.fresha.com/help-center/knowledge-base/calendar/496-optimize-online-schedule-availability). | Rotina do painel, reserva rápida e busca de alternativas quando o horário desejado não existe. | Foco comercial em beleza e bem-estar; pagamentos, prioridade por valor e preenchimento artificial de agenda não são regras da CAAB. |
| [Jane](https://jane.app/guide/booking-an-appointment-online-for-patients) | Paciente encontra atendimento por tipo ou profissional e escolhe horário; [familiares vinculados podem reservar para perfis individuais](https://jane.app/guide/how-do-family-members-book-appointments-online); [recursos limitados entram no cálculo](https://jane.app/guide/resource-booking). | Beneficiário explícito, jornadas de associado/dependente e recurso físico opcional. | Regras clínicas, faturamento e prontuário não devem ser importados por analogia. |
| [Mindbody](https://www.mindbodyonline.com/en-gb/business/scheduling) | Reúne compromissos individuais e aulas, capacidade e lista de espera, com disponibilidade refletida nos canais. Sua [atualização de interface de 2026](https://www.mindbodyonline.com/business/education/blog/mindbody-ui-ux-todays-modern-workflows) destaca ações diretamente na agenda e reserva de familiares. | Separar agendamento individual de turma/vaga coletiva e reduzir passos na operação. | Turmas, penalidades e pagamento dependem de política específica da CAAB; não são parte automática do recorte atual. |
| [Square Appointments](https://squareup.com/help/us/en/article/5351-manage-your-square-appointments-account-settings) | Configura intervalo das vagas, antecedência, janela futura, aprovação automática ou manual, profissional indiferente e comunicação; o [fluxo público](https://squareup.com/help/us/en/article/5355-set-up-online-booking-with-square-appointments) permite escolher unidade, serviço e profissional. | Tornar regras de oferta explícitas por canal e evitar decisões escondidas no código. | Opções comerciais disponíveis no produto não equivalem a decisões institucionais aprovadas. |
| [SimplyBook.me](https://help.simplybook.me/wiki/Custom_Features) | Trata locais, classes, recursos, múltiplas reservas e lista de espera como capacidades separadas. | Evoluir por tipos de oferta, ativando só a complexidade necessária. | Quantidade de recursos não é, por si, boa experiência; configuração extensa aumenta o custo operacional. |
| [Cal.com](https://cal.com/teams) | Referência para agendas de equipe, disponibilidade, roteamento e fluxos. A documentação do [antigo plano Platform/Atoms](https://cal.com/docs/platform/atoms/booker) informa que ele está em manutenção para clientes existentes e fechado a novos clientes. | Ideias de apresentação e integração; avaliar produto/contrato atual somente se surgir necessidade concreta. | Não há evidência de que substituir o núcleo CAAB por Cal.com resolva beneficiários, elegibilidade e governança próprias. A condição anterior de não integrar por conveniência permanece. |

## O que converge entre as referências

1. **Dois modos de uso compartilham a mesma agenda:** a equipe opera o dia, cadastra oferta e resolve exceções; a pessoa encontra um serviço, um horário e acompanha suas reservas no app/site. A documentação de [Mindbody](https://www.mindbodyonline.com/en-gb/business/scheduling) descreve atualização da oferta em diferentes canais; para a CAAB, a mesma regra de disponibilidade deve alimentar todos os canais autorizados.
2. **A jornada começa pela necessidade e oferece caminhos alternativos:** buscar serviço/procedimento ou profissional, filtrar unidade, mostrar dias e horários reais, oferecer próxima data ou outros profissionais quando não houver vaga. [Fresha](https://www.fresha.com/help-center/knowledge-base/calendar/260-create-appointments-1) e [Jane](https://jane.app/guide/booking-an-appointment-online-for-patients) documentam esses caminhos.
3. **Disponibilidade é calculada, não apenas uma grade visual:** duração do procedimento, funcionamento da unidade, jornada, pausas, bloqueios e, quando cabível, recursos/capacidade interferem na oferta. Antecedência e horizonte futuro são políticas configuradas em [Square](https://squareup.com/help/us/en/article/5351-manage-your-square-appointments-account-settings); [Jane](https://jane.app/guide/resource-booking) mostra o efeito de recursos limitados.
4. **A pessoa atendida deve ser inequívoca:** uma conta pode reservar para familiares autorizados, mas cada compromisso pertence ao beneficiário individual. [Jane](https://jane.app/guide/how-do-family-members-book-appointments-online) oferece um exemplo concreto. Na CAAB, a autorização de representar dependente e a elegibilidade precisam vir dos contratos próprios de Associados.
5. **Após a reserva, ainda há operação:** detalhes, remarcação, cancelamento, chegada/falta e histórico. [Jane](https://jane.app/guide/patient-arrivals-no-shows) distingue chegada e falta, enquanto [Fresha](https://www.fresha.com/help-center/knowledge-base/personal-account/35-respond-to-your-personal-reviews) vincula avaliação a atendimento concluído. Decorrer do horário não comprova atendimento.
6. **Lista de espera e automação são incrementos com política:** Fresha permite operação manual ou aviso automático, com opções diferentes de prioridade; [Mindbody](https://www.mindbodyonline.com/business/education/product-waitlist-improvements) diferencia inclusão automática de primeira pessoa a confirmar. A CAAB deve decidir ordem, prazo de resposta, elegibilidade e prevenção de disputa antes de implementar.
7. **Atendimento por IA é tendência de 2026, não pré-requisito:** [Fresha](https://www.fresha.com/blog/fresha-ai-concierge-launch) e [Mindbody](https://www.mindbodyonline.com/business/ai-concierge) anunciam assistentes que consultam dados vivos e acionam reservas/remarcações. Para a CAAB, só faria sentido após identidade, permissões, regras e ações auditáveis estarem consolidadas.

## Direção recomendada para a CAAB — inferência da comparação

### Experiência de quem reserva no app/site

1. Apresentar serviços e procedimentos com duração, unidade e instruções essenciais; permitir descobrir por serviço ou por profissional quando houver preferência.
2. Antes da confirmação, identificar quem será atendido (titular ou dependente autorizado). Mostrar apenas opções que possam ser reservadas por esse perfil; explicar indisponibilidade sem expor dados internos.
3. Mostrar datas com vagas e horários legíveis, com próxima data e alternativas de unidade/profissional quando não houver vaga. A seleção é provisória até a confirmação no servidor.
4. Revisar beneficiário, procedimento, unidade, profissional, data, hora e regras aplicáveis numa confirmação explícita. Em conflito, conservar escolhas e oferecer nova vaga.
5. Em “Minhas reservas”, separar próximas e históricas, mostrar situação textual e permitir remarcação/cancelamento somente conforme política aprovada. Oferecer “agendar novamente” como atalho apenas se a oferta ainda for válida.

### Experiência da equipe no painel

1. Manter Agenda como entrada operacional, com Lista/Dia/Semana/Mês, data e filtros persistentes. Mostrar ações de criar e abrir detalhes sem perder o contexto. A versão atual já possui esse fundamento; rever CAL06.
2. Separar configuração de unidades, serviços/procedimentos, profissionais/habilitações e horários da rotina de reservas. Explicar por que uma combinação não produz vagas.
3. Acrescentar, em incremento próprio, exceções de agenda e tratamento de reservas futuras afetadas. Evitar cancelamento implícito por mudança de configuração.
4. Exibir alertas operacionais, como beneficiário bloqueado após reserva, com decisão humana registrada. Consulta e alteração permanecem permissões distintas.
5. Distinguir situação da reserva, comparecimento e avaliação; só marcar presença/falta por ação autorizada, nunca por relógio.

### Núcleo de disponibilidade e integridade

Uma única regra de servidor deve compor oferta ativa, habilitação, expediente, pausa, exceções, duração, políticas de canal, beneficiário e capacidade/recurso quando aplicáveis. Ela deve alimentar consulta de vagas e validação final para painel e futuros app/site. Registrar a reserva de forma transacional, com idempotência, revalidação de elegibilidade e proteção de conflitos do profissional e do beneficiário. O [PostgreSQL documenta restrições de exclusão sobre intervalos](https://www.postgresql.org/docs/current/rangetypes.html), mecanismo adequado para impedir sobreposição mesmo sob concorrência; a escolha exata deve respeitar o esquema existente e dados prévios. Horários persistidos em UTC são apresentados no fuso da unidade; calendário visual não é garantia de vaga.

Essas são recomendações de desenho, não declaração de que cada parte já existe no código.

## Ordem sugerida de estudo e evolução

| Sequência | Resultado a detalhar | Situação frente à spec vigente |
| --- | --- | --- |
| 1 | Fechar concessões consultar/alterar, conflito por beneficiário, aviso de bloqueio, exportação e revisão CAL06. | Lacunas já registradas em spec/plan/tasks; confirmar estado do Git antes de executar. |
| 2 | Especificar primeira jornada app/site, identidade do titular/dependente, contrato de vagas e mutações, e transição do legado. | Etapa posterior priorizada no roadmap; decisões de produto e contrato ainda necessários. |
| 3 | Detalhar indisponibilidades, agenda extra, antecedência, horizonte futuro, presença/falta e avaliações. | Funcionalidades do legado ou operação a confirmar uma a uma; sem implementação automática. |
| 4 | Avaliar turmas/capacidade, recursos físicos, lista de espera, atribuição automática, múltiplos serviços e assistente conversacional conforme demanda comprovada. | Possibilidades de mercado; não pressupor que existiam no legado nem que estão autorizadas. |

## Decisões que a pesquisa não pode tomar pela CAAB

- Quais serviços aparecem no app/site e se o usuário pode escolher profissional, unidade ou “qualquer disponível”?
- Quem pode reservar e administrar compromissos de cada dependente, e como revogar esse vínculo?
- Qual antecedência de novas reservas, horizonte futuro e prazo de cancelamento valem por serviço e canal? A remarcação já tem antecedência padrão de 24 horas, editável/desativável (decisão de 24/09).
- O que acontece com uma reserva quando profissional/unidade fica indisponível depois da confirmação?
- Há atendimento coletivo com capacidade ou apenas compromissos individuais nesta etapa?
- Como a equipe registra comparecimento/falta e quando uma avaliação pode ser solicitada, respondida ou ocultada?
- Haverá lista de espera? Em caso afirmativo, qual ordem, prazo de aceitação, canal de aviso e critério de elegibilidade?
- Quais comunicações transacionais realmente serão enviadas e por qual integração homologada?

## Verificações necessárias antes de transformar a pesquisa em escopo

Validar protótipo com operadores e usuários reais da CAAB, incluindo titular que agenda para dependente; testar tarefas em celular, teclado e leitor de tela; medir tempo até achar vaga, conflitos na confirmação, abandono, remarcações e trabalho manual da equipe. A [WCAG 2.2](https://www.w3.org/WAI/WCAG22/quickref/) exige foco visível e mensagens de estado acessíveis; o [exemplo de seletor de data da W3C](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/) alerta que componentes de calendário precisam de testes reais com tecnologias assistivas. Produtos consultados são referência, não evidência de conformidade da implementação CAAB.

---

# Pesquisa anterior — 21/09/2026

**Decisão:** Exigir acesso concedido, impedir sobreposição da mesma pessoa, sinalizar reservas
mantidas após bloqueio e exportar a agenda/oferta.

**Fundamento:** Duas reservas concorrentes da mesma pessoa em profissionais/unidades distintos: uma
aceita; titular/dependentes distintos podem coincidir. Bloqueio mantém reserva/vaga e mostra aviso.
Sem read some/nega; só read não altera. Exportação não herda teto visual.

**Alternativas:** rejeitar cópia de cadastro, concessão implícita, exportar pela página visual,
gerar Buffer integral e reintroduzir fila/limites funcionais. Quando a função não implementa
exportação nesta fase, preservar seus controles existentes.

**Evidência local:** `apps/web/modules/scheduling/access.ts`,
`apps/web/modules/scheduling/booking-service.ts`,
`apps/web/modules/scheduling/availability-service.ts`. Desenho concreto em [plan.md](plan.md).
Fontes oficiais, data, limitações e alternativas na
[pesquisa transversal](../002-integrated-modules/research-2026-09-21.md). Essa revisão não homologa
dependências, desempenho ou produto; testes estão no quickstart.

## Pesquisa anterior — contexto histórico

Decisões de fluxo/armazenamento/exportação anteriores são substituídas pelo plan de 21/09 onde
conflitarem; referências antigas não autorizam funções adiadas.

# Pesquisa e decisões — entrega incremental

## Calendário administrativo — pesquisa em 18/09/2026

Fontes oficiais consultadas: [React](https://fullcalendar.io/docs/react),
[migração/API v7](https://fullcalendar.io/docs/upgrading-from-v6-js),
[fuso](https://fullcalendar.io/docs/timeZone),
[acessibilidade](https://fullcalendar.io/docs/accessibility) e
[licença](https://fullcalendar.io/license). Registry confirmou @fullcalendar/react 7.1.0, React
17–19 e peer temporal-polyfill ^1.0.1. Fixar 7.1.0 e 1.0.1 no manifest/lockfile.

Decisão: usuário autorizou FullCalendar no painel; usar Standard (MIT), mês/semana/dia, pt-BR,
America/Bahia com suporte de fuso da v7. A API v7 reúne plugins no pacote React e exige CSS
explícito. Tema classic será adaptado aos tokens, sem tema paralelo. Lista diária preservada,
consultas limitadas ao período e controles do painel. Calendário mostra ocupação; criação/remarcação
usam disponibilidade/transação atuais. Arrastar, redimensionar, grade de recursos Premium e novas
regras ficam fora do recorte. Limite técnico de 42 dias cobre seis semanas mensais; 1.000 reservas é
teto de resposta, com erro explícito e filtros como recuperação, nunca limite comercial de
agendamentos.

Alternativas: manter só lista não atende ao pedido atual; implementação manual da grade repetiria
uma função da biblioteca escolhida; grade Premium não é necessária ao escopo.

## Revisão técnica antes do código — 15/09/2026

Reconsultadas fontes oficiais:
[PostgreSQL intervalos](https://www.postgresql.org/docs/current/rangetypes.html),
[locks](https://www.postgresql.org/docs/current/explicit-locking.html) e
[Fresha criação manual](https://www.fresha.com/help-center/knowledge-base/calendar/260-create-appointments-1).
Mantido domínio próprio com intervalos semiabertos e exclusão GiST. Reutilizar lock de vínculos
elimina a leitura obsoleta de titulares em confirmações simultâneas. Transação armazena resultado da
idempotência para replay fiel, inclusive após edição. Limites de concorrência e simplificação de
expediente estão descritos no plano; sem regras comerciais adicionais, integração com fornecedores
ou cópia de código legado.

Consulta: 15/09/2026. Fontes oficiais públicas, sem conta, integração ou teste de fornecedor.
Inspeção da stack local e pesquisa delegada pela skill speckit-plan. Data de consulta não significa
lançamento recente. Não há prova de superioridade universal de um formato de agenda; as escolhas
abaixo são inferências para a CAAB.

## Decisão 1 — começar pelo painel

**Decisão:** catálogo/horários e criar, consultar, remarcar e cancelar no painel; conexão real ao
app/site na segunda etapa. **Fonte:** resposta explícita do usuário. **Racional:** permite validar a
operação completa antes da integração externa. **Alternativa:** autosserviço desde a primeira
entrega foi oferecido e não escolhido. A conversa de planejamento não autorizava código. Após a
revisão, o pedido de execução de 15/09/2026 autorizou T001–T020.

## Decisão 2 — lista diária como primeira apresentação

**Observações:** Trinks usa grade por profissional, filtros e criação manual; Cal.com descreve lista
de reservas com ações de cancelar/remarcar. Fresha permite criar por horário conhecido ou buscar
vagas e gerenciar pelo formulário. **Decisão proposta:** lista diária, filtros e detalhes com
formulário de ações. **Racional:** cumpre a jornada escolhida sem exigir arrastar cartões ou uma
grade complexa. **Alternativas:** calendário diário/semanal completo pode ser acrescentado depois;
FullCalendar documenta visualização em lista, mas não é necessário adicionar uma dependência para a
primeira lista. Isso adia sua seleção anterior em docs/STACK.md.

Fontes: [Trinks — agenda](https://ajuda.trinks.com/menu-agenda),
[Cal.com — gestão de reservas](https://cal.com/scheduling/frequently-asked-questions),
[Fresha — criar agendamentos](https://www.fresha.com/help-center/knowledge-base/calendar/260-create-appointments-1),
[Fresha — gerenciar](https://www.fresha.com/help-center/academy/run-your-business/schedule-appointments/lessons/100253),
[FullCalendar — lista](https://fullcalendar.io/docs/list-view).

## Decisão 3 — horários e catálogo já no básico

**Observações:** SimplyBook.me separa funcionamento do estabelecimento e jornada profissional;
Cal.com separa configuração inicial do atendimento/duração e disponibilidade. **Decisão proposta:**
cadastro mínimo utilizável pela UI, funcionamento semanal, expediente e almoço na primeira entrega.
Agenda extra e indisponibilidades por período entram em 2A, juntamente com antecedência e janela
futura. **Racional:** uma lista sem capacidade de configurar e reservar não seria funcional.
**Alternativas:** exigir cadastro por banco/seed ou entregar só uma tela vazia foi descartado.

Fontes:
[SimplyBook.me — horários](https://help.simplybook.me/index.php?title=Opening_hours_of_the_company_vs_Working_hours_of_provider),
[Cal.com — criar atendimento](https://cal.com/help/event-types/create-first-event),
[Cal.com — disponibilidade](https://cal.com/help/availabilities/edit-availability). O
[inventário local](../002-integrated-modules/horarios-legado-2026-09-15.md) comprova conceitos no
código anterior, não a revisão publicada. Novidades não comprovadas continuam sugestões. Não copiar
políticas/multas do fornecedor.

## Decisão 4 — integridade não é uma função opcional da etapa 3

**Observação técnica:** PostgreSQL documenta intervalos temporais e constraints de exclusão para
impedir sobreposição. **Decisão:** domínio próprio, transações, restrição por
profissional/intervalo, idempotência e versionamento de edição. **Racional:** prevenção só na UI não
cobre disputa entre operadores. **Alternativas:** fonte de verdade em calendário externo ou checagem
seguida de insert sem proteção foram rejeitadas. Mecanismos são detalhados no plan e data-model.
Fonte:
[PostgreSQL — intervalos e exclusão](https://www.postgresql.org/docs/current/rangetypes.html).

Alguns fluxos manuais de fornecedores admitem sobreposição; isso não é regra da CAAB. Referências:
[Cal.com — remarcação](https://cal.com/help/bookings/host-reschedule-busy-slots),
[Fresha — reservas manuais](https://www.fresha.com/help-center/knowledge-base/calendar/260-create-appointments-1).

## Decisão 5 — acesso e identidade

**Fonte:** decisão do usuário de 15/09 e contrato de Associados de 10/09. **Decisão:** qualquer
acesso válido ao painel autoriza Agendamentos; a busca de beneficiários tem projeção mínima própria.
Não modificar permissões dos outros módulos. Bloqueio próprio e de titular vigente revalidado no
servidor; sem punição automática. **Alternativas:** concessão scheduling extra, exigir members:read
ou confiar em objetos enviados pelo navegador contradizem o escopo ou a integridade. **Limite:**
contrato existente findMemberSummary não resolve titulares; ampliar com coordenação transacional e
testes para inserção/encerramento de vínculos e bloqueios.

## Decisão 6 — equivalência com legado e sugestões

**Decisão:** uma spec responsável pela função, evoluída em cortes. Roadmap separa capacidades
comprovadas, regras pendentes e sugestões. Não copiar código antigo. **Racional:** evitar grande
reescrita de uma vez e expansão silenciosa do escopo. **Alternativa:** implementar todas as opções
de mercado agora foi rejeitada pelo usuário.

Avaliações/lembretes estão na etapa 2. Salas, preparação separada, filas, grupos, recorrência não
comprovada e distribuição automática permanecem sugestões da etapa 3. Cal.com só poderia ser
integrado se nenhuma outra possibilidade existir; pesquisa não demonstra esse esgotamento. Nenhum
SDK, serviço ou integração está planejado.

## Limite da conclusão

Pesquisa sustenta o desenho proposto, não comprova desempenho nem entrega. A estrutura é
tecnicamente planejada usando a base atual; código, migrations, testes e homologação estão em
validação; resultados reais ficam em evidence/. Políticas da etapa 2 serão fechadas antes de cada
incremento.

## Padrão visual e ações de inclusão — 16/09/2026

Referência principal: páginas existentes de Parceiros/Associados e componentes compartilhados do
próprio projeto. O catálogo atual escondia cinco cadastros em um select genérico e a navegação usava
links avulsos. A agenda não tinha a ação de inclusão no cabeçalho padronizado.

Fontes oficiais: [GOV.UK Button](https://design-system.service.gov.uk/components/button/) orienta
texto que descreva a ação e hierarquia clara entre ações;
[W3C, rótulos de controles](https://www.w3.org/WAI/tutorials/forms/labels/) fundamenta associação
explícita entre rótulo e campo. Guias de CSS/Link do Next instalado consultados na dependência da
principal (mesmo lockfile da nova worktree).

Decisão: aplicar componentes e tokens já usados no projeto, não a aparência externa dessas
referências. Uma inclusão principal por área, abas com destino identificado, tabelas/busca
existentes, contexto na URL e controles rotulados. Avaliação por jornada real de inclusão, capturas
e axe; referências não substituem a revisão visual nem autorizam ampliar o produto.

## Estado ao navegar — 16/09/2026

Os guias locais do Next 16.3.4 (preserving-ui-state e cacheComponents) confirmam que layouts
compartilhados conservam estado; Activity do framework retém somente três rotas e não atende à
preservação geral solicitada. Usar contexto em memória no layout autenticado, separado por
identidade e formulário; manter versões originais para conflito seguro. O padrão do campo UF usa
input/list:
[MDN datalist](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/datalist).
Sugestões não validam sozinhas a seleção; conferir identificador válido antes de enviar.

### Combobox editável — implementação de16/09/2026

Consulta oficial: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/. Um campo editável com lista de
sugestões permite digitar, percorrer opções com setas, confirmar com Enter e fechar com Escape. Em
Agendamentos a confirmação usa o ID, inclusive com nomes iguais; texto avulso não é um vínculo
válido. A lista conserva busca remota, paginação e cancelamento de respostas antigas, usando os
tokens e estilo de sugestões existentes na Auditoria. O campo UF nativo continua adequado ao
conjunto fixo de estados, cujos códigos são únicos.

## Ciclo de vida e credenciais — pesquisa de 21/09/2026

Fontes primárias consultadas:
[PostgreSQL: relógios e intervalos](https://www.postgresql.org/docs/current/functions-datetime.html),
[Better Auth: autenticação e senha](https://better-auth.com/docs/authentication/email-password).
PostgreSQL distingue relógio da transação de clock_timestamp; usar o segundo para a vigência
corrente mesmo após espera por locks. Intervalos escolhidos: 24 horas e 168 horas (sete dias).
Inferência de implementação: avaliar a data persistida nas consultas evita depender de worker ativo
para efetivar a exclusão lógica. Preservar identidades e chaves estrangeiras; nenhuma remoção física
ou cancelamento automático.

Reutilizar hashPassword/verifyPassword da versão instalada e o registro credential existente; o
reset administrativo é transacional, independente do fluxo público por link de recuperação.
Sessões/recuperações antigas são revogadas e a versão impede rotação dupla. Segredo só no recibo
transitório. Cargo é validado novamente sob lock: Administrador/Gestor, sem autogeração nem
redefinição de Administrador por Gestor. Testes de integração usam contas sintéticas, banco
descartável e relógio do banco.
