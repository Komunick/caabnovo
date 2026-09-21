# Feature Specification: Fundação do Sistema CAAB

## Checkpoint de revisão de código — 21/09/2026

Contas, permissões individuais, senha inicial e sessões estão implementadas; MFA foi retirado. Encontradas lacunas A01/A03/A05/A06/A11 de autorização/visibilidade e preservação de erros. AX01–AX04/DX01 e T089/T095 permanecem pendentes. Cadastro público ainda permitido na base integrada; correção existente fora de dev deve ser conciliada em T096. T097 cobre erros de concorrência.

Revisão estática da base `ed31baf`; nenhum teste de aplicação ou homologação nesta etapa.
Evidências e limites: [revisão transversal](../002-integrated-modules/code-audit-2026-09-21.md).

**Feature Branch**: `feature/project-foundation`

**Created**: 2026-09-04

**Status**: Fundação implementada; adequações e gates institucionais pendentes conforme checkpoint.

**Input**: User description: "Faça a fundação conforme docs/PRD.md, docs/STACK.md e a constituição,
com branches dev e main obrigatórias."

## Clarifications

### Session 2026-09-21

- Q: Quem poderá baixar/exportar dados em cada módulo? → A: Uma permissão geral de exportação, combinada com o acesso aos módulos. Quem só acessa Associados e Colaboradores só pode exportar esses módulos; a permissão não concede acesso a outros.
- Q: Como apresentar módulos para quem não tem permissão de acesso? → A: Ocultar completamente da barra lateral, do menu de busca e da tela inicial, como se não existissem para essa pessoa.

- Q: Quem já possui uma permissão antiga de exportação deve receber automaticamente a nova permissão geral? → A: Sim (B). Converter automaticamente quem já possui alguma permissão de exportação, mantendo acesso restrito aos módulos/dados autorizados. Segundo o usuário, atualmente só existem as contas de teste dele e do agente; não foi realizada auditoria de contas neste clarify.

- Q: Por quanto tempo os arquivos de exportação devem ficar disponíveis para baixar novamente? → A: Substituir essa jornada por download direto, sem prazo ou limite de exportação. Clicar em “Exportar [módulo]” abre tela de filtros (data, ordenação, ações, áreas, nomes e outros pertinentes); escolher Excel, CSV ou PDF inicia o download diretamente. Exportar todos os resultados autorizados dos filtros, sem limitar à página, quantidade de registros ou duração do período. Não exigir fila, histórico de arquivos ou retorno posterior para baixar.

- Q: Na tela de exportação, a pessoa poderá escolher quais colunas aparecerão no arquivo? → A: Sim (A), permitir selecionar e ordenar as colunas autorizadas, com uma seleção inicial adequada ao módulo, nos três formatos Excel, CSV e PDF.

- Q: Notícias e Agendamentos também devem exigir permissão de acesso por usuário? → A: Sim (A), exigir acesso concedido também a Notícias e Agendamentos. Substitui a liberação automática para qualquer conta administrativa; sem acesso, ocultar o módulo na barra lateral, busca e Início e negar rotas/ações privadas.

- Q: Em Notícias e Agendamentos, o acesso concedido deve liberar todas as operações ou separar consulta e alteração? → A: Separar consultar e alterar (B), preservando o padrão existente indicado pelo usuário; não unificar as permissões. Permissões adicionais já existentes, como publicar Notícias, permanecem.

- Q: A política de prazo para guardar cadastros, documentos e auditoria ficará para definição institucional posterior ou já existe uma política aprovada? → A: Definir posteriormente (A); manter o descarte automático desligado. Não estabelecer prazos nem declarar política aprovada nesta etapa.

Checkpoint de 21/09/2026: Q3–Q10 e complementos registrados. Padrão de exportação
direta, formatos/colunas e regras de acesso definidos; retenção adiada à definição
institucional, com descarte automático desligado. Notícias já possui controles
separados no código; Agendamentos tem lacuna registrada. Implementações/validações
novas permanecem pendentes; este clarify não executou testes de aplicação.

## Cargos iniciais — resposta ao analyze I1, 21/09/2026

Administrador tem todas as permissões concretas dos módulos disponíveis, atuais e futuros, incluindo exportação e gestão de cargos/acessos. Gestor possui consulta a todos os módulos, exportação geral e acesso completo a Relatórios; pode conceder acessos de qualquer módulo a outros colaboradores, inclusive alterações que não possui para uso próprio, mas não altera os próprios acessos nem atribui cargos. Colaborador somente usa os acessos recebidos e não concede cargos ou permissões. Atribuição de cargos permanece com Administrador.

Segundo o usuário, somente Administrador existe atualmente. Criar Gestor e Colaborador faz parte da implementação futura; nenhuma conta foi alterada agora. Contrato e aceite em [cargos](contracts/roles.md). A autoridade de concessão do Gestor é independente de seus acessos de uso.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Acesso interno seguro (Priority: P1)

Como usuário interno, quero entrar no sistema e visualizar somente os módulos e ações para os quais
tenho permissão, para executar meu trabalho sem expor funções ou dados indevidos.

**Why this priority**: Nenhuma outra capacidade administrativa pode ser disponibilizada sem uma
identidade confiável e autorização consistente.

**Independent Test**: Pode ser testada com contas ativas, inativas e com permissões distintas,
confirmando que cada ação protegida permite ou nega acesso conforme a matriz aprovada.

**Acceptance Scenarios**:

