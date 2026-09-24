# Feature Specification: Agendamentos — evolução incremental

## Checkpoint da entrega ativa — 21/09/2026

Incremento de ciclo de vida implementado e validado no CI35644236348 (57d6b56), com dados
sintéticos. Evidências e limites no
[relatório da entrega](../001-project-foundation/evidence/plan-2026-09-21-validation.md). Clarify e
analyze concluídos somente nas alterações do recorte; sem achados relevantes. Requisitos históricos
sem relação com o diff e exportações próprias ainda planejadas ficam fora. Checkpoints anteriores
são históricos. Localhost desligado; banco local preservado.

## Checkpoint de revisão de código — 21/09/2026

Primeira versão administrativa e FullCalendar estão na base integrada. Falta concessão
consultar/alterar (AC01–AC03), conflito do beneficiário (BEN01–BEN03), indicação de bloqueio
posterior (BLQ01/BLQ02) e exportação DX01. CAL06 permanece validação visual/documental, sem
alteração de PR34 já integrado. Horários semanais/almoço e conflito do profissional já existem;
T021–T024 são expansões.

Revisão estática da base `ed31baf`; nenhum teste de aplicação ou homologação nesta etapa. Evidências
e limites: [revisão transversal](../002-integrated-modules/code-audit-2026-09-21.md).

**Feature Branch**: `feature/scheduling-management-20260915` **Created**: 2026-09-15 **Status**:
Primeira versão (US1 + US2) implementada e validada em 15/09/2026; evidências em
evidence/release-review.md. **Input**: Começar com básico funcional, evoluir até o legado e depois
novas funções. **Confirmação do usuário**: primeira entrega opera pelo painel; conexão real ao
app/site na etapa seguinte.

## Clarifications

### Session 2026-09-20

- Q: Impedir reservas sobrepostas da mesma pessoa, mesmo com profissionais ou unidades diferentes? →
  A: Sim, por beneficiário atendido. Associado e cada dependente são pessoas distintas; o vínculo
  familiar não reúne suas agendas nem impede reservas simultâneas entre eles.
- Q: O que acontece com reservas futuras existentes quando o associado é bloqueado, incluindo
  dependentes afetados? → A: Manter as reservas e sinalizar para decisão manual da equipe, sem
  cancelamento automático. Novas reservas e remarcações continuam sujeitas ao impedimento vigente.

### Session 2026-09-21

- Q: Notícias e Agendamentos também devem exigir permissão de acesso por usuário? → A: Sim (A),
  exigir acesso concedido também a Notícias e Agendamentos. Substitui a liberação automática para
  qualquer conta administrativa; sem acesso, ocultar o módulo na barra lateral, busca e Início e
  negar rotas/ações privadas.

- Q: Em Notícias e Agendamentos, o acesso concedido deve liberar todas as operações ou separar
  consulta e alteração? → A: Separar consultar e alterar (B), preservando o padrão existente
  indicado pelo usuário; não unificar as permissões. Permissões adicionais já existentes, como
  publicar Notícias, permanecem.

Checkpoint de 21/09/2026: Q9 preserva consulta/alteração separadas. Notícias já possui controles no
código; documentação corrigida. Agendamentos apresenta lacuna de autorização (ver planos/tarefas).
Nenhum teste de aplicação executado. Registros anteriores: Q8 substitui sessão suficiente por acesso
concedido ao módulo; FR-001/cenários/SC-008 e contrato atualizados, AC01–AC03 pendentes. Nenhum
código, migration, conta ou teste alterado. Q9 define consulta/alteração separadas; adequação e
transição técnica ainda pendentes, sem conceder acesso automaticamente.

### Session 2026-09-23

- Q: Na primeira versão do app/site, quem poderá confirmar uma reserva para um dependente? →
  A: O titular pode reservar para si e seus dependentes; cada dependente pode reservar somente
  para si mesmo.
- Q: Antes de entrar na conta, uma pessoa pode consultar serviços e horários disponíveis? →
  A: Os serviços podem ser consultados sem login; horários disponíveis exigem autenticação.
- Q: Quem pode consultar e, quando permitidas, remarcar ou cancelar reservas de um dependente? →
  A: O titular pode fazê-lo enquanto o vínculo estiver vigente; o dependente pode fazê-lo nas
  próprias reservas, inclusive quando a reserva foi criada pelo titular.
- Q: Ao concluir uma reserva no app/site, ela é confirmada imediatamente ou aguarda a equipe? →
  A: Cada serviço define se a confirmação é imediata ou se exige aprovação da equipe.
- Complemento do usuário: confirmação imediata é o padrão; a equipe pode desligá-la por serviço
  para exigir aprovação. A mudança de configuração vale para novos envios.
- Q: Enquanto a equipe não decide, a solicitação pendente deve ocupar a vaga? →
  A: Sim. Ela ocupa a vaga até aprovação ou recusa da equipe, sem expiração automática.

### Session 2026-09-24

- Q: No app/site, titular e dependente poderão remarcar e cancelar reservas futuras confirmadas
  que estão autorizados a gerir? → A: Sim. A remarcação seguirá o processo de aceitação escolhido
  para o serviço: imediato ou sujeito à aprovação da equipe.
- Q: Como priorizar remarcações na fila de aprovação? → A: Remarcações primeiro, ordenadas pela
  proximidade do horário atual da reserva, e não pela antiguidade do pedido ou pelo novo horário.
  Antecedência mínima para solicitar remarcação: 24 horas por padrão, editável e desativável.
- Q: O cancelamento também deve exigir antecedência mínima? → A: Não. No app/site, pode cancelar
  uma reserva futura confirmada até antes do início, sem antecedência mínima.
- Q: Enquanto uma remarcação aguarda aprovação, o usuário pode desistir da troca ou substituir
  o horário solicitado? → A: Sim. Pode desistir mantendo a consulta original ou substituir o
  horário solicitado; apenas uma troca pendente por reserva, com substituição sujeita ao prazo
  de remarcação. A garantia de manter a consulta original foi substituída pela revisão posterior
  de 24/09 abaixo; os demais pontos permanecem.
- Q: Qual limite de trocas será aplicado e quais eventos contam? → A: Duas remarcações
  confirmadas por reserva. Esclarecimento posterior: pedido reserva uma utilização em andamento;
  confirmação a consolida uma vez. Pedidos recusados e desistências não consomem outra; depois das
  duas, é necessário cancelar a reserva e fazer um novo agendamento para escolher outro horário.
