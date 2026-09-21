# Feature Specification: Módulos integrados CAAB

## Checkpoint de revisão de código — 21/09/2026

Clarify encerrado. Início já possui rascunhos e cadastros sem análise; Meu trabalho é parcial. Relatórios inicial está implementado em 010. T022–T026 são históricas; T051/T052/T054 remetem à execução inicial de 010. Novas exportações, permissões, app/site, portal e validação integrada continuam pendentes. DOC01 cobre a conciliação documental desta revisão.

Revisão estática da base `ed31baf`; nenhum teste de aplicação ou homologação nesta etapa.
Evidências e limites: [revisão transversal](../002-integrated-modules/code-audit-2026-09-21.md).

**Prioridade de 18/09/2026:** evolução administrativa de Agendamentos com FullCalendar,
conforme spec 008, antecede app/site. Esta decisão substitui a prioridade histórica
de 15/09 abaixo, sem ampliar os demais módulos ou integrações.

**Decisão vigente — 21/09/2026:** a finalidade de Mensagens foi confirmada: comunicados e campanhas aos associados, com seleção de público e programação. O código existente continua sendo um protótipo, sem homologação do produto. A definição de finalidade substitui a pendência de 17/09; revisão de aderência do protótipo e critérios de continuidade permanecem em M016. Meios, provedores e envio real continuam adiados. Conversa interna do painel e suporte por tickets do app/site são possibilidades de módulos futuros separados, com nomes e funcionamento sujeitos a pesquisa posterior; não estão em implementação.

Colaboradores é a gestão atual de contas e permissões, nas rotas `/users`; não há cadastro separado de RH. Um módulo futuro chamado **Recursos Humanos** permanece como possibilidade, pendente de definição de finalidade, escopo e autorização de construção. Essa possibilidade não reativa os requisitos antigos COL-001–COL-005 nem autoriza duplicar contas ou permissões.

**Feature Branch**: `feature/product-direction` **Created**: 2026-09-09 **Status**: Escopo
consolidado; módulos administrativos existentes entregues; expansões e regras institucionais seguem por história.
**Input**: Incluir todos os módulos, evitar duplicatas, fundir Operações com Auditoria, atualizar
planejamento e começar implementação cedo.

**Organização atualizada**: Este documento é o escopo geral do programa. Cada funcionalidade nova
ganha spec próprio antes da implementação. A primeira é
[003 — Auditoria e Processamentos](../003-audit-operations/spec.md). Notícias inicia em
[004 — Notícias e publicação](../004-news-publishing/spec.md). Correções e mudanças de funções
existentes atualizam seus próprios specs; não criam novas especificações.

## Clarifications

### Session 2026-09-21

- Q: Quem poderá baixar/exportar dados em cada módulo? → A: Uma permissão geral de exportação, combinada com o acesso aos módulos. Quem só acessa Associados e Colaboradores só pode exportar esses módulos; a permissão não concede acesso a outros.
- Q: Como apresentar módulos para quem não tem permissão de acesso? → A: Ocultar completamente da barra lateral, do menu de busca e da tela inicial, como se não existissem para essa pessoa.

- Q: Quem já possui uma permissão antiga de exportação deve receber automaticamente a nova permissão geral? → A: Sim (B). Converter automaticamente quem já possui alguma permissão de exportação, mantendo acesso restrito aos módulos/dados autorizados. Segundo o usuário, atualmente só existem as contas de teste dele e do agente; não foi realizada auditoria de contas neste clarify.

- Q: Qual deve ser a finalidade principal do módulo Mensagens? → A: Comunicados e campanhas aos associados, com seleção de público e programação (A). Registrar separadamente duas possibilidades futuras, com nomenclatura a definir: conversa interna entre usuários do painel administrativo e suporte para usuários do app/site abrirem tickets, conversarem sobre problemas e receberem atendimento até a resolução. Pesquisar como esses módulos serão feitos e usados antes de definir escopo e construção.

