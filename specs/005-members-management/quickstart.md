# Validação do incremento — Associados: preservação manual, agenda e exportação

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
corepack pnpm test:integration apps/web/tests/integration/members.test.ts
corepack pnpm test:e2e members.spec.ts --project=chromium
corepack pnpm test:a11y --project=chromium
```

O job browser existente prepara ambiente/contas sintéticos; não copiar seus seeds
para o preview principal. Testes de migração/conflito usam banco descartável. Antes
de entrega de código, completar format/lint/typecheck/build/security e evidências
visuais pelo workflow de CI, sem iniciar builds/serviços pesados no computador.

## Jornada independente

Consulta OAB: conferir que a consulta avulsa e a consulta pelo cadastro não exibem botão de exportação, mesmo com permissão geral; seu resultado não aparece no catálogo de datasets exportáveis. Dados cadastrais de Associados mantêm o escopo autorizado.

Exportar associados/dependentes sem acesso a Relatórios; negar documento/campo restrito; bloqueio mantém reservas e vaga, sinaliza vínculos vigentes e não afeta situação própria; manter análise manual sem novas exigências.

Para cada dataset do contrato, abrir Exportar [módulo], variar filtros, selecionar/reordenar colunas por teclado e baixar Excel/CSV/PDF. Ler arquivos com parsers independentes, confrontar IDs/contagem/conteúdo/ordem com a massa conhecida. Vazio mantém cabeçalho; mais de uma página não corta resultados.

Matriz negativa: anônimo, sessão revogada, sem acesso, leitura sem geral, geral sem
leitura, leitura+geral sem escrita, campo proibido, operação de outro usuário e
revogação entre lotes. Preservar filtros após falha; interrupção não retorna sucesso.
Testar teclado,390 px, desktop e temas. Módulos negados têm zero entradas no menu,
busca e Início; controles pessoais da conta continuam disponíveis.

## Evidência esperada

Registrar comandos, versões/commit, fixtures sintéticas, resultados, arquivos
validados e capturas em `specs/005-members-management/evidence/plan-2026-09-21-validation.md`
(arquivo futuro). Nunca marcar tarefas como concluídas por este roteiro.
Requisitos e representações: [modelo](data-model.md), [contrato](contracts/exports.md).

## Roteiro anterior — histórico

Não executar serviços/seeds indicados abaixo no preview principal. O roteiro atual
usa CI/banco descartável; passos substituídos não autorizam reativação local.

<details>
<summary>Roteiro anterior preservado</summary>

# Validação

## Histórico do preview — 10/09/2026, não executar como instrução atual

Abrir `http://localhost:3106/members`. O código está em `.cache/pr-members`, branch
`feature/members-management`, com `origin/dev` be46efa integrado (Configurações e PR #14).
O login é o mesmo do painel local, sem autenticador. O administrador existente recebe acesso;
outros perfis precisam de concessão explícita. A pedido do usuário, os previews das portas 3105
e 3107 foram encerrados; manter somente 3106. Associados ainda não foi enviado para DEV nem
está liberado para PR.

Não executar seed/reset no banco compartilhado do preview: preservar contas e testes do usuário.
Para testes automatizados locais, usar somente fixtures sintéticas existentes; integração usa
bancos descartáveis. A caixa de e-mail local de Configurações continua exclusiva para localhost,
e precisa ser substituída pelo SMTP e URL pública configurados ao sair do local, conforme spec 006.

## Roteiro

Usar banco descartável próprio, dependências do lockfile, migrations, web/storage/antivírus existentes.

1. Criar duas pessoas sintéticas em /members, pesquisar por nome/CPF/OAB, filtrar por seccional,
   combinar com análise/arquivamento, paginar, vincular e encerrar dependência.
2. CPF duplicado/ciclo/versão obsoleta são recusados sem efeito parcial.
3. Enviar arquivo, aguardar liberação, pedir correção e substituir preservando evidência anterior.
4. Aprovar cadastro e registrar OAB manual; finanças/elegibilidade permanecem desconhecidas.
5. Avaliar credencial/elegibilidade com fonte/validade; alterar identificação sinaliza revisão.
6. Arquivar/restaurar, consultar histórico, testar sessão revogada e arquivo alheio.
7. Testar teclado/390px/axe, contratos, autorização, integração, lint, typecheck e build.

## Situação administrativa

No cadastro, aba Situações, a seção Situação administrativa oferece Ativar associado,
Bloquear associado ou Desbloquear associado conforme o estado. Abrir a ação e confirmar, sem
preencher justificativa. Cancelar não grava. Somente conta com permissão de análise
altera esse estado. A lista inclui filtro Situação administrativa com aplicação imediata.
Cadastro sem decisão começa Não ativado; arquivar/restaurar preserva bloqueio. Desbloqueio
é manual. Agenda receberá a integração documentada separadamente; não existe prazo automático.

Na automação local, usar respostas interceptadas para essas alterações e banco descartável
para o serviço. Não criar/remover fixtures do banco compartilhado nem consultar pessoas reais
na OAB para validar este fluxo.

Este roteiro não declara gates aprovados. Evidências serão preenchidas após execução real.

## Configuração da consulta OAB — 15/09/2026

No serviço web, fornecer API_OAB_KEY e API_OAB_PASSWORD do relatório STATUS CAAB.
OAB_API_ENABLED não controla mais a consulta. Qualquer valor legado, inclusive false,
é ignorado; não é necessário alterar essa variável na hospedagem.
O exemplo .env.example mantém ambos os segredos vazios. O deploy deve fornecer
as credenciais privadas válidas; esta alteração não incorpora nem transporta segredos.

Validação do código: pnpm exec vitest run --project unit oab-provider oab-route.
Os testes simulam o provedor e não consultam inscrições reais. Após o deploy pelo fluxo
existente, a consulta operacional deve usar inscrição autorizada; T028 não é concluída
com testes simulados. O acesso à VM não é requisito para entregar esta correção.

</details>
