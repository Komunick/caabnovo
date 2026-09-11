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
- [x] T005 [US1] Implementar subnavegação com guardas específicas em
      páginas de `apps/web/app/(admin)/audit/` e `apps/web/modules/audit/ui/audit-navigation.tsx`.
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

- [ ] T010 [US3] Complementar pesquisa e contrato de consulta em
      `specs/003-audit-operations/research.md` e `contracts/navigation.md` antes do código.
- [ ] T011 [US3] Exigir leitura antes de reenvio e testar negação sem mutação em
      `apps/web/modules/jobs/job-service.ts` e `job-service.test.ts` (programa T009).
- [ ] T012 [US3] Implementar paginação estável e filtros no contrato, repositório, serviço e tela em
      `packages/contracts/src/jobs.ts`, `packages/db/src/repositories/job-execution.ts`,
      `apps/web/modules/jobs/job-service.ts` e `apps/web/app/(admin)/audit/jobs/page.tsx` (programa
      T010).
- [ ] T013 [US3] Validar regressões de consulta/reenvio em `apps/web/tests/e2e/operations.spec.ts` e
      atualizar `specs/003-audit-operations/evidence.md`.

Dependências: T001–T003 → T004/T005/T007 → T006/T008 → T009. US3: T010 → T011/T012 → T013. Código e
testes de histórias se encontram na verificação; execução local sequencial. PR próprio autorizado em
09/09/2026 para esta função, preservando a separação por spec.

## Revisão solicitada — 11/09/2026

- [ ] T014 Apresentar os eventos de auditoria em linguagem simples, com quem realizou a ação,
      o que mudou e quem foi afetado. Exemplo: “Gabriel removeu o perfil de administrador de Felipe”.
      Substituir códigos como `role.revoked` e identificadores na leitura principal por descrições
      em português; manter códigos e dados técnicos disponíveis nos detalhes. Resolver nomes com
      as permissões existentes, prever registros antigos ou nomes indisponíveis sem inventar
      informações e preservar o registro original. Validar concessão/remoção de funções,
      criação/alteração/desativação de colaboradores e demais ações registradas; conferir
      leitura visual, filtros e ausência de exposição de dados restritos.

T014 registrada para implementação posterior, a pedido do usuário; não faz parte da harmonização visual atual.
