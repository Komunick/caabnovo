# Tasks: Agendamentos: acesso, integridade por pessoa e exportação — incremento de 21/09/2026

**Input:** [spec](spec.md), [plan](plan.md), [research](research.md), [modelo](data-model.md),
[contrato](contracts/exports.md), [quickstart](quickstart.md). **Branch da entrega:**
`docs/project-clarify-20260921`. Nenhuma tarefa nova executada. **Lista ativa:** T025–T039; testes
foram pedidos nas specs e nos gates do projeto. Caminhos novos são destinos planejados; conferir
referências contra o inventário de artefatos deste incremento antes de editar. Nenhum arquivo de
código foi criado agora.

## Rastreabilidade e escopo

AC01–AC03/BEN01–BEN03: US1; BLQ01/BLQ02: US2; exportação: US4. CAL06 continua verificação de
evidências, mas PR34 já integrado não pode receber edição; registrar revisão no ciclo atual. US3
futura não inicia automaticamente.

O histórico abaixo conserva marcadores e evidências originais. IDs provisórios detalhados aqui não
são uma segunda execução; usar a lista ativa. Pendências de política/pesquisa/homologação e funções
suspensas continuam pendentes e não são autorizadas por constarem neste arquivo. Não repetir tarefas
já concluídas.

## Setup

- [ ] T025 Conferir o catálogo real de telas/abas e filtros contra
      `specs/008-scheduling-management/contracts/exports.md`; mapear campos permitidos/defaults e
      projeções atuais, sem criar fonte ou ampliar permissão.

## Foundational

- [ ] T026 Preparar fixtures sintéticas isoladas e contratos da função em
      `apps/web/modules/scheduling/export-fixtures.ts` (novo, exclusivo de testes), com datas
      empatadas, zero resultados, texto longo, campos restritos e filtros combinados; depende dos
      schemas de 001.

## US1 — Configurar e reservar

**Objetivo/aceite independente:** Sem read não acessa; só read não muda dados; mesma pessoa em
profissionais/unidades diferentes conflita no banco, familiares distintos podem coincidir,
remarcação falha preserva original.

- [ ] T027 [US1] Atualizar fixtures e testes de acesso em
      `apps/web/tests/integration/scheduling.test.ts`, `packages/contracts/src/scheduling.test.ts` e
      `apps/web/modules/scheduling/http/routes.test.ts`; cobrir nenhum grant, read, read+write,
      write sem read e ator revogado após lock.
- [ ] T028 [US1] Aplicar concessões atuais read/write no banco em
      `apps/web/modules/scheduling/access.ts` e controles em
      `apps/web/modules/scheduling/ui/booking-form.tsx`; conferir todas as páginas/serviços/rotas do
      módulo, preservando beneficiary-service mínimo.
- [ ] T029 [US1] Adicionar diagnóstico read-only em
      `packages/db/scripts/check-scheduling-beneficiary-overlaps.sql` (novo) e testes de conflitos
      antigos em `apps/web/tests/integration/scheduling.test.ts`; se detectar pares sobrepostos,
      parar sem cancelar/alterar reserva e emitir relatório seguro para decisão explícita.
- [ ] T030 [US1] Criar exclusão GiST por member_id+intervalo [) scheduled em
      `packages/db/migrations/0028_scheduling_beneficiary_overlap.sql` (nova), preservando
      constraint profissional; provar que falha integralmente com conflitos existentes e não usar
      NOT VALID.
- [ ] T031 [US1] Adequar `apps/web/modules/scheduling/booking-service.ts`,
      `apps/web/modules/scheduling/availability-service.ts` e `packages/contracts/src/scheduling.ts`
      para beneficiaryId na disponibilidade e tratamento recuperável de conflito por pessoa,
      mantendo rollback da remarcação e constraint como garantia final.
- [ ] T032 [US1] Testar corrida da mesma pessoa em profissionais/unidades diferentes,
      titular/dependentes distintos, parcial/adjacente/cancelada e rollback em
      `apps/web/tests/integration/scheduling.test.ts`; uma reserva vencedora por conflito, sem
      perder a reserva original.

## US2 — Consultar e gerenciar

**Objetivo/aceite independente:** Bloqueio próprio/titular vigente sinaliza lista/calendário/detalhe
e mantém reserva/vaga; desbloqueio remove aviso, cancelamento manual autorizado permanece.

- [ ] T033 [US2] Projetar eligibilityWarning blocked|null em lote, sem N+1, em
      `apps/web/modules/scheduling/booking-service.ts` e `packages/contracts/src/scheduling.ts`;
      reutilizar vínculos atuais de `packages/db/src/repositories/members.ts`, sem mutar
      status/versão/ocupação.
