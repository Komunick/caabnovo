# Validação do incremento — Relatórios: exportação direta nas três abas

## Estado e pré-requisitos

Pré-requisitos de execução futura: Node 24/pnpm do package.json, dependências fixadas,
PostgreSQL 18 descartável/Testcontainers e Chromium no CI. Nunca usar banco do preview
ou contas reais como seed. Localhost continua desligado; os comandos abaixo são roteiro,
não foram executados neste planejamento. Variáveis/segredos seguem `.github/workflows/ci.yml`.

```powershell
corepack pnpm install --frozen-lockfile
corepack pnpm test:unit
corepack pnpm test:contract
corepack pnpm test:integration apps/web/tests/integration/reports.test.ts
corepack pnpm test:e2e reports.spec.ts --project=chromium
corepack pnpm test:a11y --project=chromium
```

O job browser existente prepara ambiente/contas sintéticos; não copiar seus seeds
para o preview principal. Testes de migração/conflito usam banco descartável. Antes
de entrega de código, completar format/lint/typecheck/build/security e evidências
visuais pelo workflow de CI, sem iniciar builds/serviços pesados no computador.

## Jornada independente

Aplicar o [perfil C1 de100 registros](../002-integrated-modules/export-validation-100.md). Medições/aceite definidos ali substituem massas grandes nesta rodada; nenhum teste de estresse ou alegação de capacidade em grande volume. U1 usa fixtures legadas sintéticas e as permissões atuais, conforme [contrato](../010-reports-analytics/contracts/legacy-downloads.md).

Três abas baixam Excel/CSV/PDF com100 registros sintéticos, inclusive filtros distribuídos por mais de366 dias, colunas na ordem pedida e dados íntegros; downloads legados seguem U1. Medições e aceite no [perfil C1](../002-integrated-modules/export-validation-100.md). Não afirmar validação de grande volume; coleta US4 permanece sem afetar reserva.

Para cada dataset do contrato, abrir Exportar [módulo], variar filtros, selecionar/reordenar colunas por teclado e baixar Excel/CSV/PDF. Ler arquivos com parsers independentes, confrontar IDs/contagem/conteúdo/ordem com a massa conhecida. Vazio mantém cabeçalho; mais de uma página não corta resultados.

Matriz negativa: anônimo, sessão revogada, sem acesso, leitura sem geral, geral sem
leitura, leitura+geral sem escrita, campo proibido, operação de outro usuário e
revogação entre lotes. Preservar filtros após falha; interrupção não retorna sucesso.
Testar teclado,390 px, desktop e temas. Módulos negados têm zero entradas no menu,
busca e Início; controles pessoais da conta continuam disponíveis.

## Evidência esperada

Registrar comandos, versões/commit, fixtures sintéticas, resultados, arquivos
validados e capturas em `specs/010-reports-analytics/evidence/plan-2026-09-21-validation.md`
(arquivo futuro). Nunca marcar tarefas como concluídas por este roteiro.
Requisitos e representações: [modelo](data-model.md), [contrato](contracts/exports.md).

## Roteiro anterior — histórico

Não executar serviços/seeds indicados abaixo no preview principal. O roteiro atual
usa CI/banco descartável; passos substituídos não autorizam reativação local.

<details>
<summary>Roteiro anterior preservado</summary>

﻿# Validação

CI com massa sintética; não ligar localhost. pnpm install --frozen-lockfile;
format:check, lint, typecheck, test:unit, test:contract, test:integration, build,
security:scan. CI browser prepara PostgreSQL/worker e executa test:e2e e test:a11y.
Conferir três abas, consultas salvas, coleta SPA, PDF/XLSX/CSV reais e screenshots
mobile/desktop/temas. Concessão de reports:read/export pela role administrativa;
escolhas individuais existentes não são ampliadas. Arquivar evidências no spec.

## Aceite alvo após Q3/Q4/Q6 — 21/09/2026

O roteiro acima descreve a implementação original. No incremento, validar permissão
geral de exportação + reports:read + leitura dos domínios e conversão automática das
permissões antigas, preservando acessos. Percorrer “Exportar Relatórios” → filtros →
Excel/CSV/PDF → download direto, nas três abas; validar arquivos completos, maiores
que 50 mil linhas e período maior que 366 dias, falhas e retomada sem histórico.
Sem prazo de arquivo e sem truncamento. DX01–DX03 pendentes; não executar este
roteiro como se o código já tivesse sido adaptado.

</details>
