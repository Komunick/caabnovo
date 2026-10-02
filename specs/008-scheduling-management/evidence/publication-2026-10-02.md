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
restrição individual por falta/histórico, sem novo módulo de compras. Sem alteração de workflow,
dependências, transporte de e-mail ou cópia do gerador novo de Relatórios. Registry preserva
usersExport, reportExports e schedulingExports. report-summary.ts incorpora somente a correção do
período; reportSources.bookings preserva os estados e campos opcionais. Fonte de hashes abaixo
delimita os snapshots, não congela trabalho concorrente.

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

## Primeira execução remota — 69fb803

CI37031025184, push: https://github.com/Komunick/caabnovo/actions/runs/37031025184. Security
aprovado (audit e Gitleaks); formatação/lint/tipos,558 unitários e169 contratos aprovados.
Integrações:346 aprovadas,1 ignorada e1 falha;31 arquivos. As cinco suítes específicas de
Agendamentos passaram: scheduling37, workflow19, absence22, export27 e absence-query13, total118.
Incluem migrations reais em PostgreSQL18, concorrência/exclusões, permissões/revogação, aprovação,
recuperação, faltas e os quatro datasets nos três formatos. A regressão de cancelamento sem horário
passou dentro de workflow19. Teste ignorado é volume opcional de Relatórios (CAAB_EXPORT_VOLUME=1),
fora da amostra C1, não um cenário de Agendamentos dispensado.

Falha: packages/db/tests/migrations.test.ts esperava nomes somente até0030; recebeu corretamente
0031–0034. Correção acrescenta os quatro nomes à lista explícita sem modificar migrations,
reexecução, controles ou workflow. Formato/lint do teste corrigido aprovados localmente; exige nova
execução do CI. Navegador ainda em andamento no momento deste registro. T107 continua aberto;
nenhuma declaração de aprovação integral desta execução.

## Lacuna de evidência visual identificada antes da nova execução

A jornada administrativa capturava política/fila somente390 claro e recuperação1280 escuro;
exportação capturava390/1280 nos dois temas. O guia pede conferência1280/390/320. Ampliada a mesma
jornada para capturar política/fila/recuperação nas três larguras e dois temas, com axe e
verificação de overflow; exportação agora inclui320. Sem nova regra de produto, sem reduzir
asserções ou alterar workflow. Esta cobertura deve executar no CI; não contar capturas antigas como
evidência desta versão.

Primeiro browser encerrado com cinco falhas nos novos testes: conexão SASL sem senha string, pois
DATABASE_ADMIN_URL não estava definida no processo de testes. A variável do webServer não é herdada
pelo runner. Ajustados os quatro arquivos scheduling-absence/access/export/workflow para usar o
mesmo fallback sintético já empregado em global-setup, scheduling.spec e outras suítes. Sem
alteração de workflow, credenciais reais ou banco de uso. Os testes falharam antes das jornadas,
portanto suas capturas de erro não comprovam a UI. Correção e matriz visual seguem para novo CI.

## Segunda execução remota — b3d8c87

CI37032676133: quality/security aprovados;558 unitários,169 contratos,347 integrações aprovadas
(incluindo118 de Agendamentos),1 volume opcional ignorado e build57 páginas. Browser:97 aprovados, 4
falhas; a11y final não executada por dependência do passo anterior. Primeiro fluxo de faltas e
exportação passaram, gerando as matrizes atuais. T107 continua aberto.

Diagnóstico das quatro falhas: contexto adicional do revisor usava PLAYWRIGHT_BASE_URL ausente no
runner, causando navegação relativa inválida. Passa a usar o fixture baseURL resolvido da
configuração. As fixtures de faltas inseriam reservas futuras sem expediente da unidade/serviço;
isso acionava corretamente SCHEDULING_FUTURE_BOOKINGS nas criações posteriores dos testes access,
workflow e scheduling. Corrigida a fixture com expediente08–18 nos sete dias e reservas09–10
America/Bahia, independentes da hora da execução. Preservadas as asserções de permissão, bloqueio e
jornadas; sem alteração da aplicação, migrations ou workflow. Os gates anteriores não comprovam
estes E2Es corrigidos; exige-se nova execução completa. Artefato11237769464,
scheduling-synthetic-evidence, baixado localmente.