- [ ] T034 [US2] Mostrar aviso textual em lista/calendário/detalhe em
      `apps/web/modules/scheduling/ui/` e cobrir `apps/web/tests/e2e/scheduling.spec.ts`; manter
      reservas após bloqueio, negar nova/remarcação, permitir cancelamento manual e remover aviso
      após desbloqueio efetivo.

## US4 — Exportação autorizada

**Objetivo/aceite independente:** Reserva/oferta/horários exportam três formatos sem limites do
calendário; dados de beneficiário ficam na projeção autorizada.

- [ ] T035 [US4] Escrever testes do adaptador em
      `apps/web/modules/scheduling/export-adapter.test.ts` (novo): filtro+sort, columns em ordem
      pedida, campo proibido, dados completos e matriz de autorização conforme
      `specs/008-scheduling-management/contracts/exports.md`.
- [ ] T036 [US4] Implementar `apps/web/modules/scheduling/export-adapter.ts` (novo) reutilizando as
      consultas/projeções do domínio, IDs/dependências para reautorização por lote e cursor do
      núcleo 001; cobrir todos os datasets do contrato, sem ampliar acesso ou alterar dados.
- [ ] T037 [US4] Integrar ação/tela em `apps/web/app/(admin)/scheduling/exportar/page.tsx` (nova) e
      nas listas/abas existentes de `apps/web/modules/scheduling/ui/`; passar contexto/filtros,
      preservar rascunho e oferecer os três formatos com defaults e reordenação acessível.
- [ ] T038 [US4] Validar arquivos reais nos três formatos, ordem/contagem/IDs/filtros e negações em
      `apps/web/tests/integration/scheduling.test.ts` e `apps/web/tests/e2e/scheduling.spec.ts`;
      usar o parser independente do núcleo 001 e confirmar erro recuperável sem corte.

## Polish

- [ ] T039 Executar gates/testes da função no CI e registrar resultados/capturas/limites em
      `specs/008-scheduling-management/evidence/plan-2026-09-21-validation.md` (novo); marcar
      conclusão somente com evidência, preservando tarefas institucionais e históricas.

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

# Tasks: Agendamentos — primeira entrega funcional

Data: 15/09/2026. Branch feature/scheduling-management-20260915. Entrada: spec.md, plan.md,
research.md, data-model.md e contracts/admin.md. **T001–T020 autorizadas em 15/09/2026.
Implementação e validação concluídas; evidências em evidence/release-review.md.** Testes
transacionais reunidos em apps/web/tests/integration/scheduling.test.ts para compartilhar o banco
descartável; jornadas US1/US2 em tests/e2e/scheduling.spec.ts. Testes exigidos pelos cenários da
spec e pelo fluxo de entrega, especialmente agenda, dados, autorização e acessibilidade. Etapas do
produto estão em roadmap.md.

## Phase 1 — Setup

## Clarificação — conflito do beneficiário, 20/09/2026

FR-016/SC-006 definidos pelo usuário no /clarify. Tarefas abaixo permanecem pendentes; esta sessão
registra a regra e não retoma implementação ou validação.

- [ ] BEN01 Diagnosticar conflitos preexistentes e preparar migration aditiva com restrição por
      beneficiário/intervalo, preservando dados e restrição profissional; resolução de dados
      existentes depende de decisão explícita.
- [ ] BEN02 Revalidar conflito do beneficiário na criação/remarcação transacional, com resposta
      recuperável na interface, distinguindo associado e cada dependente pelo identificador da
      pessoa atendida.
- [ ] BEN03 Validar concorrência, sobreposição parcial, unidades/profissionais diferentes,
      titular/dependentes independentes, canceladas, horários adjacentes e rollback da remarcação em
      banco descartável; cobrir jornada por interface e registrar evidências reais.

Ordem: BEN01 → BEN02 → BEN03. Não marcar concluído com base nos testes históricos.

- [ ] BLQ01 Aplicar FR-017 nas consultas e sinalização textual da agenda/detalhes, preservando
      reservas, ocupação e estados; coordenar regra de vínculos/bloqueio com spec 005.
- [ ] BLQ02 Validar SC-007 com titular, dependentes afetados e pessoas sem vínculo,
      criação/remarcação negadas e cancelamento manual auditado; registrar evidências de banco e
      interface.

BLQ01 → BLQ02; regra esclarecida em Q2, implementação e validação ainda pendentes.

