# Tasks: Parceiros e benefícios: exportação autorizada — incremento de 21/09/2026

**Input:** [spec](spec.md), [plan](plan.md), [research](research.md), [modelo](data-model.md),
[contrato](contracts/exports.md), [quickstart](quickstart.md).
**Branch da entrega:** `docs/project-clarify-20260921`. Nenhuma tarefa nova executada.
**Lista ativa:** T039–T045; testes foram pedidos nas specs e nos gates do projeto.
Caminhos novos são destinos planejados; conferir referências contra o inventário de
artefatos deste incremento antes de editar. Nenhum arquivo de código foi criado agora.

## Rastreabilidade e escopo

Nova exportação US5; tarefas concluídas do módulo e políticas institucionais permanecem históricas/pendentes conforme seu estado.

O histórico abaixo conserva marcadores e evidências originais. IDs provisórios
detalhados aqui não são uma segunda execução; usar a lista ativa. Pendências de
política/pesquisa/homologação e funções suspensas continuam pendentes e não são
autorizadas por constarem neste arquivo. Não repetir tarefas já concluídas.

## Setup

- [ ] T039 Conferir o catálogo real de telas/abas e filtros contra `specs/007-partners-management/contracts/exports.md`; mapear campos permitidos/defaults e projeções atuais, sem criar fonte ou ampliar permissão.

## Foundational

- [ ] T040 Preparar fixtures sintéticas isoladas e contratos da função em `apps/web/modules/partners/export-fixtures.ts` (novo, exclusivo de testes), com datas empatadas, zero resultados, texto longo, campos restritos e filtros combinados; depende dos schemas de 001.

## US5 — Exportação autorizada

**Objetivo/aceite independente:** Todas as listas/abas consultáveis exportam três formatos com filtros/colunas idênticos; contratos/publicação permanecem intactos.

- [ ] T041 [US5] Escrever testes do adaptador em `apps/web/modules/partners/export-adapter.test.ts` (novo): filtro+sort, columns em ordem pedida, campo proibido, dados completos e matriz de autorização conforme `specs/007-partners-management/contracts/exports.md`.
- [ ] T042 [US5] Implementar `apps/web/modules/partners/export-adapter.ts` (novo) reutilizando as consultas/projeções do domínio, IDs/dependências para reautorização por lote e cursor do núcleo 001; cobrir todos os datasets do contrato, sem ampliar acesso ou alterar dados.
- [ ] T043 [US5] Integrar ação/tela em `apps/web/app/(admin)/partners/exportar/page.tsx` (nova) e nas listas/abas existentes de `apps/web/modules/partners/ui/`; passar contexto/filtros, preservar rascunho e oferecer os três formatos com defaults e reordenação acessível.
- [ ] T044 [US5] Validar arquivos reais nos três formatos, ordem/contagem/IDs/filtros e negações em `apps/web/tests/integration/partners.test.ts` e `apps/web/tests/e2e/partners.spec.ts`; usar o parser independente do núcleo 001 e confirmar erro recuperável sem corte.

## Polish

- [ ] T045 Executar gates/testes da função no CI e registrar resultados/capturas/limites em `specs/007-partners-management/evidence/plan-2026-09-21-validation.md` (novo); marcar conclusão somente com evidência, preservando tarefas institucionais e históricas.

## Dependências e ordem de execução

Setup → Foundational → histórias → Polish. Dentro de cada história, contratos/testes
antecedem código e jornada; tarefas sem [P] seguem a ordem apresentada. Infraestrutura
de 001 (concessões, schemas, writers, rotas e UI) precede adaptadores/exportações dos
demais specs. Migração 0025 precede0026;0027 antes de transferências;0028 depende do
diagnóstico de conflitos e não altera dados automaticamente. Regressões004/006 e
regras008 podem avançar após catálogo/migrações mesmo antes do núcleo de exportação.
Aceite transversal002 depende das evidências das funções. Spec009 exige gate M016.
Não há dependência em retenção/P01/canais futuros para o recorte administrativo atual.

## Paralelismo por história

Após pré-requisitos, os adaptadores de domínios diferentes podem avançar em paralelo
porque têm arquivos próprios. Dentro desta função, manter testes→adaptador→UI→E2E
sequencial; não dividir edições no mesmo arquivo. [P] identifica arquivos independentes
prontos após a base da fase: writers separados em001 e relatórios de aceite em002.
Para cada história sem par de arquivos independente, não há paralelismo interno seguro;
ela pode avançar junto da história equivalente de outro domínio após as dependências.
Migrações/catálogo/registro central têm um único responsável na spec001, sem edições simultâneas.

## Estratégia incremental e MVP

