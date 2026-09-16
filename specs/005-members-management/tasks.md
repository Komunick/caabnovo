# Tasks: Associados

## Coordenação com Agendamentos — 15/09/2026

- [x] AE01 Compartilhar lock transacional e projeção mínima de elegibilidade com spec 008.
- [x] AE02 Preservar regras/permissões do módulo e cobrir cadeias de titulares vigentes.
- [x] AE03 Validar bloqueio/vínculo/desvínculo concorrentes reais no CI e registrar evidências da spec 008.

## Incremento: foto de perfil — branch feature/member-profile-photo

**Status: PRONTO — aceite explícito do usuário em 11/09/2026.** A foto pertence ao
associado e será a mesma enviada por ele no app. A integração de envio pelo app está
documentada como escopo do app; não bloqueia o aceite desta entrega administrativa.

- [x] T040 Registrar a origem da foto no app, referência compartilhada com o painel,
  limites da integração futura e aceite da entrega (FR-029).

- [x] T034 Atualizar spec, pesquisa oficial, plano e modelo antes da implementação.
- [x] T035 Adicionar referência opcional e comando privado, versionado e auditado para foto.
- [x] T036 Implementar envio seguro, prévia no novo cadastro, substituição/remoção e avatar.
- [x] T037 Validar arquivos inválidos, autorização, concorrência, idempotência e rollback.
- [x] T038 Conferir visualmente temas e 390 px; validar E2E, acessibilidade e build.
- [x] T039 Abrir [PR #17](https://github.com/Komunick/caabnovo/pull/17) para dev e concluir
  gates, sem executar merge. Evidências em [photo-validation.md](photo-validation.md).

**Status em 11/09/2026**: o usuário confirmou “associados considere pronto” e autorizou
preparar os PRs do trabalho concluído que ainda não entrou em dev. T017 concluída por essa
confirmação explícita. T012 concluída com o [PR #15](https://github.com/Komunick/caabnovo/pull/15);
a homologação externa OAB (T028) continua separada,
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
- [x] T012 Abrir um PR completo para dev com documentação, testes e código, após confirmação
  funcional explícita do usuário em 11/09/2026: [PR #15](https://github.com/Komunick/caabnovo/pull/15).
  Sem merge automático; acompanhar os gates e a revisão no próprio PR.

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

- [x] CF-M Padronizar máscara e validação acessível de CPF/telefone/e-mail, conforme CF01–CF03 da fundação, e validar persistência/edição.

## Campos — 14/09/2026

- [x] CF-OAB Validar digitação/colagem até seis dígitos, contrato de cadastro/consulta e regressões; PR #19.

## Padronização de justificativas — 14/09/2026

- [x] JP01 Inventariar criação/alteração e registrar regra, pesquisa e plano.
- [x] JP02 Implementar contrato, serviço, auditoria e formulário desta área.
- [x] JP03 Validar criação sem motivo, edição recusada sem motivo e auditoria preservada.
- [x] JP04 Concluir gates e evidências da entrega compartilhada em branch nova antes do PR.

## Resultado da consulta OAB — 14/09/2026

- [x] OR01 Registrar campos retornados e seleção do usuário sem dados pessoais; atualizar spec, plano e pesquisa.
- [x] OR02 Ampliar contrato/provedor e exibir os sete campos com ausências explícitas, sem repetir OAB.
- [x] OR03 Validar projeção, situações independentes, privacidade da auditoria, responsividade e acessibilidade com dados sintéticos.
- [x] OR04 Concluir CI e evidências na branch única ativa, sem consultar novamente os dados reais.

Validação de justificativas e resultado OAB: [evidências de 14/09/2026](../001-project-foundation/evidence/justification-oab.md).


## Regra vigente: nenhuma justificativa obrigatória — 14/09/2026

- [x] RM01 Remover exigências de justificativa nos contratos, serviços e persistência desta função.
- [x] RM02 Retirar campos e bloqueios de motivo em todas as telas da função.
- [x] RM03 Validar fluxos sem motivo, auditoria preservada e controles de autorização; registrar evidências da entrega compartilhada.

Evidências RM03: [validação final de 15/09/2026](../001-project-foundation/evidence/reason-removal-2026-09-14.md).

## Configuração OAB para deploy — histórico substituído, 15/09/2026

OC01–OC03 registram a proposta inicial do PR25. A regra vigente é ON01–ON03 abaixo:
OAB_API_ENABLED é ignorada, inclusive false. Não reaplicar a regra inicial.

- [x] OC01 Pesquisar APIs oficiais equivalentes e registrar decisão na spec/plan/research.
- [x] OC02 Permitir credenciais completas sem flag, preservando false e recusa de configuração inválida; atualizar contrato e exemplo.
- [x] OC03 Executar regressões sintéticas e gates; registrar evidências para entrega em PR isolado.

T028 permanece separada: consulta real não foi executada nesta correção de código.

Evidências OC01–OC03: [configuração OAB](evidence/oab-config-2026-09-15.md).

## Decisão final: OAB sem flag de ativação — 15/09/2026

- [x] ON01 Remover dependência da flag, atualizar exemplo e contrato vigente.
- [x] ON02 Validar consulta com qualquer flag legada e recusa sem credenciais; executar CI.
- [x] ON03 Registrar evidências e preparar entrega substituta do PR25 em branch nova.

Evidências ON01–ON03: [OAB sem flag](evidence/oab-always-on-2026-09-15.md).

## Conferência dos padrões de entrega — 15/09/2026

- [x] WF01 Transferir entrega para prefixo fix e restaurar filtros de branch do CI.
- [x] WF02 Rever constituição, princípios, workflow, stack, spec/plan/tasks/contratos e template; corrigir referências vigentes.
- [x] WF03 Validar ajustes documentais/workflow e preparar PR substituto com checklist completo.

Relatório: [conferência dos padrões](evidence/workflow-compliance-2026-09-15.md).
Proteções remotas e homologação mantêm seus limites explícitos no relatório.


## Navegação sem perda de edição — 16/09/2026

- [x] DP01 Integrar a preservação compartilhada às abas e formulários desta função.
- [x] DP02 Validar retorno, sucesso, cancelamento e isolamento; registrar [evidências](evidence/drafts-2026-09-16.md) no PR.

## Homologação e prontidão — 16/09/2026

- [x] HV01 Executar a verificação aplicável e registrar resultados reais, inclusive impedimentos; ver [evidências](evidence/readiness-2026-09-16.md).
- [x] HV02 Corrigir e testar as lacunas técnicas/documentais; retenção executável e OAB publicada continuam dependências externas explícitas.
- [x] HV03 Registrar resultados e impedimentos externos sem aprovações fictícias; CI final acompanha o PR.

Consulta individual autorizada em 16/09 no DEV retornou OAB_NOT_CONFIGURED; T028 permanece aberta. Sem resultado pessoal armazenado em evidência. Ver evidence/readiness-2026-09-16.md.