- Q: Por quanto tempo os arquivos de exportação devem ficar disponíveis para baixar novamente? → A: Substituir essa jornada por download direto, sem prazo ou limite de exportação. Clicar em “Exportar [módulo]” abre tela de filtros (data, ordenação, ações, áreas, nomes e outros pertinentes); escolher Excel, CSV ou PDF inicia o download diretamente. Exportar todos os resultados autorizados dos filtros, sem limitar à página, quantidade de registros ou duração do período. Não exigir fila, histórico de arquivos ou retorno posterior para baixar.

- Q: Na tela de exportação, a pessoa poderá escolher quais colunas aparecerão no arquivo? → A: Sim (A), permitir selecionar e ordenar as colunas autorizadas, com uma seleção inicial adequada ao módulo, nos três formatos Excel, CSV e PDF.

- Q: Notícias e Agendamentos também devem exigir permissão de acesso por usuário? → A: Sim (A), exigir acesso concedido também a Notícias e Agendamentos. Substitui a liberação automática para qualquer conta administrativa; sem acesso, ocultar o módulo na barra lateral, busca e Início e negar rotas/ações privadas.

- Q: Em Notícias e Agendamentos, o acesso concedido deve liberar todas as operações ou separar consulta e alteração? → A: Separar consultar e alterar (B), preservando o padrão existente indicado pelo usuário; não unificar as permissões. Permissões adicionais já existentes, como publicar Notícias, permanecem.

- Q: A política de prazo para guardar cadastros, documentos e auditoria ficará para definição institucional posterior ou já existe uma política aprovada? → A: Definir posteriormente (A); manter o descarte automático desligado. Não estabelecer prazos nem declarar política aprovada nesta etapa.

- Q: As regras de quem pode ser dependente e quais documentos são obrigatórios também ficam para definição posterior? → A: Sim (A); definir posteriormente e manter o cadastro e a análise manual atuais. Não presumir critérios institucionais, obrigatoriedade documental ou aprovação automática.

Checkpoint de 21/09/2026: Q3–Q11 e complementos registrados. P01 de Associados adiada,
com operação manual atual preservada. Padrão de exportação
direta, formatos/colunas e regras de acesso definidos; retenção adiada à definição
institucional, com descarte automático desligado. Notícias já possui controles
separados no código; Agendamentos tem lacuna registrada. Implementações/validações
novas permanecem pendentes; este clarify não executou testes de aplicação.

## Cargos — decisão posterior ao analyze, 21/09/2026

Administrador tem todas as permissões concretas dos módulos disponíveis, atuais e futuros, incluindo exportação e gestão de cargos/acessos. Gestor possui consulta a todos os módulos, exportação geral e acesso completo a Relatórios; pode conceder acessos de qualquer módulo a outros colaboradores, inclusive alterações que não possui para uso próprio, mas não altera os próprios acessos nem atribui cargos. Colaborador somente usa os acessos recebidos e não concede cargos ou permissões. Atribuição de cargos permanece com Administrador.

Fonte e aceite: [001 cargos](../001-project-foundation/contracts/roles.md). Administrador tem exportação geral por cargo; a conversão Q4 permanece separada. Nenhuma conta ou permissão foi alterada nesta fase.

## User Scenarios & Testing

### Integração da agenda e contraste — 15/09/2026

O cabeçalho identifica Agendamentos nas rotas /scheduling. O menu da conta deve
manter contraste legível também durante a troca de tema, sem animar seu fundo
separadamente dos textos. Essa correção compartilhada foi identificada no E2E da spec 008.

### Prioridade após Agendamentos — 15/09/2026

Decisão do usuário: após a primeira versão funcional de Agendamentos no painel,
o próximo passo será a primeira versão da interface do usuário no app/site.
Essa etapa terá especificação própria antes do código e prioridade sobre as demais
expansões e módulos ainda pendentes. Reutilizar os dados e serviços existentes;
detalhar jornadas e contratos dos canais sem duplicar cadastros. Ver a sequência
vigente em [plan.md](plan.md). Este registro autoriza o planejamento da prioridade,
sem iniciar implementação ou alterar a suspensão de CAASSH.

