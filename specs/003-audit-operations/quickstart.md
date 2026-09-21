# Validação do incremento — Auditoria e Processamentos: exportação direta

## Estado e pré-requisitos

Pré-requisitos de execução futura: Node 24/pnpm do package.json, dependências fixadas,
PostgreSQL 18 descartável/Testcontainers e Chromium no CI. Nunca usar banco do preview
ou contas reais como seed. Localhost continua desligado; os comandos abaixo são roteiro,
não foram executados neste planejamento. Variáveis/segredos seguem `.github/workflows/ci.yml`.

```powershell
corepack pnpm install --frozen-lockfile
corepack pnpm test:unit
corepack pnpm test:contract
corepack pnpm test:integration apps/web/tests/integration/audit.test.ts
corepack pnpm test:e2e audit.spec.ts --project=chromium
corepack pnpm test:a11y --project=chromium
```

O job browser existente prepara ambiente/contas sintéticos; não copiar seus seeds
para o preview principal. Testes de migração/conflito usam banco descartável. Antes
de entrega de código, completar format/lint/typecheck/build/security e evidências
visuais pelo workflow de CI, sem iniciar builds/serviços pesados no computador.

## Jornada independente

Perfis só eventos e só jobs exportam apenas sua subárea; matriz geral+leitura; campos redigidos e colunas reordenadas nos três formatos; downloads legados continuam protegidos.

Para cada dataset do contrato, abrir Exportar [módulo], variar filtros, selecionar/reordenar colunas por teclado e baixar Excel/CSV/PDF. Ler arquivos com parsers independentes, confrontar IDs/contagem/conteúdo/ordem com a massa conhecida. Vazio mantém cabeçalho; mais de uma página não corta resultados.

Matriz negativa: anônimo, sessão revogada, sem acesso, leitura sem geral, geral sem
leitura, leitura+geral sem escrita, campo proibido, operação de outro usuário e
revogação entre lotes. Preservar filtros após falha; interrupção não retorna sucesso.
Testar teclado,390 px, desktop e temas. Módulos negados têm zero entradas no menu,
busca e Início; controles pessoais da conta continuam disponíveis.

## Evidência esperada

Registrar comandos, versões/commit, fixtures sintéticas, resultados, arquivos
validados e capturas em `specs/003-audit-operations/evidence/plan-2026-09-21-validation.md`
(arquivo futuro). Nunca marcar tarefas como concluídas por este roteiro.
Requisitos e representações: [modelo](data-model.md), [contrato](contracts/exports.md).

## Roteiro anterior — histórico

Não executar serviços/seeds indicados abaixo no preview principal. O roteiro atual
usa CI/banco descartável; passos substituídos não autorizam reativação local.

<details>
<summary>Roteiro anterior preservado</summary>

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

</details>