1. **Given** uma conta ativa com credenciais válidas, **When** o usuário conclui a autenticação,
   **Then** ele acessa apenas as áreas e ações expressamente concedidas.
2. **Given** uma conta sem permissão para uma ação, **When** o usuário tenta executá-la por qualquer
   caminho disponível, **Then** a ação é negada sem revelar dados protegidos. Se não
   possui acesso ao módulo, ele também não aparece na barra lateral, na busca ou no Início.
3. **Given** uma conta inativa ou uma sessão revogada, **When** o usuário tenta acessar uma área
   protegida, **Then** o acesso é negado e o evento de segurança é registrado.
4. **Given** uma conta administrativa válida, **When** autentica por e-mail/senha,
   **Then** acessa somente operações concedidas; não há segundo fator, retirado por decisão do usuário.

---

### User Story 2 - Administração de usuários e permissões (Priority: P2)

Como administrador autorizado, quero criar, atualizar, desativar e atribuir funções e permissões a
usuários, para manter o acesso alinhado às responsabilidades reais de cada pessoa.

**Why this priority**: A operação depende de conceder e retirar acessos com menor privilégio e sem
usar o nome do cargo como autorização ampla.

**Independent Test**: Pode ser testada administrando uma conta de teste, alterando permissões
concretas e verificando que as novas concessões e revogações passam a valer e ficam auditadas.

**Acceptance Scenarios**:

1. **Given** um administrador com permissão de gestão de acesso, **When** ele cria uma conta com as
   funções aprovadas, **Then** a conta recebe somente as permissões associadas e permanece
   rastreável.
2. **Given** um Gestor sem permissão de alteração em um módulo, **When** concede esse acesso a outro
   Colaborador, **Then** a concessão funciona sem ampliar o acesso do Gestor; tentar alterar
   os próprios acessos ou atribuir cargos é recusado.
3. **Given** uma conta ativa, **When** um administrador autorizado a desativa, **Then** novas ações e
   sessões da conta são impedidas imediatamente.
4. **Given** uma alteração sensível de acesso, **When** o administrador a confirma sem
   preencher justificativa, **Then** a alteração é aplicada e registrada com autor, momento e valores
   permitidos antes e depois.

---

### User Story 3 - Investigação por auditoria (Priority: P3)

Como auditor autorizado, quero pesquisar eventos críticos e seus contextos sem poder alterá-los,
para identificar quem fez cada mudança e apoiar investigações e conformidade.

**Why this priority**: A rastreabilidade é requisito central do produto e precisa existir antes da
entrada dos demais módulos de negócio.

**Independent Test**: Pode ser testada executando alterações críticas conhecidas e confirmando que
um auditor encontra uma sequência completa, imutável e livre de segredos.

**Acceptance Scenarios**:

1. **Given** uma alteração crítica concluída, **When** um auditor autorizado pesquisa pelo período,
   ator, ação ou entidade, **Then** encontra o evento com contexto suficiente para reconstruir o que
   ocorreu.
2. **Given** um evento de auditoria existente, **When** qualquer usuário tenta editá-lo ou excluí-lo,
   **Then** a operação é recusada.
3. **Given** uma alteração que envolve campos sensíveis, **When** o evento é consultado, **Then**
   senhas, tokens e dados pessoais desnecessários não aparecem.
4. **Given** um usuário sem permissão de auditoria, **When** ele tenta pesquisar ou exportar eventos,
   **Then** nenhum dado de auditoria é retornado.

---

### User Story 4 - Área administrativa acessível e consistente (Priority: P4)

Como usuário interno, quero uma estrutura administrativa clara, responsiva e acessível, para
navegar, compreender estados e concluir tarefas com teclado, leitor de tela ou interação visual.

**Why this priority**: A fundação visual será reutilizada pelos módulos posteriores e acessibilidade
faz parte do aceite desde o início.

**Independent Test**: Pode ser testada nas telas de autenticação, navegação e administração de
usuários por inspeção de contraste, foco, semântica, teclado e nomes acessíveis.

**Acceptance Scenarios**:

1. **Given** um usuário que navega somente por teclado, **When** ele percorre a autenticação, o menu e
   a gestão de usuários, **Then** todos os controles ficam alcançáveis, identificáveis e com foco
   visível.
2. **Given** uma mensagem de sucesso, aviso ou erro, **When** ela é apresentada, **Then** seu
   significado não depende apenas de cor ou ícone.
3. **Given** uma tela em desktop ou tablet suportado, **When** o espaço disponível muda, **Then** o
   conteúdo essencial continua legível e operável sem perda de ações.

---

### User Story 5 - Operação resiliente e observável (Priority: P5)

Como responsável pela operação, quero acompanhar saúde, erros e trabalhos assíncronos, para detectar
falhas, evitar efeitos duplicados e restaurar o serviço com segurança.

**Why this priority**: A fundação precisa tornar falhas visíveis e controláveis antes que processos
de publicação, arquivos e integrações dependam dela.

**Independent Test**: Pode ser testada submetendo trabalhos repetidos, simulando falhas e verificando
progresso, tentativas, resultado terminal, correlação e mensagens seguras.

**Acceptance Scenarios**:

1. **Given** o mesmo pedido assíncrono recebido mais de uma vez, **When** ele é processado, **Then** o
   resultado esperado ocorre uma única vez sem efeitos duplicados.
