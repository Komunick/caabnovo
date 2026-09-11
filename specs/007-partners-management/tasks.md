# Tasks: Parceiros e benefícios

Base: [spec.md](spec.md), [plan.md](plan.md), pesquisa, modelo, contratos e interface.
Testes obrigatórios por autorização, publicação, arquivos e persistência.

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
- [ ] T008 [US1] Criar lista, formulário inicial e abas Cadastro/Unidades em apps/web/modules/partners/ui/ e app/(admin)/partners/.
- [x] T009 [US1] Validar duplicidade, filtros, referências e conflitos em apps/web/tests/integration/partners.test.ts.

## US2 — Contratos e arquivos

Objetivo/teste independente: registrar/aprovar/encerrar contrato e proteger documento de outro parceiro.

- [x] T010 [US2] Implementar contratos/vigência/documentos em apps/web/modules/partners/partner-service.ts.
- [ ] T011 [US2] Integrar proprietário partner em apps/web/modules/files/file-service.ts com testes de upload/finalize/download.
- [ ] T012 [US2] Criar aba de contratos e envio verificado em apps/web/modules/partners/ui/contract-panel.tsx.
- [x] T013 [US2] Validar aprovação, data-limite, arquivo indevido e rollback em apps/web/tests/integration/partners.test.ts.

## US3 — Benefícios e exibição

Objetivo/teste independente: rascunho/prévia/publicação por canal, edição privada, vigência e retirada.

- [x] T014 [US3] Implementar snapshot/publicação/consulta externa em apps/web/modules/partners/partner-service.ts e app/api/v1/benefits/.
- [ ] T015 [US3] Criar aba/editor/prévia e catálogo administrativo em apps/web/modules/partners/ui/benefit-panel.tsx e app/(admin)/partners/benefits/.
- [x] T016 [US3] Validar projeção pública, estado, canais e expiração em apps/web/tests/integration/partners.test.ts.

## US4 — Acesso e harmonização

Objetivo/teste independente: conta sem acesso recusada; consulta/edição/publicação distintas; histórico legível.

- [ ] T017 [US4] Integrar menu/cabeçalho/painel e acessos individuais em apps/web/modules/workspace/areas.ts, components/app-shell.tsx e modules/users/ui/user-access-form.tsx.
- [ ] T018 [US4] Exibir histórico e validar negações/revogação em apps/web/modules/partners/ui/ e http/routes.test.ts.
- [ ] T019 [US4] Validar jornadas, teclado e acessibilidade em apps/web/tests/e2e/partners.spec.ts.

## Acabamento e entrega

- [ ] T020 Conferir quatro páginas, claro/escuro e 390 px; registrar evidências em specs/007-partners-management/evidence.md.
- [ ] T021 Executar gates e vincular a entrega ao programa em specs/002-integrated-modules/tasks.md e docs/MODULES.md.
- [ ] T022 Preparar PR único para dev e corrigir CI, registrando resultado em specs/007-partners-management/evidence.md, sem merge.

## Dependências e estratégia

T001–T005 → US1 → US2 → US3 → US4 → T020–T022. Primeiro incremento testável: cadastro/unidades;
a entrega solicitada abrange as quatro histórias no mesmo PR. Contratos e testes podem ser
preparados separadamente após o desenho; implementação sequencial para evitar disputa nos
arquivos de serviço/UI. A pesquisa independente exigida pelo workflow de planejamento foi
delegada; isso não cria autorização para agentes de implementação adicionais.

22 tarefas, IDs únicos; US1 4, US2 4, US3 3, US4 3, setup/fundação/acabamento 8.
Hooks before/after ausentes. Nenhum deploy/merge ou seed sobre banco compartilhado.
