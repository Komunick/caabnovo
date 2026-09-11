# Feature Specification: Módulos integrados CAAB

**Feature Branch**: `feature/product-direction` **Created**: 2026-09-09 **Status**: Escopo
consolidado; implementação começa por US1; regras institucionais são entradas por história.
**Input**: Incluir todos os módulos, evitar duplicatas, fundir Operações com Auditoria, atualizar
planejamento e começar implementação cedo.

**Organização atualizada**: Este documento é o escopo geral do programa. Cada funcionalidade nova
ganha spec próprio antes da implementação. A primeira é
[003 — Auditoria e Processamentos](../003-audit-operations/spec.md). Notícias inicia em
[004 — Notícias e publicação](../004-news-publishing/spec.md). Correções e mudanças de funções
existentes atualizam seus próprios specs; não criam novas especificações.

## User Scenarios & Testing

Prioridades indicam dependências internas; todas as histórias pertencem à mesma entrega. Testes de
autorização, integridade, contratos e acessibilidade são obrigatórios conforme o risco.

| História / prioridade                 | Jornada e razão da ordem                                                                                                | Teste independente / cenários de aceite                                                                                                                                                                                           |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| US1 / P1 — Auditoria e Processamentos | Encontrar eventos e jobs numa área; elimina duplicação existente e permite início imediato.                             | Com eventos e jobs, uma área e duas subáreas; só jobs acessa Processamentos e não eventos; só eventos não acessa jobs; nenhum não vê a área. URLs anteriores chegam ao mesmo registro. Exportação mantém sua autorização própria. |
| US2 / P1 — Conteúdo                   | Criar notícias, mídia, destaques, versões e publicar/programar; usa fundação pronta.                                    | Rascunho não altera versão pública; prévia é privada; publicação segue política editorial, canal e vigência; repetição não duplica distribuição e falha é acompanhável.                                                           |
| US3 / P1 — Pessoas                    | Cadastrar associados/dependentes, analisar documentos, explicar situação; sustenta atendimento e comunicação.           | Correção documental preserva evidências válidas; vínculo possui histórico; cadastro, vínculo, OAB, situação financeira, credencial e restrições são dimensões distintas; sem política/fonte não há decisão automática presumida.  |
| US4 / P2 — Atendimentos               | Configurar oferta, unidade, recursos e exceções; reservar, remarcar e registrar desfecho; depende de Pessoas.           | Disputa simultânea não excede capacidade; alteração de disponibilidade revela reservas afetadas; cancelamento/remarcação/presença/falta preservam motivo/histórico; avaliação mantém opinião original.                            |
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