2. **Given** uma falha recuperável, **When** uma nova tentativa é executada, **Then** o histórico de
   tentativas e o progresso permanecem disponíveis para o operador.
3. **Given** uma falha definitiva, **When** o trabalho atinge seu estado terminal, **Then** o operador
   recebe informação útil e correlacionável sem exposição de segredos ou dados pessoais
   desnecessários.
4. **Given** a indisponibilidade de um componente essencial, **When** a condição é detectada,
   **Then** a saúde operacional indica a degradação e permite identificar o componente afetado.

### Edge Cases

- O último administrador ativo não pode remover de si próprio o acesso necessário para recuperar a
  administração sem confirmação e mecanismo de recuperação autorizado.
- Uma revogação de permissão ou desativação de conta durante uma sessão ativa deve impedir a próxima
  ação protegida, mesmo que a interface ainda mostre conteúdo anterior.
- Credenciais inválidas devem negar acesso sem revelar dados da conta. Recuperação de senha
  permanece autorizada e auditada, sem exigir segundo fator, removido em 10/09/2026.
- A mesma solicitação repetida por timeout ou reenvio não pode criar contas, arquivos, eventos ou
  efeitos assíncronos duplicados.
- Se a auditoria obrigatória de uma ação crítica não puder ser registrada, a ação deve falhar de
  forma segura e informar um erro correlacionável.
- Arquivo com extensão permitida, mas conteúdo real inválido ou malicioso, deve ser rejeitado ou
  isolado antes de ficar disponível.
- Dados operacionais antigos em cache ou na interface não podem prevalecer sobre a fonte de verdade.
- Uma solicitação de descarte não pode remover dados sujeitos a obrigação legal de preservação; o
  conflito deve ser registrado e encaminhado ao responsável pela política aprovada.
- Tentativa de push direto ou merge não autorizado em `dev` ou `main` deve ser bloqueada pelas
  proteções do fluxo de entrega.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE exigir autenticação para toda área e ação interna.
- **FR-002**: O sistema DEVE validar autorização em cada ação protegida, negar por padrão e conceder
  somente permissões concretas necessárias. Módulos sem acesso devem ser totalmente
  omitidos da barra lateral, do menu de busca e da tela inicial, incluindo atalhos,
  resultados e cartões; não mostrar versões desabilitadas, cadeados ou convites para
  solicitar acesso nesses locais. URLs e ações diretas continuam protegidas no servidor.
- **FR-003**: O sistema DEVE autenticar administradores por e-mail e senha, com sessão ativa
  e autorização em cada ação. MFA foi removido em 10/09/2026 por reclamações, conforme
  confirmação de 17/09/2026 e spec 006; não reintroduzir sem nova decisão.
- **FR-004**: O sistema DEVE permitir encerramento de sessão pelo próprio usuário e revogação de
  sessões por administrador autorizado.
- **FR-005**: A desativação de uma conta ou revogação de acesso DEVE impedir novas ações protegidas
  imediatamente após a alteração.
- **FR-006**: Administradores autorizados DEVEM poder criar, consultar, atualizar e desativar contas
  sem excluir seu histórico auditável.
- **FR-007**: O sistema DEVE permitir que uma conta possua múltiplas funções e que cada função reúna
  permissões concretas por ação.
- **FR-008**: Concessão DEVE respeitar autoridade de gestão, distinta da permissão de uso.
  Administrador concede cargos e permissões a qualquer colaborador; Gestor concede acessos
  de qualquer módulo a outros colaboradores, inclusive alterações que não possui, sem alterar
  os próprios acessos/cargo ou atribuir cargos; Colaborador não concede nada.
- **FR-009**: Alterações sensíveis de contas, funções, permissões e sessões DEVEM exigir confirmação
  e autorização específica, sem campo ou exigência de justificativa.
- **FR-010**: Toda tentativa relevante de autenticação, revogação de sessão e mudança de acesso DEVE
  produzir evento de segurança pesquisável por pessoal autorizado.
- **FR-011**: Toda alteração crítica DEVE produzir evento de auditoria append-only com ator, ação,
  entidade, identificador, data, origem, identificador de correlação, sem exigir ou inventar justificativa humana. Motivos históricos permanecem legíveis.
- **FR-012**: Eventos de auditoria DEVEM preservar valores anteriores e posteriores somente quando
  permitidos e DEVEM redigir campos sensíveis.
- **FR-013**: A aplicação NÃO DEVE permitir alteração nem exclusão de eventos de auditoria.
- **FR-014**: Auditores autorizados DEVEM poder pesquisar auditoria por período, ator, ação e entidade
  e exportar resultados somente quando possuírem a permissão geral de exportação,
  combinada com acesso aos dados de Auditoria. A mesma permissão vale para todos os
  módulos, sempre limitada ao acesso já concedido e aos campos autorizados.
  Na transição, quem já possui alguma permissão de exportação recebe automaticamente
  a permissão geral. Isso permite exportar os demais módulos aos quais já tem acesso,
  sem conceder novos módulos. Quem não possui exportação não a recebe por essa conversão.
- **FR-015**: Senhas, tokens, cookies, segredos, arquivos completos e dados pessoais desnecessários
  NÃO DEVEM aparecer em auditoria, mensagens de erro ou registros operacionais.
- **FR-016**: O sistema DEVE manter uma única fonte persistente e autoritativa para identidades,
  permissões e auditoria, sem permitir que interfaces ou integrações substituam sua decisão final.
