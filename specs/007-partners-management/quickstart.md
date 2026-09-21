# Validação do incremento — Parceiros e benefícios: exportação autorizada

**Operação vigente — 21/09/2026:** localhost permanece desligado até ordem explícita.
Rotinas abaixo são roteiros para ambiente autorizado; usar banco descartável em
testes e preservar o banco principal. Portas/branches antigas são histórico, não
origem de preview atual. Nenhum teste foi executado pela revisão documental.

## Estado e pré-requisitos

Pré-requisitos de execução futura: Node 24/pnpm do package.json, dependências fixadas,
PostgreSQL 18 descartável/Testcontainers e Chromium no CI. Nunca usar banco do preview
ou contas reais como seed. Localhost continua desligado; os comandos abaixo são roteiro,
não foram executados neste planejamento. Variáveis/segredos seguem `.github/workflows/ci.yml`.

```powershell
corepack pnpm install --frozen-lockfile
corepack pnpm test:unit
corepack pnpm test:contract
corepack pnpm test:integration apps/web/tests/integration/partners.test.ts
corepack pnpm test:e2e partners.spec.ts --project=chromium
corepack pnpm test:a11y --project=chromium
```

O job browser existente prepara ambiente/contas sintéticos; não copiar seus seeds
para o preview principal. Testes de migração/conflito usam banco descartável. Antes
de entrega de código, completar format/lint/typecheck/build/security e evidências
visuais pelo workflow de CI, sem iniciar builds/serviços pesados no computador.

## Jornada independente

Três formatos por dataset, mesmo filtro/ordem/colunas; leitura sem exportação e exportação sem leitura negadas; documentos/contatos privados preservam seu controle; exportação não muda publicação ou contrato.

Para cada dataset do contrato, abrir Exportar [módulo], variar filtros, selecionar/reordenar colunas por teclado e baixar Excel/CSV/PDF. Ler arquivos com parsers independentes, confrontar IDs/contagem/conteúdo/ordem com a massa conhecida. Vazio mantém cabeçalho; mais de uma página não corta resultados.

Matriz negativa: anônimo, sessão revogada, sem acesso, leitura sem geral, geral sem
leitura, leitura+geral sem escrita, campo proibido, operação de outro usuário e
revogação entre lotes. Preservar filtros após falha; interrupção não retorna sucesso.
Testar teclado,390 px, desktop e temas. Módulos negados têm zero entradas no menu,
busca e Início; controles pessoais da conta continuam disponíveis.

## Evidência esperada

Registrar comandos, versões/commit, fixtures sintéticas, resultados, arquivos
validados e capturas em `specs/007-partners-management/evidence/plan-2026-09-21-validation.md`
(arquivo futuro). Nunca marcar tarefas como concluídas por este roteiro.
Requisitos e representações: [modelo](data-model.md), [contrato](contracts/exports.md).

## Roteiro anterior — histórico

Não executar serviços/seeds indicados abaixo no preview principal. O roteiro atual
usa CI/banco descartável; passos substituídos não autorizam reativação local.

<details>
<summary>Roteiro anterior preservado</summary>

# Validar Parceiros

1. Instalar dependências com corepack pnpm install --frozen-lockfile; usar infraestrutura local
   já existente ou isolada, configurar .env privado e aplicar migrations com db:migrate.
2. Administrador com partners:read/write/publish; documentos também files:read/create e worker ativo.
3. Abrir /partners, criar estabelecimento fictício, unidade, contrato com datas/condições explícitas.
4. Enviar documento sintético e aguardar liberação, aprovar contrato sem justificativa, preservando auditoria.
5. Criar benefício, conferir prévia, selecionar canais e publicar. Conferir /api/v1/benefits/site.
6. Editar rascunho e confirmar publicação anterior preservada; ocultar e confirmar retirada.
7. Conferir lista geral/filtros/histórico, acessos negados e vigência vencida em testes isolados.
8. Validar em 390 px e desktop, claro/escuro, com teclado e axe; registrar evidência.

Gates: pnpm format:check, lint, typecheck, test:unit, test:contract, test:integration, build,
test:e2e --project=chromium e test:a11y. Nunca executar seed de contas sobre banco compartilhado.
Sem consulta real a OAB/Receita, mensagens ou publicação de dados reais durante testes.
Rollback: voltar aplicação e preservar tabelas opcionais/arquivos/auditoria; sem delete destrutivo.

</details>
