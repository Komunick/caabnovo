# Módulos e responsabilidades

## Atualização do retrato de Agendamentos — 02/10/2026

Conferência documental por CODEX; solicitante mafaltti. O incremento administrativo de Agendamentos
está implementado na worktree própria e no PR #43, ainda aberto, com HEAD
ba9a6eaa21182acedf48384d425a0e6e4810541a na consulta desta revisão. Correções de segurança
identificadas no fechamento estão em validação pela frente responsável; checks de versões anteriores
não comprovam essas correções. Não declarar conclusão, homologação ou integração desse incremento em
dev.

A base integrada de referência continua 748539d, com migrations até 0030. As migrations 0031–0034 e
a permissão scheduling:review_absences pertencem à entrega de Agendamentos, ainda não integrada. Os
retratos anteriores de 4e9abac/WSL abaixo são históricos e não representam a ponta atual do PR.

**Pendência pós-integração:** após a integração autorizada do PR #43, atualizar MODULES e
spec/plan/tasks do programa 002 com o SHA efetivamente integrado, migrations e evidências vigentes.
Conferir primeiro o estado do PR e os resultados das correções; não marcar essa atualização como
concluída nesta entrega. Preservar HIN, DS/AC, contratos, autoria e homologações pendentes.

## Retrato anterior das quatro instâncias — primeira consolidação de 02/10/2026

Agendamentos, Relatórios, Documentação e Acessos são quatro instâncias independentes; Agendamentos
tem prioridade máxima. Este é um retrato datado, não uma fila de execução ou autorização de
serviços.

| Instância    | Estado confirmado e próximo limite                                                                                                                                                                                                                                                                                         |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Agendamentos | Base local 4e9abac e correção posterior de compatibilidade no aviso de cancelamento sem horário. T109 concluída; T107, PostgreSQL/E 2E/revisão visual pendentes por WSL. Os 727 testes/build anteriores não validam a correção SQL posterior. Não tentar recuperar WSL ou iniciar serviços por este registro.              |
| Relatórios   | Implementação local dos modos restantes e gates estáticos registrados na frente 010. PostgreSQL/E 2E/a11y/C1 e QA humano pendentes; Retomar validações de Relatórios bloqueadas pelo WSL (CAAB-46) registra a retomada. Conferir o filtro de cancelamentos sem horário recebido da frente 008 antes da validação conjunta. |
| Documentação | Consolidação transversal/DS e revisão AC reunidas nesta entrega; commit, push e PR para dev autorizados pelo usuário neste fechamento, sem merge. A autorização substitui apenas o impedimento anterior de publicação desta entrega.                                                                                       |
| Acessos      | Revisão documental concluída e incorporada aqui pela coordenação: 66 acréscimos e matriz AC01–AC14. G01/AC-T002, G02/G03/AC-T003–AC-T004, P01/AC-T005 e validação AC-T006 continuam pendentes. Não abrir PR duplicado da revisão; correções funcionais seguem a frente própria.                                            |

A conciliação preserva DS-T133–DS-T140, AC-T001–AC-T006, IDs originais de cargo único e roles.md. Os
31 unitários/28 contratos de acessos são evidência da instância na base 748539d, não nova execução
nesta versão documental. T099 e homologações continuam abertas. Ver a
[conciliação de acessos](../specs/001-project-foundation/evidence/documentation-access-conciliation-2026-10-02.md).

Agendamentos mantém modelo/migrations 0031–0034 e scheduling:review_absences. Na futura conciliação
funcional, preservar seu modelo de reservas junto ao gerador agrupado de Relatórios; conferir
runtime.ts, export-screen.tsx, repositories/reports.ts, report-summary.ts e
report-overview-export.ts. A compatibilidade foi revisada sem serviços; testes anteriores não
comprovam o conjunto futuro. E-mails operacionais continuam adiados por inexistência do serviço, sem
alterar destinatários e finalidade já definidos. A fila ativa permanece somente no caderno
principal.