- Complemento do usuário: cada associado deve ter histórico próprio de agendamentos,
  cancelamentos, compras e demais atividades. A visão individual integrada está detalhada no
  [programa 002](../002-integrated-modules/spec.md#histórico-individual-integrado--24092026).

### Session 2026-09-24 — rodada 3

- Q: Ao agendar, a pessoa poderá escolher um profissional específico ou qualquer habilitado? →
  A: Sim, quando houver profissionais cadastrados. O estabelecimento pode desativar a escolha
  mesmo com profissionais cadastrados; sem profissionais, o controle de escolha não aparece.
- Q: Sem profissionais cadastrados, o estabelecimento deve continuar recebendo agendamentos? →
  A: Sim, usando horários e quantidade de vagas definidos para o serviço. Alguns estabelecimentos
  não precisam diferenciar seus profissionais; exigir esse cadastro criaria atrito desnecessário.
- Q: Qual antecedência mínima deve valer para novos agendamentos? → A: Sem antecedência mínima
  por padrão; o estabelecimento pode configurar o prazo por serviço. O prazo de remarcação é separado.
- Q: Até quanto tempo no futuro o associado poderá agendar? → A: Janela móvel de 90 dias por
  padrão, editável e desativável por serviço. O usuário aceitou a opção A após consultar as
  referências de mercado; a janela avança com o tempo e respeita os horários configurados.
- Q: Se chegar o horário original e a equipe ainda não tiver aprovado a remarcação, o que acontece? →
  A: Manter a troca pendente; a equipe pode aprová-la depois, desde que o destino ainda seja
  futuro. Preservar histórico e não presumir comparecimento ou falta.
- Pedido adicional: pesquisar a ocupação da vaga original durante a remarcação para revisar a
  política de troca. Pesquisa registrada no research.

### Session 2026-09-24 — revisão da ocupação na remarcação

- Q: Liberar a vaga original ao enviar a remarcação, mantendo somente a nova vaga retida? →
  A: Sim. A nova segue confirmação imediata ou aprovação do serviço. Recusa ou desistência não
  restaura automaticamente a antiga nem garante sua disponibilidade. Preservar histórico e
  prioridade pelo horário original. Esta decisão substitui a manutenção da ocupação original
  até aprovação e a garantia de recuperá-la ao desistir.
- Q: Após recusa ou desistência, como escolher outro horário? → A: Continuar no mesmo
  agendamento, mantendo histórico e trocas já usadas, inclusive se o horário original passou.
  O usuário reforçou que a recusa não deve consumir outra troca.
- Q: Como contar um pedido de troca, suas alternativas pendentes e a retomada após recusa? →
  A: O primeiro pedido ocupa uma das duas trocas; alterar o destino ainda não aprovado ou
  retomar após recusa continua a mesma troca, sem consumir outra. Só a confirmação consolida
  essa utilização. O limite evita sucessivas mudanças de horários confirmados sem usar o serviço.

### Session 2026-09-24 — publicação de serviços

- Q: Serviço novo deve aparecer automaticamente no app/site ou depender de publicação? →
  A: Oferecer dois botões, “Publicar” e “Salvar”, no próprio formulário, para dar controle sem
  etapa extra. Salvar guarda o novo serviço sem publicar; Publicar salva e disponibiliza em uma
  única ação, após validação.
- Q: Ao editar um serviço já publicado, Salvar deve guardar um rascunho ou atualizar a versão
  pública imediatamente? → A: Guardar rascunho (opção A), com os rótulos “Salvar alterações”
  e “Publicar alterações”. Salvar alterações preserva a versão publicada; Publicar alterações
  salva e disponibiliza a edição numa única ação, após validação.
- Complemento do usuário: cada botão deve ter uma descrição curta logo abaixo explicando a
  diferença entre salvar rascunho e publicar; aplicar no cadastro e na edição publicada.

## User Scenarios & Testing

### Incremento autorizado — calendário administrativo, 18/09/2026

O usuário priorizou evoluir o painel com FullCalendar antes de app/site. Esta decisão substitui a
ordem anterior do roadmap, sem autorizar os demais incrementos juntos.

- CAL-F01: alternar Lista, Dia, Semana e Mês na mesma Agenda, mantendo cabeçalho, inclusões
  explícitas, filtros e tokens do painel. Lista permanece entrada padrão.
- CAL-F02: navegar anterior/próximo/hoje e escolher data; data, visualização e filtros persistem na
  URL, recarga e histórico do navegador. Edição não salva é preservada.
- CAL-F03: mostrar reservas de todo o intervalo visível, em America/Bahia, mesmo com navegador em
  outro fuso. Beneficiário, horário, profissional, procedimento e situação devem ser identificáveis;
  cancelado tem indicação textual, além da cor.
- CAL-F04: abrir os detalhes existentes a partir da reserva; criar, remarcar e cancelar continuam
  com confirmação/revalidação no servidor. Grade vazia não comprova vaga.
- CAL-F05: consulta autenticada por intervalo exclusivo no fim, máximo 42 dias e 1.000 reservas.
  Acima disso recusar integralmente e orientar reduzir período/filtros; nunca truncar ou apresentar
  erro de rede como agenda vazia.
- CAL-F06: teclado, foco, mobile 390 px, temas claro/escuro, vazio/erro/carregamento e retorno à
  lista devem funcionar. Semana/mês podem rolar dentro da grade, sem transbordar a página. Não
  introduzir arrastar/redimensionar nem plugins Premium.

Aceite: uma reserva criada pela UI aparece no mês/semana/dia no horário correto; filtros e recarga
mantêm contexto; abrir/remarcar/cancelar atualiza a visualização; limites/intervalos
inválidos/sessão revogada não expõem dados ou agenda incompleta.

### US1 — Configurar oferta e realizar uma reserva (Priority: P1)

Pessoa com sessão administrativa válida e acesso concedido a Agendamentos consegue cadastrar uma
unidade, seus serviços, procedimentos e profissionais; configurar horários e reservar para uma
pessoa já cadastrada em Associados. A jornada inclui os pré-requisitos necessários: não depender de
cadastros feitos diretamente no banco ou de dados fictícios.

**Why this priority**: entrega um fluxo utilizável de ponta a ponta no painel. **Independent Test**:
partir de catálogo vazio, cadastrar oferta e expediente, criar reserva, recarregar a tela e
encontrá-la no dia e horário escolhidos.

**Acceptance Scenarios**:

1. Dada uma unidade com dois serviços, ao vincular procedimentos e profissionais, a seleção de uma
   reserva oferece apenas combinações cadastradas e ativas.
2. Dado funcionamento de 08h–18h e profissional de 09h–17h, com almoço 12h–13h, um procedimento de
   60 minutos não oferece início às 08h ou 11h30.
3. Dados dois operadores disputando o mesmo profissional e horário, apenas uma reserva é aceita; o
   outro recebe mensagem de conflito e pode escolher nova vaga.
4. Dada repetição do mesmo envio após falha de conexão, permanece uma única reserva.
5. Dado associado ou titular vigente bloqueado, a criação é recusada sem alterar cadastros; o
   impedimento também vale para dependentes conforme decisão anterior.
6. Dado um beneficiário com reserva Agendada, criar ou remarcar outra reserva para a mesma pessoa em
   intervalo sobreposto é recusado, inclusive com outro profissional ou unidade. Envios concorrentes
   não podem persistir a sobreposição.
7. Dado um associado e seus dependentes com identificadores próprios, suas reservas podem ocorrer
   simultaneamente, respeitando disponibilidade e impedimentos de cada pessoa e profissional. Duas
   reservas do mesmo dependente continuam sujeitas ao bloqueio.

### US2 — Consultar e gerenciar reservas (Priority: P1)

A equipe abre a lista por dia, filtra, consulta detalhes, remarca e cancela. **Why this priority**:
completa a operação mínima escolhida pelo usuário. **Independent Test**: com uma reserva existente,
localizar, remarcar, consultar histórico e cancelar, conferindo a liberação do horário.

**Acceptance Scenarios**:

1. A lista mostra hora inicial/final, pessoa, unidade, serviço/procedimento, profissional e
   situação, ordenada cronologicamente.
2. Ao remarcar para vaga livre, o mesmo registro mantém seu histórico e libera a vaga anterior; se
   houver conflito, a reserva anterior permanece íntegra.
3. Ao cancelar uma reserva futura, a equipe confirma a ação sem preencher motivo; o registro
   permanece consultável e a vaga é liberada.
4. Ao editar a mesma reserva em duas telas, a segunda alteração desatualizada é recusada com
   orientação de recarregar, sem sobrescrever a primeira.
5. Conta administrativa sem concessão de Agendamentos não vê o módulo na barra lateral, busca ou
   Início e não consulta/altera reservas por URL/API. Acesso concedido de consulta habilita entrada
   ao módulo; somente consulta não cria, altera, remarca ou cancela reservas nem muda
   oferta/horários. Alterações exigem também permissão de alterar. Sessão inválida ou concessão
   revogada impede as ações correspondentes.
6. Ao bloquear um associado com reservas futuras, suas reservas e as dos dependentes afetados
   permanecem Agendadas, ocupando os horários, e recebem indicação textual de bloqueio para decisão
   manual da equipe. O vínculo não altera a situação própria do dependente. Cancelamento manual
   autorizado continua disponível e auditado.

### US3 — Ampliar até cobrir o legado (Priority: P2)

Etapa posterior, com cortes menores e critérios próprios antes de cada implementação. Inclui
operação real do app/site, indisponibilidades, agenda extra, antecedência, limite futuro, demais
estados, avaliações e comunicações comprovadas no legado. **Why this priority**: ampliar sobre a
primeira operação validada. **Independent Test**: cada incremento tem roteiro próprio em roadmap.md;
critérios de funcionalidades ainda não definidos serão detalhados antes de seu código. **Acceptance
Scenarios**:

1. Uma reserva feita no app/site aparece no painel e ocupa a mesma disponibilidade.
2. Ao adicionar um bloqueio ou agenda extra, os canais refletem a alteração e eventuais reservas
   afetadas são tratadas conforme política previamente definida.
3. A avaliação permanece associada ao atendimento e ao autor conforme contrato específico; gestão
   não implica reescrever automaticamente a opinião recebida.

### Detalhamento 2C — primeira reserva no app/site (rascunho de 23/09/2026)

**Estado:** continuação documental de US3 baseada na [pesquisa de mercado de 23/09](research.md).
Descreve resultados e invariantes para a primeira experiência externa; não aprova integração,
implantação ou implementação. A interface completa do app/site terá a especificação própria já
prevista no programa 002. As decisões em aberto abaixo devem ser resolvidas antes de fechar o
contrato externo e gerar tarefas executáveis.

**Jornada de valor:** uma pessoa descobre os serviços publicados no canal antes do login. Depois
de autenticar, identifica o beneficiário que está autorizada a representar, consulta vagas e envia
uma reserva. Conforme a regra do serviço, ela é confirmada imediatamente ou fica aguardando
aprovação da equipe; em ambos os casos, a pessoa acompanha sua situação em próximas reservas.
Pode remarcar ou cancelar reservas futuras confirmadas que está autorizada a gerir. Remarcação
exige, por padrão, ao menos 24 horas até o horário atual, com prazo editável ou desativável por
serviço. Cancelamento é permitido até antes do início, sem antecedência mínima. A remarcação segue
a aceitação do serviço. Novos agendamentos não exigem antecedência mínima por padrão; o
estabelecimento pode configurá-la por serviço. O horizonte futuro é uma janela móvel de 90 dias
por padrão, editável e desativável por serviço. A equipe vê a mesma reserva e sua trilha no painel.

**Cenários de aceite do recorte 2C:**

1. Antes do login, uma oferta publicada para o canal mostra unidade, procedimento, duração e
   informações essenciais, sem dados privados ou horários disponíveis. Ofertas não publicadas para
   o canal não aparecem nem são reserváveis pela API externa. No cadastro, Salvar guarda o
   novo serviço sem publicá-lo; Publicar salva e publica em uma ação. Publicação inválida não
   expõe oferta e preserva os dados preenchidos para correção. Ao editar serviço publicado,
   Salvar alterações guarda rascunho e mantém a versão pública; Publicar alterações salva e
   substitui a versão publicada numa ação. Falha conserva a versão pública anterior.
2. O titular autenticado pode selecionar a si ou um dependente com vínculo vigente; o dependente
   autenticado só pode selecionar a si mesmo. A reserva fica vinculada ao identificador individual
   do beneficiário, enquanto autor e origem são registrados separadamente. Tentar enviar uma
   reserva para pessoa fora dessa regra, inclusive por URL/API, é negado.
3. Depois do login, com oferta e beneficiário válidos, a consulta apresenta datas/horários
   efetivamente calculados pela mesma regra de disponibilidade usada no painel. Sem vaga, oferece
   próxima data ou outra combinação autorizada quando houver, sem mostrar uma grade vazia como
   confirmação de ausência
   definitiva. A prévia de vaga não a retém.
4. Ao enviar a reserva, o servidor revalida identidade, representação, elegibilidade, oferta,
   disponibilidade e conflitos do beneficiário, além do profissional ou da capacidade do serviço,
   conforme o modo da oferta. O serviço usa confirmação imediata
   por padrão; se a equipe a desativar nesse serviço, novos envios geram reserva identificada
   como aguardando aprovação, sem comunicar confirmação ao usuário. Em ambos os fluxos, a transição é auditada,
   um envio repetido não duplica reserva e um conflito conserva as escolhas para buscar alternativa.
   A decisão da equipe exige autorização e revalidação antes de confirmar.
5. Reserva criada no app/site aparece no painel com mesmo identificador, horário, beneficiário e
   situação, inclusive quando aguarda aprovação. A equipe pode aprovar ou recusar uma solicitação
   pendente com decisão auditada e situação atualizada para o usuário. Enquanto aguarda, a
   solicitação ocupa o horário do beneficiário e do profissional ou uma vaga da capacidade do serviço,
   conforme o modo da oferta, em todos os canais; a recusa libera
   a vaga, e a aprovação mantém a mesma ocupação sem duplicá-la. Não há expiração automática.
   Reserva criada no painel ocupa a vaga vista no app/site. A origem é distinguível no histórico.
6. Titular com vínculo vigente e o próprio dependente veem as reservas futuras e históricas do
   dependente, mesmo quando criadas pelo outro, com situação textual, dados mínimos da oferta e
   ações permitidas. Ambos podem remarcar e cancelar reservas futuras confirmadas sob as mesmas
   verificações de autorização. Pedir remarcação exige antecedência mínima de 24 horas em relação
   ao início atual da reserva, salvo configuração editada ou desativada no serviço. A remarcação segue a aceitação configurada
   no serviço: imediata ou aguardando aprovação. Antes do envio, informar que a vaga original
   será liberada e não está garantida em caso de recusa/desistência. Ao aceitar o pedido, liberar
   origem e ocupar destino em uma transação; a nova fica confirmada ou pendente. A origem deixa
   de representar compromisso confirmado. Aprovar mantém somente a ocupação do destino; recusar
   libera o destino e deixa o registro sem horário confirmado, preservando identidade/histórico.
   Falha ao registrar o pedido conserva a reserva anterior. Cancelamento de reserva confirmada
   segue até antes do início, sem antecedência mínima ou aprovação. Encerrar troca pendente
   libera somente destino, sem recuperar origem e sem permitir aprovação posterior.
7. Sessão expirada, representação revogada, bloqueio de beneficiário, alteração de oferta ou
   conflito entre prévia e confirmação recebem resposta clara e sem dados de terceiros. Ações
   privadas não vazam por cache, histórico do navegador ou API de outro canal.
8. A jornada de descoberta, escolha, confirmação e consulta funciona por teclado e em tela móvel,
   com foco visível, status além da cor e mensagens anunciáveis, conforme WCAG 2.2 AA e o guia de
   design CAAB vigente. A revisão do guia local e a validação visual são gates antes do código.

9. Na fila de aprovação, uma troca de consulta marcada para amanhã aparece antes de uma troca
   de consulta marcada para o próximo mês, mesmo quando o segundo pedido foi enviado primeiro.
   Ambas aparecem antes de novos pedidos. O horário pretendido não define a prioridade; em
   empate de horário atual, ordenar pelo pedido mais antigo e usar desempate estável.

10. Enquanto o horário original registrado ainda é futuro, desistir da troca libera o destino
    retido, preserva histórico e não restaura a consulta antiga. Substituir o horário solicitado
    respeita o prazo calculado sobre a origem registrada e a aceitação do serviço. O novo destino
    substitui o anterior sem acumular retenções; falha conserva a proposta e o destino anteriores,
    sem reocupar a origem já liberada.

11. Com profissionais habilitados e escolha liberada pelo estabelecimento, a pessoa pode
    selecionar um nome ou “Qualquer profissional disponível”. Se o estabelecimento desativar a
    escolha, o sistema define um profissional habilitado disponível e o informa antes de
    concluir. Sem profissionais cadastrados, o controle não aparece e a reserva usa horários e
    capacidade definidos para o serviço. Profissional inativo ou sem habilitação para a oferta
    não aparece como opção disponível. Falta de profissional livre numa oferta por profissional
    não a converte automaticamente em oferta por capacidade.
12. Em estabelecimento sem profissionais cadastrados, configurar horários e capacidade positiva
    do serviço permite reservas individuais até esse limite simultâneo. Confirmadas, pendentes
    de aprovação e retenções de remarcação disputam a mesma capacidade no painel e app/site.
    Esgotamento não aceita uma reserva extra; cancelamento ou recusa libera apenas sua ocupação.

**Requisitos específicos propostos para 2C:**

- **2C-FR-01:** Expor catálogo de serviços publicados para o canal antes do login, com projeção
  mínima e sem dados privados ou horários disponíveis. Consultar vagas exige identidade externa
  validada, assim como reservar, remarcar, cancelar e consultar reservas próprias. Aplicar
  visibilidade explícita por canal; APIs administrativas e suas sessões não são reutilizadas
  pelo cliente externo.
- **2C-FR-02:** Resolver ator externo e beneficiário no servidor a cada comando. Titular pode
  solicitar para si e dependentes com vínculo vigente; dependente só pode solicitar para si.
  Nunca confiar em papel, elegibilidade ou vínculo enviados pelo navegador. Usar o cadastro
  único de Associados, sem copiar seus dados para Agendamentos.
- **2C-FR-03:** Aplicar a mesma fonte de disponibilidade e as mesmas restrições transacionais da
  agenda administrativa. A seleção visual é provisória; envio e aprovação exigem revalidação e
  idempotência. A confirmação imediata vem ativada por padrão em cada serviço; a equipe pode
  desativá-la para exigir aprovação dos novos envios. A situação resultante é exibida sem
  ambiguidade nos canais. A equipe autorizada aprova ou recusa com auditoria; uma solicitação
  pendente nunca é apresentada como confirmada. Enquanto aguarda, ela bloqueia vaga e conflito do
  beneficiário. A espera por aprovação não tem expiração automática; para a troca vinculada a uma
  reserva, o encerramento explícito da troca libera somente o destino (2C-FR-09/10).
  Recusa libera a ocupação; aprovação preserva a mesma reserva e ocupação. Intervalos são
  [início, fim), persistidos em UTC e apresentados em America/Bahia.
- **2C-FR-04:** Listar apenas reservas que o ator pode consultar no momento, separando futuras e
  históricas; preservar trilha, autor e origem. O titular consulta as reservas do dependente
  somente com vínculo vigente; o dependente consulta todas as próprias reservas, inclusive as
  criadas pelo titular. Titular com vínculo vigente e dependente podem remarcar e cancelar as
  reservas futuras confirmadas que estão autorizados a gerir, com controle de versão. O prazo
  de remarcação está em 2C-FR-08; cancelamento até antes do início está em 2C-FR-09. A aprovação
  pela equipe de proposta recebida em tempo pode ocorrer após o início original (2C-FR-17).
  Remarcação segue a aceitação configurada por serviço: imediata ou com aprovação. Ao registrar
  o pedido com sucesso, liberar a origem e ocupar apenas o destino, em transação única. No fluxo
  manual, o destino aguarda aprovação sem expiração automática e o registro não possui horário
  confirmado; a origem permanece como referência histórica, sem ocupação. Aprovar confirma o
  destino mantendo identificador/histórico. Recusar ou desistir libera o destino sem restaurar
  origem. Falha técnica/validação antes de registrar o pedido conserva integralmente a reserva
  anterior. Antes do envio, informar perda da garantia da vaga antiga e situação da nova.
- **2C-FR-05:** Não gerar comparecimento, conclusão, falta, avaliação, pagamento, penalidade,
  lista de espera ou mensagem real por inferência. Atribuição de profissional fica restrita ao
  fluxo aprovado em 2C-FR-13; distribuição avançada de carga e demais capacidades têm cortes e
  políticas próprios.
- **2C-FR-06:** Preservar compatibilidade dos consumidores e dados existentes durante a transição
  do legado. A ativação externa requer inventário de contas e reservas a preservar, plano de
  migração/convivência e rollback sem perda de histórico.

- **2C-FR-07:** Priorizar remarcações na fila de aprovação, ordenando pelo início original registrado ao solicitar a troca
  em ordem crescente. Essa referência é preservada mesmo após liberar a origem. A data pretendida não interfere nessa prioridade. Em empate, usar a data
  de envio e um identificador estável; novos pedidos seguem depois, por ordem de envio. A
  prioridade organiza análise, sem tomar vagas ocupadas ou dispensar a aceitação do serviço.
- **2C-FR-08:** Para remarcação no app/site, exigir antecedência mínima editável por serviço,
  inicialmente 24 horas corridas antes do início atual da reserva, com opção de desativar.
  Verificar o prazo ao receber o pedido: exatamente 24 horas atende ao padrão; menos de 24 não
  atende. Guardar o início original como referência também para substituições da proposta.
  O prazo não é calculado sobre o horário pretendido. Pedido recebido dentro do prazo
  continua em análise quando a antecedência cruza o limite; não expira automaticamente nem é
  recusado apenas pela demora da equipe. Alterar a configuração vale para novos pedidos.

- **2C-FR-09:** Permitir ao ator autorizado cancelar reserva futura confirmada no app/site,
  sem antecedência mínima e sem aprovação da equipe, desde que o comando seja validado antes
  do início atual. Exatamente no início ou depois, negar cancelamento de reserva confirmada
  pelo autosserviço. Preservar histórico, autorização e idempotência, sem motivo obrigatório.
  Quando existir troca pendente, a origem já foi liberada: encerrar a solicitação libera apenas
  destino e não restaura origem. Manter a fronteira vigente para essa ação externa baseada no
  início original registrado; aprovação tardia pela equipe segue 2C-FR-17. Versão impede decisão
  atrasada de reativar proposta encerrada ou tocar ocupação adquirida por terceiro.

- **2C-FR-10:** Permitir ao ator autorizado desistir da troca pendente enquanto o início
  original registrado ainda for futuro, sem exigir as 24 horas de nova remarcação. Liberar
  destino e preservar o registro/histórico sem horário confirmado; não restaurar origem
  automaticamente, mesmo se ainda livre. Informar essa consequência antes de retirar o pedido.
  Permitir substituir destino conforme antecedência calculada sobre a origem registrada e
  aceitação vigente do serviço. No máximo uma proposta pendente por reserva; substituir retenção
  atomicamente, preservando proposta/destino anteriores se falhar e sem reocupar origem.
  Recusa/desistência/substituição não consomem outra utilização nem aumentam as confirmadas;
  pertencem à mesma troca em andamento (2C-FR-11). Decisão sobre versão
  retirada/substituída é recusada. A retomada após recusa/desistência segue 2C-FR-18.

- **2C-FR-11:** Limitar cada agendamento a duas trocas, distinguindo confirmadas de uma troca
  em andamento. Ao registrar o primeiro pedido de remarcação, reservar uma utilização do limite
  para essa troca; no máximo uma troca em andamento por agendamento. Só confirmar consolida a
  utilização, sem cobrar novamente: converter uma utilização reservada em uma confirmada.
  Alterar o destino antes da aprovação, sofrer recusa e escolher alternativa ou retirar a
  proposta para escolher outra são tentativas da mesma troca, sem nova cobrança ou reinício do
  contador. Recusa libera a vaga pretendida, mas mantém essa troca aguardando nova escolha ou
  cancelamento; não há horário confirmado. Ao confirmar a alternativa, a troca inteira conta
  uma única vez. Nova mudança depois dessa confirmação inicia outra troca e usa a próxima
  utilização. Exibir separadamente confirmadas e em andamento; não chamar pendência de troca
  confirmada. Duas confirmadas impedem iniciar uma terceira. Cancelar o agendamento encerra a
  troca não confirmada sem aumentar a contagem, preservando tentativas/histórico e sem restituir
  utilizações já confirmadas. Novo agendamento tem outra identidade/contador zero, sem garantia
  de vaga. Falha técnica antes de registrar pedido não reserva utilização. Todas as transições
  são idempotentes e o total de confirmadas mais utilização reservada nunca ultrapassa dois.
- **2C-FR-12:** Alimentar o histórico individual por beneficiário com reserva, confirmação,
  remarcação, cancelamento e demais transições efetivamente registradas, incluindo ator, data,
  origem e alterações autorizadas. Titular que age por dependente é autor; o atendimento pertence
  ao histórico do dependente. A consulta integrada de atividades segue o programa 002 e as
  permissões de cada domínio; a autorização familiar de agenda não libera dados de compras.

- **2C-FR-13:** Permitir ao estabelecimento/unidade desativar a escolha de profissional no
  app/site. A escolha está disponível quando habilitada e existem profissionais ativos aptos à
  oferta; oferecer nome específico ou “Qualquer profissional disponível”. Sem profissionais
  aptos ou com a escolha desativada, ocultar esse controle. Quando há profissionais aptos mas
  a escolha está desativada, ou quando o usuário prefere qualquer disponível, o servidor define
  um profissional livre e habilitado, apresentado antes de concluir. Revalidar configuração e
  disponibilidade no comando; não aceitar imposição de profissional pelo cliente quando a
  escolha está desativada, nem substituir silenciosamente o responsável apresentado.

- **2C-FR-14:** Permitir agendamentos sem cadastrar ou individualizar profissionais, usando
  horários e capacidade de atendimento simultâneo definidos para o serviço naquela unidade.
  Exigir capacidade inteira positiva e horários configurados para oferecer vagas; não inventar
  expediente, capacidade ilimitada ou profissional fictício. Respeitar duração completa e
  funcionamento da unidade. Confirmadas, pendentes e destinos retidos de remarcação ocupam
  capacidade, protegida contra concorrência. Ao enviar troca, remover a ocupação original e
  registrar somente destino atomicamente, inclusive quando intervalos se sobrepõem; não dispensar
  conflitos de terceiros nem manter origem como bloqueio oculto. Permanecem os conflitos
  do beneficiário e todas as regras de aceitação, prazo, limite de trocas e histórico. Ofertas
  por profissional continuam usando habilitação e disponibilidade individual; escolha desativada
  com equipe cadastrada não elimina essa atribuição. Cadastrar/desativar profissionais ou mudar
  capacidade não cancela nem converte reservas existentes; recusar alterações que invalidem
  ocupações futuras até resolução explícita, preservando seu modo e histórico.

- **2C-FR-15:** Novas reservas no app/site não exigem antecedência mínima por padrão. Permitir ao
  estabelecimento definir, alterar e desativar esse prazo por serviço. Mesmo sem prazo mínimo,
  aceitar somente início futuro; exatamente no início ou depois, negar nova reserva. Com prazo
  configurado, comparar instantes no servidor: início a exatamente esse prazo é elegível, abaixo
  dele não. Consulta de vagas e comando aplicam a mesma regra, revalidada ao receber o envio e
  antes de persistir. A configuração vale para novos pedidos e não cancela reservas existentes
  nem expira pendências recebidas em tempo. Aplica-se aos modos por profissional e por capacidade,
  com confirmação imediata ou aprovação. É independente do prazo de remarcação de 2C-FR-08;
  não aplicar automaticamente a antecedência de nova reserva ao destino de uma troca.

- **2C-FR-16:** No app/site, oferecer agendamento dentro de uma janela móvel de 90 dias corridos
  por padrão, editável e desativável pelo estabelecimento por serviço. Calcular o limite a partir
  do instante atual do servidor, sem depender de reabertura manual da agenda. O início no limite
  exato é permitido; além dele, recusado. Usar o mesmo limite na consulta e no envio, inclusive
  na escolha de destino de remarcação, sem alterar sua antecedência em relação ao horário
  original. A janela apenas restringe vagas realmente configuradas e disponíveis; não cria
  horários ou capacidade. Vale para ambos os modos de ocupação e aceitação. Mudanças afetam
  novos pedidos, preservando reservas e propostas já aceitas para análise; não cancelar,
  antecipar ou expirar registros existentes por redução do horizonte. Desativar remove somente
  o limite máximo, preservando início futuro, antecedência mínima e demais verificações.

- **2C-FR-17:** Uma proposta de remarcação recebida dentro do prazo permanece pendente mesmo
  quando chega ou passa o início original. A equipe autorizada pode aprovar essa mesma proposta
  depois, desde que o novo início seja estritamente futuro no instante da decisão e as demais
  validações de autorização, elegibilidade, disponibilidade, versão e limite de trocas passem.
  A exceção permite concluir análise já iniciada, sem liberar novas solicitações fora do prazo
  nem cancelamento externo de reserva passada. Não inferir comparecimento, conclusão ou falta
  pelo relógio. Preservar origem e decisão tardia no histórico; recusa não recria vaga passada.
  Se o destino também chegou/passou, negar aprovação desse destino e manter a pendência para
  resolução explícita da equipe, sem confirmar retroativamente ou expirar automaticamente.

- **2C-FR-18:** Após recusa ou desistência de proposta que deixou o registro sem horário
  confirmado, permitir ao ator autorizado escolher nova vaga no mesmo agendamento. Preservar
  identificador, beneficiário, histórico, contador já usado e início original como referência
  de prioridade; registrar nova tentativa vinculada à anterior. Essa retomada é permitida mesmo
  após o início original e não reaplica sua antecedência de 24 horas. Exigir destino futuro,
  horizonte vigente, elegibilidade, autorização, disponibilidade e aceitação do serviço.
  Não aplicar prazo mínimo de nova reserva a essa continuação. Não restaurar origem, zerar
  contador ou duplicar reserva. O estado sem horário não ocupa vagas; nova tentativa válida
  retém somente destino e respeita uma única proposta ativa. Falha conserva o estado anterior.
  Recusas e novas tentativas continuam a mesma troca em andamento, com a utilização já reservada,
  sem consumir outra; a confirmação consolida uma única utilização conforme 2C-FR-11. Se preferir
  cancelar o agendamento sem horário confirmado, permitir encerramento explícito mesmo após o
  horário original, sem restaurar origem nem inferir falta. Isso não autoriza cancelar
  retroativamente um atendimento que permanece confirmado.

- **2C-FR-19:** No formulário de cadastro de serviço, oferecer as ações “Salvar” e “Publicar”.
  Salvar persiste o novo serviço para gestão interna sem disponibilizá-lo no app/site. Publicar
  salva os dados e publica nos canais de destino configurados numa única ação, sem exigir salvar
  primeiro nem passar por uma segunda tela de publicação. Publicar exige permissão administrativa
  de alteração e validação no servidor da oferta ativa, dados necessários, duração e configuração
  de agenda do modo adotado: habilitação/horários profissionais ou horários/capacidade por serviço.
  Não exigir profissionais no modo por capacidade. Agenda válida sem vagas livres não é erro de
  publicação. Falha conserva os valores preenchidos e informa correções necessárias, sem publicar
  dados parciais ou comunicar sucesso falso. Repetição não duplica serviço/eventos e versão impede
  sobrescrever edição concorrente. Salvar não publica por inferência de serviço ativo.
  Ao editar serviço já publicado, usar os rótulos “Salvar alterações” e “Publicar alterações”.
  Salvar alterações persiste rascunho separado, sem alterar nem retirar a versão publicada.
  Publicar alterações valida, salva e substitui atomicamente a versão publicada, sem exigir
  salvar antes. Catálogo, consulta de vagas e comandos externos usam a configuração publicada,
  nunca alterações somente salvas. Rascunho não modifica políticas, duração ou oferta vigentes.
  A disponibilidade continua considerando ocupações, bloqueios e elegibilidade atuais; o rascunho
  não congela esses controles operacionais. Publicação inválida ou concorrente preserva a versão
  pública anterior e os valores editados para correção. Publicar não altera retroativamente
  reservas/histórico e deve respeitar as guardas existentes para alterações que afetem reservas
  futuras. Registrar autoria e versão; repetição não publica nem emite eventos em duplicidade.
  Exibir descrição curta e persistente imediatamente abaixo de cada botão, sem depender de
  tooltip: Salvar — “Guarda o serviço sem publicar.”; Publicar — “Salva e disponibiliza o serviço
  aos associados.”; Salvar alterações — “Guarda um rascunho sem mudar a versão publicada.”;
  Publicar alterações — “Salva e disponibiliza as alterações aos associados.” Associar cada
  descrição ao respectivo botão também para tecnologias assistivas.

**Critérios mensuráveis de 2C:**

- **2C-SC-01:** Na massa sintética, uma reserva criada em cada canal aparece no outro com mesmo
  identificador, beneficiário, horário e situação após recarga; remarcar/cancelar preserva a
  trilha e altera a ocupação apenas uma vez.
- **2C-SC-02:** Em 20 confirmações imediatas simultâneas da mesma vaga por painel e canal externo,
  exatamente uma reserva confirmada ocupa o profissional; quando todas tentam reservar o mesmo
  beneficiário em profissionais livres distintos, exatamente uma reserva sobreposta persiste.
  Vinte repetições idênticas do envio resultam em um único registro/evento. Em serviço com
  aprovação, nenhuma solicitação é exibida como confirmada antes da decisão da equipe; uma
  pendência impede outra reserva conflitante por profissional ou beneficiário até a decisão.
  Aprovar não duplica ocupação; recusar libera a vaga uma única vez.
- **2C-SC-03:** A matriz de titular sem vínculo vigente, dependente tentando reservar para titular
  ou outro dependente, sessão revogada, reserva de terceiro e oferta fora do canal retorna zero
  detalhes privados ou mutações aceitas. O titular perde acesso às reservas do dependente ao
  cessar o vínculo; o dependente mantém acesso às próprias reservas criadas pelo titular.
  Visitante sem login vê apenas serviços publicados para o canal; a consulta anônima de horários
  disponíveis é negada.
- **2C-SC-04:** A jornada completa é executável por teclado e em 390 px, com estados e conflitos
  identificáveis sem depender apenas de cor; evidências incluem revisão pelo guia CAAB e WCAG 2.2 AA.

- **2C-SC-05:** Ao enviar remarcação válida, somente destino permanece ocupado: confirmado
  no fluxo imediato ou pendente no manual. Outra pessoa pode reservar a origem liberada antes
  da decisão da equipe. Aprovar mantém destino sem dupla ocupação; recusar/retirar libera destino
  e não toca a nova reserva de terceiro na origem. Identificador/histórico são preservados.
  Falha antes de concluir o envio mantém a reserva original. Repetição e decisões concorrentes
  não duplicam liberação, ocupação ou contagem. Revisão e resultado informam a perda de garantia
  da origem e distinguem pendência de confirmação.

- **2C-SC-06:** Em massa com pedidos enviados fora de ordem, a fila mostra remarcações primeiro,
  pelo horário atual mais próximo. Trocar a data pretendida não muda a prioridade. Empates são
  estáveis por envio/identificador; pedidos novos não ultrapassam remarcações.
- **2C-SC-07:** Com limite de 24 horas, pedido a exatamente 24 horas é aceito e a 23h59min59s é
  recusado; mudar o limite altera a fronteira para novos pedidos. Desativá-lo permite solicitar
  remarcação até antes do início atual, respeitadas as demais regras. Passar pelo limite durante
  análise não invalida pedido recebido em tempo; fuso do navegador não muda a decisão.

- **2C-SC-08:** Cancelar um segundo antes do início é permitido; exatamente no início e depois
  é negado pelo app/site. Repetir o cancelamento não duplica eventos. Em disputa entre cancelar
  e aprovar uma troca, a verificação de versão impede decisão obsoleta; cancelamento concluído
  não deixa retenção órfã nem permite que uma aprovação posterior reative a reserva.

- **2C-SC-09:** Desistir da troca libera destino e mantém histórico sem horário confirmado;
  origem não é restaurada automaticamente, esteja livre ou ocupada por terceiro. Substituições
  concorrentes nunca deixam mais de uma proposta/ocupação ativa. Destino indisponível ou prazo
  insuficiente conserva proposta/destino anteriores; origem continua liberada. Aprovação de
  proposta retirada/substituída é recusada como desatualizada. Repetições não duplicam efeitos.

- **2C-SC-10:** Partindo de zero confirmadas, enviar troca produz zero confirmadas e uma em
  andamento. Mudar destino, receber recusa e escolher alternativas mantém zero mais uma.
  Confirmar qualquer alternativa dessa troca produz uma confirmada e zero em andamento, sem
  cobrança adicional. Pedir nova mudança depois da confirmação produz uma mais uma; confirmá-la
  produz duas mais zero. Rejeitar uma terceira troca. Repetições/concorrência não duplicam ciclo,
  utilização ou incremento. Cancelar durante a análise/retomada encerra a utilização reservada
  sem aumentar confirmadas, sem apagar histórico nem restaurar origem. Novo agendamento só
  recebe contador zero em outro registro; tentativas dentro da mesma troca nunca zeram contador.
- **2C-SC-11:** Reserva do dependente criada pelo titular aparece no histórico do dependente,
  com titular identificado como autor. Consultas não misturam atendimentos de pessoas distintas
  nem expõem atividades de outros domínios sem autorização. Cancelar ou criar nova reserva
  não remove os eventos anteriores.

- **2C-SC-12:** Estabelecimento com escolha habilitada e profissionais aptos oferece as duas
  modalidades. Desativar a escolha oculta o controle mesmo com profissionais cadastrados e
  impede contorno por API. Sem profissionais aptos, o controle não aparece. O responsável
  atribuído é habilitado, está disponível e é informado antes de concluir; desativação ou
  conflito após a prévia exige revalidação sem atribuição silenciosa a outra pessoa.

- **2C-SC-13:** Com capacidade 3 e 20 envios concorrentes de beneficiários distintos para o mesmo
  intervalo livre, persistem exatamente 3 ocupações, inclusive misturando painel, app/site,
  confirmação imediata e aprovação manual. Capacidade 1 admite apenas uma. Sobreposição parcial
  respeita o limite durante toda a duração; intervalos adjacentes não conflitam. Aprovar não
  consome outra vaga; recusa/cancelamento libera somente a ocupação correspondente. Remarcar,
  retirar e substituir proposta mantêm somente destino enquanto pendente, sem retenção órfã. O mesmo beneficiário
  continua impedido de reservar intervalos sobrepostos em qualquer modo/unidade. Leituras e
  histórico funcionam sem profissional fictício; alterações de cadastro não migram reservas
  existentes silenciosamente.

- **2C-SC-14:** Sem antecedência configurada, uma vaga futura próxima pode gerar nova reserva,
  observadas as demais regras; início igual ou anterior ao instante validado no servidor é
  recusado. Com prazo de teste de 2 horas, exatamente 2 horas é elegível e 1h59min59s não.
  Alterar/desativar o prazo modifica novas consultas/envios, sem mudar reservas ou pendências
  anteriores; prévia obtida antes da mudança é revalidada. Cobrir ambos os modos de ocupação,
  confirmação imediata/aprovação e navegador em outro fuso. Alterar esse prazo não muda as
  24 horas padrão para solicitar remarcação em relação ao horário original.

- **2C-SC-15:** Com relógio controlado e vagas configuradas, início a exatamente 90 dias é
  elegível; a 90 dias e um segundo é negado. Avançar o relógio um dia avança a janela um dia.
  Editar para 30 dias altera a fronteira de novos pedidos; desativar permite uma vaga além de
  90 dias, se configurada e válida. Reduzir o horizonte preserva reservas/propostas anteriores.
  Conferir revalidação após mudança entre prévia e envio, origem da remarcação independente do
  destino, fuso do navegador e ambos os modos de ocupação/aceitação. Desativação não cria vagas
  em dias sem expediente nem permite início passado.

- **2C-SC-16:** Com proposta recebida em tempo, avançar o relógio até/depois do início original
  mantém a pendência e permite aprovação única para destino ainda futuro, com incremento único
  da contagem de trocas. Destino exatamente no instante da decisão ou passado é recusado sem
  confirmação retroativa. O relógio não gera falta/comparecimento/conclusão; histórico preserva
  o horário original e a decisão. Cancelamento/recusa concorrentes não podem ser sobrescritos,
  e a exceção não permite iniciar troca de reserva passada que permanece confirmada; retomada
  de registro sem horário após recusa/desistência é autorizada separadamente em 2C-FR-18.

- **2C-SC-17:** Recusar/retirar proposta libera destino sem restaurar origem. Retomar antes
  ou depois do horário original mantém o mesmo identificador, histórico, beneficiário e contador
  anterior, sem veto pelas 24 horas da origem. Pedido válido retém somente novo destino;
  repetição ou envios concorrentes não criam duas propostas. Conflito ou falha conserva registro
  sem horário. Ordem de análise mantém referência original. Origem ocupada por terceiro não é
  alterada. Recusas sucessivas e tentativas não confirmadas preservam confirmadas e a mesma
  utilização reservada. Confirmar alternativa consolida essa utilização uma vez. Cancelar
  registro sem horário depois do início original encerra a troca sem incrementar confirmadas.

- **2C-SC-18:** Cadastrar com Salvar mantém serviço acessível à gestão e ausente do catálogo e
  dos comandos externos. Publicar diretamente com configuração válida persiste um único serviço
  e o disponibiliza nos canais configurados, sem etapa prévia de salvar. Configuração inválida
  mantém campos e informa erro, sem publicação parcial. Validar ambos os modos de agenda,
  capacidade/profissional, falta de permissão, retry, versão desatualizada e agenda sem vagas
  livres. Estado ativo sem publicação não torna serviço reservável pelo app/site. Em serviço
  publicado, Salvar alterações mantém o rascunho após reabrir a edição e preserva os valores
  públicos em catálogo/vagas/comandos. Publicar alterações torna a edição vigente numa ação,
  mantendo o mesmo serviço. Cobrir publicação sem salvamento prévio, conflito de versão, retry
  e erro de validação que mantém a versão anterior; preservar reservas/histórico e controles
  atuais de ocupação/bloqueio/elegibilidade mesmo com rascunho pendente. Conferir descrição
  explicativa visível abaixo de cada botão no cadastro e na edição, conforme 2C-FR-19, inclusive
  em telas estreitas, e associação acessível sem depender de passar o cursor.

**Decisões de produto pendentes para fechar 2C:**

- Mecanismo de identidade externa e ligação de cada conta ao cadastro individual; gestão do
  vínculo e revogação de acesso quando ele cessa. As regras de reserva e de acesso ao histórico
  de dependentes foram decididas em 23/09/2026.
- Canais de destino e informações por canal; ordem das etapas externas ainda será detalhada.
  Cadastro usa Salvar/Publicar; edição publicada usa Salvar alterações (rascunho) e Publicar
  alterações (salvar e disponibilizar), conforme decisão de 24/09. A escolha
  entre profissional específico e qualquer disponível é permitida e desativável pelo
  estabelecimento (rodada 3 de 24/09). Sem profissionais cadastrados, reservas usam horários e
  capacidade do serviço, conforme decisão da mesma rodada.
- Tratamento de reservas afetadas por indisponibilidade posterior. Horizonte futuro definido:
  janela móvel de 90 dias por padrão, editável/desativável por serviço. Nova reserva não tem
  antecedência mínima por padrão, configurável por serviço (rodada 3 de 24/09).
  Remarcação tem antecedência padrão de 24 horas, editável/desativável;
  cancelamento é permitido até antes do início, sem antecedência mínima (decisões de 24/09/2026).
  Não inferir penalidades.
- Prazo interno de análise e responsabilidade da equipe pela fila de pendências; conteúdo e canal
  de mensagens transacionais. A pendência ocupa a vaga até decisão da equipe, sem expiração
  automática, e a necessidade de aprovação é configurada por serviço, conforme decisões de
  23/09/2026.
- Fonte de contas/reservas do legado, coexistência, corte e tratamento de duplicatas/histórico.

**Fora deste recorte:** turmas coletivas, salas/equipamentos, lista de espera, múltiplos serviços
na mesma reserva, assistente por IA, avaliações e integração Cal.com. Permanecem possibilidades
de pesquisa ou incrementos separados; não se tornam requisitos por aparecerem em produtos de mercado.

### Edge Cases

- Catálogo vazio, filtro sem resultado, falha de carregamento e sessão expirada.
- Unidade/profissional fechado, horário passado, fim antes do início, duração não contida em um
  expediente ou sobreposição parcial entre procedimentos diferentes.
- Um atendimento termina exatamente quando outro começa: não há sobreposição.
- Conflito do beneficiário usa a pessoa atendida, nunca a conta do operador nem o titular do grupo
  familiar. Homônimos com cadastros distintos não são reunidos por nome.
- Reserva cancelada não ocupa a agenda do beneficiário. Remarcação desconsidera a própria reserva e,
  se recusada, conserva integralmente seu horário anterior.
- Bloqueio administrativo ou mudança de dependência durante confirmação/remarcação.
- Alteração de duração, expediente ou desativação com reservas futuras existentes.
- Horário que atravessa meia-noite: fora do recorte inicial; explicar no cadastro.
- Registro histórico não comprova conclusão: não marcar atendimento concluído pelo relógio.

## Requirements

### Functional Requirements — primeira entrega

- **FR-001**: Exigir sessão administrativa válida e acesso concedido a Agendamentos, revalidado no
  servidor para consultas e alterações, inclusive calendário, catálogo, disponibilidade e seleção de
  beneficiários. Sem acesso, ocultar o módulo na barra lateral, busca e Início e negar URL/API;
  preservar autenticação e auditoria. Q8 de 21/09/2026 substitui a liberação automática por sessão
  do painel. Q9 exige permissões separadas de consultar e alterar; alterar depende de consultar.
  Somente consulta permite ler agenda/detalhes/oferta/horários, sem criar/alterar cadastros,
  configurar horários, reservar, remarcar ou cancelar. Exportação depende da consulta e da permissão
  geral, sem exigir alteração.
- **FR-002**: Cadastrar/editar unidades, serviços e procedimentos com duração positiva,
  profissionais e vínculos de habilitação, usando os formulários do próprio painel.
- **FR-003**: Permitir vários serviços por unidade e vários profissionais habilitados por
  procedimento; escolher um profissional em cada reserva inicial.
- **FR-004**: Configurar funcionamento semanal da unidade, jornada profissional e almoço. Dias
  fechados não oferecem vagas. Não presumir expediente ou duração padrão.
- **FR-005**: Oferecer apenas horários contidos no funcionamento e jornada, com duração completa,
  sem almoço ou conflito. Não permitir encaixe sobreposto na primeira versão.
- **FR-006**: Criar reserva individual futura para associado/dependente existente, revalidando
  bloqueio próprio/titulares vigentes e recusando cadastro arquivado.
- **FR-007**: Consultar lista por dia, unidade, profissional, situação e pessoa; abrir detalhes com
  histórico. Paginar sem perder filtros.
- **FR-008**: Remarcar reserva futura atomicamente, preservando identidade e histórico; revalidar
  disponibilidade, vínculos e impedimentos.
- **FR-009**: Cancelar reserva futura com confirmação, sem motivo obrigatório e sem exclusão do
  registro. Cancelamento repetido não produz efeitos duplicados.
- **FR-010**: Impedir conflitos mesmo com envios simultâneos e proteger contra duplicação por
  repetição do envio e sobrescrita de edição desatualizada.
- **FR-011**: Registrar autor, data, ação e alteração relevante com minimização de dados pessoais.
  Não incluir informações clínicas nem dados financeiros no formulário.
- **FR-012**: Impedir mudança de expediente/desativação que invalide reservas futuras até que a
  equipe resolva essas reservas. Não cancelar automaticamente.
- **FR-013**: A duração alterada vale para novas reservas; anteriores preservam início e fim
  registrados. Remarcação reapresenta a duração vigente antes de confirmar.
- **FR-014**: Exibir estados de carregamento, vazio, erro e confirmação em português; permitir fluxo
  completo por teclado e em tela de 390 px, com estados além da cor.
- **FR-015**: A primeira entrega funciona apenas no painel, sem chamar ou gravar no legado, sem
  alterar o app/site existente e sem publicar API anônima de reservas.
- **FR-016**: Impedir criação e remarcação de reservas Agendadas com sobreposição para o mesmo
  beneficiário, globalmente entre profissionais e unidades, inclusive sob concorrência. Usar o
  identificador individual da pessoa atendida: associado e cada dependente possuem agendas
  independentes. Preservar também a prevenção de conflito do profissional; intervalos adjacentes e
  reservas canceladas não conflitam.
- **FR-017**: Bloqueio posterior à reserva DEVE preservar as reservas futuras do beneficiário e dos
  dependentes afetados pelos vínculos vigentes, com seus horários e histórico, e sinalizá-las na
  agenda e nos detalhes para decisão manual da equipe. Não cancelar, remarcar ou liberar vagas
  automaticamente. Preservar as recusas de novas reservas/remarcações enquanto houver impedimento e
  permitir cancelamento manual conforme autorização existente. A indicação não cria nova situação da
  reserva.

### Key Entities

Unidade; Serviço; Procedimento; Profissional; habilitação em uma unidade/procedimento;
funcionamento/jornada; Pessoa beneficiária já cadastrada; Agendamento; histórico.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Completar configuração → criar → consultar após recarga → remarcar → cancelar com
  dados sintéticos, sem manipulação direta de banco.
- **SC-002**: Em disputa de 20 envios pelo mesmo profissional/intervalo, exatamente uma reserva
  persiste; em 20 repetições idênticas, também persiste uma única reserva.
- **SC-003**: Em remarcação recusada, 100% dos campos e a ocupação anterior permanecem.
- **SC-004**: Todas as ações críticas registram autoria e horário; nenhum cancelamento remove o
  registro original nem exige motivo.
- **SC-005**: Completar os fluxos por teclado e em 390 px, em temas claro/escuro, sem corte de ações
  ou dependência de arrastar elementos.
- **SC-006**: Em 20 criações concorrentes sobrepostas para a mesma pessoa, com profissionais
  disponíveis distintos, persiste exatamente uma reserva. Validar associado e dependente
  separadamente, sobreposição parcial, unidades diferentes, remarcação recusada com rollback,
  cancelamento e intervalos adjacentes; permitir reservas simultâneas entre titular e dependentes
  distintos quando os demais requisitos forem atendidos.
- **SC-007**: Após bloquear um titular da massa sintética, 100% das reservas futuras próprias e dos
  dependentes afetados mantêm identidade, horário, situação e ocupação, com sinalização textual na
  agenda/detalhes. Pessoas sem vínculo afetado permanecem inalteradas; novas reservas/remarcações
  impedidas são recusadas e cancelamento manual preserva histórico e libera somente a vaga
  cancelada.

- **SC-008**: Conta administrativa sem concessão do módulo não consulta/altera Agendamentos nem
  encontra entradas na barra lateral/busca/Início; após revogação, a próxima ação protegida é
  negada. Somente consulta não executa mutações por UI/API; consultar+alterar mantém as jornadas de
  gestão. Alterar sem consultar é recusado.

## Assumptions

Hipóteses de recorte para revisão, sem fingir que todas vieram do usuário:

- A reserva inicial é individual, presencial, para associado/dependente existente. Público externo e
  regras do autosserviço pertencem à segunda etapa.
- Situações iniciais: Agendado e Cancelado. Confirmação de comparecimento, conclusão e falta entram
  na etapa 2; a primeira versão não mede atendimentos realizados.
- Agendado representa reserva aceita pelo operador, não confirmação do cliente.
- Reserva/remarcação/cancelamento inicial só altera compromissos futuros. Histórico é consultável.
  Correções de atendimentos passados serão especificadas posteriormente.
- Não criar bloqueio financeiro, punição, prazo de cancelamento ou exigência de OAB regular.
  Situação inativa, isoladamente, não ganha novo veto presumido; bloqueio e arquivamento seguem os
  impedimentos explicitamente documentados.
- Cadastros do legado não serão importados automaticamente na primeira entrega.
- Funções ausentes do legado permanecem sugestões: salas, equipamentos, preparação, filas,
  turmas/recorrência não comprovadas e distribuição avançada de carga. As decisões de 2C autorizam
  atribuição de profissional no fluxo definido e capacidade por serviço sem profissionais.
- Cal.com somente referência; integrar apenas se nenhuma outra possibilidade existir.

## Revisão de UI/UX e inclusão — 16/09/2026

Pedido do usuário após PR28: padronizar todas as telas de Agendamentos com as demais páginas e
tornar as inclusões encontráveis. Nova branch fix/scheduling-ui-20260916.

- UI-F01 Reutilizar page-header, Button/buttonVariants (inclusão size=add com Plus),
  ModuleNavigation, SearchField/FilterToggle, Table/TableContainer e tokens existentes, tomando
  Parceiros/Associados como referência. Nenhuma identidade visual nova.
- UI-F02 Mostrar Nova reserva no cabeçalho da agenda. Expor Unidades, Serviços, Procedimentos,
  Profissionais, Habilitações e Horários em abas identificadas, com ação específica de inclusão em
  cada cadastro, disponível mesmo sem resultados.
- UI-F03 Abas e filtros devem manter contexto na URL/recarga. Formulários de cadastro identificam a
  ação e oferecem salvar/cancelar, com foco de entrada e retorno. Não perder dados após erro de
  envio.
- UI-F04 Reduzir ruído dos filtros e seletores; usar listagens tabulares, estados vazios orientados
  à ação e formulário de reserva organizado por beneficiário, atendimento e horário.
- UI-F05 Validar inclusão de todos os tipos, edição, reserva/remarcação/cancelamento, teclado, 390
  px/desktop, temas e contraste transitório. Preservar contratos, permissões e integridade atuais;
  não criar novas funções do roadmap.

## Edições durante navegação — decisão de 16/09/2026

- Preservar campos, seleções e alterações pendentes ao consultar outra aba ou módulo e voltar,
  separados por formulário e registro, sem gravação automática no servidor.
- Salvar com sucesso, cancelar/descartar explicitamente ou encerrar a sessão encerra a edição.
  Falhas de validação/rede conservam os dados; manter as proteções de versão/autorização.
- Compartilhar a infraestrutura do painel e validar ida/volta, sem misturar registros ou usuários.

- **SL01**: Substituir busca e select separados por um único controle editável de seleção, como UF;
  preservar filtros dependentes, pesquisa real, paginação, identidade e validação.

### US4 — Exportar dados autorizados (Priority: P2)

O operador com permissão geral de exportação e consulta da função abre “Exportar Agendamentos”,
ajusta filtros, seleciona/reordena colunas e escolhe Excel, CSV ou PDF para download direto. Abrange
dados/abas consultáveis da função, sem teto funcional de registros/período, sem prazo de arquivo nem
fila/histórico obrigatório. Não exportar bytes de anexos, segredos ou campos sem autorização.

Teste independente: Duas reservas concorrentes da mesma pessoa em profissionais/unidades distintos:
uma aceita; titular/dependentes distintos podem coincidir. Bloqueio mantém reserva/vaga e mostra
aviso. Sem read some/nega; só read não altera. Exportação não herda teto visual. Em erro, manter
filtros/colunas; três formatos preservam conjunto e ordem escolhidos. Campos restritos enviados
diretamente são recusados no servidor. Este detalhamento aplica o padrão transversal já decidido,
sem implementação ou nova homologação.

Checkpoint de 21/09/2026 — plan concluído: desenho, pesquisa, modelo, contratos e roteiro
atualizados. Nenhum código, serviço, migration ou teste de aplicação executado. Tarefas serão
detalhadas em seguida; políticas e funções adiadas permanecem pendentes.

Checkpoint de 21/09/2026 — tasks concluídas: 15 tarefas novas (T025–T039), com histórias,
dependências, caminhos e aceite; nenhuma implementação/teste de aplicação executado. Ver tasks.md.

Checkpoint final de21/09/2026 — plan seguido de tasks encerrados. Conferência documental de IDs,
fases, links e preservação do histórico concluída; código, testes de aplicação e homologações não
executados. Próximo passo recomendado: análise cruzada antes da implementação. Detalhes no relatório
do programa002.

## Associado excluído e reservas — 21/09/2026

A exclusão lógica de associado se torna efetiva sete dias após a solicitação (spec005). Preservar
reservas e histórico. Exibir aviso Associado excluído na agenda/calendário e detalhe; responsável
com scheduling:write pode Manter reserva ou Cancelar reserva. Manter registra decisão auditada, sem
ocultar o aviso e sem gerar nova reserva. Cancelar usa o fluxo existente e libera o horário.
Consulta apenas não autoriza decisão. Impedir novas reservas de associado excluído; restauração não
recria reserva cancelada. Decisão vinculada à ocorrência da exclusão: nova exclusão exige nova
análise.