### Definições vigentes de Agendamentos — 15/09/2026

**Planejamento incremental posterior:** a função agora tem spec própria
[008 — Agendamentos](../008-scheduling-management/spec.md). Etapa 1: operação
funcional no painel com oferta e horários, criação, consulta, remarcação e cancelamento.
Etapa 2: equivalência com legado e conexão real ao app/site. Etapa 3: novas funções
selecionadas entre sugestões. Etapa 1 integrada em dev; 002 mantém o mapa e as expansões futuras.

Correção posterior do usuário: funcionalidades ausentes do site antigo ficam como
sugestões (exemplo: controle de salas), sem aprovação implícita pela pesquisa.
Gerenciamento de horários deve explicitar funcionamento, expediente, almoço,
indisponibilidades, agenda extra, antecedência e janela de reservas. Conferir o
[inventário do legado](horarios-legado-2026-09-15.md); presença no código não comprova
funcionamento publicado nem aprova a cópia de regras ou falhas antigas.

US4 administra pela CAAB o serviço de agendamentos do app/site. Q8 de 21/09/2026
exige sessão administrativa válida e acesso concedido ao módulo, substituindo
a liberação automática por sessão. Sem restrição por unidade ou papel exclusivo
de gestor presumidos; autenticação e auditoria permanecem.

Escopo confirmado: unidades com um ou mais serviços, profissionais, procedimentos,
configuração de funcionamento/abertura e consulta/gestão de avaliações. Relações
detalhadas, políticas, ações de avaliação e primeira entrega ainda em discussão.
Cal.com é referência; não integrar salvo se nenhuma outra possibilidade for encontrada.
Esta decisão substitui a hipótese de administração independente por profissionais.

Ver [decisões do brainstorming](brainstorming-agendamentos.md) e
[pesquisa complementar](pesquisa-gestao-agendamentos-2026-09-15.md).
Primeira entrega autorizada pela spec 008; T022–T026 antigas continuam suspensas. A spec
deve validar sessão e acesso concedido a Agendamentos, recusa sem concessão,
ocultação nas três superfícies e auditoria de alterações, conforme Q8.

### Revisão de escopo — 14/09/2026

Referência histórica; as definições de 15/09 acima prevalecem.

**Esclarecimento posterior:** o produto permitirá aos profissionais configurar suas
reservas para barbearia, medicina, futevôlei, fisioterapia, psicologia, spa e zumba.
Restaurantes são apenas possibilidade futura. A autorização atual é exclusivamente
pesquisa e registro de conclusões para revisão posterior. Não implementar o módulo.
Ver [pesquisa de mercado](pesquisa-mercado-agendamentos-2026-09-14.md).

- O nome correto de US4 é **Agendamentos**. O usuário solicitou novo brainstorming
  porque a evolução será ampla. O desenho anterior é referência histórica, não escopo
  aprovado para implementação. Ver [brainstorming-agendamentos.md](brainstorming-agendamentos.md).
- US8 / **CAASSH está desativado — pendente de revisão**, por decisão do usuário.
  T041–T045 ficam suspensas. O painel informa esse estado sem link ou ação operacional;
  não criar concessões, saldo, rotas ou permissões durante a suspensão.
- Aceite: o painel identifica Agendamentos como “Em revisão de escopo” e CAASSH
  como “Desativado — pendente de revisão”, sem ações de navegação nos cartões.
  Os demais módulos mantêm seu estado de planejamento.

Prioridades indicam dependências internas; todas as histórias pertencem à mesma entrega. Testes de
autorização, integridade, contratos e acessibilidade são obrigatórios conforme o risco.

