# Tasks: Auditoria e Processamentos: exportação direta — incremento de 21/09/2026

**Input:** [spec](spec.md), [plan](plan.md), [research](research.md), [modelo](data-model.md),
[contrato](contracts/exports.md), [quickstart](quickstart.md). **Branch da entrega:**
`docs/project-clarify-20260921`. Nenhuma tarefa nova executada. **Lista ativa:** T015–T022; testes
foram pedidos nas specs e nos gates do projeto. Caminhos novos são destinos planejados; conferir
referências contra o inventário de artefatos deste incremento antes de editar. Nenhum arquivo de
código foi criado agora.

## Rastreabilidade e escopo

EX01/EX02/DX01/DX02: substituídos pelo detalhamento de US5 e continuidade US2; migração pertence
à001.

O histórico abaixo conserva marcadores e evidências originais. IDs provisórios detalhados aqui não
são uma segunda execução; usar a lista ativa. Pendências de política/pesquisa/homologação e funções
suspensas continuam pendentes e não são autorizadas por constarem neste arquivo. Não repetir tarefas
já concluídas.

## Setup

- [ ] T015 Conferir o catálogo real de telas/abas e filtros contra
      `specs/003-audit-operations/contracts/exports.md`; mapear campos permitidos/defaults e
      projeções atuais, sem criar fonte ou ampliar permissão.

## Foundational

- [ ] T016 Preparar fixtures sintéticas isoladas e contratos da função em
      `apps/web/modules/audit/export-fixtures.ts` (novo, exclusivo de testes), com datas empatadas,
      zero resultados, texto longo, campos restritos e filtros combinados; depende dos schemas
      de 001.

## US2 — Continuidade das operações

**Objetivo/aceite independente:** Rotas/arquivos legados mantêm dono e permissões atuais; revogação
bloqueia worker e download genérico; jobs:redrive permanece independente.

- [ ] T017 [US2] Preservar rotas/arquivos/jobs antigos e reenvio autorizado em
      `apps/web/modules/audit/http/audit-exports-route.ts`, `apps/worker/src/jobs/audit-export.ts` e
      `apps/web/tests/e2e/operations.spec.ts`; novos pedidos usam somente fluxo direto, sem
      confundir jobs:read com audit:read.

## US5 — Exportação autorizada

**Objetivo/aceite independente:** Eventos e jobs exportam Excel/CSV/PDF com filtros, redação e
colunas em ordem; nenhum corte além da paginação.

- [ ] T018 [US5] Escrever testes do adaptador em `apps/web/modules/audit/export-adapter.test.ts`
      (novo): filtro+sort, columns em ordem pedida, campo proibido, dados completos e matriz de
      autorização conforme `specs/003-audit-operations/contracts/exports.md`.
- [ ] T019 [US5] Implementar `apps/web/modules/audit/export-adapter.ts` (novo) reutilizando as
      consultas/projeções do domínio, IDs/dependências para reautorização por lote e cursor do
      núcleo 001; cobrir todos os datasets do contrato, sem ampliar acesso ou alterar dados.
- [ ] T020 [US5] Integrar ação/tela em `apps/web/app/(admin)/audit/exportar/page.tsx` (nova) e nas
      listas/abas existentes de `apps/web/modules/audit/ui/`; passar contexto/filtros, preservar
      rascunho e oferecer os três formatos com defaults e reordenação acessível.
- [ ] T021 [US5] Validar arquivos reais nos três formatos, ordem/contagem/IDs/filtros e negações em
      `apps/web/tests/integration/audit.test.ts` e `apps/web/tests/e2e/audit.spec.ts`; usar o parser
      independente do núcleo 001 e confirmar erro recuperável sem corte.

## Polish

- [ ] T022 Executar gates/testes da função no CI e registrar resultados/capturas/limites em
      `specs/003-audit-operations/evidence/plan-2026-09-21-validation.md` (novo); marcar conclusão
      somente com evidência, preservando tarefas institucionais e históricas.

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

# Tasks: Auditoria e Processamentos

## Setup e fundação

