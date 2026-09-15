# Validar fusão

## US3 Processamentos — 15/09/2026

Unitários: `pnpm test:unit`; contratos: `pnpm test:contract`. Banco/build/navegador
são executados pelo CI com banco e contas sintéticas, sem seeds no preview principal.
Regressão de banco em `apps/web/tests/integration/job-query.test.ts`: 137 execuções,
datas empatadas/microssegundos, páginas de 25 e 100, filtros combinados, vazios e inserção
entre páginas. Testes adicionais verificam negação antes dos efeitos, concorrência,
limite de tentativas e rollback da fila. Navegador em `operations.spec.ts`: filtros,
teclado, continuação/primeira página, limpeza, URL inválida, celular e acessibilidade.
Capturas sintéticas no artefato `jobs-synthetic-screenshots` do CI.

Usar serviços locais e usuários sintéticos da fundação. Executar:

```powershell
corepack pnpm test:unit
corepack pnpm test:e2e --project=chromium operations.spec.ts audit.spec.ts workspace-experience.spec.ts accessibility.spec.ts
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm build
```

Resultados esperados: perfis acessam somente as subáreas permitidas, uma entrada, redirecionamento
dos favoritos, exportação/reenvio preservados e acessibilidade das mudanças aprovada. Sem repetição
manual do PR #10. PR próprio da fusão autorizado pelo usuário em 09/09/2026; main fora do escopo.