## Calendário administrativo — autorizado em 18/09/2026

Decisão atual supera a prioridade anterior de T022. Código integrado pelo PR34. A branch original
não recebe trabalho novo; retomada na entrega vigente do mapa local, com checkpoint.md atualizado.

- [x] CAL01 Registrar escopo, pesquisa oficial, contratos, plano e estratégia de validação.
- [x] CAL02 Escrever testes de intervalo/limites/filtros/autorização e consulta de calendário.
- [x] CAL03 Implementar GET calendar limitado e autenticado, preservando listagem diária.
- [x] CAL04 Integrar FullCalendar mês/semana/dia, URL/filtros, tokens, fuso e estados acessíveis.
- [x] CAL05 Cobrir jornada real de reservas, recarga/navegação, mobile/temas e fuso no E2E.
- [ ] CAL06 Encerrar a revisão do conjunto e das evidências visuais, reconciliar documentação com o
      CI registrado e conferir a base integrada em dev. PR34 já integrado: não alterar seus
      metadados nem reutilizar sua branch. Leitura estática não conclui esta validação.

Não marcar CAL06 antes de verificações reais; atualizar checkpoint a cada fase.

- [x] T001 Conferir base/branch sem PR e validar o recorte/hipóteses com a revisão do planejamento
      em specs/008-scheduling-management/spec.md antes do código.
- [x] T002 Conciliar contratos com os padrões existentes em
      specs/008-scheduling-management/contracts/admin.md e definir próximo número de migration livre
      em packages/db/migrations/.

## Phase 2 — Foundational

- [x] T003 Criar migration aditiva de catálogo, horários, reservas, histórico e idempotência em
      packages/db/migrations/, conforme specs/008-scheduling-management/data-model.md; validar
      exclusão temporal e FKs.
- [x] T004 Definir contratos/validações de payload, paginação, versões, erros e estados em
      packages/contracts/src/scheduling.ts e exportar em packages/contracts/src/index.ts.
- [x] T005 Implementar guarda com acesso administrativo válido e proteção de mutações em
      apps/web/modules/scheduling/http/; sem concessões extras; testes em
      apps/web/tests/integration/scheduling-auth.test.ts.
- [x] T006 Implementar protocolo transacional de configurações/beneficiários, incluindo bloqueio e
      mudança de vínculos em apps/web/modules/members/ e packages/db/src/repositories/members.ts,
      com regressões concorrentes em apps/web/tests/integration/scheduling-eligibility.test.ts.

## Phase 3 — US1: configurar e reservar

Objetivo: cadastro mínimo e primeira reserva persistida. Teste independente: catálogo vazio →
configurar no painel → reservar → consultar após recarga.

- [x] T007 [P] [US1] Criar testes dos contratos e horários semanais/almoço em
      packages/contracts/src/scheduling.test.ts e apps/web/modules/scheduling/availability.test.ts
      antes dos serviços.
- [x] T008 [P] [US1] Criar testes de 20 reservas concorrentes, retry, limites adjacentes e corrida
      com alteração de expediente em apps/web/tests/integration/scheduling-create.test.ts.
- [x] T009 [US1] Implementar catálogo, habilitações, horários e proteção de alterações com reservas
      futuras em apps/web/modules/scheduling/catalog-service.ts e hours-service.ts.
- [x] T010 [US1] Implementar disponibilidade, busca mínima de beneficiários e criação
      transacional/idempotente em apps/web/modules/scheduling/availability-service.ts,
      beneficiary-service.ts e booking-service.ts.
- [x] T011 [US1] Expor catálogo, horários, vagas, beneficiários e criação autenticada em
      apps/web/app/api/v1/scheduling/ conforme contracts/admin.md.
- [x] T012 [US1] Criar formulários de oferta/horários e reserva com seleção de vaga em
      apps/web/modules/scheduling/ui/ e apps/web/app/(admin)/scheduling/; não exigir cadastro via
      banco.
- [x] T013 [US1] Validar jornada sintética de configuração/criação/recarga e erros em
      apps/web/tests/e2e/scheduling-create.spec.ts.

## Phase 4 — US2: consultar, remarcar e cancelar

Objetivo: operação da reserva existente. Teste independente com fixture sintética: localizar →
remarcar → conferir histórico → cancelar e liberar horário.

- [x] T014 [P] [US2] Criar testes de rollback da remarcação, versão desatualizada,
      idempotência/cancelamento e preservação histórica em
      apps/web/tests/integration/scheduling-manage.test.ts.