- **FR-017**: Registros auditáveis DEVEM preservar histórico e usar desativação ou exclusão lógica,
  exceto quando uma obrigação legal de descarte estiver documentada e autorizada.
- **FR-018**: O sistema DEVE validar arquivos por tipo permitido, extensão, conteúdo real, tamanho e
  verificação de segurança antes de disponibilizá-los.
- **FR-019**: Arquivos privados DEVEM ser acessíveis somente a identidades autorizadas e por tempo
  limitado, sem exposição por localização pública permanente.
- **FR-020**: Trabalhos assíncronos DEVEM aceitar identificação única, impedir efeitos duplicados e
  registrar progresso, tentativas e estado terminal.
- **FR-021**: Falhas assíncronas DEVEM ser correlacionáveis e apresentar informação operacional útil
  sem revelar segredos ou dados pessoais desnecessários.
- **FR-022**: Responsáveis pela operação DEVEM conseguir verificar a saúde dos componentes essenciais
  e identificar indisponibilidade, degradação, falhas repetidas e acúmulo de trabalhos.
- **FR-023**: A experiência administrativa inicial DEVE incluir autenticação, navegação por função,
  gestão de usuários e permissões, feedback de estado e acesso autorizado à auditoria.
- **FR-024**: Todas as telas da fundação DEVEM atender à WCAG 2.2 AA, incluindo contraste, teclado,
  foco visível, semântica e nomes acessíveis.
- **FR-025**: Estados e mensagens NÃO DEVEM depender exclusivamente de cor ou ícone para serem
  compreendidos.
- **FR-026**: O projeto DEVE usar uma linguagem visual única para ícones de interface, reservando
  símbolos próprios apenas para marcas e elementos institucionais.
- **FR-027**: Toda mudança da fundação DEVE passar por lint, verificação de tipos, testes aplicáveis,
  build e testes de autorização antes de ser aceita para integração.
- **FR-028**: O repositório de código DEVE possuir as branches protegidas `dev` e `main`; branches
  curtas de trabalho DEVEM abrir Pull Request para `dev`, e produção DEVE receber somente promoção de
  `dev` para `main`.
- **FR-029**: Commits e pushes diretos em `dev` e `main` DEVEM ser bloqueados, e o merge em `main`
  DEVE ser realizado exclusivamente por mantenedor humano após os gates obrigatórios.
- **FR-030**: Antes de qualquer promoção para produção, a organização DEVE aprovar um inventário de
  dados pessoais e uma política por categoria contendo finalidade, acesso, prazo de retenção,
  descarte ou anonimização e exceções de preservação legal; o sistema DEVE aplicar esses controles e
  produzir evidência auditável de sua execução. Q10 de 21/09/2026 mantém a definição
  institucional de prazos para cadastros, documentos e auditoria adiada; até essa
  definição e aprovação, o descarte automático permanece desligado. Esta decisão
  não aprova a política, não define retenção permanente e não dispensa o gate de produção.

- **FR-031**: Disponibilizar os cargos Administrador, Gestor e Colaborador conforme
  [contrato de cargos](contracts/roles.md), reutilizando identidades e vínculos existentes.
- **FR-032**: Administrador ativo DEVE possuir todas as permissões concretas dos módulos
  disponíveis, incluindo novas funções ao entrarem no catálogo, gestão e exportação;
  configuração individual não reduz esse conjunto. Sem contornar autenticação ou regras de domínio.
- **FR-033**: Gestor DEVE possuir consulta a todos os módulos, permissão geral de exportação
  e acesso completo a Relatórios por cargo. Nos demais módulos, mutações dependem de concessão
  adicional. Pode conceder qualquer acesso de módulo a outros colaboradores, inclusive mutações
  que não possui; NÃO DEVE alterar os próprios acessos/cargo nem atribuir cargos. A concessão
  a terceiro não acrescenta essas mutações ao próprio Gestor.
- **FR-034**: Colaborador NÃO DEVE conceder cargos ou permissões, inclusive por API;
  somente usa o que recebeu. Perder cargo privilegiado remove sua autoridade sem conservar
  privilégios por cópia permanente; preservar último Administrador, versão e auditoria.

### Key Entities *(include if feature involves data)*

- **Usuário**: Identidade autorizável, estado da conta, vínculos funcionais permitidos e histórico de
  acesso; não contém a permissão final como texto livre.
- **Função**: Agrupamento nomeado de responsabilidades que pode ser atribuído a múltiplos usuários.
- **Permissão**: Autorização concreta para uma ação e escopo determinados, concedida por meio de uma
  ou mais funções aprovadas.
- **Atribuição de acesso**: Relação auditável entre usuário, função, vigência e concedente;
  preservar motivos históricos existentes sem exigir novos.
- **Sessão**: Período autenticado associado a uma identidade, validade,
  revogação e contexto de segurança.
- **Evento de segurança**: Registro de tentativa de autenticação, revogação, bloqueio ou mudança de
  acesso relevante à proteção do sistema.
- **Evento de auditoria**: Registro imutável de uma alteração crítica, seu ator, alvo, momento,
  origem, correlação e valores permitidos antes e depois; motivos históricos permanecem legíveis.
- **Arquivo armazenado**: Metadados, classificação de acesso, integridade, estado de verificação e
  vínculo com o responsável ou processo que o originou.
