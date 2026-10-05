# Tasks: Coordenação da entrega após clarify — incremento de 21/09/2026

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

| Instância    | Estado confirmado e próximo limite                                                                                                                                                                                                                                                                                        |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Agendamentos | Base local 4e9abac e correção posterior de compatibilidade no aviso de cancelamento sem horário. T109 concluída; T107, PostgreSQL/E2E/revisão visual pendentes por WSL. Os 727 testes/build anteriores não validam a correção SQL posterior. Não tentar recuperar WSL ou iniciar serviços por este registro.              |
| Relatórios   | Implementação local dos modos restantes e gates estáticos registrados na frente 010. PostgreSQL/E2E/a11y/C1 e QA humano pendentes; Retomar validações de Relatórios bloqueadas pelo WSL (CAAB-46) registra a retomada. Conferir o filtro de cancelamentos sem horário recebido da frente 008 antes da validação conjunta. |
| Documentação | Consolidação transversal/DS e revisão AC reunidas nesta entrega; commit, push e PR para dev autorizados pelo usuário neste fechamento, sem merge. A autorização substitui apenas o impedimento anterior de publicação desta entrega.                                                                                      |
| Acessos      | Revisão documental concluída e incorporada aqui pela coordenação: 66 acréscimos e matriz AC01–AC14. G01/AC-T002, G02/G03/AC-T003–AC-T004, P01/AC-T005 e validação AC-T006 continuam pendentes. Não abrir PR duplicado da revisão; correções funcionais seguem a frente própria.                                           |

A conciliação preserva DS-T133–DS-T140, AC-T001–AC-T006, IDs originais de cargo único e roles.md. Os
31 unitários/28 contratos de acessos são evidência da instância na base 748539d, não nova execução
nesta versão documental. T099 e homologações continuam abertas. Ver a
[conciliação de acessos](../001-project-foundation/evidence/documentation-access-conciliation-2026-10-02.md).

Agendamentos mantém modelo/migrations 0031–0034 e scheduling:review_absences. Na futura conciliação
funcional, preservar seu modelo de reservas junto ao gerador agrupado de Relatórios; conferir
runtime.ts, export-screen.tsx, repositories/reports.ts, report-summary.ts e
report-overview-export.ts. A compatibilidade foi revisada sem serviços; testes anteriores não
comprovam o conjunto futuro. E-mails operacionais continuam adiados por inexistência do serviço, sem
alterar destinatários e finalidade já definidos. A fila ativa permanece somente no caderno
principal.

## Coordenação anterior à incorporação da revisão de acessos — 02/10/2026-CODEX-SOLICITANTE_NAO_VERIFICADO

Conciliação de Conciliar a documentação do projeto (CAAB-38). Incorpora por conteúdo a coordenação
registrada pela entrega Jira/Confluence de 01–02/10, atualizada pela correção posterior do usuário.
Agendamentos (CAAB-37) tem prioridade máxima, com Relatórios e documentação simultâneos. A revisão
de acessos foi separada por pedido durante esta execução e iniciada em uma quarta instância, com
base 748539d; resultados e limites permanecem no caderno e na evidência da frente. Registros de
pausa/ordem anteriores são históricos.

| Frente       | Responsabilidade e limite                                                                                                                                                              |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Agendamentos | Spec 008, modelo e migrations 0031–0034. Validar a versão local conciliada `4e9abac`; não refazer sobreposição, bloqueio, permissões, aprovação/remarcação ou faltas já implementados. |
| Relatórios   | Spec 010/evidências e motor de exportação; nova entrega da dev, sem reutilizar a branch integrada do PR #40. Preservar detalhe sem agrupamento e completar agrupado/resumo/evolução.   |
| Documentação | MODULES/PRD/STACK/TOOLING, programa 002 e recorte DS da spec 001 na entrega documental existente; preservar fontes Jira/design por conteúdo.                                           |
| Acessos      | Preparação de aceite da base integrada em worktree própria; somente conteúdo de acessos da spec 001/evidências. Decisão sobre contas sem cargo continua pendente.                      |

Conferir `runtime.ts`, `export-screen.tsx` e `repositories/reports.ts` antes de integração futura.
Não alterar specs/evidências das outras frentes nem atribuir homologação por testes anteriores.
Entregar os avisos operacionais de Agendamentos por e-mail (CAAB-42) e Homologar os avisos
operacionais após disponibilizar o serviço de e-mail (CAAB-45) estão adiados por inexistência do
serviço, dependentes de Serviço de e-mail transacional e definição da caixa de entrada (CAAB-2). A
instrução anterior de completar transporte/T089 imediatamente está superada. Destinatários e caráter
operacional permanecem definidos. App/site, campanhas, WAHA e caixa de entrada não entram por
inferência.

Base integrada `748539d`: cadastro público bloqueado, cargos/cargo único, navegação por acesso e
motor de exportação entregues; Relatórios tem detalhe sem agrupamento integrado. As listas e
checkpoints de 21/09 abaixo não reabrem a implementação. Tarefas de consumidor, decisões
institucionais e aceite humano permanecem próprios. O [mapa de módulos](../../docs/MODULES.md) e a
[evidência da consolidação](../001-project-foundation/evidence/documentation-consolidation-2026-10-02.md)
distinguem esses estados. A documentação da spec 011 permanece na entrega de origem, com suas
pendências operacionais; não repetir publicações/criações nem alegar confirmação remota nova.

Resumo da entrega: [plan/tasks e dependências](plan-tasks-result-2026-09-21.md).

## Estado das tarefas documentais — 02/10/2026

DOC01 possui conclusão histórica em 21/09, preservada abaixo. A conciliação complementar dos quatro
documentos transversais, programa e recorte DS está concluída localmente, com
[evidência](../001-project-foundation/evidence/documentation-consolidation-2026-10-02.md). T099
permanece aberta para a revisão final dos contratos/modelos/planos de cada função e fechamento
transversal das entregas simultâneas; não confundir essa cobertura com QA humano ou reexecução da
Fundação integrada. Não há código a reconstruir por conta das listas históricas.

**Input:** [spec](spec.md), [plan](plan.md), [research](research.md), [modelo](data-model.md),
[contrato](contracts/exports.md), [quickstart](quickstart.md). A lista T098–T108 coordena o
programa; execução e evidências permanecem com cada função. A branch de 21/09 é histórica. Cadastro
público, T097 e núcleo de acessos/exportação já estão integrados; os aceites dos demais recortes
continuam nas frentes responsáveis. Nenhum teste funcional é concluído por esta atualização
documental.

## Rastreabilidade e escopo