Primeiro invariantes de acesso/migração e descoberta; depois fluxo completo de
Relatórios usando núcleo 001 como prova vertical (três formatos, todos os dados).
Isso é marco de validação, não redução do escopo: completar depois cada função
do contrato, incluindo003/004/005/007/008 e Colaboradores;009 permanece condicionada.
Reservas Q1/Q2 seguem incremento independente008 após permissões. Políticas adiadas,
chat/suporte, CAASSH, portal e app/site não são parte do MVP.

## Histórico e backlog anterior — não executar automaticamente

<details>
<summary>Tarefas anteriores, evidências e pendências preservadas</summary>

# Tasks: Parceiros e benefícios

Base: [spec.md](spec.md), [plan.md](plan.md), pesquisa, modelo, contratos e interface.
Testes obrigatórios por autorização, publicação, arquivos e persistência.

## Estado da execução — retomada autorizada em 14/09/2026

Implementação e validação local concluídas: 308 unitários/contratos, 135 integrações,
builds, typecheck e 55 E2E Chromium passaram. Abas, contatos, CEP e justificativas
validados com teclado, Axe e capturas em dois temas/390 px. Evidências atualizadas.
T001–T036 concluídas. Preview 3107 atualizado com banco/contas/fotos preservados;
PR #18 atualizado e quality/browser/security aprovados no commit 775e761.
Dependência compartilhada entregue no PR #19, também com CI aprovado. Ambos
permanecem abertos para revisão humana. Nenhum merge em dev.

## Setup

- [x] T001 Criar branch isolada e spec/checklist/interface em specs/007-partners-management/.
- [x] T002 Pesquisar fontes oficiais e definir plano/modelo/contratos em specs/007-partners-management/.

## Fundação

- [x] T003 Definir schemas e testes de CNPJ/entradas em packages/contracts/src/partners.ts e tests/partners.test.ts.
- [x] T004 Criar migration aditiva 0016 e validar constraints em packages/db/migrations/0016_partners.sql e apps/web/tests/integration/partners.test.ts.
- [x] T005 Implementar autorização atual e permissões em apps/web/modules/partners/access.ts e modules/auth/permissions.ts.

## US1 — Cadastros e unidades

Objetivo/teste independente: criar, buscar, editar, suspender, arquivar/restaurar e manter unidades.

- [x] T006 [US1] Implementar transação/idempotência/cadastro/unidades em apps/web/modules/partners/partner-service.ts.
- [x] T007 [US1] Expor API privada em apps/web/modules/partners/http/ e app/api/v1/partners/.
- [x] T008 [US1] Criar lista, formulário inicial e abas Cadastro/Unidades em apps/web/modules/partners/ui/ e app/(admin)/partners/.
- [x] T009 [US1] Validar duplicidade, filtros, referências e conflitos em apps/web/tests/integration/partners.test.ts.

## US2 — Contratos e arquivos

Objetivo/teste independente: registrar/aprovar/encerrar contrato e proteger documento de outro parceiro.

- [x] T010 [US2] Implementar contratos/vigência/documentos em apps/web/modules/partners/partner-service.ts.
- [x] T011 [US2] Integrar proprietário partner em apps/web/modules/files/file-service.ts com testes de upload/finalize/download.
- [x] T012 [US2] Criar aba de contratos e envio verificado em apps/web/modules/partners/ui/contract-panel.tsx.
- [x] T013 [US2] Validar aprovação, data-limite, arquivo indevido e rollback em apps/web/tests/integration/partners.test.ts.

## US3 — Benefícios e exibição

Objetivo/teste independente: rascunho/prévia/publicação por canal, edição privada, vigência e retirada.

- [x] T014 [US3] Implementar snapshot/publicação/consulta externa em apps/web/modules/partners/partner-service.ts e app/api/v1/benefits/.
- [x] T015 [US3] Criar aba/editor/prévia e catálogo administrativo em apps/web/modules/partners/ui/benefit-panel.tsx e app/(admin)/partners/benefits/.
- [x] T016 [US3] Validar projeção pública, estado, canais e expiração em apps/web/tests/integration/partners.test.ts.

## US4 — Acesso e harmonização

Objetivo/teste independente: conta sem acesso recusada; consulta/edição/publicação distintas; histórico legível.

- [x] T017 [US4] Integrar menu/cabeçalho/painel e acessos individuais em apps/web/modules/workspace/areas.ts, components/app-shell.tsx e modules/users/ui/user-access-form.tsx.
- [x] T018 [US4] Exibir histórico e validar negações/revogação em apps/web/modules/partners/ui/ e http/routes.test.ts.
- [x] T019 [US4] Validar jornadas, teclado e acessibilidade em apps/web/tests/e2e/partners.spec.ts.

## Acabamento e entrega