| História / prioridade                 | Jornada e razão da ordem                                                                                                | Teste independente / cenários de aceite                                                                                                                                                                                           |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| US1 / P1 — Auditoria e Processamentos | Encontrar eventos e jobs numa área; elimina duplicação existente e permite início imediato.                             | Com eventos e jobs, uma área e duas subáreas; só jobs acessa Processamentos e não eventos; só eventos não acessa jobs; nenhum não vê a área. URLs anteriores chegam ao mesmo registro. Exportação mantém sua autorização própria. |
| US2 / P1 — Conteúdo                   | Criar notícias, mídia, destaques, versões e publicar/programar; usa fundação pronta.                                    | Rascunho não altera versão pública; prévia é privada; publicação segue política editorial, canal e vigência; repetição não duplica distribuição e falha é acompanhável.                                                           |
| US3 / P1 — Pessoas                    | Cadastrar associados/dependentes, analisar documentos, explicar situação; sustenta atendimento e comunicação.           | Correção documental preserva evidências válidas; vínculo possui histórico; cadastro, vínculo, OAB, situação financeira, credencial e restrições são dimensões distintas; sem política/fonte não há decisão automática presumida.  |
| US4 / P2 — Agendamentos               | Configurar oferta, unidade, recursos e exceções; reservar, remarcar e registrar desfecho; depende de Pessoas.           | Disputa simultânea não excede capacidade; alteração de disponibilidade revela reservas afetadas; cancelamento/remarcação/presença/falta preservam motivo/histórico; avaliação mantém opinião original.                            |
| US5 / P2 — Benefícios                 | Manter parceiros, unidades, contratos, ofertas e avaliações; prepara o portal.                                          | Oferta sem condições obrigatórias não publica; vencida não aparece vigente; ocultar não exclui histórico; moderação não reescreve opinião.                                                                                        |
| US6 / P2 — Equipe e acesso            | Colaborador, conta, grupos/funções e escopo; reutiliza acesso existente.                                                | Colaborador pode existir sem login; vincular conta existente não cria duplicata; permissões efetivas são explicáveis e restritas; recuperação e sessões preservam segurança.                                                      |
| US7 / P2 — Mensagens                  | Público, modelos, prévia, programação e resultados; depende de contatos/eventos.                                        | Exclusões/preferências são revalidadas ao enviar; repetição não duplica; aceitação/entrega/leitura têm evidências distintas; canal não configurado não confirma envio real.                                                       |
| US8 / P2 — Créditos                   | Configurar Caassh, conceder individualmente/em lote, consultar extrato e corrigir; depende de política e beneficiários. | Com política sintética explícita, lote repetido não duplica saldo; correção referencia original. Sem política não há conversão ou concessão real presumida.                                                                       |
| US9 / P3 — Portal                     | Parceiro opera solicitações avulsas/QR limitadas à sua organização; depende de parceiro/conta.                          | Parceiro A não consulta registros/arquivos de B por mudança de identificador; QR identifica solicitação, não comprova pagamento.                                                                                                  |
| US10 / P3 — Meu trabalho e relatórios | Resolver pendências reais e exportar dados autorizados; depende dos domínios.                                           | Indicador tem período/significado e remete aos registros que o compõem; filtros, campos e escopos preservados na exportação; dados não são duplicados em cadastro paralelo.                                                       |

### Edge Cases

- Perfis só de eventos, só de jobs, só de exportação, combinados e sem acesso.
- Registro ausente/identificador inválido; permissão revogada durante operação.
- Edição concorrente, reserva concorrente, comando/lote repetido e worker indisponível.
- Fonte institucional divergente, política ausente, documento rejeitado e preservação legal.
- Oferta/credencial vencida, exceção com reservas existentes e mensagem sem confirmação.
- QR sem liquidação e tentativa de acesso entre organizações.

## Requirements

### Functional Requirements

- **FR-001**: Incluir US1–US10 e todas as funções do [mapa](../../docs/MODULES.md) no escopo
  integrado.