EXP01–EXP07/ACC01: coordenação e critérios nas histórias correspondentes; execução técnica pertence
aos specs próprios. DOC01: conciliação histórica concluída; complemento documental atual concluído,
com revisão transversal T099 ainda aberta. FUT01/FUT02 continuam pesquisa futura, fora da lista
ativa.

O histórico abaixo conserva marcadores e evidências originais. IDs provisórios detalhados aqui não
são uma segunda execução; usar a lista ativa. Pendências de política/pesquisa/homologação e funções
suspensas continuam pendentes e não são autorizadas por constarem neste arquivo. Não repetir tarefas
já concluídas.

## Setup

- [ ] T098 Conferir alterações, números de migrations e dono de cada dataset em
      `specs/002-integrated-modules/contracts/direct-exports.md` e
      `specs/002-integrated-modules/plan.md`; atualizar referências se a base avançar, sem criar
      nova worktree por função.

## Foundational

- [ ] T099 Revisar conformidade final dos contratos/modelos/planos com decisões vigentes em
      `.specify/memory/constitution.md`, `docs/STACK.md` e
      `specs/002-integrated-modules/plan-tasks-result-2026-09-21.md`; concluir a revisão transversal
      após essa revisão, preservando histórico e pendências institucionais. Recorte transversal
      documental concluído em 02/10; restante é conferência por função das entregas simultâneas, sem
      substituir seus contratos/evidências ou marcar QA humano.

## US1 — Auditoria integrada

**Objetivo/aceite independente:** Operador só de jobs e auditor só de eventos exportam sua subárea
sem ganhar leitura ou reenvio adicional.

- [ ] T100 [US1] Conferir aceite de eventos versus jobs, exportação sem reenvio e três formatos da
      spec003; registrar matriz cruzada em
      `specs/002-integrated-modules/evidence/export-coverage.md` (novo).

## US2 — Notícias

**Objetivo/aceite independente:** Notícias nega conta sem concessão, preserva read/write/publish e
leitura pública de publicação.

- [ ] T101 [P] [US2] Conferir ausência de baseline implícito e preservação da API pública/versão
      publicada da spec004; registrar evidência em
      `specs/002-integrated-modules/evidence/news-access.md` (novo).

## US3 — Associados

**Objetivo/aceite independente:** Cadastro/análise manual preservados; bloqueio não cancela reservas
nem muda situação própria de dependentes.

- [ ] T102 [P] [US3] Conferir Q11 e seu complemento P01 documentados e coordenação
      bloqueio/vínculos005/008, sem cancelar reservas nem exigir documentos além da matriz
      confirmada; registrar em `specs/002-integrated-modules/evidence/members-scheduling.md` (novo).

## US4 — Agendamentos

**Objetivo/aceite independente:** Acesso explícito, exclusão por pessoa e aviso de bloqueio
comprovados na mesma agenda; exportação completa.

- [ ] T103 [P] [US4] Conferir acesso explícito, conflito global por pessoa, aviso de bloqueio e
      exportação da spec 008; registrar em
      `specs/002-integrated-modules/evidence/scheduling-acceptance.md` (novo).

## US5 — Parceiros

**Objetivo/aceite independente:** Datasets de Parceiros exportados sem mudar contratos/publicação e
sem expor documentos privados.

- [ ] T104 [P] [US5] Conferir cobertura de listas/abas e campos privados da spec007, sem efeitos em
      publicação/contratos; registrar em `specs/002-integrated-modules/evidence/partners-exports.md`
      (novo).

## US6 — Colaboradores

**Objetivo/aceite independente:** Usuário só Associados+Colaboradores+geral exporta apenas essas
duas fontes, com demais módulos invisíveis/negados.

- [ ] T105 [US6] Validar exemplo obrigatório de cargo Colaborador com acesso apenas a
      Associados+Colaboradores e exports:generate e negação dos demais módulos em
      `apps/web/tests/e2e/export-permissions.spec.ts` (novo), incluindo sem export, sem módulo,
      override e revogação.

## US7 — Mensagens

**Objetivo/aceite independente:** Revisão M016 registrada antes de nova construção; nenhum envio ou
chat/ticket incluído.

- [ ] T106 [US7] Conferir resultado de M016 e aceite do incremento condicionado na spec009 em
      `specs/002-integrated-modules/evidence/messaging-scope.md` (novo); sem decisão de continuidade
      registrar bloqueio, não construir/envio nem dar a tarefa por concluída.

## US10 — Relatórios

**Objetivo/aceite independente:** Três abas/formatos completos e autorizados, campos/ordem corretos
e nada de Agendamentos sem scheduling:read.

- [ ] T107 [P] [US10] Conferir três abas/formato/colunas/volumes da spec010 e agendamento protegido
      sob reports+domain read em `specs/002-integrated-modules/evidence/reports-exports.md` (novo).

## Polish

- [ ] T108 Executar cobertura transversal e gates de CI aplicáveis, registrar
      commit/comandos/evidências em
      `specs/002-integrated-modules/evidence/plan-2026-09-21-validation.md` (novo), mantendo
      aprovações/retencão/P01/envio e módulos futuros pendentes.

## Dependências e ordem de execução

Setup → Foundational → histórias → Polish. Dentro de cada história, contratos/testes antecedem
código e jornada; tarefas sem [P] seguem a ordem apresentada. Infraestrutura de 001 (concessões,
schemas, writers, rotas e UI) precede adaptadores/exportações dos demais specs. Migração 0025
precede 0026; 0027 antes de transferências. A antiga referência 0028 para sobreposição está
superada: Agendamentos mantém 0031–0034 e seu diagnóstico de conflitos, sem alterar dados
automaticamente. Regressões 004/006 e regras 008 podem avançar após catálogo/migrações mesmo antes
do núcleo de exportação. Aceite transversal 002 depende das evidências das funções. Spec 009 exige
gate M016. Não há dependência em retenção/P01/canais futuros para o recorte administrativo atual.

## Paralelismo por história

Após pré-requisitos, os adaptadores de domínios diferentes podem avançar em paralelo porque têm
arquivos próprios. Dentro desta função, manter testes→adaptador→UI→E2E sequencial; não dividir
edições no mesmo arquivo. [P] identifica arquivos independentes prontos após a base da fase: writers
separados em001 e relatórios de aceite em002. Para cada história sem par de arquivos independente,
não há paralelismo interno seguro; ela pode avançar junto da história equivalente de outro domínio
após as dependências. Migrações/catálogo/registro central têm um único responsável na spec001, sem
edições simultâneas.

## Estratégia incremental e MVP

