# Validação do incremento — Coordenação da entrega após clarify

**Estado de 21/09/2026:** roteiro para retomada autorizada; não ligar localhost
nem executar seeds no banco principal. T055–T057 não estão concluídas por esta
documentação. Consultar [revisão de código](code-audit-2026-09-21.md).

## Estado e pré-requisitos

Pré-requisitos de execução futura: Node 24/pnpm do package.json, dependências fixadas,
PostgreSQL 18 descartável/Testcontainers e Chromium no CI. Nunca usar banco do preview
ou contas reais como seed. Localhost continua desligado; os comandos abaixo são roteiro,
não foram executados neste planejamento. Variáveis/segredos seguem `.github/workflows/ci.yml`.

```powershell
corepack pnpm install --frozen-lockfile
corepack pnpm test:unit
corepack pnpm test:contract
corepack pnpm test:integration apps/web/tests/integration/user-permissions.test.ts
corepack pnpm test:e2e workspace-experience.spec.ts --project=chromium
corepack pnpm test:a11y --project=chromium
```

O job browser existente prepara ambiente/contas sintéticos; não copiar seus seeds
para o preview principal. Testes de migração/conflito usam banco descartável. Antes
de entrega de código, completar format/lint/typecheck/build/security e evidências
visuais pelo workflow de CI, sem iniciar builds/serviços pesados no computador.

## Jornada independente

Percorrer a matriz de módulos/subáreas, três formatos, zero descoberta sem acesso, dados completos e campos autorizados; reconciliar tarefas/evidências por função e políticas adiadas sem marcar homologação ausente.

Verificar apenas os controles e a matriz de coordenação descritos no plano, sem ampliar funções pessoais ou institucionais.

Matriz negativa: anônimo, sessão revogada, sem acesso, leitura sem geral, geral sem
leitura, leitura+geral sem escrita, campo proibido, operação de outro usuário e
revogação entre lotes. Preservar filtros após falha; interrupção não retorna sucesso.
Testar teclado,390 px, desktop e temas. Módulos negados têm zero entradas no menu,
busca e Início; controles pessoais da conta continuam disponíveis.

## Evidência esperada

Registrar comandos, versões/commit, fixtures sintéticas, resultados, arquivos
validados e capturas em `specs/002-integrated-modules/evidence/plan-2026-09-21-validation.md`
(arquivo futuro). Nunca marcar tarefas como concluídas por este roteiro.
Requisitos e representações: [modelo](data-model.md), [contrato](contracts/exports.md).

## Roteiro anterior — histórico

Não executar serviços/seeds indicados abaixo no preview principal. O roteiro atual
usa CI/banco descartável; passos substituídos não autorizam reativação local.

<details>
<summary>Roteiro anterior preservado</summary>

# Validação integrada

Pré-requisitos: Node 24/pnpm e dependências do projeto, `.env` local, serviços e worker conforme
`docs/runbooks/foundation.md`. Usar contas/dados sintéticos, sem exibir segredos.

## US1

1. `corepack pnpm test:unit`: catálogo/perfis e invariantes existentes.
2. `corepack pnpm test:e2e --project=chromium operations.spec.ts audit.spec.ts workspace-experience.spec.ts accessibility.spec.ts`.
3. Gestor: uma entrada Auditoria, Eventos/Processamentos, detalhe e reenvio autorizado.
4. Auditor: eventos, jobs negados; operador só de jobs: Processamentos, eventos negados; comum:
   nenhum.
5. URLs anteriores chegam à canônica; legado usa audit:export; validar migração à permissão geral + leitura e download direto conforme 003 EX/DX.
6. Formatação, lint, typecheck e build após mudanças. Sem repetir validação manual do PR #10.

## Demais histórias

Acrescentar contratos, testes de integração e E2E conforme tasks.md. Asserções devem comprovar os
cenários de spec.md; configuração sintética não é aprovação institucional. Cada função deve estar
concluída antes do seu PR; a validação integrada precede a liberação do conjunto. Não publicar,
contratar ou alterar main.

</details>
