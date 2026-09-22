# Tasks: Relatórios: exportação direta nas três abas — incremento de 21/09/2026

**Pendências preservadas pela revisão de código — 21/09:** T025 (A02: autorização de Agendamentos em
resumo/detalhes/worker/download) deve ser executada em conjunto com T030/T031, sem duplicação; T026
(A13: instrumentação externa) continua dependência futura, não coberta pela regressão da coleta
existente.

**Input:** [spec](spec.md), [plan](plan.md), [research](research.md), [modelo](data-model.md),
[contrato](contracts/exports.md), [quickstart](quickstart.md). **Branch da entrega:**
`docs/project-clarify-20260921`. Nenhuma tarefa nova executada. **Lista ativa:** T027–T039; testes
foram pedidos nas specs e nos gates do projeto. Caminhos novos são destinos planejados; conferir
referências contra o inventário de artefatos deste incremento antes de editar. Nenhum arquivo de
código foi criado agora.

## Rastreabilidade e escopo

EX01/EX02/DX01–DX03: detalhados em US1/US2/US3, compatibilidade e volume; migração de permissões
pertence à001. Evidências antigas não concluem o novo fluxo.

O histórico abaixo conserva marcadores e evidências originais. IDs provisórios detalhados aqui não
são uma segunda execução; usar a lista ativa. Pendências de política/pesquisa/homologação e funções
suspensas continuam pendentes e não são autorizadas por constarem neste arquivo. Não repetir tarefas
já concluídas.

## Setup

- [ ] T027 Conferir o catálogo real de telas/abas e filtros contra
      `specs/010-reports-analytics/contracts/exports.md`; mapear campos permitidos/defaults e
      projeções atuais, sem criar fonte ou ampliar permissão.

## Foundational

- [ ] T028 Preparar fixtures sintéticas isoladas e contratos da função em
      `apps/web/modules/reports/export-fixtures.ts` (novo, exclusivo de testes), com datas
      empatadas, zero resultados, texto longo, campos restritos e filtros combinados; depende dos
      schemas de 001.

## US1 — Resumo gerencial

**Objetivo/aceite independente:** Resumo oferece três formatos e período maior que 366 dias com os
mesmos agregados autorizados da consulta completa.

- [ ] T029 [US1] Permitir xlsx/csv/pdf no resumo e separar limites de tela dos filtros de exportação
      em `packages/contracts/src/reports.ts` e `packages/contracts/tests/reports.test.ts`; preservar
      métricas e testar intervalo maior que 366 dias sem corte.

## US2 — Análise detalhada

**Objetivo/aceite independente:** Detalhe exporta os100 registros da massa, columns na ordem
escolhida e apenas fontes/escopos permitidos; produto continua sem teto funcional. Arquivos legados
seguem autorização atual U1.

- [ ] T030 [US2] Retirar limite 50 mil e seleção pela ordem do catálogo em
      `packages/db/src/repositories/reports.ts`; implementar cursor/columns ordenadas, manter SQL
      parametrizado e exigir scheduling:read no dataset bookings e em
      métricas/séries/avisos/cancelamentos de `packages/db/src/repositories/report-summary.ts`, sem
      alterar analytics.
- [ ] T031 [US2] Aplicar `specs/010-reports-analytics/contracts/legacy-downloads.md` em
      `packages/db/src/repositories/report-storage.ts` e
      `apps/web/tests/integration/reports.test.ts`: exigir acessos atuais derivados também da
      configuração/gerador, inclusive scheduling:read omitido de snapshots antigos de
      detalhe/resumo/apresentação. Negar conteúdo de escopo indeterminável; testar revogação,
      caminhos genéricos/worker e propriedade, preservando hashes/bytes/registros.
- [ ] T032 [US2] Escrever testes do adaptador em `apps/web/modules/reports/export-adapter.test.ts`
      (novo): filtro+sort, columns em ordem pedida, campo proibido, dados completos e matriz de
      autorização conforme `specs/010-reports-analytics/contracts/exports.md`.
- [ ] T033 [US2] Implementar `apps/web/modules/reports/export-adapter.ts` (novo) reutilizando as
      consultas/projeções do domínio, IDs/dependências para reautorização por lote e cursor do
      núcleo 001; cobrir todos os datasets do contrato, sem ampliar acesso ou alterar dados.
- [ ] T034 [US2] Integrar ação/tela em `apps/web/app/(admin)/reports/exportar/page.tsx` (nova) e nas
      listas/abas existentes de `apps/web/modules/reports/ui/`; passar contexto/filtros, preservar
      rascunho e oferecer os três formatos com defaults e reordenação acessível.
- [ ] T035 [US2] Validar arquivos reais nos três formatos, ordem/contagem/IDs/filtros e negações em
      `apps/web/tests/integration/reports.test.ts` e `apps/web/tests/e2e/reports.spec.ts`; usar o
      parser independente do núcleo 001 e confirmar erro recuperável sem corte.

## US3 — Resultados e evolução