- **FR-002**: Reutilizar contas, permissões, arquivos, jobs, idempotência e auditoria existentes.
- **FR-003**: Mostrar uma área Auditoria com Eventos/Processamentos, preservando suas permissões
  independentes.
- **FR-004**: Um responsável por registro de domínio; portal e relatórios usam os mesmos dados
  autorizados.
- **FR-005**: Implementar jornadas completas conforme os critérios de cada história, com
  persistência e histórico.
- **FR-006**: Condicionar consequências institucionais à política definida, sem inferir
  regras do legado/mercado. Q11 adia critérios de dependentes e documentação mínima;
  manter cadastro e análise manual atuais em Associados (005 FR-006/P01), sem nova
  exigência documental ou aprovação/reprovação automática presumida.
- **FR-007**: Proteger alterações/exportações/reenvios com autorização, auditoria
  e idempotência, sem campo ou exigência de justificativa.
- **FR-008**: Usar contratos novos/formalmente fornecidos e explicitar integração indisponível.
- **FR-009**: Validar autorização, integridade, teclado, nomes acessíveis e responsividade nos
  fluxos alterados.
- **FR-010**: Separar cadastro, vínculo, OAB, finanças, credencial e elegibilidade por finalidade.
- **FR-011**: Prever o aplicativo mobile como consumidor das funções destinadas a ele. Cada spec
  deve indicar destinos, dados expostos, contrato e autorização do consumidor. Site e app são
  canais independentes; disponibilizar conteúdo não implica enviar notificação push. Reutilizar os
  registros do domínio, sem criar cadastros paralelos para o mobile.

- **FR-012**: Oferecer exportação mediante uma permissão geral, combinada com acesso
  ao módulo e aos dados exportados. Não exigir uma permissão de exportação por módulo.
  A permissão geral sozinha não concede consulta, acesso a Relatórios ou visibilidade
  de módulos. Aplicar também a Auditoria e Relatórios, preservando restrições de dados.
  Converter automaticamente permissões de exportação existentes na permissão geral,
  habilitando exportação nos módulos já acessíveis, sem alterar suas permissões de
  leitura. Quem não tem permissão de exportação não a recebe por essa conversão.
- **FR-013**: Ocultar completamente módulos sem acesso na barra lateral, no menu de
  busca e na tela inicial; não exibir cartões desabilitados, cadeados ou atalhos.
  Chamadas diretas continuam sujeitas à autorização no servidor. Notícias e
  Agendamentos também exigem acesso concedido; sessão administrativa sozinha não basta.
  Q9 preserva consultar e alterar separadamente nesses módulos; alteração depende
  de consulta, que controla sua descoberta. Preservar publicação separada existente
  em Notícias; não trocar controles atuais por uma permissão única.

- **FR-014**: Mensagens prepara comunicados e campanhas para associados. Registrar como
  possibilidades futuras distintas (nomes provisórios, não nomes finais): conversa
  interna entre usuários do painel administrativo; suporte para usuários do app/site
  abrirem tickets e conversarem com a equipe até a resolução do problema. Antes de
  definir construção, pesquisar finalidade operacional, uso, jornadas, permissões,
  integração app/site e alternativas técnicas, com fontes oficiais e decisão registrada.
  Nenhum desses dois candidatos ganha spec própria, código ou integração nesta etapa;
  cada um terá spec, plano e tarefas próprios se sua construção for aprovada.