- [x] T020 Conferir quatro páginas, claro/escuro e 390 px; registrar evidências em specs/007-partners-management/evidence.md.
- [x] T021 Executar gates e vincular a entrega ao programa em specs/002-integrated-modules/tasks.md e docs/MODULES.md.
- [x] T022 Preparar PR único para dev e corrigir CI, registrando resultado em specs/007-partners-management/evidence.md, sem merge.

## Dependências e estratégia

## Complemento de escopo — revisão do usuário em 11/09/2026

- [x] T023 Atualizar spec/plano/interface/pesquisa para unidades gerais, categorias, avaliações e configuração do app.
- [x] T024 Criar contratos e migration 0017 com backfill de categorias, configurações e avaliações preservadas.
- [x] T025 Implementar categorias, unidades gerais e configuração com autorização, auditoria, idempotência e testes.
- [x] T026 Aplicar a seleção de categorias na API do app e oferecer catálogo público de categorias com testes de exclusão e canal site independente.
- [x] T027 Implementar páginas Unidades/Categorias/Configurações e navegação harmonizada.
- [x] T028 Implementar aba Avaliações e moderação preservando opinião original; explicitar integração externa disponível/pendente.
- [x] T029 Validar novos fluxos, falhas, permissões, persistência, teclado e dois temas em desktop/390 px.
- [x] T030 Atualizar evidências e PR 18, corrigir CI e publicar a composição atual no preview 3107 preservando seu banco.

## Ajustes de unidades — revisão de 11/09/2026

- [x] T031 Atualizar contrato e formulário de unidades com CEP automático, UF digitável/lista e máscara DDD + fixo/celular.
- [x] T032 Dispensar motivo na criação de unidade; manter validação na edição e auditoria de ambas.
- [x] T033 Testar preenchimento, falhas/concorrência do CEP, persistência e máscaras; atualizar preview e evidências no mesmo PR.
- [x] T034 Aplicar os mesmos campos ao cadastro do parceiro, incluindo endereço, CNPJ/e-mail/site e criação sem motivo; consumir o padrão compartilhado das tarefas CF01–CF03 da fundação.
- [x] T035 Separar navegação geral das seções do cadastro/edição: áreas do módulo apenas nas consultas, retorno à lista no cadastro e faixa interna “Dados do parceiro” com abas de texto e linha ativa; validar dois temas e celular.

T001–T005 → US1 → US2 → US3 → US4 → T020–T022. Primeiro incremento testável: cadastro/unidades;
a entrega solicitada abrange as quatro histórias no mesmo PR. Contratos e testes podem ser
preparados separadamente após o desenho; implementação sequencial para evitar disputa nos
arquivos de serviço/UI. A pesquisa independente exigida pelo workflow de planejamento foi
delegada; isso não cria autorização para agentes de implementação adicionais.

- [x] T036 Aplicar criação sem motivo a categorias, contratos e benefícios; manter motivo em todas as alterações/transições, validar auditoria e atualizar evidências no PR 18.

38 tarefas, IDs únicos; 22 da entrega inicial e 16 dos complementos solicitados.
Hooks before/after ausentes. Nenhum deploy/merge ou seed sobre banco compartilhado.

## Campos de todo o sistema — 14/09/2026

- [x] T037 Aplicar os campos comuns em todas as abas, separar endereço de parceiro/unidade, preservar legado e projeção pública; testar persistência, consulta CEP, teclado e regressão no PR #18 dependente do #19.

- [x] T038 Explicitar JPG nos anexos de contratos usando o seletor comum do PR #19 e preservar PNG/PDF.


## Regra vigente: nenhuma justificativa obrigatória — 14/09/2026

- [x] RM01 Remover exigências de justificativa nos contratos, serviços e persistência desta função.
- [x] RM02 Retirar campos e bloqueios de motivo em todas as telas da função.
- [x] RM03 Validar fluxos sem motivo, auditoria preservada e controles de autorização; registrar evidências da entrega compartilhada.

Evidências RM03: [validação final de 15/09/2026](../001-project-foundation/evidence/reason-removal-2026-09-14.md).


## Navegação sem perda de edição — 16/09/2026

- [x] DP01 Integrar a preservação compartilhada às abas e formulários desta função.
- [x] DP02 Validar retorno, sucesso, cancelamento e isolamento; registrar [evidências](evidence/drafts-2026-09-16.md) no PR.

## Exportação transversal — revisão de 21/09/2026

- [ ] DX01 Detalhar, implementar e validar a exportação de Parceiros e suas abas conforme 002 EXP06/EXP07 e docs/EXPORT-STANDARD.md: ação nomeada, filtros pertinentes, seleção/ordem de colunas, Excel/CSV/PDF integrais e download direto, consulta ao módulo mais permissão geral, recusa de campos restritos e revogação. Sem teto funcional, fila/histórico obrigatório ou prazo de download; sem alterar anexos/documentos. A07 (missing). Tarefa do módulo que executa a coordenação transversal, não um segundo projeto.

</details>