Primeiro invariantes de acesso/migração e descoberta; depois fluxo completo de Relatórios usando
núcleo 001 como prova vertical (três formatos, todos os dados). Isso é marco de validação, não
redução do escopo: completar depois cada função do contrato, incluindo003/004/005/007/008 e
Colaboradores;009 permanece condicionada. Reservas Q1/Q2 seguem incremento independente008 após
permissões. Políticas adiadas, chat/suporte, CAASSH, portal e app/site não são parte do MVP.

## Histórico e backlog anterior — não executar automaticamente

<details>
<summary>Tarefas anteriores, evidências e pendências preservadas</summary>

# Tasks: Módulos integrados CAAB

**Prioridade de 18/09/2026:** usuário escolheu continuar Agendamentos no painel com FullCalendar;
executar CAL01–CAL06 da spec 008 antes da interface app/site (UI01/UI02). Não reabrir escopos
suspensos. Preservar documentação de retomada durante a execução.

**Input**: spec.md, plan.md, research.md, data-model.md, contracts/interfaces.md. **Tests**:
Obrigatórios por risco conforme especificação. Cada função tem artefatos próprios; alterações
autorizadas compartilham a única branch/worktree da entrega e seu PR enquanto aberto. **Status em
16/09/2026**: Auditoria/Processamentos, Notícias, Associados, Parceiros, contas/acessos e
Agendamentos administrativos iniciais estão entregues em dev, incluindo as correções dos PRs #29 e
#30. Pessoas/elegibilidade institucional (T017) permanece parcial, distinta do cadastro
implementado. Mensagens é protótipo com finalidade confirmada em 21/09/2026 e aderência pendente
(009 M016); Portal e interface app/site permanecem futuros. Relatórios foi integrado pelo PR34 em
21/09; CAASSH/Créditos suspenso. A validação final de todo o programa (T055–T057) depende dessas
histórias futuras.

Este arquivo acompanha o programa. A execução detalhada de cada funcionalidade ocorre no seu spec
próprio; [003-audit-operations/tasks.md](../003-audit-operations/tasks.md) é o primeiro. Antes de
iniciar uma função nova, criar seu spec/plano/tasks e vincular aqui. Mudanças de funções existentes
atualizam seus artefatos: T009/T010 pertencem ao spec 003. Notícias inicia no
[spec 004](../004-news-publishing/tasks.md), sem duplicar infraestrutura da fundação.

## Phase 1 — Setup

- [x] T001 Comparar módulos existentes e novos e registrar responsabilidades em `docs/MODULES.md`.
- [x] T002 Corrigir dependências do legado e atualizar escopo em `docs/PRD.md`, `docs/STACK.md` e
      `specs/002-integrated-modules/spec.md`.
- [x] T003 Registrar desenho, contratos, decisões e validação em
      `specs/002-integrated-modules/plan.md`, `data-model.md`, `research.md`,
      `contracts/interfaces.md` e `quickstart.md`.

## Phase 2 — Fundação reaproveitada

- [x] T004 Mapear guardas de eventos/jobs/exportações e reaproveitamento de auth/files/worker em
      `specs/002-integrated-modules/research.md`.

A fundação 001 já existe. Não refazer contas, arquivos ou fila. A fase seguinte inicia sem esperar
políticas de créditos, cadastro ou atendimento. Lacunas de domínio são tarefas específicas.

## Phase 3 — US1 Auditoria e Processamentos (P1)

Objetivo: área única, sem ampliar acesso. Teste independente: perfis eventos/jobs/ambos/nenhum, URLs
anteriores, exportação e reenvio autorizado.

- [x] T005 [US1] Criar regressões de catálogo/perfis em `apps/web/modules/workspace/areas.test.ts` e
      ajustar jornada em `apps/web/tests/e2e/operations.spec.ts`.
- [x] T006 [US1] Centralizar áreas/visibilidade/destinos em `apps/web/modules/workspace/areas.ts` e
      consumir em `modules/auth/ui/authorized-nav.tsx`, `components/workspace-controls.tsx` e
      `app/(admin)/page.tsx`.
- [x] T007 [US1] Adicionar subnavegação e canônicas em `apps/web/app/(admin)/audit/layout.tsx`,
      `audit/jobs/page.tsx`, `audit/jobs/[jobId]/page.tsx`; redirecionar `operations/jobs` e
      detalhe.
- [x] T008 [US1] Cobrir negações por perfil, compatibilidade e busca sem duplicata em
      `apps/web/tests/e2e/audit.spec.ts`, `operations.spec.ts` e `workspace-experience.spec.ts`.
- [x] T009 [US1] Validar leitura antes da mutação de reenvio em
      `apps/web/modules/jobs/job-service.ts` e adicionar regressão em
      `apps/web/modules/jobs/job-service.test.ts`.
- [x] T010 [US1] Evoluir o spec 003 e paginar/filtrar jobs reaproveitando consultas em
      `packages/db/src/repositories/job-execution.ts`, `apps/web/modules/jobs/job-service.ts`,
      `app/(admin)/audit/jobs/page.tsx` e contrato em `packages/contracts/src/jobs.ts`.
- [x] T011 [US1] Executar verificações das mudanças de US1 e registrar resultados em
      `specs/002-integrated-modules/evidence/us1.md`.

US1/T009–T010 concluídas em 15/09/2026 na branch própria de Processamentos solicitada pelo usuário.
[Evidência US3/spec003](../003-audit-operations/evidence/processamentos-2026-09-15.md).

## Phase 4 — US2 Conteúdo (P1)

Objetivo: jornada editorial completa. Teste independente: rascunho/prévia/publicação/agendamento,
versão pública preservada, canal autorizado e retry sem duplicação.

- [x] T012 [US2] Concluir integrações de mídia/canais e instalação do CMS em
      `specs/004-news-publishing/contracts/news.md` e `research.md`; acesso editorial confirmado
      pelo usuário. CMS, imagens, destaques e API pública por canal concluídos; leitura aberta
      confirmada. Consumidores externos integram o contrato v1; nenhum embed habilitado.
- [x] T013 [US2] Modelar conteúdo/versões/destaques/publicação e contratos em
      `packages/db/migrations/`, `packages/contracts/src/news.ts` e `apps/web/modules/news/`.
- [x] T014 [US2] Testar publicação, XSS, acesso a rascunhos e arquivos em `apps/web/modules/news/`,
      `apps/web/tests/integration/news.test.ts` e `packages/contracts/tests/news.test.ts`; contratos
      e precondições, persistência/concorrência, APIs pública/privada, conteúdo/mídia e worker
      validados. Evidência completa no spec 004.
