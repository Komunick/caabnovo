# Publicação administrativa — 02/10/2026

Autoria: CODEX; solicitante não verificado pela consulta GitHub inicial desta sessão.

## Preparação

Mesma worktree pr-scheduling-research-20260923; branch renomeada, sem colisão local/remota, para
feature/scheduling-administrative-20261002. Fetch confirmou origin/dev748539d; referência remota
antiga permanece500f84f, sem exclusão. Preservados2733e01 e4e9abac. Correção de cancelamentos sem
horário, regressão e documentos preservados em e7cd281.

## Conciliação do diff documental

Conferidos MODULES/STACK e programa002 com a entrega documental pr-docs-roles-20260923. Essa entrega
consolida fontes transversais e já referencia a evolução administrativa da spec008 como local/em
validação. Para não publicar versões antigas sobre essa consolidação, os deltas históricos de
MODULES/STACK desta branch foram retirados por novo commit: arquivos ficam iguais à origin/dev de
referência. Nenhuma edição na worktree documental. Seu futuro PR mantém a responsabilidade desses
arquivos; as decisões, migrations e evidências de Agendamentos continuam na spec008, inclusive
checkpoint, admin/exports e evidências de28/09. Os textos anteriores continuam recuperáveis
em2733e01/4e9abac, sem reescrita ou perda de histórico.

Programa002 conserva apenas acréscimos ao fim de spec.md/plan.md sobre histórico individual,
HIN-FR-01–05, ausentes da versão documental comparada. Não substitui seu topo, plano de frentes ou
demais critérios. Na integração futura preservar esses acréscimos junto à consolidação. Trata-se de
planejamento, não implementação de app/site/compras. A indisponibilidade do guia citada no registro
de24/09 é histórica; a revisão atual usa o guia canônico disponível.

Diff total conferido por caminhos: implementação administrativa, quatro migrations, workers de
faltas, contratos/permissão, testes/evidências; dois acréscimos em spec005 preservam decisões de
beneficiário/histórico, sem novo módulo de compras. Sem alteração de workflow, dependências,
transporte de e-mail ou cópia do gerador novo de Relatórios. Registry preserva usersExport,
reportExports e schedulingExports. report-summary.ts incorpora somente a correção do período;
reportSources.bookings preserva os estados e campos opcionais. Fonte de hashes abaixo delimita os
snapshots, não congela trabalho concorrente.

## Gates

T107 aberto; aguardando CI do commit publicado.727 testes/build de4e9abac e107 posteriores são
históricos com limites já registrados. Não afirmar PostgreSQL, concorrência, navegador ou migrations
aprovados nesta etapa. QA humano pendente. Sem serviços locais, WSL ou merge autorizados.

## Hashes SHA-256 da conciliação

```json
{
  "docs/MODULES.md": {
    "schedulingBefore": "9c210508be85394940f9b3be97e3ae71e97dccdc91bb4886aac3dd7f27608c05",
    "documentationSource": "461a8a60dd649fd503ed5668a2a93939a2ffdea9eb07a493b4d01289ca22ef66",
    "schedulingAfter": "71ef5ed6627242e7730c21bb1fecfd913837e489c0c8eb198e9991ef29f3397d"
  },
  "docs/STACK.md": {
    "schedulingBefore": "480e92e79f2705b38fe3c435ec7724539d82ffb28206a2c8fb9ffc1738f594e5",
    "documentationSource": "1caf42cd4307bd28a94e973834f5e90085c444e6abcfecbd92d6059ed8d2c9a6",
    "schedulingAfter": "71beee5d01121fd3c90a570c52d14ce2cf35c9731f4d38ff92f2129a0d0cc815"
  },
  "specs/002-integrated-modules/spec.md": {
    "schedulingBefore": "63fd9e146cdf56bc7c76228b88bfe0818f1bfc7fdb1d35e3d7fd9ebd57a6b556",
    "documentationSource": "dd852abf5e14dc3ea26c3cdd13832fb6ff7b6d74702f2d5412c473278284cc81",
    "schedulingAfter": "63fd9e146cdf56bc7c76228b88bfe0818f1bfc7fdb1d35e3d7fd9ebd57a6b556"
  },
  "specs/002-integrated-modules/plan.md": {
    "schedulingBefore": "b92f99ec972d8a578719167e8f2f153d70e93b8082527fae06b3567324fb4f28",
    "documentationSource": "8fd5c825b13a8d24fce3ec8600b88e6fc30a7723de5d7e57bccfe25a332d7257",
    "schedulingAfter": "b92f99ec972d8a578719167e8f2f153d70e93b8082527fae06b3567324fb4f28"
  }
}
```