**Objetivo/aceite independente:** Resultados/evolução oferecem todos formatos com contexto/agregados
equivalentes, sem fabricar histórico.

- [ ] T036 [US3] Integrar todos formatos/colunas à aba Resultados e evolução em
      `apps/web/modules/reports/ui/reports-page.tsx` e
      `apps/web/modules/reports/ui/reports-page.test.tsx`; provar equivalência com dados do
      resumo/detalhado sob os mesmos filtros e sem histórico inventado.

## US4 — Coleta preservada

**Objetivo/aceite independente:** Coleta não bloqueia confirmação de reserva e exportação não
duplica eventos ou altera métricas.

- [ ] T037 [US4] Executar regressão de coleta e confirmação não bloqueada em
      `apps/web/modules/reports/http.test.ts` e `apps/web/tests/integration/reports.test.ts`;
      exportação não modifica contagens nem cria eventos de negócio duplicados.

## Polish

- [ ] T038 Validar100 registros sintéticos conforme
      `specs/002-integrated-modules/export-validation-100.md` em
      `apps/web/tests/integration/export-volume.test.ts` (novo): três formatos, filtros/período>366
      dias com a mesma massa, colunas/textos íntegros, medições de tempo/RSS/CPU/conexões, resposta
      do painel, revogação/interrupção/retentativa. Sem massa maior ou teste de estresse nesta
      rodada; registrar limites da evidência, sem alegar validação da virada real de planilha/grande
      volume.
- [ ] T039 Executar gates/testes da função no CI e registrar resultados/capturas/limites em
      `specs/010-reports-analytics/evidence/plan-2026-09-21-validation.md` (novo); marcar conclusão
      somente com evidência, preservando tarefas institucionais e históricas.

T025 anterior (acesso a Agendamentos em todas as projeções) é detalhada nesta lista, inclusive
resumo/avisos/cancelamentos; T026 de consumidores externos continua adiada.

## Dependências e ordem de execução

Setup → Foundational → histórias → Polish. Dentro de cada história, contratos/testes antecedem
código e jornada; tarefas sem [P] seguem a ordem apresentada. Infraestrutura de 001 (concessões,
schemas, writers, rotas e UI) precede adaptadores/exportações dos demais specs. Migração 0025
precede0026;0027 antes de transferências;0028 depende do diagnóstico de conflitos e não altera dados
automaticamente. Regressões004/006 e regras008 podem avançar após catálogo/migrações mesmo antes do
núcleo de exportação. Aceite transversal002 depende das evidências das funções. Spec009 exige gate
M016. Não há dependência em retenção/P01/canais futuros para o recorte administrativo atual.

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

# Tasks: Relatórios e Análises

## Setup e fundação

- [x] T001 Especificar/pesquisar em specs/010-reports-analytics/{spec,plan,research}.md.
- [x] T002 Criar contratos e testes em packages/contracts/src/reports.ts e tests/reports.test.ts.
- [x] T003 Criar persistência e permissões em packages/db/migrations/0024_reports.sql.

## US1 — Resumo gerencial

Teste independente: totais e comparação conhecidos, mesmos filtros no PDF/CSV.

- [x] T004 [US1] Implementar consultas autorizadas em packages/db/src/repositories/reports.ts.
- [x] T005 [US1] Implementar resumo e série em packages/db/src/repositories/report-summary.ts.
- [x] T006 [US1] Criar HTTP/navegação em apps/web/modules/reports/http.ts e
      app/(admin)/reports/page.tsx.
- [x] T007 [US1] Criar aba gerencial em apps/web/modules/reports/ui/reports-page.tsx.

## US2 — Análise detalhada e exportações

Teste independente: filtro/coluna/grupo, consulta pessoal versionada e arquivo completo.

- [x] T008 [US2] Persistir consultas/exportações em packages/db/src/repositories/report-storage.ts.
- [x] T009 [US2] Gerar PDF/XLSX/CSV no worker em apps/worker/src/jobs/report-export.ts.
- [x] T010 [US2] Reautorizar downloads e bloquear bypass em apps/web/modules/reports/http.ts e
      modules/files/file-service.ts.
- [x] T011 [US2] Criar detalhes, consultas e exportações em
      apps/web/modules/reports/ui/reports-page.tsx.

## US3 — Resultados e evolução

Teste independente: mesma base do resumo, gráfico acessível, comentários e PDF.

- [x] T012 [US3] Criar visão executiva/modo apresentação em
      apps/web/modules/reports/ui/reports-page.tsx.

## US4 — Acessos e uso

Teste independente: navegação SPA, retry sem duplicação, fonte sem dados e rejeição de coleta
inválida.

- [x] T013 [US4] Criar coletor e métricas em packages/db/src/repositories/report-analytics.ts.
- [x] T014 [US4] Instrumentar painel e integração externa em apps/web/modules/reports/collector.tsx
      e ingest.ts.
- [x] T015 [US4] Expor atividade/jornadas/cobertura em apps/web/modules/reports/ui/reports-page.tsx.

## Validação e entrega

