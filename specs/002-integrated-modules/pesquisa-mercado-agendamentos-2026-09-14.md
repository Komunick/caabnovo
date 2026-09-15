# Pesquisa de mercado: Agendamentos para diferentes negócios

> Atualização em 15/09/2026: a CAAB administra a oferta pelo painel; qualquer pessoa
> com acesso válido ao painel pode alterar Agendamentos. A hipótese abaixo de gestão
> independente pelos profissionais foi substituída. Unidades com vários serviços,
> profissionais, procedimentos, funcionamento e avaliações foram confirmados.
> Cal.com é referência, com integração somente se nenhuma outra possibilidade existir.
> Ver [pesquisa complementar](pesquisa-gestao-agendamentos-2026-09-15.md) e
> [decisões vigentes](brainstorming-agendamentos.md). As propostas de mercado seguem abertas.

**Data de consulta:** 14/09/2026. **Estado:** pesquisa concluída para revisão; nenhuma
proposta deste documento está aprovada para implementação.

## 1. Objetivo e contexto confirmado

O usuário esclareceu que profissionais e negócios configurarão seus próprios sistemas
de reservas. Após a correção do usuário, o recorte atual inclui **barbearia, medicina,
futevôlei, fisioterapia, psicologia, spa e zumba**. Portanto, o produto não está
limitado à agenda interna da CAAB nem a serviços de saúde.

**Restaurantes não fazem parte do escopo atual.** A pesquisa já realizada sobre eles
foi preservada apenas como possibilidade futura, sem afetar prioridades ou requisitos
da versão em discussão. Inclusão posterior exigirá nova decisão.

Segundo o usuário, a versão no ar foi feita às pressas, sem estudo suficiente do domínio.
Esse relato motiva a pesquisa; não houve auditoria operacional do sistema publicado.
O planejamento antigo de US4 não representa o escopo desta evolução.

O pedido atual é pesquisar práticas de mercado, registrar conclusões e revisá-las depois.
Não criar telas, contratos, tabelas, integrações ou regras de negócio nesta etapa.
CAASSH permanece desativado, pendente de revisão; não presumir relação com reservas.

## 2. Método e limites

Foram comparadas documentações públicas e páginas oficiais de **Trinks, Fresha,
iClinic, Feegow, Doctoralia, OpenTable, TheFork Manager, Tock, SimplyBook.me e
Microsoft Bookings**, complementadas por **Tecnofit, Next Fit, TeamUp, Mindbody,
Cliniko, Jane e Playtomic** após o esclarecimento sobre esporte, terapias e aulas.
A seleção principal cobre beleza, saúde, esporte, bem-estar e plataformas multissetoriais.
As referências de restaurantes são exploratórias. São referências de funcionamento,
não uma classificação de fornecedores.

“Observado” significa que a fonte documenta a função; não significa que ela foi
testada em uma conta, está incluída em todo plano ou está disponível em qualquer país.
Páginas comerciais têm peso menor que instruções operacionais. Não foram adotadas
promessas de redução de faltas, aumento de receita ou números de participação de mercado.
“Conclusão” e “proposta” abaixo são inferências para discussão do nosso produto.

As fontes foram consultadas na data acima; várias não informam atualização editorial.
As páginas de serviços e equipe do Bookings informam abril de 2025. A consulta atual
não transforma uma página antiga em evidência de lançamento recente. Não houve cadastro
em fornecedores, contratação, envio de mensagens, acesso a dados privados ou teste de carga.

## 3. O que os produtos de referência fazem