- **Trabalho assíncrono**: Unidade de processamento com identidade única, progresso, tentativas,
  resultado terminal, correlação e erro seguro.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% das ações internas exercitadas nos testes de aceite negam acesso a usuários não
  autenticados ou sem a permissão necessária. Módulos sem acesso têm zero entradas
  na barra lateral, no menu de busca e na tela inicial, inclusive para quem possui
  somente a permissão geral de exportação.
- **SC-002**: Login, recuperação de senha e ações administrativas não solicitam MFA;
  100% dos cenários de sessão inválida/revogada ou permissão ausente negam a ação protegida.
- **SC-003**: 100% das alterações críticas previstas no escopo geram evento de auditoria completo e
  pesquisável, sem possibilidade de edição ou exclusão pela aplicação.
- **SC-004**: Nenhuma senha, token, cookie, segredo ou dado pessoal desnecessário é encontrado nas
  amostras de auditoria, erros e registros operacionais dos testes de segurança.
- **SC-005**: Pelo menos 90% dos administradores participantes do aceite conseguem criar, ajustar e
  desativar uma conta corretamente na primeira tentativa e em até 5 minutos.
- **SC-006**: Pelo menos 95% das execuções de login, abertura da navegação, listagem de
  usuários, gravação de alteração de usuário/permissão e pesquisa de auditoria apresentam resposta
  perceptível em até 2 segundos sob o perfil operacional aprovado e registrado no aceite,
  desconsiderando indisponibilidade externa identificada.
- **SC-007**: 100% dos trabalhos assíncronos repetidos nos cenários de retry concluem sem produzir
  efeitos de negócio duplicados e mantêm histórico de tentativas e resultado.
- **SC-008**: 100% das telas e jornadas da fundação passam pelos critérios aplicáveis de WCAG 2.2 AA
  nos testes automatizados e na revisão manual definida para o aceite.
- **SC-009**: 100% das mudanças aceitas para integração possuem evidência dos gates obrigatórios, são
  incorporadas por Pull Request em `dev` e chegam a `main` somente por promoção aprovada e merge
  humano.
- **SC-010**: Em todos os cenários simulados de falha de componente ou trabalho esgotado, o operador
  identifica a área afetada e o identificador de correlação em até 5 minutos.

- **SC-011**: Todos os seis cenários do contrato de cargos passam por UI/API/banco,
  incluindo Administrador com override vazio, nova permissão, Gestor com consulta global/exportação/Relatórios completos e sem escrita em outro módulo
  concedendo essa escrita a terceiro, autoconcessão negada e Colaborador sem poder de concessão.

## Assumptions

- “Repositório Dev e repositório main” significa um único repositório de código com branches
  protegidas `dev` e `main`, conforme a constituição e `docs/DELIVERY-WORKFLOW.md`.
- A branch original desta feature foi `feature/project-foundation`; novas entregas seguem a
  inicialização e configuração Git fora deste comando de especificação.
- Os perfis descritos no PRD formam a base para validação, mas a matriz concreta de permissões por
  ação será aprovada pelos gestores antes da liberação para uso real.
- A escolha do provedor de identidade depende do ambiente existente e será tomada no planejamento,
  preservando e-mail/senha, revogação, menor privilégio e autorização em cada ação, sem MFA.
- A política organizacional de retenção e classificação será aprovada pelo Jurídico ou DPO antes da
  entrada em produção. O planejamento não presume prazos; a promoção fica bloqueada até a política e
  seus controles verificáveis estarem implementados.
- O aplicativo móvel, o site externo e os fluxos completos de notícias, agendamentos, associados,
  parceiros e colaboradores estão fora desta feature; eles usarão esta fundação em especificações
  posteriores.
- A organização disponibilizará responsáveis humanos para aprovar permissões, revisar mudanças
  sensíveis e executar merges em `main`.
- Ambientes de desenvolvimento e produção terão dados, credenciais e integrações separados.

## Harmonização administrativa — 11/09/2026

A experiência administrativa existente passa a usar azul, branco e vermelho, com cores
equivalentes no modo escuro. Cabeçalhos, abas, buscas, filtros, botões e formulários seguem
componentes e estilos compartilhados; ações de adicionar têm ícone `+` e alvo de 48 px.
O atalho visível da busca é `Ctrl + K`. A logo preserva a transparência original e o botão
de recolher acompanha o menu fixo durante a rolagem.

A inicial apresenta atalhos autorizados, quatro notícias publicadas mais recentes,
rascunhos e cadastros sem análise. Próximos módulos aparecem como planejamento, sem
indicadores fictícios. A versão pública é usada nas notícias, sem expor revisões privadas.

Colaboradores é o nome da gestão de Usuários existente, conforme
[decisão de escopo](../../docs/EMPLOYEES-BOUNDARIES.md). Não existe nova área de RH.
Parceiros continua representando externos. Toda a linha das listas de pessoas abre o
perfil por link nativo, inclusive por teclado.

Implementação: componentes `ModuleNavigation`, `SearchField` e `FilterToggle` em
`apps/web/components/ui`; tokens e estilos globais; integração nas páginas existentes.
Validação: inspeção nos temas claro/escuro e 390 px, testes de navegação/autorização,
integração da seleção de notícias e gates do repositório. Evidências e limites em
`docs/VISUAL-REVIEW-2026-09-11.md`.

## Acessos individuais de Colaboradores — 11/09/2026

Nota de precedência em21/09: o relato abaixo é histórico. Administrador mantém todo o catálogo apesar de seleção individual; Gestor tem autoridade de concessão independente do próprio uso. Baseline editorial geral será removido. Valem FR-031–034 e contracts/roles.md.

