# Feature Specification: Agendamentos — evolução incremental

## Checkpoint da entrega ativa — 21/09/2026

Implementação do incremento de ciclo de vida realizada na entrega compartilhada, com testes de
integração e navegador aprovados no CI35640590161. Gates complementares no CI35641862727:
quality/security aprovados; navegador em andamento. Evidências, limites e próximo passo no
[relatório da entrega](../001-project-foundation/evidence/plan-2026-09-21-validation.md). Clarify e
analyze serão restritos às alterações desta entrega; requisitos históricos sem relação com o diff e
exportações próprias ainda planejadas ficam fora. Os checkpoints anteriores são históricos.
Localhost desligado, sem alteração do banco local.

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
  turmas/recorrência não comprovadas e distribuição automática.
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