- [x] T016 Validar banco/arquivos/autorização em apps/web/tests/integration/reports.test.ts (inclui
      o worker real).
- [x] T017 Validar navegador, estados vazios, mobile, temas e acessibilidade em
      apps/web/tests/e2e/reports.spec.ts.
- [x] T018 Registrar exportação transversal em specs/002-integrated-modules/plan.md e tasks.md.
- [x] T019 Executar gates/CI e revisar artefatos em specs/010-reports-analytics/evidence.md.
- [x] T020 Abrir PR para dev com evidências e rollback, sem merge, e sincronizar principal.

## Dependências e execução

- [x] T021 Corrigir acompanhamento de retries e testar transições até sucesso/falha definitiva.
- [x] T022 Corrigir atualização explícita com filtros iguais e testar números renovados na tela.
- [x] T023 Mover analytics de reserva para após a resposta e testar coleta pendente/indisponível.
- [x] T024 Validar correções nos dois CIs, atualizar evidências e PR34 sem merge.

T001 → T002/T003 → T004/T005 → T006/T007. T008 → T009/T010/T011. US3 reutiliza resumo/exportador.
T013 → T014/T015. T016/T017 → T019/T020. Contratos e pesquisa independentes; exemplos de trabalho
paralelo: testes de formato US2 e estilos US1; não há delegação de implementação nesta execução.
Primeiro incremento verificável é US1; entrega completa inclui US1–US4, sem parar no MVP.

## Permissão geral de exportação — 21/09/2026

- [ ] EX01 Substituir reports:export pela permissão geral nos controles de solicitação, geração e
      download, mantendo consulta, leitura dos domínios e propriedade; converter automaticamente
      concessões antigas com 001 AX01/002 EXP04, sem alterar leitura nem conceder a quem não tinha
      exportação.
- [ ] EX02 Validar matriz de acesso parcial, ausência/revogação da permissão geral, acesso aos
      domínios revogado e URLs diretas; preservar arquivos privados e registrar evidências.

## Download direto — Q6 de 21/09/2026

T008–T011/T021 registram implementação anterior de fila/histórico/retries; não comprovam o fluxo
novo. Não desmarcar evidências históricas nem apagar seus dados.

- [ ] DX01 Pesquisar e planejar exportação direta integral nos três formatos, recursos/interrupção e
      restrições dos formatos; adequar contratos/geração para remover teto funcional de
      linhas/período e dependência da jornada de fila/histórico, preservando registros legados e
      autorização.
- [ ] DX02 Implementar “Exportar Relatórios” com tela de filtros, seleção e ordem de colunas
      autorizadas e botões Excel/CSV/PDF nas três abas; iniciar download direto ao escolher formato,
      mostrar andamento/falha e preservar contexto para repetir.
- [ ] DX03 Validar arquivos completos reais nos três formatos, filtros, seleção e ordem das colunas
      iguais nos três formatos, ordenação dos registros e recusa de campos restritos, mais de 50 mil
      linhas e período maior que 366 dias, autorização/revogação, interrupção/retentativa,
      navegador/acessibilidade; registrar evidências no CI sem carga pesada no preview.

## Phase 1: Convergence — revisão de 21/09/2026

- [ ] T025 Exigir consulta a Agendamentos para dataset bookings, métricas/séries/avisos do resumo,
      apresentação e arquivos; capturar/revalidar essa concessão no worker/download e testar
      revogação/acesso parcial, coordenando 008 AC01–AC03. Origem: FR-006/SC-002 e Q8/Q9, A02
      (partial).
- [ ] T026 Quando app/site forem retomados, instrumentar e homologar cada consumidor externo no
      endpoint de ingestão existente, com fontes/credenciais por canal, deduplicação e cobertura
      real; manter indicação de fonte não instrumentada até evidência. Origem: US4/FR-009/SC-004,
      A13 (partial); coordenar UI01/UI02 sem iniciar esses canais agora.

DX01–DX03 devem reutilizar seleção de colunas existente no detalhe e corrigir sua ordem: queryReport
hoje percorre o catálogo, não query.columns. Schema/UI recusam Excel em Resumo/Resultados. Os testes
históricos não aprovam as decisões novas.

</details>

## Padronização de ações — 22/09/2026

- [x] UI03 Mover a exportação existente para dentro do quadro acima dos filtros com cabeçalho
      compartilhado, botão secundário e ícone; preservar acesso/fluxo e validar posição,
      responsividade, temas e acessibilidade no CI. Colaboradores usa inclusão primária no cabeçalho
      conforme Parceiros/Associados.

Validação da padronização22/09:
[CI35734927572](https://github.com/Komunick/caabnovo/actions/runs/35734927572) aprovou
quality/browser/security eme9d05ed (95 E2E e6 a11y). Imagens de Colaboradores, Auditoria e
Relatórios revisadas em desktop/celular e claro/escuro; exportação dentro do quadro acima dos
filtros. Ver
[evidências do complemento](../001-project-foundation/evidence/collaborators-2026-09-22-validation.md).
