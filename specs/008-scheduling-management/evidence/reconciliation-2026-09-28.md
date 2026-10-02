# Reconciliação de Agendamentos com dev — 28/09/2026

## Escopo e autoria

Registro: reconciliação-documental-CODEX-mafaltti. Solicitante: mafaltti, login Danilo-Komunick,
perfil autenticado GitHub consultado em 28/09 nesta sessão. Pedido: corrigir os oito achados
fornecidos pelo usuário, preservando decisões posteriores.

Base conferida após fetch: origin/dev = dev = 89d2356e1cdad84c73c0e20e79efb28fcee8e79b. Entrega:
codex/scheduling-market-research-20260923, worktree local
C:/Projetos/caabnovo/.cache/pr-scheduling-research-20260923, inicial 500f84f. Diff prévio contra dev
contém somente documentação; código inspecionado corresponde à base. Nenhum PR dessa branch foi
encontrado. Nenhuma implementação, migration, banco, serviço, instalação ou teste de produto foi
executado por esta revisão.

## Achados e tratamento

| ID  | Severidade  | Conferência e correção documental                                                                                                                                                                                                                                                                                                                                                      | Trabalho de código ainda pendente                                                                                          |
| --- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| R1  | Alta        | 0028_account_member_lifecycle.sql é do PR #36/af6f096. 0029/0030 também existem; 0031 está livre na base. A branch documental já havia removido 0028 de T030; agora plan/tasks/modelo fixam o caminho proposto 0031_scheduling_beneficiary_overlap.sql e scheduling_beneficiary_no_overlap, com reconferência antes de criar. T029 precede EXCLUDE; 0020/0028 e checksums preservados. | T029–T032; FR-016/SC-006 continuam ausentes no banco.                                                                      |
| R2  | Alta        | access.ts exige read/write; catálogo, layout, descoberta e controles já existem. AC01/AC02/T028 marcados concluídos com PR #36, sem usar isso como prova de toda a matriz. reports.bookings continua scheduling:read, preservando Gestor.                                                                                                                                              | T027/AC03: completar matriz. Há testes pontuais de sessão/restrição e LC; não há comprovação da matriz completa de grants. |
| R3  | Alta        | DTO atual e ação keep preservados explicitamente. eligibilityWarning: 'blocked' ou null é aditivo e não substitui memberDeletion*, memberDeleted, keptAfterMemberDeletion ou evento kept_after_member_deletion. Os avisos podem coexistir.                                                                                                                                             | T033/T034; FR-017/SC-007 continuam pendentes para lista/calendário/detalhe.                                                |
| R4  | Média       | US4, contrato exports e quickstart recebem aceite independente: três formatos, filtros/ordem/conjunto completo, permissões, falhas e ausência de teto do calendário. T036 acrescenta adapters ao lado de usersExport via SQL/cursor; T037 preserva Nova reserva; T038 tem E2E próprio e regressão /users/exportar.                                                                     | T025/T026/T035–T039; exportação própria ainda ausente.                                                                     |
| R5  | Média       | Roadmap/plan/tasks passam a uma sequência: revisão/CAL06 → pendências administrativas T025–T039 → integração T022/2C. PR #34 não é reaberto. Ao contrário do retrato antigo, channels.md existe desde esta entrega; preservar requisitos de 23–28/09.                                                                                                                                  | CAL06 exige revisão real; implementação depende de autorização.                                                            |
| R6  | Média       | admin distingue contrato vigente de extensões futuras e remete exports ao contrato próprio. Inventários MODULES/STACK corrigidos apenas no recorte Agendamentos. beneficiaryId ainda ausente no código; extensão opcional e compatível em T031, com consumidores atualizados.                                                                                                          | Disponibilidade por beneficiário e constraint final; não tornar campo obrigatório de surpresa.                             |
| R7  | Baixa       | requirements.md identificado explicitamente como histórico exclusivo da etapa 1, com marcadores preservados e referência à revisão atual/checklist 2C. Não apresenta aprovação atual ou nova homologação.                                                                                                                                                                              | Checklist channels.md continua do revisor, 25 itens abertos; implement deve respeitar esse gate.                           |
| R8  | Informativa | Ordem atual é sessão → lock nas escritas → grants. T027/plan/admin agora exigem grants antes do lock e repetição de sessão/grants após espera; GET não recebe 5010/1. Isso reduz contenção sem ampliar permissões.                                                                                                                                                                     | Ajuste mínimo e testes em T027; não foi aplicado ao código nesta revisão.                                                  |

