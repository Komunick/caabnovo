# Tasks: Associados

**Status em 11/09/2026**: o usuário confirmou “associados considere pronto” e autorizou
preparar os PRs do trabalho concluído que ainda não entrou em dev. T017 concluída por essa
confirmação explícita. T012 em preparação; a homologação externa OAB (T028) continua separada,
sem consulta real autorizada nesta revisão.

## Ativação e bloqueio administrativo — 10/09/2026

- [x] T029 Especificar e implementar estados/transições com migration aditiva, contrato,
  permissão de análise, justificativa, versão/idempotência e auditoria na mesma transação.
- [x] T030 Exibir situação, última decisão e confirmação de ações no cadastro; acrescentar
  coluna/filtro imediato na lista e situação no resumo para consumidores.
- [x] T031 Validar contrato, autorização, transições, concorrência, rollback de auditoria,
  independência das avaliações e arquivamento/restauração em banco descartável; conferir UI
  com dados simulados, acessibilidade e atualizar localhost sem reset/seed ou PR.
- [x] T032 Compactar filtros a pedido do usuário: busca sempre visível, painel recolhível,
  contador de filtros ativos e grade compacta; verificar navegação, teclado e acessibilidade.

## Setup

- [x] T033 Corrigir abertura do calendário de nascimento e aplicar máscaras numéricas de
  CPF/telefone e erro de e-mail junto ao campo; validar calendário, teclado, colagem,
  limites, correção e acessibilidade em Chromium, Firefox e WebKit sem salvar cadastros.

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
- [ ] T012 Somente após Associados estar funcionalmente pronto, abrir um PR completo para dev;
  documentação/testes/código juntos, sem merge automático. Aguardar conclusão das pendências e
  revisão funcional; não executar com base apenas nos testes do incremento atual.

Dependências: T001→T002/T003→T004→T005/T006→T007→T008→T009→T010→T011→T012. Preparação de contratos e migration pode ocorrer em arquivos separados; implementação local sequencial. Caassh pode progredir em worktree separado com o contrato publicado, sem editar estes arquivos. Primeiro incremento US1; entrega inclui todas as histórias.

## Complementos da retomada — 10/09/2026

- [x] T013 Atualizar base para dev preservando trabalho parcial e revisar spec/plano/contratos; registrar credencial limitada a situação e validade.
- [x] T014 Aplicar members:read/write/review com concessão inicial ao administrador aprovada pelo usuário em 10/09/2026; revalidar permissões no banco, proteger páginas/navegação e rotas genéricas de arquivos; testar revogação e matriz negativa.
- [x] T015 Exibir histórico completo das revisões documentais e vínculos em ambos os cadastros; testar substituição, download e avaliações independentes.

T014/T015 complementam T004–T010 e precedem a validação final T011/T012. Emissão institucional de credencial e políticas P01–P04 permanecem fora deste incremento conforme FR-013.

- [x] T016 Tratar o evento de erro transitório da fila no worker, preservando o retry e registrando
  somente campos seguros; adicionar regressão em `apps/worker/src/queue.test.ts` e iniciar o worker
  no CI de navegador para validar uploads reais.

- [x] T017 Receber a validação funcional do usuário no localhost e registrar os ajustes solicitados;
  implementar e verificar esses ajustes antes de considerar T012 disponível.

### Pontos para reconciliação de escopo antes da entrega

O PRD cita pesquisa por seccional (ASS-002), coberta na retomada T020, e
ativação/bloqueio/desbloqueio com histórico (ASS-003/005), tratados por T029–T031.
O usuário confirmou desbloqueio manual e registro da futura integração com Agenda para
associado/dependentes. Regras financeiras e demais finalidades continuam em P02.

## Retomada após PRs #13 e #14 — 10/09/2026

- [x] T018 Preservar o trabalho pausado e integrar origin/dev be46efa, incluindo Configurações e URLs públicas atrás de proxy; resolver conflitos sem retirar Associados ou outras áreas.
- [x] T019 Retirar a exigência remanescente de MFA no autorizador de Associados e nos testes; manter sessão ativa, permissões revalidadas, validade e revogação de concessões (FR-009; decisão da spec 006).
- [x] T020 Implementar filtro por seccional OAB com validação, combinação com os demais filtros e preservação na paginação; testar no servidor e no navegador (FR-001, PRD ASS-002).
- [x] T021 Completar a jornada de cadastro, vínculo, avaliação e consulta somente por teclado em 390px, usando o login atual sem autenticador; revalidar documentos e regressões da base (FR-011, SC-004).
- [x] T022 Atualizar o contrato para Caassh, retirando as reservas obsoletas da spec 006 e migrations 0011/0012; registrar gates e limites da retomada sem abrir PR (FR-008/010).

T018–T022 concluídas com 208 testes unitários/contratos, 90 de integração e 16 jornadas de
navegador aprovados; detalhes e limites em [evidence.md](evidence.md). T012/T017 continuam pendentes,
assim como as extensões que dependem de P01–P04/D02. A pedido do usuário, somente o preview
`http://localhost:3106/members` permanece ativo. Nenhum PR ou deploy de Associados foi realizado.

## Revisão funcional — filtros e integração OAB, 10/09/2026

- [x] T023 Substituir “Seccional OAB”/“Todas as seccionais” por “Estado da OAB”/“Todos os estados”; aplicar filtros de seleção imediatamente, preservar combinação e histórico, reiniciar paginação, oferecer lupa dentro do campo de pesquisa à direita, Enter e Limpar filtros; validar em navegadores sem recriar o banco local. Evidências em evidence.md.
- [x] T024 Investigar registros e implementação do painel anterior: localizar guia, serviço OAB-BA/Implanta e tela avulsa; corrigir a premissa de ausência de API e documentar contrato e diferenças de situação em contracts/oab-legacy.md.
- [x] T025 Incorporar a consulta OAB-BA avulsa e pelo cadastro usando o contrato recuperado, com configuração isolada no servidor, resposta validada, permissões revalidadas, estados de falha e auditoria. Validar com respostas simuladas e banco descartável; não converter regularidade em bloqueio, aprovação ou crédito. Homologação real separada em T028.

O retorno do usuário iniciou T017. O módulo permanece em revisão funcional, sem autorização de PR.

## Padronização visual e navegação — 10/09/2026

- [x] T026 Aplicar o padrão compartilhado de botões de Notícias em Associados, incluindo
  ações, links de retorno, paginação e lupa dentro do campo; validar temas claro/escuro,
  telas pequenas e foco/acessibilidade. Estilos compartilhados pertencem à branch
  `feature/button-style-standardization`; ajustes de Associados permanecem nesta branch.
- [x] T027 Posicionar Associados imediatamente após Notícias no menu administrativo,
  preservando as permissões existentes e a mesma ordem na navegação do workspace.

- [ ] T028 Homologar a API OAB-BA com dados de teste autorizados pela instituição e confirmar a configuração no ambiente de entrega. A conexão local foi ativada, mas o teste real foi descartado após o esclarecimento do usuário sobre falta de autorização. Não reutilizar aquela inscrição, conservar seus resultados ou apresentar testes simulados como homologação institucional.


T025 concluída localmente em 10/09/2026; T028 reaberta na revisão após o esclarecimento do usuário. O resultado da consulta real foi removido a pedido do usuário; não conservar número, situação ou capturas nem reutilizar essa inscrição em testes. Limite de seis dígitos aplicado no campo e no servidor. Não houve configuração da hospedagem ou PR.