- **FR-015**: Cada módulo autorizado oferece “Exportar [nome do módulo]”, abrindo
  uma tela de filtros adequados aos seus dados, como data/período, ordenação, ações,
  áreas e nomes. Preservar contexto da consulta e permitir ajustar filtros; oferecer
  botões “Exportar em Excel”, “Exportar em CSV” e “Exportar em PDF”. Escolher o
  formato inicia diretamente o download, sem uma etapa posterior de buscar arquivo
  em fila ou histórico e sem prazo de disponibilidade para baixá-lo.
  Excel (.xlsx), CSV (.csv) e PDF (.pdf) são os três formatos obrigatórios de todas
  as exportações, em todos os módulos existentes e futuros e suas abas; não selecionar
  um subconjunto por função. Na mesma tela, permitir selecionar e ordenar as colunas
  autorizadas, partindo de uma seleção inicial adequada ao módulo. Excel/CSV/PDF
  respeitam exatamente essa seleção e ordem; campos desmarcados não são exportados.
  Exceção explícita de 21/09/2026: Consulta OAB não terá botão nem exportação própria
  do resultado, avulso ou pelo cadastro; os dados cadastrais autorizados permanecem exportáveis.
  Padrão em [EXPORT-STANDARD](../../docs/EXPORT-STANDARD.md).
- **FR-016**: Exportar todos os resultados autorizados dos filtros, sem teto funcional
  de registros, páginas ou duração do período; nunca truncar silenciosamente. Falhas
  são explícitas, preservam filtros e permitem repetir. Autenticação, acesso ao
  módulo/dados e permissão geral de exportação continuam obrigatórios.

- **FR-017**: Conforme Q10 de 21/09/2026, manter prazos de retenção de cadastros,
  documentos e auditoria para definição institucional posterior e descarte automático
  desligado. Coordenar com 001 FR-030/T089; não inventar prazos nem tratar download
  direto de exportações como uma política de retenção dos dados originais.

### Key Entities

Identidade e colaborador; beneficiário e dependência; documento/análise/verificação/decisão;
conteúdo/versão/publicação; oferta/unidade/profissional/recurso/agendamento;
parceiro/benefício/contrato; avaliação/moderação; campanha/público/modelo/entrega; programa/conta de
crédito/lote/lançamento; solicitação do parceiro; evento/processamento/relatório. Relações não
implicam cópia de cadastros.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Barra lateral, menu de busca e tela inicial mostram no máximo uma entrada
  por área autorizada e zero entradas, cartões ou atalhos por módulo sem acesso.
- **SC-002**: Todos os perfis de US1 alcançam somente as subáreas permitidas nos cenários definidos.
- **SC-003**: Todos os cenários de US1–US10 passam antes da conclusão da entrega integrada.
- **SC-004**: Zero reservas excedentes, concessões duplicadas ou acessos entre parceiros nos testes
  negativos/concorrentes.
- **SC-005**: Todas as alterações críticas testadas têm histórico atribuível, sem segredos expostos.
- **SC-006**: Jornadas essenciais em teclado/largura reduzida preservam as ações e informações
  necessárias.

- **SC-007**: Conta com permissão geral de exportação e acesso somente a Associados e
  Colaboradores exporta apenas dados autorizados desses dois módulos. Sem a permissão
  geral, consulta autorizada permanece e exportação é negada. Ter a permissão geral
  sem acesso a módulos não permite exportar nem torna outros módulos visíveis.
  Conta com uma permissão antiga de exportação recebe a geral automaticamente e
  passa a exportar os módulos já autorizados; conta sem exportação não a recebe
  pela conversão. Repetir a conversão não duplica concessões nem altera acesso aos módulos.

- **SC-008**: Em cada módulo disponível, a jornada “Exportar [módulo]” → filtros →
  Excel/CSV/PDF entrega o download diretamente em cada um dos três formatos. Arquivos
  contêm todos os resultados autorizados, inclusive além da primeira página e dos
  limites antigos de 50 mil registros e 366 dias; não exigem download posterior em
  histórico. Selecionar um subconjunto e mudar a ordem das colunas produz exatamente
  essas colunas nessa ordem nos três formatos; a ordenação dos registros permanece
  independente. Sem permissão, nenhum caminho ou campo restrito expõe dados.
  C1 de21/09: nesta etapa validar com100 registros conforme o perfil de teste; não
  executar nem declarar provas de grande volume. O requisito funcional sem teto permanece.