Solicitação confirmada: selecionar módulos e ações individualmente no perfil do colaborador,
incluindo consultar Associados e editar Notícias; atualizar o PR #16 existente.

Critérios: matriz agrupada por módulo com rótulos simples e confirmação de
salvamento; seleção efetiva após recarregar; negativa também em rotas/serviços e navegação;
preservar acessos das contas existentes até edição explícita; nenhuma autoelevação, concessão
além da autoridade do operador ou remoção do último administrador capaz de gerir acessos.

Plano: migration aditiva `user_access` com conjunto explícito e versão. Sem configuração
individual, manter RBAC existente e acesso editorial anterior. Uma view de permissões efetivas
unifica leitura da sessão, identidade e serviços; com seleção individual, apenas as ações
selecionadas são concedidas. Perfis legados permanecem para histórico e compatibilidade.
Notícias passa a distinguir leitura, edição e publicação, com revalidação transacional.
Serviço de atualização bloqueia conta/concorrência, revalida o operador, valida dependências,
grava conjunto e auditoria na mesma transação e protege o último administrador.

Pesquisa: OWASP Authorization Cheat Sheet, consultada em 11/09/2026:
https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
Aplicar menor privilégio, negação por padrão para a seleção explícita e checagem no servidor
em cada requisição. UI isolada não autoriza. Alternativas rejeitadas: esconder somente menu;
criar um perfil compartilhado por combinação; alterar permissões de um perfil que afeta outras
contas. Compatibilidade editorial é limitada às contas sem seleção explícita, nunca um fallback
após uma permissão individual removida.

Validação: testes de contrato, rota/CSRF, banco descartável (revogação, autoridade, concorrência,
auditoria atômica, administrador), notícias somente leitura e E2E de seleção/recarregamento;
inspeção visual claro/escuro e 390 px. Não usar contas ou dados pessoais reais para mutações.

## Padrão de campos comuns — revisão de 11/09/2026

Máscaras e avisos de CPF/CNPJ, telefone brasileiro, CEP, UF, e-mail e site são
componentes/contratos compartilhados. Aplicar nos campos equivalentes existentes;
buscas textuais e links de conteúdo editorial não recebem máscara de contato.
Validar no preenchimento/saída e antes do envio, com erro associado ao campo,
valor preservado e limite explícito. Telefone tem DDD + oito/nove dígitos; CNPJ
mantém compatibilidade alfanumérica. Servidor usa o mesmo contrato nas mutações.
CEP permite consulta pontual automática, falha recuperável e correção manual,
sem transmitir dados da conta. Não reescrever dados persistidos em lote.
## Disponibilidade da infraestrutura de testes — revisão de 14/09/2026

A infraestrutura local/CI deve usar as imagens oficiais de MinIO e mc em Quay,
mantendo as versões fixadas e os mesmos volumes/contratos S3. O ajuste resolve
o pull recusado pelo Docker Hub, sem substituir o storage ou dispensar testes.

## Ampliação do PR #19 — 14/09/2026

Aplicar o padrão em todo o sistema, confirmado pelo usuário: campos de todas as
abas, filtros e diálogos usam rótulo associado, limites coerentes, indicação de
erro junto ao controle e correção sem perder o valor. Textos, seleções, datas,
senhas e arquivos mantêm seus contratos específicos; máscaras somente nos tipos
aplicáveis. OAB aceita apenas dígitos, até seis posições, na digitação/colagem e
no servidor. A busca mista por nome/CPF/OAB continua textual.

Todos os endereços físicos existentes oferecem rua, bairro, número e complemento
separados, além de CEP, cidade e UF. Número admite 12A e s/n. ViaCEP preenche
rua/bairro/cidade/UF separadamente, preservando número/complemento e correções
feitas durante a consulta. Texto legado permanece visível e preservado até
conversão explícita pelo operador. Sem dedução por vírgulas ou perda de dados.
API pública mantém endereço formatado compatível.

Critérios: validar campos em cada módulo e aba, colagem e correção, datas inválidas,
seleção obrigatória, texto vazio/espaços, CEP indisponível e corrida de respostas;
reabrir parceiro/unidade com as quatro partes persistidas e conferir endereço
legado sem edição. Testar teclado, Axe, claro/escuro e celular. PR #19 permanece
aberto, sem merge. A regra geral de justificativas é tarefa própria já registrada.

## Arquivos JPG — 14/09/2026

Todos os seletores que aceitam imagens devem listar `.jpg`, `.jpeg` e `.png` explicitamente, preservando PDF nos documentos. Ajuda e erros devem mencionar JPG. O servidor mantém o MIME `image/jpeg`, validação de assinatura, extensão, tamanho, checksum e antivírus.

## Justificativas de criação e alteração — 14/09/2026

A regra intermediária que dispensava motivo somente na criação foi substituída
pela decisão final de 14/09/2026: nenhuma ação exige campo de motivo ou
justificativa. Preservar autor, data, alterações e motivos históricos existentes,
além de autorização, confirmação, idempotência e controle de versão.
Aceite vigente: criar e alterar sem preencher/enviar motivo, sem esse controle
na interface. Não apagar dados históricos nem inventar explicação humana.

Acesso inicial do colaborador começa no instante de criação fornecido pelo banco, evitando diferença entre relógio da aplicação e relógio da transação que escondia os papéis na resposta imediata. Permissões e auditoria permanecem obrigatórias.

