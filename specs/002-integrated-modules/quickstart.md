# Validação integrada

Pré-requisitos: Node 24/pnpm e dependências do projeto, `.env` local, serviços e worker conforme
`docs/runbooks/foundation.md`. Usar contas/dados sintéticos, sem exibir segredos.

## US1

1. `corepack pnpm test:unit`: catálogo/perfis e invariantes existentes.
2. `corepack pnpm test:e2e --project=chromium operations.spec.ts audit.spec.ts workspace-experience.spec.ts accessibility.spec.ts`.
3. Gestor: uma entrada Auditoria, Eventos/Processamentos, detalhe e reenvio autorizado.
4. Auditor: eventos, jobs negados; operador só de jobs: Processamentos, eventos negados; comum:
   nenhum.
5. URLs anteriores chegam à canônica; exportação mantém audit:export.
6. Formatação, lint, typecheck e build após mudanças. Sem repetir validação manual do PR #10.

## Demais histórias

Acrescentar contratos, testes de integração e E2E conforme tasks.md. Asserções devem comprovar os
cenários de spec.md; configuração sintética não é aprovação institucional. Cada função deve estar
concluída antes do seu PR; a validação integrada precede a liberação do conjunto. Não publicar,
contratar ou alterar main.
