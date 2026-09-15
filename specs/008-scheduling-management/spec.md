# Feature Specification: Agendamentos — evolução incremental

**Feature Branch**: `codex/scheduling-planning-20260915`
**Created**: 2026-09-15
**Status**: Planejamento para revisão; implementação não iniciada.
**Input**: Começar com básico funcional, evoluir até o legado e depois novas funções.
**Confirmação do usuário**: primeira entrega opera pelo painel; conexão real ao app/site na etapa seguinte.

## User Scenarios & Testing

### US1 — Configurar oferta e realizar uma reserva (Priority: P1)

Qualquer pessoa com acesso válido ao painel consegue cadastrar uma unidade, seus
serviços, procedimentos e profissionais; configurar horários e reservar para uma
pessoa já cadastrada em Associados. A jornada inclui os pré-requisitos necessários:
não depender de cadastros feitos diretamente no banco ou de dados fictícios.

**Why this priority**: entrega um fluxo utilizável de ponta a ponta no painel.
**Independent Test**: partir de catálogo vazio, cadastrar oferta e expediente,
criar reserva, recarregar a tela e encontrá-la no dia e horário escolhidos.

**Acceptance Scenarios**:

1. Dada uma unidade com dois serviços, ao vincular procedimentos e profissionais,
   a seleção de uma reserva oferece apenas combinações cadastradas e ativas.
2. Dado funcionamento de 08h–18h e profissional de 09h–17h, com almoço 12h–13h,
   um procedimento de 60 minutos não oferece início às 08h ou 11h30.
3. Dados dois operadores disputando o mesmo profissional e horário, apenas uma
   reserva é aceita; o outro recebe mensagem de conflito e pode escolher nova vaga.
4. Dada repetição do mesmo envio após falha de conexão, permanece uma única reserva.
5. Dado associado ou titular vigente bloqueado, a criação é recusada sem alterar
   cadastros; o impedimento também vale para dependentes conforme decisão anterior.

### US2 — Consultar e gerenciar reservas (Priority: P1)

A equipe abre a lista por dia, filtra, consulta detalhes, remarca e cancela.
**Why this priority**: completa a operação mínima escolhida pelo usuário.
**Independent Test**: com uma reserva existente, localizar, remarcar, consultar
histórico e cancelar, conferindo a liberação do horário.

**Acceptance Scenarios**:

1. A lista mostra hora inicial/final, pessoa, unidade, serviço/procedimento,
   profissional e situação, ordenada cronologicamente.
2. Ao remarcar para vaga livre, o mesmo registro mantém seu histórico e libera
   a vaga anterior; se houver conflito, a reserva anterior permanece íntegra.
3. Ao cancelar uma reserva futura, a equipe confirma a ação sem preencher motivo;
   o registro permanece consultável e a vaga é liberada.
4. Ao editar a mesma reserva em duas telas, a segunda alteração desatualizada é
   recusada com orientação de recarregar, sem sobrescrever a primeira.
5. Uma conta com acesso válido ao painel, sem concessão específica de Agendamentos,
   usa todas essas ações; sessão inválida/revogada não consulta nem altera reservas.

### US3 — Ampliar até cobrir o legado (Priority: P2)

Etapa posterior, com cortes menores e critérios próprios antes de cada implementação.
Inclui operação real do app/site, indisponibilidades, agenda extra, antecedência,
limite futuro, demais estados, avaliações e comunicações comprovadas no legado.
**Why this priority**: ampliar sobre a primeira operação validada.
**Independent Test**: cada incremento tem roteiro próprio em roadmap.md; critérios
de funcionalidades ainda não definidos serão detalhados antes de seu código.
**Acceptance Scenarios**:

1. Uma reserva feita no app/site aparece no painel e ocupa a mesma disponibilidade.
2. Ao adicionar um bloqueio ou agenda extra, os canais refletem a alteração e
   eventuais reservas afetadas são tratadas conforme política previamente definida.
3. A avaliação permanece associada ao atendimento e ao autor conforme contrato
   específico; gestão não implica reescrever automaticamente a opinião recebida.

### Edge Cases

- Catálogo vazio, filtro sem resultado, falha de carregamento e sessão expirada.
- Unidade/profissional fechado, horário passado, fim antes do início, duração não
  contida em um expediente ou sobreposição parcial entre procedimentos diferentes.
- Um atendimento termina exatamente quando outro começa: não há sobreposição.
- Bloqueio administrativo ou mudança de dependência durante confirmação/remarcação.
- Alteração de duração, expediente ou desativação com reservas futuras existentes.
- Horário que atravessa meia-noite: fora do recorte inicial; explicar no cadastro.
- Registro histórico não comprova conclusão: não marcar atendimento concluído pelo relógio.