## Armazenamento no banco principal — 14/09/2026

Por decisão do usuário, os novos arquivos do fluxo compartilhado (imagens, documentos e
exportações) serão persistidos como bytes no PostgreSQL da aplicação, usando DATABASE_URL.
Uploads e downloads usam o domínio do painel; S3 deixa de ser obrigatório para novos arquivos.
Preservar contratos de intenção/finalização, limite de 25 MiB por upload, SHA-256, inspeção de
assinatura/MIME, antivírus, quarentena, permissões, auditoria e publicação por canal.
URLs temporárias devem expirar e vincular método e objeto. Conteúdo em quarentena, excluído
ou rejeitado nunca pode ser baixado. Upload finalizado não pode ser sobrescrito.
Arquivos antigos continuam acessíveis pelo adaptador S3 enquanto uma cópia verificável,
retomável e sem exclusão da origem os transfere para o banco. A migration é aditiva.
Serviços locais permanecem desligados; validação com banco descartável e navegador no CI.


## Regra vigente: nenhuma justificativa obrigatória — 14/09/2026

Decisão final do usuário: remover os campos de motivo/justificativa de todas as abas e sua obrigatoriedade no servidor. Abrange criação, edição, publicação, retirada, recuperação, arquivamento, acessos, situações, documentos, avaliações, configurações, exportações e reenvios. Esta decisão substitui as exigências anteriores, inclusive as exceções de primeira criação/publicação. Auditoria preserva ator, ação, data e alterações, sem inventar explicação humana. Dados históricos de motivo permanecem legíveis. Campos operacionais (fonte, resultado, condições e vigência), permissões, autenticação, concorrência e confirmação de ações permanecem. Aceite: jornadas funcionam sem preencher ou enviar motivo; nenhum controle de justificativa aparece na interface. Agendamentos possui primeira versão administrativa (spec 008), com app/site e expansões pendentes; OAB-BA permanece pendente da hospedagem.

## Armazenamento exclusivo no PostgreSQL — 15/09/2026

Decisão final do usuário substitui a transição S3 de 14/09: o site contém apenas dois
arquivos de teste e sua migração foi dispensada. Retirar MinIO, clientes S3, buckets,
configuração, ferramentas de migração e dependências obsoletas. PostgreSQL é o único
backend de upload/download e exportação. Preservar assinatura temporária, quarentena,
antivírus, autorização, limites, integridade e auditoria. Não modificar migrations já
aplicadas nem apagar registros/volumes como parte da atualização do código. Referências
legadas sem conteúdo no banco devem falhar de forma controlada; reenviar os arquivos de
teste se necessário. Remover o serviço remoto exige acesso operacional e conferência de
que não atende outros projetos; não declarar desligamento da VM por remover Compose.

## Busca geral por funções — 15/09/2026

Pedido do usuário: ampliar Buscar área para localizar qualquer função existente, incluindo OAB e benefícios.
Mostrar destinos específicos, rótulos em português e área de origem; reconhecer termos sem acentos,
maiúsculas/minúsculas e palavras em qualquer ordem. A consulta é sobre funções, não sobre dados pessoais.
Indexar subpáginas e tarefas que exigem escolha de cadastro, explicando essa etapa no resultado.
Somente destinos existentes e permitidos; cadastrar exige também escrita, leitura não concede mutação.
Manter Ctrl+K, teclado, celular e tema; nenhum serviço adicional nem consulta pesada no banco.
Aceite: OAB abre /members/oab; beneficios abre /partners/benefits; perfis sem leitura não encontram
essas funções; funções de conta e demais módulos existentes são encontráveis; Enter acessa o resultado.

## Navegação responsiva — 15/09/2026

- NV-F01 Ao abrir uma área dinâmica, mostrar carregamento acessível enquanto os dados chegam; manter o menu disponível e permitir escolher outro destino.
- NV-F02 A inicial deve disponibilizar cabeçalho/atalhos após autenticação e carregar publicações, rascunhos e associados independentemente. Uma consulta lenta ou falha não deve segurar as outras áreas.
- NV-F03 Quando a resposta de navegação ainda não chegou, indicar abertura no link acionado sem deslocar controles, bloquear teclado ou alterar comportamento de nova aba.
- NV-F04 Preservar conteúdo, permissões, validação atual de sessões, filtros, erros e recursos aceitos. Estados temporários não exibem dados pessoais nem concedem acesso.
- Aceite: testes com atraso controlado provam feedback antes da conclusão, independência dos blocos, navegação interrompível e manutenção do shell; validar teclado,390 px, claro/escuro, motion reduzido e regressões de autorização no CI.

## Contraste durante troca de tema — 16/09/2026

- TH-F01 Textos do menu lateral (incluindo item ativo) e da busca devem manter contraste de pelo menos 4,5:1 em cada quadro da troca claro/escuro, além dos estados finais.
- Aceite: medir ambos os sentidos da troca com requestAnimationFrame e repetir o fluxo móvel/desktop de Agendamentos com axe, sem suprimir regras nem adicionar espera para ocultar a falha.

- TH-F02 Textos herdados da página, incluindo detalhes e histórico de reserva, devem acompanhar imediatamente as superfícies do tema. Cobrir esses textos na medição por quadros da jornada real de Agendamentos.


## Edições durante navegação — decisão de 16/09/2026