- [x] T015 [US2] Implementar editor, mídia, prévia e gestão de versões em
      `apps/web/app/(admin)/news/` e `apps/web/modules/news/ui/` sem duplicar usuários/storage.
      Concluído no spec 004: imagens com descrição/legenda/ordenação, histórico, recuperação e
      Desfazer. E2E novo passou, incluindo acessibilidade mobile.
- [x] T016 [US2] Implementar distribuição/agendamento idempotente em
      `apps/worker/src/jobs/publish-news.ts` e `apps/web/app/api/v1/news/`; validar consumidor
      contratual em `apps/web/tests/e2e/news-publication.spec.ts`; 7 E2E de Notícias passaram.

## Phase 5 — US3 Pessoas (P1)

Objetivo: cadastro/vínculos/análise e situações explicáveis. Teste independente: dependente,
correção documental e avaliação conforme política sem bloqueio geral presumido.

- [ ] T017 [US3] Definir campos/documentos/vínculos/fontes e matriz de elegibilidade com os
      responsáveis em `specs/005-members-management/open-decisions.md` e
      `specs/005-members-management/contracts/members.md`. Q11 foi parcialmente respondida:
      documentos/vínculos e limite etário confirmados em P01; aplicação pendente em 005 POL02 e
      pergunta 4 de reanálise pendente em POL01. Manter análise manual; não reabrir as perguntas
      1–3.
- [x] T018 [US3] Modelar beneficiários/vínculos/análises/verificações/situação de credencial em
      `packages/db/migrations/` e `packages/contracts/src/members.ts` com identificadores e
      constraints definidos.
- [x] T019 [US3] Testar duplicidade, concorrência, autorização documental e efeitos de decisões em
      `apps/web/tests/integration/members.test.ts` e `apps/web/modules/members/http/routes.test.ts`.
- [x] T020 [US3] Implementar serviços/API/cadastro/fila documental em `apps/web/modules/members/`,
      `app/api/v1/members/` e `app/(admin)/members/`, reutilizando files/audit.
- [x] T021 [US3] Validar correção pontual, vínculo e situações independentes em
      `apps/web/tests/e2e/members.spec.ts`.

Execução detalhada e evidências: [spec 005](../005-members-management/tasks.md). T017 continua
pendente quanto às políticas institucionais; o incremento entregue registra decisões manuais com
fonte e motivo, sem inventar a matriz. Credencial nesta entrega é situação/validade, sem emissão.

## Phase 6 — US4 Agendamentos (P2)

- [x] AG-N01 Validar cabeçalho/atalho de Agendamentos e contraste do menu da conta durante a troca
      de tema; registrar junto às evidências da spec 008.

- [x] AG-I01 Concluir a etapa 1 administrativa da spec 008 (US1 + US2, T001–T020), com
      gates/evidências e PR. Código implementado e validado; entrega preparada para PR, com
      resultados em spec 008/evidence/release-review.md. As tarefas antigas T022–T026 abaixo
      abrangem mais que este recorte e permanecem substituídas pelo planejamento incremental da
      spec 008.

Planejamento incremental agora pertence à [spec 008](../008-scheduling-management/spec.md), com
[tarefas próprias](../008-scheduling-management/tasks.md). Primeiro painel funcional; depois nível
do legado/app/site; por último sugestões selecionadas. O usuário confirmou o recorte inicial.
T022–T026 permanecem históricas e não são tarefas executáveis.

**Revisão em 14/09/2026:** o módulo se chama **Agendamentos**. T022–T026 são propostas anteriores e
estão suspensas até o novo brainstorming solicitado pelo usuário. Não iniciar implementação com
regras presumidas. Consultar [brainstorming-agendamentos.md](brainstorming-agendamentos.md).

- [ ] AG-B01 Levantar com o usuário o fluxo atual e os objetivos da grande evolução. Em 15/09: CAAB
      administra o serviço de reservas do app/site pelo painel. A antiga exceção de sessão
      suficiente foi substituída por acesso concedido em Q8 (21/09). Unidades com vários serviços,
      profissionais, procedimentos, funcionamento e avaliações. Recorte: barbearia, medicina,
      futevôlei, fisioterapia, psicologia, spa e zumba. Restaurantes somente como possibilidade
      futura; fluxo detalhado ainda não definido.
- [x] AG-R01 Pesquisar soluções atuais em fontes oficiais e registrar evidências, conclusões e
      dúvidas em `pesquisa-mercado-agendamentos-2026-09-14.md`, sem implementar.
- [ ] AG-R02 Revisar posteriormente as conclusões com o usuário; nenhuma proposta de mercado ou
      primeira entrega foi aprovada pela pesquisa. Revisão iniciada em 15/09 com
      administração/catálogo/canais definidos pelo usuário; demais opções abertas.
- [x] AG-D01 Registrar decisões de 15/09 sobre gestão pela CAAB, acesso de todos os usuários do
      painel, unidade com múltiplos serviços, profissionais/procedimentos, funcionamento e
      avaliações; Cal.com apenas como referência, integração só se nenhuma outra possibilidade for
      encontrada.
- [x] AG-R03 Pesquisar Cal.com e referências de gestão de serviços presenciais em fontes oficiais;
      registrar resultados em `pesquisa-gestao-agendamentos-2026-09-15.md`.
- [ ] AG-B04 Validar organização serviço/procedimento, vínculos entre unidades e profissionais,
      ações de avaliações e efeito de mudanças de horário nas reservas.
- [x] AG-D02 Registrar que funções ausentes do legado são sugestões, incluindo controle de salas;
      detalhar o gerenciamento de horários em inventário com fontes.
- [ ] AG-B05 Revisar horários do legado com o usuário: expediente, almoço, indisponibilidades,
      agenda extra, antecedência, janela futura e reservas afetadas. Classificar cada função
      adicional como sugestão até decisão explícita.
- [ ] AG-B02 Explorar jornadas, atores, oferta, disponibilidade, exceções e integrações; distinguir
      decisões confirmadas de opções ainda em discussão.
- [x] AG-B03 Consolidar o recorte inicial em spec própria 008, plano, tarefas, pesquisa, modelo,
      contratos e roteiro de validação. Etapas posteriores têm roadmap e serão detalhadas antes de
      sua implementação; hipóteses iniciais para revisão.

Objetivo: oferta e operação sem conflitos. Teste independente: concorrência pela capacidade,
exceções, remarcação/desfecho e avaliação preservada.