- [x] T001 Registrar escopo/contratos/reaproveitamento em `specs/003-audit-operations/spec.md`,
      `plan.md` e `contracts/navigation.md`.
- [x] T002 Conferir guardas e ausência de migration em `specs/003-audit-operations/research.md` e
      `data-model.md`.

## US1 — Área consolidada

- [x] T003 [US1] Criar regressões de perfis/destinos em `apps/web/modules/workspace/areas.test.ts` e
      observar falha antes do catálogo.
- [x] T004 [US1] Implementar catálogo único em `apps/web/modules/workspace/areas.ts` e integrar
      menu, busca e dashboard.
- [x] T005 [US1] Implementar subnavegação com guardas específicas em páginas de
      `apps/web/app/(admin)/audit/` e `apps/web/modules/audit/ui/audit-navigation.tsx`.
- [x] T006 [US1] Validar quatro perfis/busca/acessibilidade em
      `apps/web/tests/e2e/operations.spec.ts`, `audit.spec.ts`, `workspace-experience.spec.ts` e
      `accessibility.spec.ts`.

## US2 — Continuidade

- [x] T007 [US2] Transferir páginas para `apps/web/app/(admin)/audit/jobs/` e redirecionar
      `apps/web/app/(admin)/operations/jobs/`.
- [x] T008 [US2] Cobrir favoritos e preservação de reenvio/exportação em
      `apps/web/tests/e2e/operations.spec.ts` e `audit.spec.ts`.

## Verificação

- [x] T009 Executar checks proporcionais e registrar evidência em
      `specs/003-audit-operations/evidence.md`; atualizar estado do programa em
      `specs/002-integrated-modules/tasks.md`.

## US3 — Melhorias da função existente

- [x] T010 [US3] Complementar pesquisa e contrato de consulta em
      `specs/003-audit-operations/research.md` e `contracts/navigation.md` antes do código.
- [x] T011 [US3] Exigir leitura antes de reenvio e testar negação sem mutação em
      `apps/web/modules/jobs/job-service.ts` e `job-service.test.ts` (programa T009).
- [x] T012 [US3] Implementar paginação estável e filtros no contrato, repositório, serviço e tela em
      `packages/contracts/src/jobs.ts`, `packages/db/src/repositories/job-execution.ts`,
      `apps/web/modules/jobs/job-service.ts` e `apps/web/app/(admin)/audit/jobs/page.tsx` (programa
      T010).
- [x] T013 [US3] Validar regressões de consulta/reenvio em `apps/web/tests/e2e/operations.spec.ts` e
      atualizar `specs/003-audit-operations/evidence.md`.

US3 concluída em 15/09/2026: código 85e5845 aprovado no CI 35006098095, 620 testes e todos os gates;
capturas desktop/celular revisadas. [Evidências](evidence/processamentos-2026-09-15.md).

Dependências: T001–T003 → T004/T005/T007 → T006/T008 → T009. US3: T010 → T011/T012 → T013. Código e
testes de histórias se encontram na verificação; execução local sequencial. PR próprio autorizado em
09/09/2026 para esta função, preservando a separação por spec.

## Revisão solicitada — 11/09/2026

- [x] T014 Apresentar os eventos de auditoria em linguagem simples, com quem realizou a ação, o que
      mudou e quem foi afetado. Exemplo: “Gabriel removeu o perfil de administrador de Felipe”.
      Substituir códigos como `role.revoked` e identificadores na leitura principal por descrições
      em português; manter códigos e dados técnicos recolhidos em Informações para suporte, no final
      do painel. Resolver nomes com as permissões existentes, prever registros antigos ou nomes
      indisponíveis sem inventar informações e preservar o registro original. Validar
      concessão/remoção de funções, criação/alteração/desativação de colaboradores e demais ações
      registradas; conferir leitura visual, filtros e ausência de exposição de dados restritos.

T014 autorizada em 15/09/2026 e reformulada após a revisão do usuário; integra o ciclo ativo.

