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

## Gate técnico concluído — cac5cbb

[CI37034671649](https://github.com/Komunick/caabnovo/actions/runs/37034671649), SHA
cac5cbb8a4c8f61352d5513f5f3e21748132e88c, push de02/10/2026: **quality, browser e security
success**. Esta é evidência nova da versão conciliada/corrigida, distinta de727testes/build
de4e9abac.

| Gate                                         | Resultado da versão cac5cbb                                              |
| -------------------------------------------- | ------------------------------------------------------------------------ |
| Formatação, regras de proteção, lint e tipos | Aprovados                                                                |
| Unitários                                    | 558 aprovados,69 arquivos                                                |
| Contratos                                    | 169 aprovados,24 arquivos                                                |
| Integração PostgreSQL18 descartável          | 347 aprovados,31 arquivos;1 volume opcional de Relatórios ignorado       |
| Agendamentos dentro das integrações          | 118:37 scheduling,19 workflow,22 absence,27 export,13 absence-query      |
| Build                                        | Aprovado,57 páginas                                                      |
| Navegador Chromium completo                  | 101 aprovados,11,1min; oito jornadas de Agendamentos aprovadas sem retry |
| Relatórios antes da suíte completa           | 3 aprovados                                                              |
| Acessibilidade final                         | 6 aprovados, além de Axe/contraste/reflow nos cenários de Agendamentos   |
| Segurança                                    | Auditoria de dependências e Gitleaks aprovados                           |

Comandos executados pelo workflow existente: pnpm format:check, lint, typecheck, test:unit,
test:contract, test:integration, build, security:scan; test:e2e reports.spec.ts --project=chromium,
test:e2e --project=chromium e test:a11y --project=chromium. Nenhum workflow alterado. Logs baixados
em .cache/ci-37034671649-quality.log e -browser.log. Avisos de pg sobre client.query concorrente e
mensagens de stream encerrado nas navegações não foram ocultados; não impediram asserções de
banco/download, e não equivalem a prova de entrega de mensagens.

### Critérios comprovados

- Sobreposição:20 requisições concorrentes, exclusões de beneficiário/profissional, unidades
  distintas, adjacência, capacidade3, replay e rollback; migrations anteriores preservadas, upgrade
  pré0032 e recusa de legado conflitante sem perda de dados.
- Bloqueios: comandos reais de bloquear/vincular/desvincular serializados com reserva; remarcação
  impedida após bloqueio, reserva anterior preservada; sinais de bloqueio/exclusão revisados no
  painel.
- Permissões: consulta/escrita distintas, Gestor leitor, revogação enquanto aguarda lock e replay,
  navegação/busca/URL/API; revisão de faltas independente de write e anexos negados ao leitor comum.
- Aprovação/remarcação: publicação/rascunho, revalidação de bloqueio superveniente, duração retida,
  limite/prazo, recusa e recuperação sem restaurar origem, capacidade, histórico e intenção única.
- Faltas: prazos7/30dias, pedido com texto e comprovante privado limpo, decisão concorrente,
  preservação durante resposta/análise, cancelamento no período, expiração/finalização automática
  com autoria de sistema e rollback/idempotência. Não simula julgamento do mérito pela aplicação.
- Exportações: quatro datasets de Agendamentos, três formatos,100linhas por amostra C1,
  colunas/ordem, filtros, vazios, privacidade e reautorização entre lotes; regressão de cancelamento
  sem horário, fora do período e sem autorização da fonte.
  usersExport/reportExports/schedulingExports preservados.
- Navegador: publicação/pedido/aprovação/troca/recusa/recuperação/cancelamento,
  faltas/rascunho/upload/ aceitação/rejeição/revogação, exportações e retry,
  catálogo/calendário/teclado e estados de erro.

T107 e T039 concluídos tecnicamente por esta execução e revisão visual. QA humano permanece
pendente: responsável, ambiente e aceite de regras sensíveis ainda não registrados. Não há merge,
deploy, serviço local ou alteração em banco de uso. Integração de e-mails/app/site/WAHA segue
adiada.

### Revisão visual pelo guia canônico

Guia consultado: docs/caab-design.md da principal, v1.1; reflow, hierarquia, temas, ações, feedback,
campos, navegação e rolagem confinada. Artefato scheduling-synthetic-evidence11239956614 contém
72capturas:18 políticas/fila/recuperação;18 lista/revisão/exportação de faltas;18 exportações de
reservas/cadastros/horários;18 jornada de catálogo/calendário. As três primeiras matrizes cobrem
1280/390/320px e claro/escuro, com Axe e overflow assertados na execução.

Revisão visual por IA de18capturas desta execução, preservadas abaixo e identificadas como
visuallyReviewed no [manifesto SHA-256](publication-2026-10-02.json). Amostra cobre todos os tipos
de tela afetados, três larguras e ambos os temas. Sem corte de ações ou overflow da página; lista
tabular conserva rolagem horizontal própria, permitida pelo guia. Textos de política/publicação,
recuperação sem horário, prazos/restrições, comprovante privado e formatos de download legíveis.
Nomes longos quebram nas filas/cartões; campos conservam seus controles. Calendário apresenta
situação antes do nome truncado e permite abrir detalhe. Nenhuma divergência bloqueante na amostra.

Não equivale a inspeção de todas as72imagens, dispositivo físico, leitor de tela real ou QA humano.
Teclado/foco/rascunho e reflow têm asserções automatizadas;320CSSpx não constitui teste manual de
zoom em todos os navegadores. Capturas adicionais permanecem no artefato remoto (retenção7dias) e na
cópia local, com hashes no manifesto; as18revisadas ficam versionadas para revisão durável.

- [absence-export-320-dark.png](publication-2026-10-02/absence-export-320-dark.png).
- [absence-list-1280-light.png](publication-2026-10-02/absence-list-1280-light.png).
- [absence-list-320-dark.png](publication-2026-10-02/absence-list-320-dark.png).
- [absence-review-390-light.png](publication-2026-10-02/absence-review-390-light.png).
- [administrative-policy-1280-light.png](publication-2026-10-02/administrative-policy-1280-light.png).
- [administrative-policy-320-dark.png](publication-2026-10-02/administrative-policy-320-dark.png).
- [administrative-queue-1280-dark.png](publication-2026-10-02/administrative-queue-1280-dark.png).
- [administrative-queue-320-light.png](publication-2026-10-02/administrative-queue-320-light.png).
- [administrative-queue-390-light.png](publication-2026-10-02/administrative-queue-390-light.png).
- [administrative-recovery-1280-dark.png](publication-2026-10-02/administrative-recovery-1280-dark.png).
- [administrative-recovery-320-dark.png](publication-2026-10-02/administrative-recovery-320-dark.png).
- [administrative-recovery-390-light.png](publication-2026-10-02/administrative-recovery-390-light.png).
- [scheduling-calendar-week-desktop-dark.png](publication-2026-10-02/scheduling-calendar-week-desktop-dark.png).
- [scheduling-deleted-member-kept-mobile.png](publication-2026-10-02/scheduling-deleted-member-kept-mobile.png).
- [scheduling-export-bookings-1280-light.png](publication-2026-10-02/scheduling-export-bookings-1280-light.png).
- [scheduling-export-bookings-320-dark.png](publication-2026-10-02/scheduling-export-bookings-320-dark.png).
- [scheduling-export-catalog-390-light.png](publication-2026-10-02/scheduling-export-catalog-390-light.png).
- [scheduling-export-hours-320-light.png](publication-2026-10-02/scheduling-export-hours-320-light.png).

### Encaminhamento

A entrega pode seguir para PR autorizado para dev, sem merge. O commit posterior que registra este
resultado altera somente spec/evidências; não muda aplicação, testes, migrations ou configuração
validados em cac5cbb. CI desse commit documental e do PR deve ser conferido pelos seus próprios IDs;
este registro não antecipa seus resultados. Conciliação com Relatórios segue as instruções por
arquivo em reports-compatibility-2026-10-02.md e exige validação da versão combinada. MODULES/STACK
permanecem sem delta; programa002 conserva os acréscimos HIN. Não sobrescrever a consolidação
documental.