| Referência | Funcionamento documentado | Aprendizado para revisão |
| --- | --- | --- |
| Trinks — beleza/barbearia | Agenda diária por profissional, filtros, criação pelo balcão, estados, ausências, repetição e fila para chegada/encaixe. | A operação diária precisa reunir marcações e exceções, com acesso rápido às ações. [Manual da agenda](https://ajuda.trinks.com/menu-agenda). |
| Fresha — beleza/bem-estar | Distingue tempo de execução, intervalo bloqueado e tempo de processamento em que o profissional pode atender outra pessoa. | A duração total da visita pode diferir do tempo ocupado do profissional. [Tempos adicionais](https://www.fresha.com/help-center/academy/run-your-business/get-the-most-from-your-services/lessons/100340). |
| iClinic — consultórios | O fluxo documentado abre WhatsApp Web para enviar mensagem com links de confirmação/cancelamento; a resposta aparece na agenda. | Distinguir envio assistido de automação e registrar a resposta na reserva. [Fluxo de lembrete](https://suporte.iclinic.com.br/pt-br/lembrete-e-confirmacao-de-consulta-via-whatsapp). |
| Feegow — clínicas | Apresenta agenda por profissionais e unidades, além de módulos próprios de prontuário e gestão. | Agendamento e registro clínico são responsabilidades distinguíveis; um não exige construir o outro. [Produto oficial](https://feegowclinic.com.br/). |
| Doctoralia — clínicas | A oferta Pro anuncia agendamento online, lembretes e lista de espera automática. A página não detalha o algoritmo da fila. | Pesquisa e entrada de clientes podem acompanhar a agenda, mas não são requisito automático do nosso produto. [Oferta para clínicas](https://pro.doctoralia.com.br/pt-br/pricing-landing). |
| OpenTable — somente expansão futura | Regras por etapa do turno, limites para grupos grandes, tipos de assento e controle do número de pessoas recebidas ao longo do serviço. | Restaurante exige controlar o fluxo de clientes, além da existência de uma mesa livre. [Disponibilidade](https://www.opentable.com/restaurant-solutions/products/features/availability-controls/). |
| Tock — somente expansão futura | Disponibilidade combina planta, capacidades de mesas, combinações de mesas, turnos, duração de ocupação e dias especiais. | Uma reserva pode consumir vários recursos físicos simultaneamente. [Planejamento de disponibilidade](https://tock.zendesk.com/hc/en-us/articles/360043851691-Availability-Planning-Overview). |
| TheFork Manager — somente expansão futura | Apresenta gestão de mesas, reservas integradas e acompanhamento da operação pelo aplicativo. | Restaurantes justificam uma visão operacional própria. A página portuguesa não comprova disponibilidade comercial no Brasil. [Produto oficial](https://www.theforkmanager.com/pt/). |
| SimplyBook.me — multissetorial | Vincula equipamentos e salas aos serviços, com recursos exclusivos ou compartilhados. A alocação pode ser automática e invisível ao cliente. | O cliente não precisa selecionar cada recurso necessário para a reserva. [Recursos relacionados](https://help.simplybook.me/index.php?title=Special:MyLanguage/Related_Resources_custom_feature). |
| Microsoft Bookings — multissetorial | Serviços configuram duração, participantes, pessoas habilitadas e publicação; há opções de um profissional disponível ou vários necessários. | “Quem presta”, “quantas pessoas participam” e “o que pode ser reservado” são decisões distintas. [Definição dos serviços](https://learn.microsoft.com/en-us/microsoft-365/bookings/define-service-offerings?view=o365-worldwide). |

## 4. Principal conclusão: distinguir modelos de reserva

**Inferência:** o ponto comum é reservar disponibilidade limitada. A escolha do
cliente e a forma de calcular essa disponibilidade variam. Um formulário universal
obrigando sempre “serviço → profissional → horário” não representa todos os exemplos.

| Modelo candidato | Exemplo ilustrativo | O que limita a reserva | Visão operacional a avaliar |
| --- | --- | --- | --- |
| Horário de uma pessoa | Corte com barbeiro; consulta com médico | Profissional habilitado, duração e eventuais recursos | Agenda por profissional |
| Recursos físicos exclusivos | Sala ou equipamento | Disponibilidade dos recursos necessários | Agenda por recurso |
| Vagas em uma sessão | Zumba ou aula de futevôlei | Capacidade da sessão e ocupação da equipe/espaço | Lista de sessões e participantes |
| Mesa para um grupo — somente possibilidade futura | Restaurante, fora do escopo atual | Tamanho do grupo, mesas compatíveis, turno e ritmo de chegada | Reservas e mapa/lista de mesas |

São hipóteses de organização, não módulos aprovados. Elas sintetizam as diferenças
documentadas por Bookings, SimplyBook.me e Tock acima. “Qualquer área” deve orientar
a flexibilidade do produto; ainda não permite prometer suporte a toda combinação,
como hospedagem, locação por vários dias, rotas de entrega ou filas de urgência.

**Proposta para revisão:** compartilhar reserva, disponibilidade, cliente, comunicação
e histórico, oferecendo configurações e telas conforme a forma de reservar. A categoria
do negócio pode sugerir um ponto de partida, sem impedir uma clínica de oferecer uma
atividade coletiva. Reservas de restaurante ficam apenas como extensão futura possível.

### Aplicação às áreas informadas

Os exemplos abaixo são interpretações a validar com a operação, não regras clínicas,
esportivas ou comerciais presumidas.

| Área confirmada | Modelo a investigar primeiro | Questões próprias para a revisão |
| --- | --- | --- |
| Barbearia | Serviço individual com profissional e duração | Profissional preferido ou qualquer habilitado; combinação de serviços; chegada sem hora marcada. |
| Medicina | Consulta individual com profissional e eventual sala/equipamento | Primeira consulta e retorno podem ter ofertas distintas; presença e comunicação são separadas do registro clínico. |
| Futevôlei | Aula coletiva ou individual, vinculada a instrutor e espaço | Turma fixa ou inscrição avulsa; nível da turma se aplicável; indisponibilidade do espaço e cancelamento por condições externas. Locação de quadra não foi solicitada. |
| Fisioterapia | Sessão individual, série de sessões e, se existir na operação, sessão coletiva | Frequência e quantidade configuradas pela equipe; equipamentos/sala; reposição e continuidade com o profissional. Não inferir plano terapêutico. |
| Psicologia | Sessão individual e possibilidade de horário recorrente | Continuidade de horário/profissional, privacidade das informações da agenda e modalidade presencial/remota se oferecida. Grupos não estão presumidos. |
| Spa | Serviço individual ou sequência, com profissional, cabine e equipamentos | Preparação/limpeza, recursos simultâneos e intervalos por etapa; pacote comercial não se confunde com sequência de serviços. |
| Zumba | Sessão coletiva com instrutor, local e capacidade | Vagas avulsas ou fixas, lista de espera, presença individual, cancelamento de uma aula ou de uma inscrição. |

### Referências mais próximas de aulas, sessões e espaços

| Referência | Evidência observada | Implicação candidata |
| --- | --- | --- |
| Tecnofit | Separa agenda de turmas, grade para check-in e agenda de serviços; contempla horários fixos, sessões, presença, faltas e reposições. | A reserva de uma aula não precisa seguir o mesmo fluxo de uma consulta. [Agenda organizada](https://www.tecnofit.com.br/nossas-funcionalidades/agenda-organizada/). |
| Next Fit | Grades relacionam modalidade, instrutor, local, capacidade e permissões de visualização/agendamento por app. | A existência de vaga e o direito de reservá-la são condições diferentes. Não importar a exigência de contrato do fornecedor para a CAAB. [Grade de serviços](https://ajuda.nextfit.com.br/support/solutions/articles/69000555089). |
| Mindbody | Apresenta aulas e compromissos individuais na mesma solução, com capacidade e opção de lugares marcados. | É possível oferecer uma visão integrada preservando modelos distintos; lugar marcado seria opcional, não requisito de zumba. [Aulas e agendamentos](https://www.mindbodyonline.com/en-gb/business/scheduling). |
| Cliniko | Documenta repetição de consultas e sessões coletivas criadas antes da inclusão de participantes. | Separar a sessão oferecida das reservas individuais de seus participantes. [Repetição](https://help.cliniko.com/en/articles/1777286-book-repeating-appointments), [grupos](https://help.cliniko.com/en/articles/9668605-group-appointments-an-overview). |
| Jane | Separa disponibilidade de tratamentos, salas e recursos limitados, inclusive equipamentos. | Psicologia, fisioterapia e spa podem precisar de disponibilidade além da pessoa que presta o serviço. [Agenda e recursos](https://jane.app/guide/advanced-scheduling-hub). |
| Playtomic | Aulas públicas recorrentes relacionam quadra, instrutor e sessões; o aluno reserva uma ocorrência. | Referência por analogia para esporte com espaço compartilhado. O artigo lista padel, tênis e pickleball: **não comprova suporte a futevôlei**. [Aulas recorrentes](https://helpmanager.playtomic.com/hc/en-gb/articles/43089011499537-How-to-Create-Recurring-Public-Classes-Clinics-in-Playtomic). |

Essas fontes não definem a prática efetiva das unidades do usuário. Em especial,
precisa ser confirmado se futevôlei usa turma fixa, aula avulsa, individual ou combinação.

## 5. Configuração pelo profissional ou responsável

O Bookings separa configuração do serviço de sua publicação e permite ocultá-lo sem
apagar reservas existentes. O Tock também descreve preparação da disponibilidade antes
de liberá-la. Isso apoia avaliar um fluxo de **configurar → conferir → disponibilizar**,
com uma prévia de como o cliente reservará. [Serviços no Bookings](https://learn.microsoft.com/en-us/microsoft-365/bookings/define-service-offerings?view=o365-worldwide),
[publicação no Tock](https://tock.zendesk.com/hc/en-us/articles/360043851691-Availability-Planning-Overview).

Roteiro candidato, ainda sujeito à revisão:

1. Identificar o negócio, suas unidades e quem pode administrá-las.
2. Escolher como serão feitas as reservas: por profissional, recurso ou vagas em sessão.
3. Cadastrar o que é oferecido e relacionar equipe, recursos e capacidades necessárias.
4. Informar dias, horários, intervalos, exceções e período de abertura da agenda.
5. Definir quem pode reservar e as condições de confirmação, alteração e cancelamento.
6. Conferir exemplos de horários disponíveis e indisponíveis antes de publicar.

A nomenclatura deve acompanhar o negócio: “paciente”, “cliente”, “participante” e
“pessoas na mesa” não significam sempre o mesmo papel. Esse ajuste não deve alterar
as garantias da reserva nem introduzir cadastros paralelos sem necessidade.

## 6. Disponibilidade: regras que não podem ser confundidas

### Duração, intervalo e ocupação

O Bookings calcula disponibilidade considerando o tempo anterior/posterior reservado
para preparação ou deslocamento. A Fresha também documenta processamento que libera
o profissional durante parte da visita. São comportamentos distintos.
[Intervalos no Bookings](https://learn.microsoft.com/en-us/microsoft-365/bookings/configure-service-availability?view=o365-worldwide),
[processamento na Fresha](https://www.fresha.com/help-center/academy/run-your-business/get-the-most-from-your-services/lessons/100340).

**Inferência:** separar, na discussão, duração do serviço, intervalo entre inícios
oferecidos, preparação/limpeza e ocupação de cada pessoa/recurso. Exemplos sintéticos
como corte de 30 minutos ou consulta de 45 minutos servem apenas para experimentar
o desenho; não são valores padrão aprovados.

### Horário livre e horário oferecido

A Fresha permite oferecer horários regulares ou restringi-los para reduzir espaços
ociosos. A própria documentação reconhece que uma opção mais restritiva diminui os
horários visíveis. [Otimização da disponibilidade](https://www.fresha.com/help-center/knowledge-base/calendar/496-optimize-online-schedule-availability).

**Proposta:** diferenciar capacidade física de disponibilidade publicada. Se uma vaga
não aparece, a equipe deve conseguir entender se faltou profissional, sala, duração
suficiente ou se uma regra de oferta a ocultou. “Encher a agenda” e “dar mais opções
ao cliente” são objetivos que podem entrar em conflito.

### Restaurante: observação para possível expansão futura

Este trecho está fora do recorte atual e foi mantido por solicitação expressa do usuário.

**Inferência a partir de Tock/OpenTable:** ter oito lugares livres não garante acomodar
um grupo de oito. As mesas podem estar separadas ou não permitir combinação. Além
disso, aceitar muitos grupos no mesmo instante pode exceder o ritmo de atendimento.
Um desenho para restaurante deve avaliar compatibilidade de mesas, tamanho do grupo,
tempo previsto de ocupação e limite de chegadas por período, sem exigir seleção de garçom.

## 7. Jornadas a discutir

As sequências abaixo são propostas derivadas da comparação; ainda não são telas nem
regras definitivas.

| Ator/situação | Fluxo candidato |
| --- | --- |
| Cliente de profissional | Escolhe serviço, preferência por profissional quando aplicável, unidade/horário e confirma os dados essenciais. |
| Cliente de restaurante — somente futuro | Informa quantidade de pessoas, data, horário e eventual preferência de área; hipótese fora do escopo atual. |
| Cliente de atividade coletiva | Escolhe sessão e quantidade de vagas permitida; a reserva respeita a capacidade restante. |
| Recepção | Encontra o cliente ou registra seus dados mínimos, consulta disponibilidade e cria a mesma reserva usada pelo canal online. |
| Profissional | Consulta seus compromissos e executa ações dentro das permissões concedidas. |
| Responsável pelo negócio | Configura oferta, acompanha ocupação, resolve exceções e gerencia a equipe. |

A Trinks documenta entradas pelo balcão e por canais online; o OpenTable centraliza
reservas vindas de vários canais. **Conclusão:** esses canais devem disputar a mesma
disponibilidade, e não manter agendas independentes.
[Trinks](https://ajuda.trinks.com/menu-agenda), [OpenTable](https://www.opentable.com/restaurant-solutions/our-solutions/).

## 8. Pontos em que o mercado apresenta soluções diferentes

### Significados diferentes de “fila de espera”

- **Chegada sem horário:** a Trinks documenta uma fila para clientes que aguardam
  profissional disponível no estabelecimento.
- **Interesse em vaga futura:** a SimplyBook.me avisa inscritos quando surge horário
  em um dia lotado; a documentação descreve disputa por ordem de resposta, não uma
  reserva garantida ao primeiro inscrito.
- **Espera por mesa — somente futuro:** o OpenTable oferece filas presenciais e online
  associadas à ocupação do restaurante, fora do nosso recorte atual.

[Fila Trinks](https://ajuda.trinks.com/menu-agenda),
[lista SimplyBook.me](https://help.simplybook.me/index.php?title=Waiting_List_custom_feature),
[fila OpenTable](https://www.opentable.com/restaurant-solutions/our-solutions/).

**Conclusão:** decidir qual problema será resolvido antes de criar “a fila”. Precisam
ser discutidos ordem, prioridade, prazo de resposta e o que acontece com a vaga enquanto
alguém responde. A SimplyBook.me documenta incompatibilidade dessa lista com reservas
recorrentes e múltiplas; ativar opções isoladas não garante que funcionem combinadas.

Para aulas, o TeamUp documenta outra solução: promoção automática quando a pessoa
atende às condições e a aula está distante; perto do início, oferta com prazo de aceite,
seguida de passagem ao próximo da fila. A função documentada vale para aulas, não
para cursos ou compromissos individuais. O artigo é de 10/06/2026.
[Fila de aulas no TeamUp](https://support.goteamup.com/en/articles/10471958-waitlist-overview).

**Inferência:** para zumba e futevôlei, estudar fila por ocorrência e distinguir promoção
automática de convite. Não importar as regras de assinatura ou os prazos padrão do
fornecedor. A capacidade da turma deve continuar limitada durante a oferta da vaga.

### Recorrência e serviços em sequência

A SimplyBook.me oferece alternativas para conflitos em séries: recusar, pular datas
indisponíveis ou acrescentar reposições. Também documenta limite na remarcação pelo
cliente de reservas do pacote recorrente. Já a Fresha permite ordenar serviços dentro
de uma visita. [Recorrência](https://help.simplybook.me/wiki/Recurring_services%28packs%29),
[sequência de serviços](https://www.fresha.com/help-center/knowledge-base/catalog/74-set-services-to-book-in-sequence).

**Conclusão:** “repetir toda semana” e “fazer corte e barba na mesma visita” são problemas
diferentes. Revisar como apresentar conflitos e como alterar uma ocorrência, as futuras
ou toda a série. Nenhuma dessas políticas foi escolhida.

Há ainda uma terceira distinção: **repetir a oferta não matricula automaticamente a
pessoa**. No exemplo de aulas públicas da Playtomic, as sessões se repetem e o aluno
reserva uma de cada vez. O TeamUp documenta reserva recorrente de um horário pelo
participante quando o negócio habilita essa opção. [Oferta recorrente](https://helpmanager.playtomic.com/hc/en-gb/articles/43089011499537-How-to-Create-Recurring-Public-Classes-Clinics-in-Playtomic),
[vaga recorrente](https://support.goteamup.com/en/articles/9327404-make-a-recurring-reservation-for-a-class-time-slot).

**Conclusão para revisão:** distinguir grade recorrente, inscrição fixa na turma e
série individual de sessões. No exemplo sintético de uma aula semanal de zumba,
cancelar a inscrição de uma pessoa não deve ser confundido com cancelar a aula para
toda a turma. Na fisioterapia, reagendar uma sessão não define sozinho o destino das
demais. São cenários de desenho, sem frequência ou quantidade clínica presumida.

### Confirmação, cancelamento e comunicação

Receber uma solicitação, aceitar a reserva e obter confirmação de comparecimento do
cliente são fatos diferentes. A agenda da Trinks possui estados configuráveis de entrada;
o exemplo iClinic incorpora a resposta do cliente à agenda. **Proposta:** preservar
essas distinções, evitando que uma mensagem enviada seja interpretada como comparecimento
confirmado. [Trinks](https://ajuda.trinks.com/menu-agenda),
[iClinic](https://suporte.iclinic.com.br/pt-br/lembrete-e-confirmacao-de-consulta-via-whatsapp).

Prazos de cancelamento aparecem como configuração na SimplyBook.me.
Isso comprova a existência da capacidade, não define o prazo adequado para nosso
produto nem autoriza multas, cobranças, penalidades ou bloqueios.
[Catálogo oficial de funções](https://help.simplybook.me/index.php?title=Custom_Features%2Fen).

## 9. Papéis e fronteiras do produto

O Bookings diferencia quem agenda, quem presta o serviço e quem apenas consulta.
Também permite considerar compromissos do calendário da equipe na disponibilidade.
[Equipe e disponibilidade](https://learn.microsoft.com/en-us/microsoft-365/bookings/add-staff?view=o365-worldwide).

**Inferências para revisão:**

- “Profissional que configura o sistema” pode ser autônomo ou responsável por uma
  equipe; não assumir que haverá uma única agenda pessoal por conta.
- Se negócios independentes usarem o módulo, seus clientes, reservas e configurações
  precisarão ter fronteiras de acesso explícitas. Ainda não está definido quem cria
  os negócios e qual é o poder administrativo da CAAB sobre eles.
- Quem reserva pode ser diferente de quem recebe o serviço. Confirmar representação
  de dependentes, identificação dos participantes e privacidade das listas de turma;
  não expor dados dos demais inscritos a quem apenas procura uma vaga.
- Atuar como médico não inclui automaticamente prontuário, prescrição, faturamento
  clínico ou telemedicina no produto. Atender restaurantes não inclui automaticamente
  comandas, estoque, cardápio ou caixa. Integrações poderão ser discutidas separadamente.
- Reutilizar cadastros do projeto exige confirmar a relação entre negócio,
  profissional, parceiro, colaborador, associado e cliente externo. Não presumir
  que todo cliente é associado ou que todo profissional é parceiro cadastrado.

## 10. Conclusões para revisão posterior

Estas são recomendações de pesquisa, não decisões aprovadas:

| Conclusão candidata | Motivo | O que validar depois |
| --- | --- | --- |
| Partir de modelos de reserva e configurações por capacidade | Consultas, serviços de bem-estar e aulas não consomem disponibilidade da mesma forma. | Quais modelos precisam existir na primeira versão. |
| Oferecer configuração progressiva, com prévia | O profissional precisa compreender o resultado antes de aceitar clientes. | Quais campos são obrigatórios para cada modelo. |
| Compartilhar disponibilidade entre balcão e canal online | Evita operações concorrentes sobre agendas desconectadas. | Canais iniciais e relação com app/site existentes. |
| Adaptar a tela operacional ao negócio | Grade de profissionais, recursos e turma respondem a tarefas diferentes. | Uso no celular, recepção e gestão de várias unidades; mesas somente no futuro. |
| Distinguir reserva, comparecimento e comunicação | Uma etapa não comprova a seguinte. | Estados, responsáveis e correções permitidas. |
| Tratar recursos físicos e grupos explicitamente | “Profissional livre” ou “capacidade total” pode ser insuficiente. | Combinações de recursos, ocupação e exceções. |
| Separar recursos opcionais e testar suas combinações | Filas, recorrência e múltiplos serviços podem interferir entre si. | Combinações necessárias e complexidade aceitável. |
| Manter relatórios e integrações ligados a uma necessidade concreta | Produtos de referência incluem funções comerciais fora da reserva. | Indicadores úteis e integrações realmente exigidas. |

Para validação futura, usar casos sintéticos: dois clientes disputando o último horário;
profissional livre com sala ocupada; dois alunos disputando a última vaga de zumba; alteração
de escala com reservas existentes; cancelamento enquanto uma vaga está sendo oferecida;
série com feriado; instrutor disponível com quadra ocupada; cancelamento de aula por
condições externas; reenvio da mesma solicitação. São cenários para discutir qualidade,
não testes ou implementação iniciados.

## 11. Dúvidas guardadas para a revisão

1. Quem configura: autônomos, estabelecimentos, gestores da CAAB ou todos com papéis distintos?
2. Cada negócio possui espaço próprio? Um profissional pode participar de vários?
3. Quem reserva: qualquer cliente, apenas associados, convidados ou públicos por oferta?
4. A entrada será por app, página própria do negócio, catálogo geral, equipe ou combinação?
5. Futevôlei e zumba terão turmas fixas, vagas avulsas ou ambas? Fisioterapia e
   psicologia terão reserva recorrente individual? Quais recursos físicos precisam
   ser controlados? Restaurantes permanecem somente como possibilidade futura.
6. Qual autonomia o responsável terá para publicar serviços e definir políticas?
7. Como tratar aprovação, faltas, atrasos, remarcações e reservas recorrentes?
8. Haverá pagamentos/sinal ou apenas reserva? Nenhuma cobrança foi definida.
9. Quais comunicações serão assistidas ou automáticas e por quais provedores autorizados?
10. Que dados e reservas da versão atual precisarão ser preservados na evolução?

Não é necessário responder agora. O próximo passo é revisar estas conclusões com o
usuário, escolher os modelos e limites e somente então produzir a especificação funcional.

## 12. Limite da entrega desta pesquisa

Documento e referências registrados na worktree ativa, vinculados ao programa 002.
Não foi criada spec funcional de Agendamentos, nem desenvolvido seu código.
Não houve alteração na aplicação publicada, contratação ou escolha de fornecedor.
A pesquisa não comprovou desempenho, segurança ou integridade de implementação dos
produtos comparados: isso exigiria avaliação específica além da documentação pública.