## Requirements

### Functional Requirements — primeira entrega

- **FR-001**: Permitir consulta e alteração a qualquer pessoa com acesso válido ao
  painel, sem permissão específica adicional; preservar autenticação e auditoria.
- **FR-002**: Cadastrar/editar unidades, serviços e procedimentos com duração positiva,
  profissionais e vínculos de habilitação, usando os formulários do próprio painel.
- **FR-003**: Permitir vários serviços por unidade e vários profissionais habilitados
  por procedimento; escolher um profissional em cada reserva inicial.
- **FR-004**: Configurar funcionamento semanal da unidade, jornada profissional e
  almoço. Dias fechados não oferecem vagas. Não presumir expediente ou duração padrão.
- **FR-005**: Oferecer apenas horários contidos no funcionamento e jornada, com duração
  completa, sem almoço ou conflito. Não permitir encaixe sobreposto na primeira versão.
- **FR-006**: Criar reserva individual futura para associado/dependente existente,
  revalidando bloqueio próprio/titulares vigentes e recusando cadastro arquivado.
- **FR-007**: Consultar lista por dia, unidade, profissional, situação e pessoa;
  abrir detalhes com histórico. Paginar sem perder filtros.
- **FR-008**: Remarcar reserva futura atomicamente, preservando identidade e histórico;
  revalidar disponibilidade, vínculos e impedimentos.
- **FR-009**: Cancelar reserva futura com confirmação, sem motivo obrigatório e
  sem exclusão do registro. Cancelamento repetido não produz efeitos duplicados.
- **FR-010**: Impedir conflitos mesmo com envios simultâneos e proteger contra
  duplicação por repetição do envio e sobrescrita de edição desatualizada.
- **FR-011**: Registrar autor, data, ação e alteração relevante com minimização de
  dados pessoais. Não incluir informações clínicas nem dados financeiros no formulário.
- **FR-012**: Impedir mudança de expediente/desativação que invalide reservas futuras
  até que a equipe resolva essas reservas. Não cancelar automaticamente.
- **FR-013**: A duração alterada vale para novas reservas; anteriores preservam início
  e fim registrados. Remarcação reapresenta a duração vigente antes de confirmar.
- **FR-014**: Exibir estados de carregamento, vazio, erro e confirmação em português;
  permitir fluxo completo por teclado e em tela de 390 px, com estados além da cor.
- **FR-015**: A primeira entrega funciona apenas no painel, sem chamar ou gravar no
  legado, sem alterar o app/site existente e sem publicar API anônima de reservas.

### Key Entities

Unidade; Serviço; Procedimento; Profissional; habilitação em uma unidade/procedimento;
funcionamento/jornada; Pessoa beneficiária já cadastrada; Agendamento; histórico.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Completar configuração → criar → consultar após recarga → remarcar →
  cancelar com dados sintéticos, sem manipulação direta de banco.
- **SC-002**: Em disputa de 20 envios pelo mesmo profissional/intervalo, exatamente
  uma reserva persiste; em 20 repetições idênticas, também persiste uma única reserva.
- **SC-003**: Em remarcação recusada, 100% dos campos e a ocupação anterior permanecem.
- **SC-004**: Todas as ações críticas registram autoria e horário; nenhum cancelamento
  remove o registro original nem exige motivo.
- **SC-005**: Completar os fluxos por teclado e em 390 px, em temas claro/escuro,
  sem corte de ações ou dependência de arrastar elementos.

## Assumptions

Hipóteses de recorte para revisão, sem fingir que todas vieram do usuário:

- A reserva inicial é individual, presencial, para associado/dependente existente.
  Público externo e regras do autosserviço pertencem à segunda etapa.
- Situações iniciais: Agendado e Cancelado. Confirmação de comparecimento, conclusão
  e falta entram na etapa 2; a primeira versão não mede atendimentos realizados.
- Agendado representa reserva aceita pelo operador, não confirmação do cliente.
- Reserva/remarcação/cancelamento inicial só altera compromissos futuros. Histórico
  é consultável. Correções de atendimentos passados serão especificadas posteriormente.
- Não criar bloqueio financeiro, punição, prazo de cancelamento ou exigência de OAB
  regular. Situação inativa, isoladamente, não ganha novo veto presumido; bloqueio
  e arquivamento seguem os impedimentos explicitamente documentados.
- Cadastros do legado não serão importados automaticamente na primeira entrega.
- Funções ausentes do legado permanecem sugestões: salas, equipamentos, preparação,
  filas, turmas/recorrência não comprovadas e distribuição automática.
- Cal.com somente referência; integrar apenas se nenhuma outra possibilidade existir.