## Assumptions

- US1 inicia já; os demais módulos continuam pendentes até implementação verificável.
- Política editorial, vínculo/documentos, elegibilidade, atendimento, créditos e portal são decisões
  rastreadas por história em research.md. Ausência bloqueia somente operação dependente, não US1.
- Desenvolvimento usa dados e políticas sintéticos explicitamente identificados, sem aprovação
  institucional implícita.
- Sem acesso ao legado/refações, contratação, migração ou alteração de produção/app/site.
- Um PR com código, testes e documentação apenas ao concluir a entrega; sem PR preliminar.

# Colaboradores, Usuários e Parceiros: decisão de escopo

Confirmado pelo usuário em 11/09/2026: Colaboradores no sistema antigo corresponde à
atual gestão de Usuários. Parceiros representa externos, como estabelecimentos e conveniados.
Não há módulo separado de equipe interna/RH no escopo atual. Recursos Humanos
é uma possibilidade futura, pendente de definição e autorização (17/09/2026).

A interpretação anterior de Colaboradores como cadastro de setor, cargo e situação funcional
foi descartada. COL-001–COL-005 e T032–T035 do programa 002, como definidos para RH,
foram retirados do escopo; não são tarefas implementadas.

A interface adota **Colaboradores** na mesma gestão de contas, rotas `/users`, identificadores
e permissões existentes. Menu, catálogo, busca, cabeçalho, página, ações e mensagens usam
o nome Colaboradores. A busca também reconhece o termo Usuários. Não há novo cadastro,
API ou migration para essa renomeação.

Esta decisão substitui as propostas anteriores de cadastro funcional separado no programa
002 e no PRD. Dependências de US6 usam a gestão de contas/RBAC existente.


## Regra vigente: nenhuma justificativa obrigatória — 14/09/2026

Decisão final do usuário: remover os campos de motivo/justificativa de todas as abas e sua obrigatoriedade no servidor. Abrange criação, edição, publicação, retirada, recuperação, arquivamento, acessos, situações, documentos, avaliações, configurações, exportações e reenvios. Esta decisão substitui as exigências anteriores, inclusive as exceções de primeira criação/publicação. Auditoria preserva ator, ação, data e alterações, sem inventar explicação humana. Dados históricos de motivo permanecem legíveis. Campos operacionais (fonte, resultado, condições e vigência), permissões, autenticação, concorrência e confirmação de ações permanecem. Aceite: jornadas funcionam sem preencher ou enviar motivo; nenhum controle de justificativa aparece na interface. Agendamentos segue agora a entrega incremental da spec 008; OAB-BA permanece pendente da hospedagem.

## Homologação e prontidão — 16/09/2026

Pedido atual: matriz de validação das jornadas já entregues, distinguindo módulos futuros. Validar evidências reais, preservar dados existentes e não declarar concluída uma aprovação institucional ausente. Homologação da OAB depende da inscrição autorizada e do resultado esperado; descarte não executa sem política aprovada.

## Mensagens — entrega de preparação em 16/09/2026

A pedido do usuário, US7 avançou antes da definição dos meios de envio. [Spec 009](../009-messaging/spec.md) implementa campanhas, modelos, públicos, preferências, prévia, programação e acompanhamento com permissão única messages:access. Entrega real, fornecedores e consentimento por canal permanecem etapa posterior. Não considerar callbacks ou métricas de entrega implementados.

Rodada de clarify encerrada em 21/09/2026: 11 perguntas respondidas e complementos
registrados. Decisões suficientes para atualizar o planejamento do recorte atual;
políticas adiadas e implementação continuam pendentes. Ver
[relatório de encerramento](clarify-result-2026-09-21.md), cobertura e checklists.