Conciliação documental em 02/10/2026 sobre a base integrada `748539d`, conferida por fetch. Este
mapa orienta a navegação; critérios e estado detalhado pertencem às specs. Código integrado,
implementação local, validação técnica, homologação humana e implantação são estados distintos. A
revisão não confirma deploy nem modifica tickets. Procedência e limites na
[evidência da consolidação](../specs/001-project-foundation/evidence/documentation-consolidation-2026-10-02.md).

| Área                                     | Base integrada                                                                                                                                                           | Restante e fonte responsável                                                                                                                                                                                                                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fundação / Colaboradores                 | Contas, sessões, Administrador/Gestor/Colaborador, acessos individuais, cargo único, promoção, exportação direta e preservação de conflitos. Cadastro público bloqueado. | Preparação de aceite humano em frente própria; decisão para contas sem cargo. [001](../specs/001-project-foundation/tasks.md), [cargos](../specs/001-project-foundation/contracts/roles.md).                                                                                        |
| Conta                                    | Perfil, e-mail, senha, recuperação e sessões.                                                                                                                            | Entrega/homologação de e-mail dependem do serviço; [006](../specs/006-account-settings/tasks.md).                                                                                                                                                                                   |
| Auditoria / Processamentos               | Eventos, jobs/reenvio e revalidação de autorização do worker/download legado.                                                                                            | Download direto Excel/CSV/PDF do módulo; [003](../specs/003-audit-operations/tasks.md). Eventos e execuções não compartilham autoridade.                                                                                                                                            |
| Notícias                                 | Editor, mídia, versões, publicação/programação, API pública e acesso explícito com descoberta filtrada.                                                                  | Exportação direta, evidências específicas e homologação dos consumidores; [004](../specs/004-news-publishing/tasks.md).                                                                                                                                                             |
| Associados                               | Cadastro, dependentes, documentos/análise, situação e adaptador OAB.                                                                                                     | Reanálise documental, aplicação da matriz confirmada, identidade/credencial externa, OAB hospedada/homologada e exportação; [005](../specs/005-members-management/tasks.md).                                                                                                        |
| Parceiros                                | Administração, unidades, categorias, contratos, benefícios, moderação e API pública.                                                                                     | Portal, resgates/QR, coleta externa e exportação; [007](../specs/007-partners-management/tasks.md).                                                                                                                                                                                 |
| Agendamentos                             | Oferta, horários, reservas/remarcações/cancelamentos, histórico, FullCalendar e base de consulta/alteração explícitas.                                                   | Conflitos por pessoa, avisos de bloqueio, revalidação, exportações, aprovação e faltas têm incremento local não integrado. Validação da versão conciliada em andamento na frente 008; app/site e transporte dos avisos adiados. [008](../specs/008-scheduling-management/tasks.md). |
| Mensagens                                | Protótipo de campanhas, públicos, modelos e programação; finalidade de comunicados/campanhas confirmada.                                                                 | Revisão de aderência/continuidade M016/T003 antes de nova construção; canais/envio real adiados. [009](../specs/009-messaging/tasks.md).                                                                                                                                            |
| Relatórios                               | Consultas, três abas, coleta no painel e exportação direta do detalhe sem agrupamento em Excel/CSV/PDF, integrada pelo PR #40.                                           | Detalhe agrupado/resumo/evolução implementados localmente na frente própria, ainda em validação e sem integração; aceite humano do recorte integrado, coleta externa e demais critérios em [010](../specs/010-reports-analytics/tasks.md).                                          |
| Início / Meu trabalho                    | Atalhos, notícias, rascunhos e cadastros sem análise filtrados por acesso.                                                                                               | Demais pendências operacionais em [002 T053](../specs/002-integrated-modules/tasks.md).                                                                                                                                                                                             |
| App/site / Portal                        | Contratos e leitura pública não constituem interfaces completas.                                                                                                         | Jornadas, identidade, telas e integrações próprias; [002 UI01/UI02 e T046–T053](../specs/002-integrated-modules/tasks.md).                                                                                                                                                          |
| CAASSH / RH / conversa interna / suporte | CAASSH suspenso; demais possibilidades sem construção presumida.                                                                                                         | Definição/pesquisa antes de retomar; [programa 002](../specs/002-integrated-modules/tasks.md).                                                                                                                                                                                      |