- [x] T015 [US2] Implementar listagem/detalhes, remarcação atômica e cancelamento em
      apps/web/modules/scheduling/booking-service.ts e apps/web/app/api/v1/scheduling/bookings/.
- [x] T016 [US2] Implementar lista diária paginada, filtros na URL, detalhes, ações e confirmação em
      apps/web/modules/scheduling/ui/ e apps/web/app/(admin)/scheduling/.
- [x] T017 [US2] Integrar navegação/busca e eventos humanos de auditoria em
      apps/web/modules/workspace/ e apps/web/modules/audit/, sem liberar dados de outros módulos.
- [x] T018 [US2] Validar gestão por teclado, mobile claro/escuro e estados vazios/erro em
      apps/web/tests/e2e/scheduling.spec.ts; capturas sintéticas em
      specs/008-scheduling-management/evidence/.

## Phase 5 — Polish e saída da etapa 1

- [x] T019 Executar roteiro e gates do CI (contratos, integração, E2E, a11y, lint, tipos, build e
      segurança), registrar resultados reais em specs/008-scheduling-management/evidence/ e
      atualizar quickstart.md.
- [x] T020 Conferir limites da etapa 1, ausência de chamadas a Cal.com/legado/canais e integridade
      do rollback; registrar revisão em specs/008-scheduling-management/evidence/release-review.md
      antes de preparar PR.

## Phase 6 — US3: planejamento dos incrementos da etapa 2

**Somente preparação posterior à validação da etapa 1, não execução automática de funcionalidades.**
Teste independente de cada incremento: critérios da linha correspondente em roadmap.md devem virar
cenários concretos e tarefas antes da implementação.

- [ ] T022 [US3] Primeiro após T019–T020: detalhar 2C app/site, identidade, contratos versionados e
      plano de transição/migração do legado em
      specs/008-scheduling-management/contracts/channels.md, coordenado com a spec própria da
      primeira interface do usuário no app/site (UI01/UI02 do programa 002).
      Revisão de 24/09/2026: refletir nos contratos/tarefas de 2C a liberação da origem no envio
      bem-sucedido da remarcação, retenção apenas do destino, falha transacional preservando
      origem e recusa/desistência sem restauração automática. Preservar histórico, prioridade
      pelo início original e contagem. Retomada após recusa/desistência usa o mesmo registro
      sem horário confirmado, mesmo após início original, sem reaplicar suas 24 horas; validar
      destino futuro/horizonte e demais guardas. Contar por ciclo de troca: primeiro pedido
      reserva uma utilização, alternativas/recusas/retomadas preservam o ciclo e aprovação
      consolida a mesma utilização uma vez; outra mudança após aprovação inicia novo ciclo.
      Validar confirmadas + ciclo ativo <= 2, retry, concorrência e cancelamento sem horário.
      Incluir Salvar/Publicar no cadastro: salvar sem exposição e publicar com persistência
      atômica numa ação, permissão, validação e retry. Incluir Salvar alterações como rascunho
      separado e Publicar alterações como gravação/publicação atômica da edição, sem salvar
      antes. Validar isolamento dos valores públicos, reabertura, concorrência, preservação da
      publicação anterior em falha e guardas de reservas existentes/disponibilidade operacional.
      Incluir descrições curtas e sempre visíveis abaixo de cada botão, no cadastro e na edição,
      com associação acessível e revisão responsiva conforme 2C-FR-19.
      Publicação conjunta em app/site, sem seleção/configuração por canal: contratos usam estado
      e revisão únicos; validar atualização das projeções/caches dos dois e isolamento do rascunho.
- [ ] T021 [US3] Após a primeira interface app/site, detalhar 2A horários completos e 2B
      estados/operação a partir do inventário em specs/008-scheduling-management/spec.md e
      contracts/; reconciliar políticas antigas com decisões atuais.
- [ ] T023 [US3] Detalhar 2D avaliações e 2E comunicações/limites em
      specs/008-scheduling-management/spec.md e contracts/, após validar ações, provedores e
      políticas.
- [ ] T024 [US3] Criar matriz de equivalência validada com o legado em
      specs/008-scheduling-management/legacy-parity.md; manter sugestões novas separadas em
      roadmap.md.

## Dependencies & Execution Order