Checkpoint de 21/09/2026 — plan concluído: desenho, pesquisa, modelo, contratos e
roteiro atualizados. Nenhum código, serviço, migration ou teste de aplicação executado.
Tarefas serão detalhadas em seguida; políticas e funções adiadas permanecem pendentes.

Checkpoint de 21/09/2026 — tasks concluídas: 11 tarefas novas (T098–T108), com histórias, dependências, caminhos e aceite; nenhuma implementação/teste de aplicação executado. Ver tasks.md.

Checkpoint final de21/09/2026 — plan seguido de tasks encerrados. Conferência
documental de IDs, fases, links e preservação do histórico concluída; código,
testes de aplicação e homologações não executados. Próximo passo recomendado:
análise cruzada antes da implementação. Detalhes no relatório do programa002.

Checkpoint de 21/09/2026 — analyze em andamento: usuário determinou que a Consulta OAB não terá botão de exportação. Exceção registrada no padrão, specs, planos, contratos, tarefas existentes e roteiro; nenhuma tarefa executada, código alterado ou consulta externa realizada. A análise dos demais pontos continua sem correções automáticas.

Checkpoint de encerramento — 21/09/2026: analyze concluído sobre as dez funções e108 tarefas novas. A exceção de Consulta OAB foi registrada por pedido explícito e validada documentalmente. Restam quatro achados para conciliação antes da implementação: I1 concessão inicial de Agendamentos (alta); U1 autorização de arquivos antigos de Relatórios com dados de Agendamentos (alta); C1 critérios mensuráveis de desempenho das exportações (média); D1 identificador US4 duplicado em003 (média). Não aplicadas essas correções. Nenhuma nova violação constitucional explícita identificada no desenho; a pendência crítica anterior001 T096 permanece. Sem código, teste de aplicação ou localhost. Relatório detalhado apresentado na conversa; próximo passo: correções documentais autorizadas e nova análise.

Checkpoint após respostas I1/D1 — 21/09/2026: cargos/autoridade definidos no contrato001; I1 resolvido no desenho, implementação pendente. D1 corrigido: Auditoria mantém US4 para histórico legível e usa US5 para exportação. U1/C1 em esclarecimento, sem correções funcionais. Contagem permanece108 tarefas novas pendentes.

Complemento final I1 — 21/09/2026: Gestor possui consulta a todos os módulos, exportação geral e acesso completo a Relatórios. Pode conceder a terceiros alterações de outros módulos que não possui, sem autogestão. Plan/tasks/contrato conciliados; implementação pendente. D1 corrigido documentalmente; U1/C1 aguardam esclarecimento.

Checkpoint U1/C1 — 21/09/2026: correção U1 aprovada e detalhada em010/contracts/legacy-downloads.md; C1 ajustado por decisão do usuário à massa de100 registros em export-validation-100.md. I1 e D1 já conciliados. Achados respondidos documentalmente; implementação/testes de aplicação pendentes. Revalidar consistência do conjunto antes de implementar, sem usar este checkpoint como homologação.

Checkpoint I2/I3 — 21/09/2026: correções documentais autorizadas após o segundo analyze. A massa inicial permanece em 100 registros de entrada por cenário; listagens sem agrupamento conferem registros, e resumos/séries/agrupamentos conferem grupos, totais e valores calculados esperados, sem exigir 100 linhas de saída. O contrato de cargos referencia U1/C1 como decisões aprovadas. Conferência dos trechos e links locais e git diff --check concluídos sem falhas; nenhuma implementação ou teste de aplicação executado. As 108 tarefas novas permanecem pendentes. Próximo passo: implementação quando autorizada, preservando as dependências e pendências já registradas.


Checkpoint de entrega — 21/09/2026: usuário autorizou preparar PR e retirar cópias históricas locais após backup. Documentação atual registrada e segurança preparada conciliada nesta branch; sem iniciar as 108 tarefas novas de exportação/cargos/módulos. Conflitos de documentação preservam decisões atuais; validações da composição e PR pendentes. Sem merge ou localhost.