## Coordenação anterior à incorporação da revisão de acessos — 02/10/2026

Agendamentos (CAAB-37) tem prioridade máxima. A worktree local de Agendamentos foi conciliada em
`4e9abac`; seu checkpoint registra testes técnicos aprovados e integrações/E 2E ainda pendentes por
indisponibilidade Docker/WSL. A pausa anterior foi substituída pela retomada autorizada. Consultar
sempre checkpoint/evidência da frente para o resultado mais recente; não duplicá-los nesta entrega.

Entregar os avisos operacionais de Agendamentos por e-mail (CAAB-42) e Homologar os avisos
operacionais após disponibilizar o serviço de e-mail (CAAB-45) estão adiados pela inexistência do
serviço, dependentes de Serviço de e-mail transacional e definição da caixa de entrada (CAAB-2).
Destinatários e finalidade operacional já definidos permanecem; não inventar provedor, enviar
mensagens nem antecipar campanhas. Permitir agendamento pelo app e site (CAAB-30) continua adiado.

Relatórios mantém suas specs/evidências na nova entrega, preservando Exportar análise detalhada sem
agrupamento (CAAB-43), já integrado e aguardando aceite humano, e trabalhando Exportar detalhe
agrupado, resumo e evolução sem os limites antigos (CAAB-44). Agendamentos controla modelo e
migrations 0031–0034; Relatórios coordena motor de exportação. Conciliar `runtime.ts`,
`export-screen.tsx` e `repositories/reports.ts` antes de futura integração.

A revisão de Gerenciar cargos e acessos de Administrador, Gestor e Colaborador (CAAB-19), Restringir
criação de contas ao fluxo administrativo (CAAB-18) e Mostrar apenas funções autorizadas na
navegação (CAAB-20) foi incorporada à entrega documental. Matriz e lacunas permanecem explícitas;
revisão concluída não significa aceite integral ou correção de G01–G03. Conversão nativa do último
ticket e filtro salvo continuam pendências operacionais da entrega Jira.

## Conferência das entregas da fundação

A lista atual da [spec 001](../specs/001-project-foundation/tasks.md) marca T096/T097, T098–T123 e
os incrementos de Colaboradores como concluídos, inclusive T139–T142. `auth-factory.ts` desabilita
cadastro público. Não reabrir essas tarefas a partir do inventário de 21/09. Adaptações de
exportação e autorização dos outros módulos continuam nas suas tarefas; o núcleo compartilhado
concluído não conclui todos os consumidores.

## Fronteiras e referências

- Cada domínio mantém seus registros; não duplicar associado, conta ou parceiro por canal.
- Autenticação, autorização, arquivos, fila, idempotência e auditoria são compartilhados.
- Colaboradores usa a gestão de contas; não cria cadastro de RH. [Limites](EMPLOYEES-BOUNDARIES.md).
- Aprovação cadastral, regularidade OAB, situação financeira e elegibilidade são dimensões
  distintas.
- Unidade própria de atendimento e unidade de parceiro têm responsabilidades distintas.
- App/site e portal consomem contratos versionados e escopos próprios; não herdam acesso
  administrativo.
- Exportações seguem [EXPORT-STANDARD](EXPORT-STANDARD.md). UI/UX segue
  [caab-design](caab-design.md).
- Objetivos e regras do produto: [PRD](PRD.md). Arquitetura/testes: [STACK](STACK.md).
- A fila de execução é a tarefa autorizada, registrada temporariamente no [caderno](agentcache.md).
  Pendências e possibilidades de produto permanecem no programa e nas specs.

## Inventários anteriores

O [histórico até 21/09/2026](history/modules-2026-09-21.md) conserva os inventários e decisões
anteriores. Não usar suas listas de “a construir” ou branches históricas como fila atual.
