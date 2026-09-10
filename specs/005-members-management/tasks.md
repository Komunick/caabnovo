# Tasks: Associados

## Setup

- [x] T001 Especificar e pesquisar em specs/005-members-management/spec.md e research.md; registrar contrato Caassh em contracts/caassh-handoff.md.
- [x] T002 Criar schemas e testes de entradas em packages/contracts/src/members.ts e tests/members.test.ts.
- [x] T003 Criar constraints e grants em packages/db/migrations/0010_members.sql e validar banco descartável.

## US1 — cadastro e vínculos

Critério independente: cadastro, duplicidade, conflito concorrente, dependência sem ciclo e arquivamento histórico.

- [x] T004 [US1] Implementar serviço transacional e idempotência em apps/web/modules/members/member-service.ts com testes em apps/web/tests/integration/members.test.ts.
- [x] T005 [US1] Expor rotas privadas em apps/web/modules/members/http/routes.ts e app/api/v1/members/ com testes de autorização em http/routes.test.ts.
- [x] T006 [US1] Criar lista/cadastro/detalhe/vínculos em apps/web/modules/members/ui/ e app/(admin)/members/.

## US2 — documentos

Critério independente: upload seguro, revisão e substituição sem perda.

- [x] T007 [US2] Implementar anexos/revisão/download no serviço e UI em apps/web/modules/members/; testar arquivo alheio/quarentena em tests/integration/members.test.ts.

## US3 — avaliações

Critério independente: decisões independentes e atribuíveis, validade/alteração de identificação visíveis.

- [x] T008 [US3] Implementar decisões e histórico em apps/web/modules/members/member-service.ts e UI, com cenários negativos em tests/integration/members.test.ts.

## US4 — consumidores

Critério independente: resumo estável sem CPF/contas e nenhuma listagem pública.

- [x] T009 [US4] Expor findMemberSummary em packages/db/src/repositories/members.ts e adicionar entrada única em apps/web/modules/workspace/areas.ts.

## Validação e entrega

- [x] T010 Verificar jornada completa, teclado/390px/axe em apps/web/tests/e2e/members.spec.ts.
- [x] T011 Executar gates e registrar resultados em specs/005-members-management/evidence.md; atualizar escopo geral existente.
- [ ] T012 Abrir um PR completo para dev após Notícias integrada; documentação/testes/código juntos, sem merge automático.

Dependências: T001→T002/T003→T004→T005/T006→T007→T008→T009→T010→T011→T012. Preparação de contratos e migration pode ocorrer em arquivos separados; implementação local sequencial. Caassh pode progredir em worktree separado com o contrato publicado, sem editar estes arquivos. Primeiro incremento US1; entrega inclui todas as histórias.

## Complementos da retomada — 10/09/2026

- [x] T013 Atualizar base para dev preservando trabalho parcial e revisar spec/plano/contratos; registrar credencial limitada a situação e validade.
- [x] T014 Aplicar members:read/write/review com concessão inicial ao administrador aprovada pelo usuário em 10/09/2026; revalidar permissões no banco, proteger páginas/navegação e rotas genéricas de arquivos; testar revogação e matriz negativa.
- [x] T015 Exibir histórico completo das revisões documentais e vínculos em ambos os cadastros; testar substituição, download e avaliações independentes.

T014/T015 complementam T004–T010 e precedem a validação final T011/T012. Emissão institucional de credencial e políticas P01–P04 permanecem fora deste incremento conforme FR-013.

- [x] T016 Tratar o evento de erro transitório da fila no worker, preservando o retry e registrando
  somente campos seguros; adicionar regressão em `apps/worker/src/queue.test.ts` e iniciar o worker
  no CI de navegador para validar uploads reais.