- T022 [US4, histórica/suspensa; execução vigente na spec 008] Definir
  oferta/capacidade/jornada/cancelamento/falta e integração de elegibilidade em
  `specs/002-integrated-modules/contracts/scheduling.md`.
- T023 [US4, histórica/suspensa; execução vigente na spec 008] Modelar unidades
  próprias/ofertas/recursos/disponibilidade/reservas/eventos em `packages/db/migrations/` e
  `packages/contracts/src/scheduling.ts`.
- T024 [US4, histórica/suspensa; execução vigente na spec 008] Implementar testes de reserva
  concorrente/retry/exceções em `apps/web/modules/scheduling/scheduling-service.test.ts` com
  PostgreSQL real.
- T025 [US4, histórica/suspensa; execução vigente na spec 008] Implementar disponibilidade e
  comandos transacionais em `apps/web/modules/scheduling/` e `app/api/v1/scheduling/`.
- T026 [US4, histórica/suspensa; execução vigente na spec 008] Implementar operação
  diária/configuração/agenda/avaliação em `apps/web/app/(admin)/scheduling/` e validar em
  `apps/web/tests/e2e/scheduling.spec.ts`.

## Phase 7 — US5 Benefícios (P2)

Implementação administrativa detalhada na [spec 007](../007-partners-management/spec.md), com
[plano](../007-partners-management/plan.md), [tarefas](../007-partners-management/tasks.md) e
[sete páginas](../007-partners-management/interface.md). Parceiros são estabelecimentos externos.
Cadastro, diretório, configuração do app e moderação administrativa estão na spec 007. Coleta
externa de avaliações, portal e resgate permanecem integrações futuras; não são apresentados como
conectados pela entrega administrativa.

Objetivo: parceiros/contratos/ofertas confiáveis. Teste independente: vigência, ocultação e
moderação.

- [x] T027 [US5] Definir condições/exposição/moderação e contrato em
      `specs/007-partners-management/contracts/partners.md`.
- [x] T028 [US5] Modelar parceiro/unidades/contratos/ofertas/categorias/avaliações em
      `packages/db/migrations/` e `packages/contracts/src/partners.ts`.
- [x] T029 [US5] Implementar testes de vigência/autorização/moderação em
      `apps/web/tests/integration/partners.test.ts`.
- [x] T030 [US5] Implementar serviços/API/UI usando arquivos existentes em
      `apps/web/modules/partners/`, `app/api/v1/partners/` e `app/(admin)/partners/`.
- [x] T031 [US5] Validar oferta, contrato, ocultação e opinião preservada em
      `apps/web/tests/e2e/partners.spec.ts` e `partner-directory.spec.ts`.

## Phase 8 — US6 Acesso existente; cadastro de equipe retirado do escopo

Decisão do usuário em 11/09/2026: Colaboradores no legado corresponde a Usuários. Parceiros são
externos; não haverá módulo separado de equipe interna/RH.

- T032–T035: **canceladas por alteração de escopo**, não implementadas.
- Contas, permissões, sessões e recuperação permanecem nos recursos existentes.
- Dependências de US6 nas fases seguintes significam reutilizar Usuários/RBAC, sem aguardar ou criar
  cadastro funcional, vínculo colaborador-conta ou módulo employees.

## Phase 9 — US7 Mensagens (P2)

**Decisão vigente — 21/09/2026:** a finalidade de Mensagens foi confirmada: comunicados e campanhas
aos associados, com seleção de público e programação. O código existente continua sendo um
protótipo, sem homologação do produto. A definição de finalidade substitui a pendência de 17/09;
revisão de aderência do protótipo e critérios de continuidade permanecem em M016. Meios, provedores
e envio real continuam adiados. Conversa interna do painel e suporte por tickets do app/site são
possibilidades de módulos futuros separados, com nomes e funcionamento sujeitos a pesquisa
posterior; não estão em implementação. M015 foi resolvida por Q5 em 21/09; M016 da spec 009 revisará
aderência e continuidade antes de retomar T036–T039. Meios e envio real continuam adiados.

Atualização 16/09/2026: implementação autorizada antes dos canais, no spec próprio
[009-messaging](../009-messaging/spec.md). T036–T039 cobrem também entrega real e permanecem
parciais; a preparação é acompanhada em M001–M008. Meios de envio adiados expressamente pelo
usuário. Qualquer operador com acesso ao módulo pode preparar/solicitar.

Objetivo: público correto e entrega rastreável. Teste independente: exclusão, falha/retry e estados.

- [ ] T036 [US7] Definir público/preferências/canais/contratos e política de envio em
      `specs/002-integrated-modules/contracts/messaging.md`.
- [ ] T037 [US7] Modelar campanha/modelo/público/execução/entrega em `packages/db/migrations/` e
      `packages/contracts/src/messages.ts`.
- [ ] T038 [US7] Implementar testes de exclusão/idempotência/eventos duplicados em
      `apps/web/modules/messaging/messaging-service.test.ts`.
- [ ] T039 [US7] Implementar serviços/adaptadores/worker em `apps/web/modules/messaging/`,
      `app/api/v1/messages/` e `apps/worker/src/jobs/send-message.ts`.
- [x] T040 [US7] Implementar prévia/programação/acompanhamento em `apps/web/app/(admin)/messages/` e
      validar em `apps/web/tests/e2e/messaging.spec.ts`.

## Phase 10 — US8 Créditos (P2)

**Desativado — pendente de revisão, por decisão do usuário em 14/09/2026.** T041–T045 ficam
suspensas, sem implementação ou ativação até nova decisão.

Objetivo: programa configurado e extrato consistente. Teste independente: concessão/lote/correção
sob política explícita, sem duplicidade nem edição direta de saldo.

- [ ] T041 [US8] Definir finalidade/unidade/conversão/limites/validade/uso/correção/aprovador em
      `specs/002-integrated-modules/contracts/credits.md`.
- [ ] T042 [US8] Modelar política/conta/lote/lançamento/correção em `packages/db/migrations/` e
      `packages/contracts/src/credits.ts`.
- [ ] T043 [US8] Testar concorrência/idempotência/correção/ausência de política em
      `apps/web/modules/credits/credit-service.test.ts`.
- [ ] T044 [US8] Implementar concessões/extrato/API/worker/UI em `apps/web/modules/credits/`,
      `app/api/v1/credits/`, `app/(admin)/credits/` e `apps/worker/src/jobs/grant-credits.ts`.
- [ ] T045 [US8] Validar lote e correção referenciada em `apps/web/tests/e2e/credits.spec.ts`.

## Phase 11 — US9 Portal (P3)

Objetivo: solicitações no escopo do parceiro. Teste independente: organizações A/B e QR sem
liquidação presumida.

