# Feature Specification: Módulos integrados CAAB

**Feature Branch**: `feature/product-direction` **Created**: 2026-09-09 **Status**: Escopo
consolidado; módulos administrativos existentes entregues; expansões e regras institucionais seguem por história.
**Input**: Incluir todos os módulos, evitar duplicatas, fundir Operações com Auditoria, atualizar
planejamento e começar implementação cedo.

**Organização atualizada**: Este documento é o escopo geral do programa. Cada funcionalidade nova
ganha spec próprio antes da implementação. A primeira é
[003 — Auditoria e Processamentos](../003-audit-operations/spec.md). Notícias inicia em
[004 — Notícias e publicação](../004-news-publishing/spec.md). Correções e mudanças de funções
existentes atualizam seus próprios specs; não criam novas especificações.

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

US4 administra pela CAAB o serviço de agendamentos do app/site. Qualquer pessoa
com acesso válido ao painel administrativo pode consultar e alterar o módulo,
sem permissão adicional específica, papel de gestor ou restrição por unidade.
Autenticação e auditoria permanecem; não ampliar permissões dos demais módulos.

Escopo confirmado: unidades com um ou mais serviços, profissionais, procedimentos,
configuração de funcionamento/abertura e consulta/gestão de avaliações. Relações
detalhadas, políticas, ações de avaliação e primeira entrega ainda em discussão.
Cal.com é referência; não integrar salvo se nenhuma outra possibilidade for encontrada.
Esta decisão substitui a hipótese de administração independente por profissionais.

Ver [decisões do brainstorming](brainstorming-agendamentos.md) e
[pesquisa complementar](pesquisa-gestao-agendamentos-2026-09-15.md).
Primeira entrega autorizada pela spec 008; T022–T026 antigas continuam suspensas. A spec
deve validar acesso ao módulo por qualquer conta com acesso administrativo válido,
recusa sem esse acesso e auditoria de alterações, sem inventar concessão de Agendamentos.

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
- **FR-006**: Condicionar consequências institucionais à política definida, sem inferir regras do
  legado/mercado.
- **FR-007**: Proteger alterações/exportações/reenvios com autorização, justificativa quando
  aplicável e idempotência.
- **FR-008**: Usar contratos novos/formalmente fornecidos e explicitar integração indisponível.
- **FR-009**: Validar autorização, integridade, teclado, nomes acessíveis e responsividade nos
  fluxos alterados.
- **FR-010**: Separar cadastro, vínculo, OAB, finanças, credencial e elegibilidade por finalidade.
- **FR-011**: Prever o aplicativo mobile como consumidor das funções destinadas a ele. Cada spec
  deve indicar destinos, dados expostos, contrato e autorização do consumidor. Site e app são
  canais independentes; disponibilizar conteúdo não implica enviar notificação push. Reutilizar os
  registros do domínio, sem criar cadastros paralelos para o mobile.

### Key Entities

Identidade e colaborador; beneficiário e dependência; documento/análise/verificação/decisão;
conteúdo/versão/publicação; oferta/unidade/profissional/recurso/agendamento;
parceiro/benefício/contrato; avaliação/moderação; campanha/público/modelo/entrega; programa/conta de
crédito/lote/lançamento; solicitação do parceiro; evento/processamento/relatório. Relações não
implicam cópia de cadastros.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Menu, busca e dashboard mostram no máximo uma entrada por área autorizada.
- **SC-002**: Todos os perfis de US1 alcançam somente as subáreas permitidas nos cenários definidos.
- **SC-003**: Todos os cenários de US1–US10 passam antes da conclusão da entrega integrada.
- **SC-004**: Zero reservas excedentes, concessões duplicadas ou acessos entre parceiros nos testes
  negativos/concorrentes.
- **SC-005**: Todas as alterações críticas testadas têm histórico atribuível, sem segredos expostos.
- **SC-006**: Jornadas essenciais em teclado/largura reduzida preservam as ações e informações
  necessárias.

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
Não haverá módulo separado de equipe interna/RH.

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