T001–T002 → T003–T006 → US1 (T007–T013) → US2 (T014–T018) → T019–T020. US2 pode ser testada com
fixture de reserva, mas sua entrega depende dos serviços US1. Primeira entrega contratada contém
US1 + US2; não encerrar após mostrar apenas o catálogo. T019–T020 → UI01/T022 → UI02 (primeira
interface app/site) → demais incrementos. T021–T024 são detalhamento posterior; T022 tem prioridade
confirmada pelo usuário em 15/09/2026. Seus resultados gerarão tarefas próprias para 2A–2E, sem
duplicar a spec da interface do usuário. Manter os identificadores existentes para rastreabilidade.
Nenhuma tarefa da etapa 3 enquanto o usuário não selecionar sugestões.

## Parallel Opportunities

Depois da fundação, T007 e T008 trabalham em arquivos distintos. Em US2, T014 pode ser preparado
independentemente da UI, depois de definido o contrato. T021–T024 são sequenciais para evitar
concorrência nos mesmos documentos. Paralelismo é possibilidade técnica; não exige múltiplos agentes
nem muda a política de branch.

## Implementation Strategy

Uma entrega pequena e completa primeiro; testes de invariantes antes dos serviços; revisão do
resultado antes de ampliar. Preservar dados, histórico e disponibilidade ao adicionar
funcionalidades. Não usar demo, fixture ou página vazia como entrega.

## Correção UI/UX e inclusão — 16/09/2026

- [x] UI01 Comparar padrão local e registrar pesquisa, requisitos e plano da correção na nova
      branch.
- [x] UI02 Padronizar cabeçalho/abas e expor as inclusões específicas por cadastro.
- [x] UI03 Padronizar catálogo, agenda, formulários, horários, detalhes e estados vazios preservando
      operações reais.
- [x] UI04 Validar jornada de inclusão, edição, filtros/URL, teclado/390px/temas e contraste no CI;
      revisar capturas.
- [x] UI05 Concluir evidências e abrir novo PR para dev após checks aprovados; não aprovar/integrar.

Evidências desta correção: [validação e revisão visual](evidence/ui-2026-09-16.md).

## Navegação sem perda de edição — 16/09/2026

- [x] DP01 Integrar a preservação compartilhada às abas e formulários desta função.
- [x] DP02 Validar retorno, sucesso, cancelamento e isolamento; registrar
      [evidências](evidence/drafts-2026-09-16.md) no PR.

## Acesso concedido a Agendamentos — Q8 de 21/09/2026

T005 comprova a implementação histórica de sessão suficiente, substituída como requisito por Q8.
Nenhuma tarefa nova concluída apenas pela atualização documental.

- [ ] AC01 Incluir consultar/alterar Agendamentos no catálogo/gestão existentes, com alteração
      dependente de consulta; definir transição técnica preservando contas e dados; não inferir
      novas concessões a partir de Q4.
- [ ] AC02 Exigir consulta nas páginas, calendário, catálogo, disponibilidade e seleção de
      beneficiários, e consulta+alteração nos comandos de oferta/horários/reservas; ocultar barra
      lateral/busca/Início sem concessão e preservar leitura mínima de Associados.
- [ ] AC03 Validar sem acesso, somente consulta, consulta+alteração e alteração sem consulta
      recusada, revogação, URL/API direta e três superfícies de descoberta, mantendo conflitos de
      reserva e auditoria; registrar evidências reais.

## Exportação transversal — revisão de 21/09/2026

- [ ] DX01 Detalhar, implementar e validar a exportação de Agendamentos, oferta e horários conforme
      002 EXP06/EXP07 e docs/EXPORT-STANDARD.md: ação nomeada, filtros pertinentes, seleção/ordem de
      colunas, Excel/CSV/PDF integrais e download direto, consulta ao módulo mais permissão geral,
      recusa de campos restritos e revogação. Sem teto funcional, fila/histórico obrigatório ou
      prazo de download; sem alterar anexos/documentos. A07 (missing). Tarefa do módulo que executa
      a coordenação transversal, não um segundo projeto.

</details>

## Ciclo de vida de associados — 21/09/2026

- [x] LC01 Avisar exclusão efetiva de associado em reservas, preservando histórico e ocupação;
      permitir manter (com auditoria) ou cancelar por responsável com escrita; validar fronteira
      temporal, concorrência, UI e negações. Depende de 005 LC01.

Evidência do ciclo de vida: CI35641862727 (385f0d6) totalmente aprovado; integração e jornadas de
interface em `account-member-lifecycle`, `members` e `scheduling`, conforme a função. Exclusão,
recuperação e decisão da reserva mantêm histórico/ocupação. Detalhes no
[relatório da entrega](../001-project-foundation/evidence/plan-2026-09-21-validation.md). Somente os
itens LC acima foram concluídos; exportação própria e pendências anteriores permanecem.