## Fontes verificadas

- PR #34: ed31baf; PR #36: af6f096013e29639dc9fa0930784b85c27b6b7cb.
- [Migration profissional 0020](../../../packages/db/migrations/0020_scheduling.sql),
  [concessões 0026](../../../packages/db/migrations/0026_explicit_module_access.sql),
  [lifecycle 0028](../../../packages/db/migrations/0028_account_member_lifecycle.sql),
  [migrador por nome/checksum](../../../packages/db/src/migrate.ts).
- [Guarda](../../../apps/web/modules/scheduling/access.ts),
  [layout](<../../../apps/web/app/(admin)/scheduling/layout.tsx>),
  [descoberta](../../../apps/web/modules/workspace/areas.ts),
  [permissões de Relatórios](../../../packages/contracts/src/reports.ts).
- [DTO e disponibilidade](../../../packages/contracts/src/scheduling.ts),
  [consulta de vagas](../../../apps/web/modules/scheduling/availability-service.ts),
  [reservas/LC01](../../../apps/web/modules/scheduling/booking-service.ts),
  [detalhe/keep](../../../apps/web/modules/scheduling/ui/booking-detail.tsx),
  [E2E existente](../../../apps/web/tests/e2e/scheduling.spec.ts).
- [Registry de exportação](../../../apps/web/modules/exports/runtime.ts).
- O guia vigente foi localizado e lido na pasta principal: C:/Projetos/caabnovo/docs/caab-design.md.
  O arquivo local é não rastreado; não copiá-lo silenciosamente para esta entrega. Posição de
  exportação segue também [EXPORT-STANDARD](../../../docs/EXPORT-STANDARD.md).

## Validação documental

Validação local em 28/09, sobre os arquivos desta worktree:

- Prettier existente da pasta principal, com `--ignore-path .gitignore --write` e depois `--check`
  nos 13 documentos alterados: aprovado. Nenhuma dependência instalada.
- `git diff --check`: aprovado.
- Estados conferidos: T028/AC01/AC02 concluídos; T027/AC03/CAL06 abertos; T040–T077 são 38 IDs
  únicos abertos; checklist channels mantém seus 25 itens abertos.
- Os 15 links locais da evidência resolvem. Escopo conferido: somente Markdown em docs/specs;
  `git diff origin/dev -- apps packages infra` vazio. Migration 0031 não criada.
- Revisão contra o guia: posição proposta de Exportar preserva Nova reserva, filtros e seleção
  acessível. Não houve alteração visual nem nova homologação de UI.

Esta revisão não executou testes de produto nem o workflow integral do Spec Kit. A leitura de
migrations não comprova aplicação em banco; leitura de teste não significa execução. T040–T077
permanecem 38 tarefas abertas. T028/AC01/AC02 mudam estado por evidência de código já integrado, não
por trabalho novo. CAL06 e demais pendências não foram marcadas como concluídas.

## Continuidade e autorização

O executor normal e Git foram recuperados por correção local autorizada nesta sessão; o impedimento
de executor do checkpoint anterior é histórico. O guia visual está localizado, mas sua leitura não
homologa UI nem encerra integração com UI01/UI02. Concluir as pendências na ordem única do roadmap
após autorização para implement. Nenhum PR/merge/deploy foi solicitado por esta revisão. Não
confundir correção de documentação com autorização de implementação.