- [ ] T046 [US9] Definir tarefas/estados da solicitação e vínculo com créditos em
      `specs/002-integrated-modules/contracts/partner-portal.md`.
- [ ] T047 [US9] Modelar vínculo conta-organização/solicitação/QR em `packages/db/migrations/` e
      `packages/contracts/src/partner-requests.ts`.
- [ ] T048 [US9] Testar isolamento inclusive arquivos/exportações em
      `apps/web/modules/partner-portal/partner-portal.test.ts`.
- [ ] T049 [US9] Implementar serviços/API/layout/UI restritos em `apps/web/modules/partner-portal/`,
      `app/api/v1/partner-requests/` e `app/(partner)/`.
- [ ] T050 [US9] Validar solicitações/QR e isolamento A/B em
      `apps/web/tests/e2e/partner-portal.spec.ts`.

## Phase 12 — US10 Meu trabalho e relatórios (P3)

Objetivo: pendências e informação útil dos domínios. Teste independente: dados conhecidos, filtros e
escopos.

- T051 [US10, planejamento inicial atendido na spec 010; adequações em EX/DX] Definir
  indicadores/relatórios/campos/público em `specs/010-reports-analytics/contracts/interfaces.md`.
- T052 [US10, planejamento inicial atendido na spec 010; adequações em EX/DX] Implementar consultas
  e exportações reutilizando jobs/files em `apps/web/modules/reports/`,
  `apps/web/app/api/v1/reports/` e `apps/worker/src/jobs/report-export.ts`.
- [ ] T053 [US10, parcial] Completar pendências operacionais dos domínios; preservar rascunhos de
      Notícias e cadastros sem análise já existentes. Relatórios inicial está em 010; conciliar o
      restante do planejamento em `apps/web/app/(admin)/page.tsx` e `app/(admin)/reports/`, sem
      métricas fictícias.
- T054 [US10, planejamento inicial atendido na spec 010; adequações em EX/DX] Validar filtros,
  contagens e exportações autorizadas em `apps/web/tests/e2e/reports.spec.ts`.

## Phase 13 — Validação integrada

- [ ] T055 Completar matriz de permissões/contratos OpenAPI e documentação em
      `packages/contracts/src/openapi.ts`, `docs/MODULES.md` e `docs/PRD.md`.
- [ ] T056 Validar jornadas cruzadas, acessibilidade, banco/concorrência, segurança e build;
      registrar resultados em `specs/002-integrated-modules/evidence/integrated.md`.
- [ ] T057 Conferir todas as histórias completas e conferir os PRs por função concluída para dev,
      com riscos/rollback e pendências T089/T095 explícitas em
      `specs/002-integrated-modules/evidence/delivery.md`.

## Dependencies & Execution Order

**Prioridade confirmada em 15/09/2026:** após concluir e validar a etapa 1 de Agendamentos (spec
008), iniciar a primeira versão da interface do usuário no app/site, antes das demais expansões e
módulos pendentes. As fases numeradas acima organizam o backlog; a sequência vigente está em
[plan.md](plan.md).

- [ ] UI01 Após Agendamentos inicial validado, preparar spec, plano, tarefas e critérios de aceite
      próprios para a primeira interface do usuário no app/site; definir jornadas, identidade e
      contratos, coordenando reservas com a spec 008.
- [ ] UI02 Implementar e validar essa primeira versão conforme o recorte especificado, usando os
      mesmos dados e serviços do painel; registrar evidências dos dois canais.

T001–T004 → US1. US2/US3/US5/US6 usam fundação e suas decisões próprias. US4 depende de US3 e
cadastros/oferta da própria história; US7 depende de contatos e eventos (US2/US3/US5); US8 depende
de US3 e, para parceiros, US5; US9 depende de US5/US6 e só depende de US8 se a política vincular
solicitação a crédito. US10 depende dos domínios; T055–T057 dependem de todas as histórias.

## Oportunidades de trabalho independente

Execução atual é sequencial. Se houver autorização futura de trabalho paralelo, modelos e testes
podem ser preparados independentemente por US2/US3/US5/US6 depois dos contratos; US4 testes de
concorrência versus UI após serviço; US7 adaptador versus editor após contrato; US8 testes versus UI
após contrato; US9 isolamento versus layout; US10 consultas versus apresentação. US1 catálogo e
rotas se encontram nos testes. Migrations e catálogo compartilhados exigem coordenação e integração
sequencial. Essas possibilidades não são instrução para abrir PRs ou criar agentes adicionais.

## Implementation Strategy

Incrementos locais completos, começando por US1. O usuário pediu planejamento de todos os módulos e
início imediato, não conclusão instantânea nem telas demonstrativas. Marcar [x] apenas trabalho
executado/verificado. Manter decisões de negócio pendentes visíveis, avançando nas tarefas
independentes.

## Regra vigente: nenhuma justificativa obrigatória — 14/09/2026

- [x] RM01 Remover exigências de justificativa nos contratos, serviços e persistência desta função.
- [x] RM02 Retirar campos e bloqueios de motivo em todas as telas da função.
- [x] RM03 Validar fluxos sem motivo, auditoria preservada e controles de autorização; registrar
      evidências da entrega compartilhada.

Evidências RM03:
[validação final de 15/09/2026](../001-project-foundation/evidence/reason-removal-2026-09-14.md).

## Homologação e prontidão — 16/09/2026

- [x] HV01 Executar a verificação aplicável e registrar resultados reais, inclusive impedimentos;
      ver [evidências](evidence/readiness-2026-09-16.md).
- [x] HV02 Corrigir e testar as lacunas técnicas/documentais; retenção executável e OAB publicada
      continuam dependências externas explícitas.
- [x] HV03 Registrar resultados e impedimentos externos sem aprovações fictícias; CI final acompanha
      o PR.

## Exportação transversal — 18/09/2026

- [ ] EXP01 Inventariar e implementar baixar/exportar em todos os módulos existentes, atualizando
      specs próprios: Notícias, Associados, Parceiros/Benefícios, Colaboradores, Agendamentos,
      Mensagens, Auditoria/Processamentos.
- [ ] EXP02 Exigir baixar/exportar nos planos de todo módulo futuro, conforme
      disponibilidade/autorização da função, sempre nos três formatos Excel/CSV/PDF conforme
      docs/EXPORT-STANDARD.md, sem reativar módulos suspensos.
- [ ] EXP03 Conferir preservação de filtros, período, colunas e permissões, arquivos completos além
      da paginação e jornada por interface em cada spec responsável.

