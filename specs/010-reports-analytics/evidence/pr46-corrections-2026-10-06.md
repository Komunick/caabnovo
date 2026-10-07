# Correções do PR46 — 06/10/2026-CODEX-mafaltti

Autor CODEX; solicitante mafaltti/login Danilo-Komunick, confirmado pelo conector GitHub get_profile
em 06/10/2026. Pedido: corrigir o PR46 aberto na branch
`feature/reports-complete-combined-20261006`, partindo de 04fcd3a. Usuário escolheu restaurar
gráfico e bloco de análise no PDF de Resultados e evolução. Sem merge, serviços locais ou banco de
uso.

## Triagem dos candidatos históricos — 07/10/2026-CODEX-mafaltti

Na ponta 72b0a0c, o [CI 37624277155](https://github.com/Komunick/caabnovo/actions/runs/37624277155)
confirmou que a correção executa o scan real: 518 commits e 18487649 bytes examinados. Security
112801951539 bloqueou corretamente a entrega com 13 candidatos, sem erro de Git. Quality
112801951272 aprovado: 642 unitários, 178 contratos, 404 integrações e um opt-in não executado;
migrations e build aprovados. A regressão PostgreSQL de arredondamento/janelas/EXPLAIN passou em 618
ms. Os candidatos não foram presumidos benignos pelo resultado de outros gates.

Triagem local autorizada, reutilizando o Gitleaks 8.28.0 existente: SHA256 do pacote Windows
`da6458e8864af553807de1c46a7a8eac0880bd6b99ba56288e87e86a45af884f` confere o checksum oficial salvo,
e o executável confere o conteúdo do ZIP. Nenhuma instalação, serviço ou configuração global. O scan
do histórico inteiro local examinou 527 commits e 18603290 bytes; as referências locais incluem nove
commits além das referências daquele checkout do CI. Encontrados 13 candidatos. Relatório redigido e
resumo somente com metadados em `.cache/diagnostics/`, ignorados pelo Git.

Cada linha foi conferida no blob histórico: nove candidatos são referências a variáveis
`env.S3_ACCESS_KEY`/`env.S3_SECRET_KEY`, sem valores de credencial; quatro são identificadores de
escopo de rascunho da UI, usados por `DraftForm`/`DraftScope`, sem autenticar pedidos. Todos são
falsos positivos da regra `generic-api-key`, em sete commits de 08–16/09/2026. Alguns permanecem na
dev e outros nas referências remotas históricas incluídas pelo scan completo; o número de commits
não foi usado como equivalência entre essas referências.

Preparado `.gitleaksignore` com **somente os 13 fingerprints completos** de commit/caminho/regra/
linha, separados por justificativa. Sem regex, exclusão de caminhos/regras, baseline geral ou
reescrita de história. O
[README da versão fixada](https://github.com/gitleaks/gitleaks/blob/v8.28.0/README.md#gitleaksignore)
documenta essa exceção por ocorrência; novas ocorrências permanecem sujeitas às regras padrão.

Prova local: com essas exceções exatas, o mesmo scan completo de 527 commits/18603290 bytes terminou
com exit 0 e sem candidatos. Prova negativa em repositório sintético isolado, com a mesma lista e
uma chave falsa de alta entropia em fingerprint novo: scanner detectou `generic-api-key` e retornou
exit 1. Nenhum valor de credencial foi impresso ou publicado. Revisão independente por outro agente
CODEX confirmou os 13 blobs e o uso de `draftKey` como nome de escopo de rascunho; a coordenação
autorizou essas exceções exatas. **CI final remoto e browser seguem pendentes. T049 permanece
aberta.**

## Conferência do CI e correção da verificação de segredos — 07/10/2026-CODEX-mafaltti

Publicado 99067ecfc12ae2a228d81a2fac26b246b43bae6c. O
[CI 37623048182](https://github.com/Komunick/caabnovo/actions/runs/37623048182) do PR usa a
conciliação de teste 737bd824bea7e4a40b4c6bb153ba6ba4b47c8e64 com dev 2b30f53. Quality 112797829225
aprovado, com logs conferidos: 642 unitários, 178 contratos, 404 testes de integração e um opt-in de
volume não executado; build, tipos, lint, formato e migrations aprovados. A suíte report-exports
contém 15 testes aprovados e um opt-in não executado. Sua nova regressão real de
arredondamento/CSV/quatro janelas/EXPLAIN passou em 1062 ms. Browser ainda em execução ao registrar.

Security 112797829256 aparece aprovado, e o audit confirmou somente dois avisos low e dois moderate.
**A leitura dos logs invalida a aprovação do scan de segredos:** Git recusou o diretório do
container por ownership divergente; Gitleaks registrou erro, zero commits e zero bytes examinados,
mas encerrou com sucesso. Esse resultado não comprova ausência de segredos. Limitação corresponde ao
[erro relatado no projeto Gitleaks](https://github.com/gitleaks/gitleaks/issues/1981).

Corrigida a invocação em `.github/workflows/ci.yml`, mantendo imagem 8.28.0 e regras de detecção:
mount somente leitura; configuração de confiança no processo para apenas `/github/workspace`;
preflight Git exige histórico legível e não vazio. A pipeline preserva códigos de erro, registra
saída redigida sem cores e rejeita erros/scan parcial ou ausência de commits/bytes positivos, mesmo
se o scanner retornar zero. Nenhuma configuração global do host é alterada. A
[documentação oficial do Git](https://git-scm.com/docs/git-config#SCOPES) confirma a configuração de
runtime como escopo protegido; flags e mensagens conferidas no
[código fixado do Gitleaks](https://github.com/gitleaks/gitleaks/blob/v8.28.0/cmd/root.go).

Validação local sem Docker/serviços: YAML parseado; `bash -n` aprovado; sete fixtures do validador
de log e seis da invocação completa com comando Docker sintético aprovadas. Incluem sucesso real
simulado, histórico vazio, Git retornando 128, scanner retornando 1 apesar de resumo positivo, falso
sucesso com zero scan, erro Git no log, resumo ausente, zero bytes e scan parcial. Prettier e diff
check aprovados. **O scan real corrigido e o CI completo da próxima ponta ainda precisam de execução
remota; T049 permanece aberta.**

## Conferência para publicação — 07/10/2026-CODEX-mafaltti

Solicitante reutilizado da consulta autenticada desta sessão pelo conector GitHub get_profile:
mafaltti/login Danilo-Komunick, em 07/10/2026. Pedido atual autoriza conferir trabalho local, PR
correspondente e executar os testes de CI. Revisados os 12 arquivos alterados sobre HEAD
5a0d4b8bba7e25ed7c801d63dee54e404e0381e0; sem nova correção funcional necessária. O PR #46 continua
aberto na mesma branch; a ponta remota anterior não inclui a conciliação local nem estes deltas.

Revalidação local, com Node 24.20.0 e até dois workers:

- `node node_modules/prettier/bin/prettier.cjs --check .`: aprovado.
- `node node_modules/prettier/bin/prettier.cjs --ignore-path .gitignore --check` nos cinco
  documentos modificados desta spec: aprovado.
- `node node_modules/vitest/vitest.mjs run --project unit apps/web/modules/exports/formats/writers.test.ts apps/web/modules/reports/overview-export-adapter.test.ts --maxWorkers 2`:
  19 testes aprovados.
- `node node_modules/vitest/vitest.mjs run --project contract packages/contracts/tests/reports.test.ts --maxWorkers 2`:
  12 testes aprovados.
- `node node_modules/eslint/bin/eslint.js` nos sete arquivos TypeScript modificados: aprovado.
- `git diff --check`: aprovado.

As suítes completas e os tipos já aprovados na segunda revisão não foram repetidos sem mudança
funcional adicional. Integração PostgreSQL, build, browser/a11y e segurança da ponta consolidada
ficam para o CI remoto após publicação; não homologados por esta conferência local. T049 permanece
aberta até conferir esse resultado. Nenhum serviço, container ou banco de uso iniciado. T038 e
aceite humano continuam pendentes conforme os critérios existentes.

## Segunda revisão — versão pós-PR49 em validação

Achados do usuário confirmados e corrigidos nesta mesma entrega, sobre merge 5a0d4b8 com dev
2b30f53. pnpm-lock.yaml e specs/004-news-publishing/evidence.md ficaram exatamente como dev;
manifestos/código Payload também sem delta. Backups dos dois arquivos conferidos por SHA256 em
`.cache/local-backups/pr46-before-dev-20261006`, sem reescrever a história ou aplicar migration.

- CSV: -5.2 permanece numérico quando o catálogo declara number e o valor é número finito ou literal
  numérico estrito. Texto -5.2, -2+3, fórmulas, tabs e quebra final seguem protegidos.
- PDF: reproduzido pelo writer antigo de 7b74ae7 e pelo novo, com o mesmo catálogo padrão real de 14
  colunas e 40 registros sintéticos. **162 páginas antes, 11 depois**, sem retirar coluna. Amostra
  tem análise vazia e gráfico em estado vazio; a massa de 40 pontos de gráfico é coberta pelo teste
  do adaptador real, com todas as colunas, limitado a 16 páginas nessa fixture. Onze PNGs da versão
  final renderizados e inspecionados, incluindo todas as faixas e continuações. A evidência anterior
  de sete páginas usava duas colunas e não cobria esse padrão.
- PDF passa a reapresentar faixas do mesmo conjunto de registros: numeração comum, cabeçalhos
  repetidos e palavra sem corte no limite normal. Spool privado inclui somente valores das colunas
  selecionadas (arquivo 0600, diretório privado), retirado em sucesso, falha ou cancelamento. Teste
  interrompe a escrita depois de criar o spool e verifica remoção; sem buffer do arquivo completo.
- Arredondamento: contagens inteiras usam BigInt para equivaler ao floor do SQL em meios exatos;
  403/80 = 403.8 na tela/arquivo, 79/80 = -1.2. Não muda tratamento de anterior zero.
- Quatro janelas de uso: uma leitura via live_usage materializado com quatro contagens condicionais,
  preservando filtros e datas. Regressores PostgreSQL usam casos 403/80 e 91/96, CSV e PDF padrão,
  quatro janelas diferentes e EXPLAIN ANALYZE para conferir um scan e quatro consumidores.
  **Execução PostgreSQL ainda pendente no CI; nenhuma afirmação de tempo em base grande.**

Validação local: tipos web/contracts/db e lint focado aprovados; 642 unitários e 178 contratos
aprovados; verificação de formato geral e diff check aprovados. Após reforço da regra numérica para
quebra final, writer foi validado novamente em recorte específico. Arquivos visuais locais em
`.cache/qa-pr46-round2/`; nenhum serviço/banco de uso iniciado. T038 permanece aberta.

A validação seguinte deve usar a ponta publicada já conciliada; CI abaixo é histórico.

## Validação da primeira rodada (histórico)

Código entregue em b67c30b e 90f82e2.
[CI 37520740384](https://github.com/Komunick/caabnovo/actions/runs/37520740384) de 90f82e2 aprovado:
quality 112465181426, security 112465181695, browser 112465182174. Logs lidos: 639 unitários, 172
contratos, 403 integração, 105 E2E e 6 a11y aprovados. Pré-etapa isolada de Relatórios: 5 E2E
aprovados; retentativa/PDF passou isolada e no conjunto completo. Suíte report-exports: 14 aprovados
e 1 teste opt-in de volume desativado. Notícias (editor, capa e concorrência) também passou após
alinhamento Lexical. Build, migrations, auditoria de dependências e scan de segredos aprovados;
nenhum gate contornado.

T042: projeção bookings e árvore de migrations idênticas à dev 9dc6a7f, verificadas por hash: SHA256
da projeção ea550007110394ed8df699ba04f91104d8dfdc2eeaf8f4434e6542a0ac356a98; árvore Git das
migrations 7a4e691985accee4d859ebfeca9c1b7678b01ba1. Registry preserva usersExport, reportExports e
schedulingExports. PostgreSQL validou agrupamentos/filtros/profissional nulo, datas, cancelamentos,
paridade da tela e revogação entre lotes. T039/T041/T042/T043–T045 encerradas; T038 e homologação
humana permanecem pendentes.

Atualização documental posterior registra essa versão de código, sem nova mudança funcional.
Proposta de descrição do PR em `.cache/qa-pr46/pr-description.md`, local/ignorada, aguarda
aprovação.

## Resultado implementado

- PDF executivo: bloco de análise integral identificado; tabela com colunas escolhidas; barras
  mensais das fontes autorizadas/selecionadas e dos acessos filtrados. Metadados internos de séries
  vêm do mesmo cursor/snapshot e não entram na seleção tabular. CSV/Excel preservados.
- PDF permanece incremental. Só agregados do gráfico passam por spool privado no diretório
  temporário do sistema, removido no sucesso/falha/cancelamento, sem reter o arquivo inteiro.
- Funil único via CTE materializado substitui quatro cálculos equivalentes.
- Solicitar novamente abre filtros na mesma aba com formato validado, comentário integral por
  sessionStorage, filtros e ordenação. Formato anterior vem primeiro, com três alternativas.
- Fonte revogada apresenta alerta e link de retorno, sem formulário. Dataset desconhecido
  mantém 404. Autorização no servidor e revalidações não foram afrouxadas.

As correções anteriores (403 auditado, teto legado e sharp via PR47 já na dev) foram conferidas. CI
37512816327 de 04fcd3a passou quality/browser/security. Log quality 112438064693 foi lido: suíte
report-exports teve 13 testes aprovados e 1 opt-in de volume não executado, incluindo T041 em 590
ms. Esse CI anterior não valida as novas mudanças.

## Falhas do primeiro CI e correções adicionais

Commit b67c30b, CI 37519461893: quality aprovado (tipos/unit/contract/PostgreSQL/build). Log
confirma 14 testes de report-exports aprovados e 1 opt-in de volume não executado, incluindo o PDF
com gráfico independente das colunas e T041. Browser aprovou retentativa/PDF/Axe, mas falhou no
teste de negação: `getByRole("alert")` também encontrou o route-announcer do Next. Corrigido
selecionando o alerta pelo texto, mantendo a asserção de negação e ausência do formulário.

Security falhou por cinco avisos high e um critical de Payload 3.89.0, publicados no banco de
advisories em 06/10. Atualizados todos os pacotes Payload para 3.90.0 e o override Sass
correspondente, com lockfile regenerado. Editor passa a importar Lexical dos reexports oficiais do
Payload, evitando duas versões. Local, audit --audit-level high passou: somente 2 low/2 moderate.
Fonte primária: [release 3.90.0](https://github.com/payloadcms/payload/releases/tag/v3.90.0) e
[advisory crítico](https://github.com/payloadcms/payload/security/advisories/GHSA-vc4h-q48j-5hcx).
Config desativa auth local/HTTP/GraphQL/admin e não usa uploads/jobs do Payload; campo novo de reset
não é adicionado à projeção user. Teste da configuração garante ausência desses campos; sem
migration ou aplicação no banco de uso. Tipos web/news/worker passaram após instalação.

A revisão automática recusou atualizar a descrição do PR, por tratar o envio de detalhes internos
como egress não autorizado. Não foi contornada; texto será preparado localmente para aprovação.

## Validação local e visual

Notebook-Gabriel-Brazil, Node 24.20.0, 8 CPUs, aproximadamente 3,6 GiB livres ao conferir. Execução
sequencial/até dois workers; serviços locais não iniciados. Wrappers pnpm desta instalação não
resolveram os executáveis; ferramentas executadas diretamente por Node dos mesmos node_modules.

- `node node_modules/typescript/bin/tsc --noEmit -p apps/web/tsconfig.json`: aprovado.
- `node node_modules/typescript/bin/tsc --noEmit -p packages/db/tsconfig.json`: aprovado.
- `node node_modules/eslint/bin/eslint.js .`: aprovado.
- Vitest unit completo com `--maxWorkers 2`: 639 testes aprovados após atualização Payload e teste
  real da configuração. Rodada anterior teve 638 aprovados fora do sandbox. A primeira execução no
  sandbox teve 637 aprovados e uma falha do tsx (`uv_os_get_passwd ENOMEM`), resolvida pela execução
  autorizada fora da restrição, sem mudar o teste do worker.
- Vitest contract completo com `--maxWorkers 2`: 172 testes aprovados.
- Prettier geral e documentos alterados, `git diff --check`: aprovados.
- PostgreSQL/E2E/build/security: aprovados no CI de 90f82e2 acima.

PDF de teste criado pelo writer real com 45 registros e 45 pontos (um zero), duas colunas escolhidas
e comentário com aproximadamente 2000 caracteres. Renderizado com PyMuPDF 1.28.2 (Poppler ausente).
Sete páginas A4 paisagem verificadas: análise completa, três páginas de tabela, três de gráfico; 44
barras vetoriais, sem sobreposição/cortes, rótulos e página/continuação legíveis. Caminho local
ignorado `.cache/qa-pr46/executive-restored.pdf` e PNGs correspondentes, sem dados pessoais.

Revisão pelo guia: Button compartilhado, três formatos, ordem visual/teclado coerente, texto de erro
com role alert e retorno, ausência de estilo novo da interface. E2E acrescenta Axe no fluxo de
retentativa e arquivo real; execução no CI confirmada acima. QA humano e medições C1/T038 permanecem
pendentes e não são presumidos por estes testes. Sem nova migration/permissão/env.