- Preservar campos, seleções e alterações pendentes ao consultar outra aba ou módulo e voltar,
  separados por formulário e registro, sem gravação automática no servidor.
- Salvar com sucesso, cancelar/descartar explicitamente ou encerrar a sessão encerra a edição.
  Falhas de validação/rede conservam os dados; manter as proteções de versão/autorização.
- Compartilhar a infraestrutura do painel e validar ida/volta, sem misturar registros ou usuários.

## Homologação e prontidão — 16/09/2026

Pedido atual: proteções remotas, promoção/privacidade, implantação de arquivos e conciliação documental. Validar evidências reais, preservar dados existentes e não declarar concluída uma aprovação institucional ausente. Homologação da OAB depende da inscrição autorizada e do resultado esperado; descarte não executa sem política aprovada.

## Integração de Mensagens — 16/09/2026

Mensagens participa da navegação autorizada, busca global e título de seção no cabeçalho, usando o mesmo shell. Requisitos próprios em [009-messaging](../009-messaging/spec.md).

## Ordem de módulos — 16/09/2026

Pedido explícito do usuário: Notícias primeiro (após Início), Mensagens penúltimo imediatamente antes de Auditoria; manter utilidades da conta. Compartilhar ordem entre navegação e catálogo de áreas. Agendamentos de Mensagens na busca de funções.

## Senha inicial de colaboradores — decisão de 17/09/2026

Novos colaboradores recebem palavra aleatória em português sem acentos, com inicial maiúscula e pelo menos seis letras, seguida de exatamente seis dígitos (inclusive zeros iniciais). Cadastro, hash da credencial e auditoria são atômicos. A senha é mostrada somente na resposta inicial ao administrador, com mostrar/ocultar, copiar e abrir cadastro. Não enviar e-mail automaticamente nem guardar senha em logs, auditoria, rascunhos, URL ou storage. Repetição idempotente não troca nem reapresenta senha; orientar recuperação se a resposta original foi perdida.

Para a única conta antiga sem senha informada pelo usuário, oferecer geração inicial no detalhe somente se não houver credencial de senha. Exigir sessão ativa, users:create/users:update/roles:grant, destinatário ativo e acessos contidos na autoridade atual do gestor. Proibir autogeração e substituição de senha existente. Não executar backfill em lote nem incluir e-mail real no código.

Aceite: criação pela interface seguida de login com a senha gerada; recuperação disponível; negações, idempotência, concorrência, rollback e ausência de segredo em consultas/auditoria testados. UI desktop/mobile e acessibilidade no padrão existente.

Revisão de vocabulário solicitada em 17/09/2026: lista permitida revisada de 252 palavras. Removidos nomes de animais usados como insultos, referências corporais, palavras ambíguas e termos pouco familiares. Não identificados termos ofensivos na lista remanescente; variação regional impede garantia universal. Novas palavras exigem revisão humana. Regressão impede reintroduzir os exemplos removidos. Não gerar palavras livremente nem consultar dicionário remoto em runtime.


Checkpoint de 21/09/2026 — plan concluído: desenho, pesquisa, modelo, contratos e
roteiro atualizados. Nenhum código, serviço, migration ou teste de aplicação executado.
Tarefas serão detalhadas em seguida; políticas e funções adiadas permanecem pendentes.

Checkpoint de 21/09/2026 — tasks concluídas: 23 tarefas novas (T098–T120), com histórias, dependências, caminhos e aceite; nenhuma implementação/teste de aplicação executado. Ver tasks.md.

Checkpoint final de21/09/2026 — plan seguido de tasks encerrados. Conferência
documental de IDs, fases, links e preservação do histórico concluída; código,
testes de aplicação e homologações não executados. Próximo passo recomendado:
análise cruzada antes da implementação. Detalhes no relatório do programa002.

Checkpoint I1 de21/09/2026: três cargos e limites de autoridade definidos pelo usuário; Gestor tem consulta global, exportação geral e Relatórios completos; pode conceder a terceiros alterações que não possui. Plan/modelo/contratos/tasks atualizados; implementação e validação pendentes. U1/C1 em esclarecimento, D1 autorizado separadamente.

Complemento final I1 — 21/09/2026: Gestor possui consulta a todos os módulos, exportação geral e acesso completo a Relatórios. Pode conceder a terceiros alterações de outros módulos que não possui, sem autogestão. Plan/tasks/contrato conciliados; implementação pendente. D1 corrigido documentalmente; U1/C1 aguardam esclarecimento.

Checkpoint I3 — 21/09/2026: correção documental autorizada após o segundo analyze. O contrato de cargos agora referencia as decisões aprovadas de U1/C1 e seus documentos de aceite, substituindo a indicação desatualizada de esclarecimento pendente. Nenhuma regra de cargos alterada; implementação e testes de aplicação permanecem pendentes.


## Consolidação de segurança — 21/09/2026

Correção preparada em 17/09 incorporada nesta entrega: cadastro público por e-mail bloqueado, provisionamento sintético dos testes sem endpoint de cadastro e atualizações de dependências preservadas. A remoção anterior da dependência direta de Payload no worker foi mantida; o uso existente fica em packages/news. Nenhuma migration ou alteração de infraestrutura retirada anteriormente foi reintroduzida. As decisões do clarify e as 108 tarefas novas continuam planejadas, sem execução implícita. Validação do conjunto conciliado em andamento; localhost permanece desligado. Evidências: [segurança](../001-project-foundation/evidence/security-hardening-2026-09-17.md).
