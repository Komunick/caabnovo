# Validar fusão

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