Relatórios e Análises possui spec/plano/tarefas próprios em ../010-reports-analytics/. T051–T054 são
acompanhadas por esse spec; exportações nos demais módulos não estão concluídas pela simples criação
da central de relatórios.

- [ ] EXP04 Coordenar permissão geral de exportação com acesso aos módulos/dados (001 AX01, 003 EX01
      e 010 EX01); converter automaticamente quem possui alguma permissão antiga de exportação na
      geral, sem conceder a quem não possui e sem alterar acesso aos módulos; validar repetição
      idempotente.
- [ ] EXP05 Validar matriz transversal: com/sem permissão geral, acesso parcial, nenhum módulo,
      revogação antes de geração/download e ausência de módulos negados na barra
      lateral/busca/Início; exemplo obrigatório Associados + Colaboradores.

## Possibilidades futuras de comunicação — 21/09/2026

- [ ] FUT01 Pesquisar posteriormente uso, jornadas, participantes, permissões, privacidade e
      alternativas técnicas para conversa interna entre usuários do painel; propor nomenclatura e
      escopo para decisão. Sem construção ou spec nova autorizada nesta etapa.
- [ ] FUT02 Pesquisar posteriormente uso e implementação de suporte por tickets para app/site:
      abertura pelo usuário, conversa com equipe e resolução; investigar operação e integrações e
      propor nomenclatura/escopo. Sem construção ou spec nova autorizada nesta etapa.

Registrar fontes oficiais, data, comparações e limites da pesquisa quando executada. Cada candidato
terá spec, plano e tarefas próprios se sua construção for aprovada; não incorporá-los a Mensagens
nem iniciar código pela inclusão neste backlog.

## Exportação direta — Q6 de 21/09/2026

- [ ] EXP06 Detalhar e implementar por módulo a tela “Exportar [módulo]”, filtros pertinentes,
      seleção e ordem de colunas autorizadas e botões Excel/CSV/PDF com download direto; coordenar
      001 DX01, 003 DX01/DX02 e 010 DX01–DX03. Sem fila/histórico obrigatório, prazo ou teto
      funcional de período/registros.
- [ ] EXP07 Validar três formatos por módulo, contexto/filtros/ordenação dos registros, seleção e
      ordem das colunas idênticas nos três formatos e recusa de campos restritos, conjunto completo
      além da paginação e dos antigos limites de 50 mil linhas/366 dias,
      erros/retentativa/interrupção e autorização; registrar evidências sem confundir esta decisão
      com implementação.

- [ ] ACC01 Coordenar acesso concedido a Notícias/Agendamentos com 001 AX04 e 004/008 AC01–AC03,
      incluindo consulta/alteração separadas e transição técnica, ocultação, guardas e revogação;
      preservar leitura pública de notícias e regras de reserva.

Q10 de 21/09/2026: retenção continua dependência institucional posterior, coordenada por 001 T089;
descarte automático permanece desligado e os gates atuais preservados. Nenhuma tarefa de
política/implementação concluída por esta decisão.

- [x] DOC01 Conciliar os artefatos técnicos derivados antes da implementação: planos,
      contratos/modelos e instruções normativas antigas que ainda mencionem MFA obrigatório ou
      justificativa exigida, em especial princípio V da constituição. Aplicar as decisões vigentes
      de retirada, preservando autorização/auditoria, dados históricos e evidências datadas.
      Conferir também consistência dos estados de entrega; não reabrir decisões nem tratar tarefas
      históricas como validação nova.

Rodada de clarify encerrada: [relatório](clarify-result-2026-09-21.md). DOC01 concluída em 21/09 na
revisão estática: artefatos normativos/derivados conciliados, links locais e diff documental
conferidos. Evidência: [revisão de código](code-audit-2026-09-21.md). Tarefas funcionais/políticas
preservam seu estado; desenho não significa implementação.

## Conciliação do backlog — revisão de código de 21/09/2026

Relatório responsável: [code-audit-2026-09-21.md](code-audit-2026-09-21.md). T022–T026 permanecem
referências históricas, sem caixas de execução duplicadas. T051/T052/T054 remetem à
implementação/evidência inicial da spec 010; isso não conclui os novos EX/DX nem homologação DEV.
T053 é parcial, não ausência total do Início. Pendências novas: 001 T096/T097, 006 T025, 010
T025/T026. Exportação distribuída às specs 004/005/007/008/009 em DX01, executando EXP06/EXP07 sem
duplicação de escopo.

</details>

## Pedidos e possibilidades preservados do caderno — 23/09/2026

Transferência documental: CODEX, solicitante mafaltti. Assinaturas abaixo preservam a origem
conhecida dos registros anteriores. Este índice remete às tarefas de cada função; não cria uma
segunda lista executável nem concede autorização nova. Conferir estado e escopo na fonte antes de
iniciar. Ideias futuras, suspensões e homologações adiadas continuam assim.