- [x] T014a Histórico por data, filtros de pessoa/área/ação/período e painel lateral acessível.
- [x] T014b Detalhes completos em linguagem simples, antes/depois e suporte técnico recolhido.
- [x] T014c Validar permissões da busca de pessoas, tradução, filtros, teclado, celular e
      screenshots sintéticos; atualizar preview com limites de recursos.
- [x] T014d Área/ação digitáveis e selecionáveis como o Estado de Parceiros; validar rótulos,
      limpeza, texto inválido e compatibilidade dos links antigos.

## Regra vigente: nenhuma justificativa obrigatória — 14/09/2026

- [x] RM01 Remover exigências de justificativa nos contratos, serviços e persistência desta função.
- [x] RM02 Retirar campos e bloqueios de motivo em todas as telas da função.
- [x] RM03 Validar fluxos sem motivo, auditoria preservada e controles de autorização; registrar
      evidências da entrega compartilhada.

Evidências RM03:
[validação final de 15/09/2026](../001-project-foundation/evidence/reason-removal-2026-09-14.md).

## Retirada do armazenamento legado — 15/09/2026

- [x] SR01 Remover saída S3 das exportações e validar conteúdo privado/idempotência no PostgreSQL;
      evidências compartilhadas com a fundação.

# Andamento T014 — 15/09/2026

Primeira revisão substituída pelo histórico com painel de detalhes humanos. Validação final e
evidências na seção de conclusão abaixo.

## T014 concluída — 15/09/2026

Histórico, detalhes humanos, nomes autorizados dos alvos e filtros digitáveis concluídos. CI
final591cf00 /34976399886 aprovado:276unitários,94contratos,152integrações,62E2E,6a11y. Preview3107
atualizado com build remoto e conferido no Chrome, com banco e limites preservados.
[Evidências finais](evidence/audit-readable-2026-09-15.md). US3 continua pendente; não ampliada
nesta entrega.

## Correção da sobreposição de log — 16/09/2026

- [x] AD01 Diagnosticar camadas do cabeçalho/modal e registrar critério/plano/pesquisa.
- [x] AD02 Corrigir ordem visual e validar backdrop/painel acima de todo o shell, foco e capturas no
      CI.

Evidências AD02: [fundo do log e cabeçalho](evidence/modal-2026-09-16.md).

## Navegação sem perda de edição — 16/09/2026

- [x] DP01 Integrar a preservação compartilhada às abas e formulários desta função.
- [x] DP02 Validar retorno, sucesso, cancelamento e isolamento; registrar
      [evidências](evidence/drafts-2026-09-16.md) no PR.

## Permissão geral de exportação — 21/09/2026

- [ ] EX01 Substituir autorização específica de exportação pela permissão geral combinada com
      leitura da subárea/dados; converter automaticamente concessões legadas de exportação com 001
      AX01/002 EXP04, preservando leitura e revalidar solicitação, geração e download.
- [ ] EX02 Validar perfis com somente exportação, somente leitura, ambos e revogação; preservar
      redação de eventos, restrições de dados e separação Eventos/Processamentos.

## Exportação direta — Q6 de 21/09/2026

- [ ] DX01 Adequar exportação de Auditoria/Processamentos à ação nomeada, tela de filtros com
      seleção e ordenação das colunas autorizadas e Excel/CSV/PDF com download direto integral, sem
      prazo ou teto funcional de período/registros; preservar eventos e arquivos legados.
- [ ] DX02 Validar três formatos com seleção e ordem de colunas idênticas, recusa de campos
      restritos, filtros/ordenação de registros, volume além da paginação, erros/retentativa e
      leitura por subárea com permissão geral; registrar evidências sem declarar o fluxo novo
      coberto pelo CI antigo.

## Evidências para EX01/EX02 — revisão de 21/09/2026

A05: cobrir runAuditExport antes da geração, findAuditExport e a rota genérica de download de
arquivos audit_export. Atualmente files:read pode obter grant sem audit:read/audit:export nesse
último caminho; o worker não relê concessões. Testar revogação, acesso por ID direto e grants
legados, preservando dados e a separação Eventos/Processamentos. Não estender a nova regra a
anexos/documentos.

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