| Assunto                                | Estado e próximo passo                                                                                                                                                                                                                                                         | Fonte                                                                                                                 | Assinatura                                                                |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| FormField                              | Correção futura registrada: texto incompleto e CPF mostram erro antes de blur/submit. Duas verificações reproduziram a divergência; não corrigida pela auditoria.                                                                                                              | [Evidência do guia](../001-project-foundation/evidence/design-guide-2026-09-22.md)                                    | `FormField-CODEX-SOLICITANTE_NAO_VERIFICADO`                              |
| TableContainer                         | Revisão assistiva pendente: div focável com aria-label sem role explícito; Axe pediu revisão manual. Conferir teclado, nome e semântica no uso real.                                                                                                                           | [Evidência do guia](../001-project-foundation/evidence/design-guide-2026-09-22.md)                                    | `TableContainer-CODEX-SOLICITANTE_NAO_VERIFICADO`                         |
| Tema Cores Legado                      | Pedido pendente: planejar e implementar vermelho/branco do site antigo nos mesmos elementos e disposição. Conferir referência, manter CAAB padrão; opção secundária discreta nas Configurações, acessível também no escuro. Atualizar spec/plano/tarefas antes de implementar. | Decisão de 21/09, substitui tema inspirado no clube                                                                   | `Tema Cores Legado-CODEX-SOLICITANTE_NAO_VERIFICADO`                      |
| Exportações por módulo                 | Base compartilhada integrada; adaptar e validar os módulos restantes, com filtros, três formatos, seleção/ordem de colunas e permissões. Tarefas antigas podem exigir conciliação com o código já entregue, especialmente Colaboradores.                                       | [Programa 002](tasks.md), EXP01–EXP07; tarefas EX/DX nas specs 001/003–010                                            | `Exportações por módulo-CODEX-SOLICITANTE_NAO_VERIFICADO`                 |
| Acesso a Notícias/Agendamentos         | AC01–AC03 ainda abertos nas specs; conferir catálogo/guardas e revogação, worker e visibilidade no Início. Não recriar permissões já existentes.                                                                                                                               | [Notícias](../004-news-publishing/tasks.md), [Agendamentos](../008-scheduling-management/tasks.md)                    | `Acesso a Notícias/Agendamentos-CODEX-SOLICITANTE_NAO_VERIFICADO`         |
| Auditoria e Relatórios                 | Adequar autorização da cadeia de exportação/download; Relatórios também exige consulta a Agendamentos nos dados de reservas. Conferir downloads antigos e proteger escopo desconhecido.                                                                                        | [Auditoria](../003-audit-operations/tasks.md), EX01/EX02; [Relatórios](../010-reports-analytics/tasks.md), EX/DX/T025 | `Auditoria e Relatórios-CODEX-SOLICITANTE_NAO_VERIFICADO`                 |
| Dependentes/documentos                 | POL01: falta responder quais alterações exigem nova análise. POL02: aplicar a matriz documental confirmada, com análise manual e preservação do legado.                                                                                                                        | [Decisões P01](../005-members-management/open-decisions.md), [tarefas 005](../005-members-management/tasks.md)        | `Dependentes/documentos-CODEX-SOLICITANTE_NAO_VERIFICADO`                 |
| Calendário de Agendamentos             | CAL01–CAL05 integrados; CAL06 ainda consta aberto para revisão final e evidências. Conferir a entrega antes de repetir validações.                                                                                                                                             | [Tarefas 008](../008-scheduling-management/tasks.md)                                                                  | `Calendário de Agendamentos-CODEX-SOLICITANTE_NAO_VERIFICADO`             |
| Agendamentos: próximos incrementos     | Pendentes conflito por beneficiário, aviso de bloqueio em reservas e demais incrementos de horários/exceções, faltas, avaliações e comunicações. Reconciliar tarefas com o que já existe e seguir a ordem aprovada. Salas/equipamentos continuam sugestões.                    | Specs 008 e programa 002, incluindo T021/T023/T024 e AG-B/AG-R                                                        | `Agendamentos: próximos incrementos-CODEX-SOLICITANTE_NAO_VERIFICADO`     |
| App/site                               | Primeira interface ainda depende de jornadas, identidade, telas e contratos próprios antes de implementação. A prioridade posterior do calendário administrativo substituiu a ordem anterior de começar pelo app/site.                                                         | Programa 002 UI01/UI02 e spec 008 T022                                                                                | `App/site-CODEX-SOLICITANTE_NAO_VERIFICADO`                               |
| Mensagens                              | Finalidade definida; M016 exige avaliar aderência do protótipo e registrar decisão de continuidade antes de nova construção. Envio real/M009/M010 adiados; testes antigos não homologam o produto.                                                                             | [Tarefas 009](../009-messaging/tasks.md)                                                                              | `Mensagens-CODEX-SOLICITANTE_NAO_VERIFICADO`                              |
| SMTP externo                           | Transporte implementado; homologação real de recuperação de senha/troca de e-mail depende de ambiente e destinatários autorizados.                                                                                                                                             | [Tarefas 006](../006-account-settings/tasks.md), T025                                                                 | `SMTP externo-CODEX-SOLICITANTE_NAO_VERIFICADO`                           |
| Métricas externas                      | Instrumentar e homologar consumidores quando app/site forem retomados; endpoint já existente.                                                                                                                                                                                  | Spec 010 T026                                                                                                         | `Métricas externas-CODEX-SOLICITANTE_NAO_VERIFICADO`                      |
| OAB-BA publicada                       | Configuração/homologação positiva adiada; última tentativa registrada retornou OAB_NOT_CONFIGURED. Não repetir sem mudança de configuração. Código/resultado já entregues, sem nova flag de ativação.                                                                          | Spec 005 T028; histórico de 16/09                                                                                     | `OAB-BA publicada-CODEX-SOLICITANTE_NAO_VERIFICADO`                       |
| Retenção/privacidade                   | Definição institucional pendente; manter descarte automático desligado e gates existentes. Não inventar prazos/aprovadores.                                                                                                                                                    | [Tarefas 001](../001-project-foundation/tasks.md), T089                                                               | `Retenção/privacidade-CODEX-SOLICITANTE_NAO_VERIFICADO`                   |
| Proteções remotas                      | T095 continua aberta para evidências remotas. Não realizar push proibido para testar proteção.                                                                                                                                                                                 | Spec 001 T095                                                                                                         | `Proteções remotas-CODEX-SOLICITANTE_NAO_VERIFICADO`                      |
| Aceite transversal                     | Conciliar tarefas e validar jornadas/contratos/evidências conforme conclusão dos módulos; não tratar módulos futuros como prontos.                                                                                                                                             | Programa 002 T055–T057 e T098–T108                                                                                    | `Aceite transversal-CODEX-SOLICITANTE_NAO_VERIFICADO`                     |
| Portal de parceiros / Meu trabalho     | Portal depende de definição/implementação própria; Meu trabalho tem base parcial e pendências operacionais, não é módulo inteiramente inexistente.                                                                                                                             | Programa 002 T046–T053                                                                                                | `Portal de parceiros / Meu trabalho-CODEX-SOLICITANTE_NAO_VERIFICADO`     |
| Login com provedores externos          | Ideia futura registrada: Google, Apple ID e outros a definir; planejar vínculo com contas existentes e primeiro acesso, separando autenticação da autorização para criar conta. Sem integração/credenciais definidas.                                                          | Decisão de 17/09; identidade externa D02                                                                              | `Login com provedores externos-CODEX-SOLICITANTE_NAO_VERIFICADO`          |
| Conversa interna / suporte por tickets | Duas possibilidades futuras separadas; pesquisar uso e funcionamento antes de nomear/especificar/construir.                                                                                                                                                                    | Programa 002 FUT01/FUT02                                                                                              | `Conversa interna / suporte por tickets-CODEX-SOLICITANTE_NAO_VERIFICADO` |
| Recursos Humanos / CAASSH-Créditos     | RH sem finalidade/escopo autorizado. CAASSH/Créditos segue suspenso e desativado; não reativar por estar no backlog.                                                                                                                                                           | Programa 002 e decisões de 17/09                                                                                      | `Recursos Humanos / CAASSH-Créditos-CODEX-SOLICITANTE_NAO_VERIFICADO`     |
