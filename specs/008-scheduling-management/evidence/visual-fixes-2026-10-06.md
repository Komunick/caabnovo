# Correção dos achados visuais de Agendamentos — 06/10/2026

Autoria CODEX; solicitante mafaltti, login Danilo-Komunick, perfil GitHub get_profile verificado
nesta sessão em 06/10. Pedido explícito: usar uma worktree de Agendamentos, atualizar e corrigir os
problemas encontrados na [revisão hospedada](visual-hosted-2026-10-06.md).

## Entrega e escopo

- Worktree `.cache/pr-scheduling-visual-20261006`, branch `fix/scheduling-visual-20261006`.
- Base `9dc6a7fa78dea304d9186c967dae63f8a42b22a2`; fetch e atualização com origin/dev confirmados. A
  branch local de auditoria foi renomeada; evidências e trabalho local preservados.
- A versão validada é a árvore local com estes deltas; hashes dos arquivos de produção no
  [manifesto](visual-fixes-2026-10-06/manifest.json).
- Alterações de apresentação/foco. Nenhuma migration, regra de disponibilidade, estado, contador
  persistido, autorização ou transporte de avisos foi alterado.
- Não houve commit, push, PR, merge, deploy ou mudança no site hospedado nesta correção.

## Resultado por achado

| Item  | Correção                                                                                                                                                                       | Evidência                                                                                                                                    |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| VQA01 | O título do diálogo compartilhado reserva 2,75 rem para a área do botão Fechar, mantendo fonte, cores e o tamanho do alvo existentes.                                          | Geometria sem interseção nos viewports 320/390/1280, claro/escuro; seis capturas e Axe.                                                      |
| VQA02 | Os quatro acionadores de decisão guardam sua referência. Escape, Fechar e Voltar restauram foco quando o botão permanece conectado e habilitado. Fechamento não envia comando. | 12 combinações de ação/fechamento em componentes e Chromium; nenhum POST durante desistência. Cancelamento mantém o DialogTrigger existente. |
| VQA03 | O calendário usa “Atendimento por capacidade do serviço” na ausência de profissional, no texto, tooltip e aria-label.                                                          | Seis regressões de componentes (três vistas, com/sem nome) e três vistas reais do FullCalendar no Chromium, sem `null`/`undefined`.          |
| VQA04 | Histórico junta somente os campos presentes; contadores usam “1 confirmada”, “1 registro” e “1 selecionada”.                                                                   | Contagens 0/1/2/desconhecida, profissional presente/ausente e status da exportação verificados. Dados e horários permanecem iguais.          |

## Validações executadas

- Vitest: 34 testes aprovados em booking-detail.test.tsx, calendar.test.tsx, export-screen.test.tsx
  e ui-contracts.test.tsx. Após detectar o singular de colunas na captura, export-screen.test.tsx
  foi ampliado/reexecutado: sete testes aprovados. Total de 35 casos únicos.
- TypeScript web:
  `node --max-old-space-size=1536 node_modules/typescript/bin/tsc --noEmit -p apps/web/tsconfig.json`,
  aprovado.
- ESLint dos arquivos TSX alterados, aprovado. Formatação dos arquivos de código/documentação e
  `git diff --check`, aprovados.
- Chromium com Playwright 1.62.1: 24 cenários, dez PNGs; exportação revalidada depois do ajuste
  final de colunas selecionadas. Sem erros de página na execução final.
- Axe: zero violações nos seis estados de modal por tema/largura, tags WCAG 2 A/AA, 2.1 AA e 2.2 AA.
- O E2E administrativo existente foi atualizado com singular, geometria em 320 px e retorno de foco
  por três formas de fechamento. Sua execução com backend permanece não realizada aqui.

Na primeira execução dos testes novos, o mock de Next/link não fornecia useLinkStatus. Corrigido sem
alterar produto. As verificações de Escape passaram a esperar o retorno assíncrono de foco do Radix;
a asserção de identidade do acionador e a ausência de mutação foram mantidas. Uma fixture ganhou
eligibilityWarning=null para cumprir o tipo existente. Ajustes de resolução de React, variáveis de
compilação do Next e rota de download foram feitos somente no harness local.

## Método de navegador e limites

O harness local empacotou os componentes reais de detalhes, diálogo, FullCalendar, exportação,
WorkspaceDrafts/Permissions e o CSS/tokens desta worktree. Next/navigation e Next/link usam um
adaptador de navegação para o teste de componentes. Todas as respostas HTTP foram interceptadas pelo
Playwright em `https://scheduling-ui.test/`, com dados sintéticos e bloqueio de pedidos inesperados.
Nenhum servidor/localhost ou banco foi iniciado; nenhum pedido foi enviado ao DEV. Scripts em
`.cache/visual-fixes/` da worktree.

Isso valida renderização, geometria, foco, texto e acessibilidade desses estados no Chromium. Não
comprova integração HTTP/PostgreSQL, downloads reais da versão corrigida, concorrência,
comprovantes, entrega de mensagens, outros navegadores ou homologação humana. A revisão anterior do
site e seus downloads continuam evidências distintas; não reatribuir suas capturas à correção. Build
de produção, suíte E2E com backend e CI não foram executados nesta etapa.

## Revisão pelo guia

[caab-design.md](../../../docs/caab-design.md) aplicado: legibilidade sem sobreposição, alvo Fechar
preservado, foco ao acionador, texto compreensível e datas/histórico intactos. As dez capturas foram
inspecionadas por IA. Elementos fixos em screenshots fullPage cobrem apenas o viewport; áreas
inferiores não cobertas não foram interpretadas como defeito de modal.

- [Modal corrigido em 320 px, claro](visual-fixes-2026-10-06/dialog-320-light.png).
- [Modal corrigido em 320 px, escuro](visual-fixes-2026-10-06/dialog-320-dark.png).
- [Exportação com um registro](visual-fixes-2026-10-06/export-single-390-light.png).

VQA01–VQA04 concluídas localmente em [tasks.md](../tasks.md). T110 e demais pendências
institucionais não são encerradas. A entrega está disponível na worktree para revisão/publicação
quando solicitada.

## Preparação do PR — 06/10/2026-CODEX-mafaltti

Pedido explícito posterior: abrir PR para análise. Código, testes e evidências publicados em
`d5f8885824a6287617678d0963193aa0b5e78cec`. O limite de ausência de publicação registrado acima
descreve a etapa local anterior.

O primeiro [CI de push](https://github.com/Komunick/caabnovo/actions/runs/37524336230) reprovou
security por Payload <3.90.0 (cinco HIGH e um CRITICAL), já existente na base `9dc6a7f`.
Quality/browser ainda estavam em execução quando o usuário informou a integração do PR #49. Não
contornar o gate nem atribuir essa falha à alteração de interface.

Integração confirmada: PR #49 em dev `2b30f538025121253c336425b6c8c6b5264193cd`. Principal
atualizada por fast-forward e base incorporada à branch por merge local
`8d7979c1fd2ec75842a75c9ba22933ff602c0f86`, sem reescrever histórico publicado ou executar merge de
PR nesta frente. Os cinco arquivos de produção da correção conservam os hashes do manifesto. O diff
do PR será contra o novo dev, excluindo a atualização de dependências já integrada.

O novo CI da ponta publicada será conferido antes da declaração de prontidão. A descrição do PR
registra a versão e seus gates reais; captura/validação de componentes local não substitui E2E,
integração, build ou segurança do CI. Sem autorização de merge/deploy desta correção.

O browser do primeiro CI concluiu com 101 cenários aprovados e duas falhas em expectativas antigas
de “1 registros”, em direct-exports.spec.ts:793 e scheduling-export.spec.ts:127. Os logs mostram
recebimento correto de “1 registro.”. Expectativas ajustadas para o singular com ponto final;
parsers e verificações de conteúdo/quantidade/permissões preservados. A jornada administrativa de
Agendamentos com as novas provas de foco/geometria passou. Quality e security da execução sobre
`332fe59` já passaram; a publicação seguinte valida também as duas expectativas corrigidas.

## Triagem de segredos e CI transversal do PR #50 — 07/10/2026-CODEX-mafaltti

Pedido atual: corrigir a análise do PR #50, incluindo a referência de evidência em `.gitleaksignore`
e a rastreabilidade das alterações transversais de CI. Solicitante mafaltti/login Danilo-Komunick,
identidade GitHub get_profile verificada nesta sessão em 07/10/2026. Esta seção complementa as
etapas anteriores sem reatribuir suas autorias ou resultados.

O PR #50 contém, além da correção visual de Agendamentos, três commits de segurança do CI: `a0845f4`
exige varredura real do histórico, `199565c` delimita falsos positivos históricos por fingerprint e
`9edc288` restringe a confiança Git ao workspace do scanner. Os mesmos ajustes transversais também
estão nos PRs #46 e #48 ainda abertos; isso não incorpora as alterações funcionais dessas entregas
ao PR #50.

A análise original encontrou aprovação aparente do Gitleaks após erro Git de ownership, com zero
commits e zero bytes examinados. O workflow atual mantém a imagem Gitleaks 8.28.0, monta o workspace
somente para leitura, exige histórico Git legível e não vazio, preserva falhas da pipeline e
verifica o log redigido: commits e bytes positivos, sem erro Git, scan parcial ou resumo ausente. O
reset de `safe.directory` usa configuração protegida de runtime: uma entrada vazia remove confianças
anteriores da imagem e a seguinte permite somente `/github/workspace`. Não altera a configuração
global do host nem aceita wildcard de confiança.

O scan real revelou 13 falsos positivos da regra `generic-api-key`, em sete commits históricos. A
triagem original conferiu cada blob e teve revisão independente por outro agente CODEX:

- Nove ocorrências são propriedades de credenciais S3 que referenciam
  `env.S3_ACCESS_KEY`/`env.S3_SECRET_KEY`, sem conter valores de credencial. Distribuem-se entre
  `apps/worker/src/main.ts` (três), `apps/worker/src/migrate-file-storage.ts` (duas),
  `apps/web/modules/shared/storage-client.ts` (duas),
  `apps/web/modules/audit/audit-export-service.ts` (uma) e
  `apps/web/modules/files/object-storage.ts` (uma).
- Quatro ocorrências são literais `draftKey` de escopos de rascunho UI em
  `apps/web/modules/scheduling/ui/agenda.tsx` e `hours.tsx`, duas em cada arquivo. São
  identificadores usados por `DraftForm`/`DraftScope`; não autenticam pedidos.

`.gitleaksignore` mantém somente esses 13 fingerprints completos de commit/caminho/regra/linha,
separados por justificativa. Não há regex, exclusão global de caminhos ou regras, baseline geral ou
reescrita do histórico. O scan local da triagem examinou 527 commits e 18.603.290 bytes; após a
lista, terminou com exit 0 e zero candidatos. Um repositório sintético isolado com a mesma lista e
uma chave falsa nova continuou detectado pela regra `generic-api-key`, com exit 1. Esses resultados
pertencem à triagem histórica, não são nova execução desta correção nem validação de código
funcional de outros PRs. Nenhum valor de credencial foi publicado.

O [CI 37633757862](https://github.com/Komunick/caabnovo/actions/runs/37633757862) da ponta
`9edc288ed61d4da24687327ac94024b991ab1944` do PR #50 concluiu quality, browser e security com
success: 626 unitários, 169 contratos, 395 integrações e um opt-in não executado, build, 103 E2E e
seis testes de acessibilidade. O scan real registrou 528 commits, 18.541.462 bytes e zero
candidatos. As contagens diferem do scan local porque as referências dos checkouts diferem. Esse CI
cobre a ponta indicada; a correção posterior da referência e do fallback da lista precisa de
validação própria e do CI de sua nova ponta.

O comentário da lista de exceções agora aponta para esta evidência, presente na árvore do PR #50; a
referência deixa de depender de um documento que existe somente no PR #46. A alteração do comentário
preserva os 13 fingerprints e o comportamento de detecção.

Na correção documental de 07/10, os 13 blobs foram reconferidos por classificação, sem imprimir
valores: nove referências env e quatro escopos UI. Comparação em bytes confirmou fingerprints
inalterados e preservação integral do texto anterior desta evidência. Prettier documental e
`git diff --check` aprovados. Não foi necessário executar novamente o scanner para alterar somente o
comentário da referência; os resultados anteriores permanecem atribuídos às suas versões.

Rollback deve considerar que uma reversão integral do PR #50 também retira seus ajustes transversais
de CI/Gitleaks se ainda não houver outra integração que os preserve em `dev`. Conferir a árvore
efetiva antes de reverter; para retirar apenas a apresentação de Agendamentos, preservar o workflow
e as exceções históricas revisadas em uma reversão seletiva. Na correção inicial, a equivalência
entre os três PRs abrangia workflow e fingerprints; a referência do comentário divergiu e gerou
conflito add/add documental. A correção desse comentário está registrada abaixo. Nenhuma dessas
verificações concede autorização de merge ou de rollback.

## Fallback da lista e correção da análise — 07/10/2026-CODEX-mafaltti

VQA05/VQA06: a lista diária agora apresenta “Atendimento por capacidade do serviço” quando
`professionalName` é nulo, usando o mesmo operador/texto de calendário e detalhe. Nomes de
profissionais existentes, beneficiários, horários, vínculos, filtros e permissões permanecem iguais.
O título do PR foi atualizado para “fix(agendamentos/ci): corrige agenda e execução do Gitleaks”; o
corpo explicita a referência independente do PR #46 e o efeito do rollback transversal descrito
acima. Releitura remota confirmou os metadados após a atualização.

Validação local desta correção sobre a base `9edc288`, com o delta ainda não commitado:

- Vitest 4.1.11: 23 testes de `calendar.test.tsx` e `booking-detail.test.tsx` aprovados.
- ESLint de `agenda.tsx`, Prettier do TSX e dos quatro documentos alterados e `git diff --check`
  aprovados. O pnpm encontrou bloqueio da política PowerShell e do store SQLite; os executáveis
  `.cmd` já instalados foram usados diretamente, sem reinstalar ou alterar dependências.
- Typecheck local encontrou `LexicalExtensionComposer` ausente no editor de Notícias: Payload e
  richtext-lexical instalados estão em 3.89.0, enquanto o lockfile da entrega exige 3.90.0. Não é
  validação de tipos aprovada; não se alterou Notícias nem a instalação compartilhada. O CI com
  `install --frozen-lockfile` deve verificar esse gate na nova ponta.
- Chromium com `SchedulingAgenda`, WorkspaceDrafts/Permissions e CSS/tokens reais: seis cenários
  (320/390/1280 px, claro/escuro), duas reservas sintéticas por cenário, com profissional ausente e
  nome presente. Fallback, nome existente, horários e links conferidos; nenhuma exposição de
  `null`/`undefined`, erro de página ou violação Axe (WCAG 2 A/AA, 2.1 AA, 2.2 AA).

Revisão pelo guia: leitura clara na coluna Atendimento, sem alteração de paleta, tipografia ou
estrutura. A rolagem bidimensional continua confinada ao contêiner da tabela em 320/390 px, sem
overflow da página; a captura móvel mostra a coluna após rolagem. Next/navigation e Next/link usam
adaptador somente no harness e todas as respostas HTTP são sintéticas/interceptadas. Não houve
servidor, banco ou pedido ao DEV. Isso não substitui E2E com backend nem homologação humana.

A fonte `agenda.tsx` validada tem SHA-256
`317d9c7907c463d356f77d4da93350ce167b0b1dfb88e86ec6ffc6cf69e4f5f2`.
[Manifesto desta revisão](visual-fixes-2026-10-07/manifest.json),
[lista em 1280 px claro](visual-fixes-2026-10-07/agenda-list-1280-light.png) e
[coluna Atendimento em 320 px escuro](visual-fixes-2026-10-07/agenda-list-320-dark-attendance.png)
preservam duas amostras auditáveis. Demais capturas e harness ficam na pasta privada
`.cache/pr50-list-review/` desta worktree. Revisão independente não encontrou bloqueador nos
arquivos corrigidos. VQA07 permanece aberta até conferir publicação e gates da nova ponta.

## CI da correção da análise — 07/10/2026-CODEX-mafaltti

VQA07 concluída: ponta funcional `01f86c23e523842db4a0254e32b3dbe9ce5379c2`, publicada no PR #50.
[CI 37650738847](https://github.com/Komunick/caabnovo/actions/runs/37650738847) concluído com
quality, browser e security aprovados. Conferidos formato, lint, tipos, 626 unitários, 169
contratos, 395 integrações PostgreSQL e um opt-in de volume não executado, migrations e build.
Browser aprovou três casos de Relatórios, 103 E2E e seis de acessibilidade, sem retry; oito jornadas
de Agendamentos incluem geometria em 320 px e retorno de foco por Escape/Fechar/Voltar. Security fez
varredura real de 532 commits e 18.589.164 bytes, sem candidatos; audit aprovado no limiar high, com
dois avisos low e dois moderate. Não equivale à ausência de todos os avisos ou a QA humano.

O typecheck passou no ambiente congelado do CI, superando a limitação da instalação local de
Notícias descrita acima. Os 13 fingerprints permaneceram iguais e a referência de evidência existe
na árvore entregue; o SHA-256 de `agenda.tsx` corresponde ao manifesto de componentes. Metadados do
PR explicitam os três pontos da análise, a ponta verificada e o rollback transversal.

Este fechamento modifica somente esta evidência e a marcação de VQA07 em tasks.md. Código, workflow,
fingerprints, contratos e capturas permanecem exatamente os da ponta funcional validada. Formatação
documental e diff-check são os gates próprios do checkpoint; qualquer CI automático posterior
pertence ao seu novo SHA e não deve ser confundido com o run funcional acima. Não houve merge,
deploy, serviço local, alteração de banco de uso ou homologação humana.

## Alinhamento da referência entre PRs — 07/10/2026-CODEX-mafaltti

Pedido explícito do usuário: corrigir o conflito documental entre `.gitleaksignore` dos PRs
#46/#48/#50. O PR #46 já foi integrado quando esta correção começou: dev
`1c21c9a711aa12f446918ac790bc6ede76490251` contém a evidência canônica
`specs/010-reports-analytics/evidence/pr46-corrections-2026-10-06.md`. Portanto, a justificativa
anterior de que o destino dependia de um PR aberto foi superada pela integração confirmada.

O comentário do PR #50 volta à mesma referência de dev e do PR #48. O arquivo inteiro, incluindo os
13 fingerprints e comentários, coincide com essas fontes; workflow e comportamento do scanner não
mudam. A triagem autocontida da spec008 permanece preservada como complemento e histórico. Não se
alterou o PR #46 integrado nem a branch do PR #48: a correção fica somente no PR #50 aberto.

Spec e plano agora registram a referência canônica. Validação desta etapa: comparação dos blobs,
existência do destino em dev, simulação das combinações Git, Prettier documental e diff-check. As
evidências funcionais anteriores permanecem atribuídas aos seus SHAs; este ajuste não muda produção,
testes ou políticas do scanner e não exige nova execução local de build/E2E. O CI automático após o
push pertence à nova ponta e não é apresentado como já aprovado.

Revisão independente com `git merge-tree --write-tree --name-only`: antes da correção, as quatro
combinações dev↔PR50 e PR48↔PR50 apresentavam somente conflito add/add de `.gitleaksignore`. Depois,
todas passaram com exit 0 e nenhum conflito, nas duas ordens. Blob comum de `.gitleaksignore`:
`f816c0c31723db2ed6928df8d754ed65b1893bbe`; de `ci.yml`: `56e39aba2a040390f93e84aca63a102b9eb74a7b`.
A simulação não alterou refs, branches ou worktrees.

## Correção de CI e composição com dev — 07/10/2026-CODEX-mafaltti

Pedido atual: corrigir o erro de CI e os conflitos do PR50. A ponta `7b1ed3a` já incorporava o PR46,
mas dev avançou para `4fafc87` com a integração do PR48. Os conflitos eram somente nos três
documentos `spec.md`, `plan.md` e `tasks.md` desta função. A resolução conserva integralmente os
blocos visuais do PR50 e a cobertura de uploads/T118 de dev, sem escolher um arquivo inteiro de um
lado. Backups dos três documentos e das regras de CI/scanner foram verificados antes da integração.
As correções visuais, os 13 fingerprints e as validações de uploads integradas permanecem.

O [CI do PR37667967432](https://github.com/Komunick/caabnovo/actions/runs/37667967432) de `7b1ed3a`
terminou cancelado. Quality e security passaram; browser ficou na instalação de dependências do
Playwright, sem executar E2E. O log mostra APT sem progresso ao acessar o espelho Ubuntu por HTTP e
cancelamento após aproximadamente 24 minutos; é compatível com o limite de 25 minutos do job, mas o
log isolado não identifica o iniciador do cancelamento. O
[CI do push37667964826](https://github.com/Komunick/caabnovo/actions/runs/37667964826) da mesma
ponta passou, com seis casos de Relatórios, 106 E2E e seis de acessibilidade. Não foi identificada
uma asserção de produto falhando nesses runs.

A preparação APT do runner troca os endereços Ubuntu HTTP por HTTPS, usando o arquivo oficial no
lugar do espelho Azure. Abrange `.list`, `.sources` e os dois arquivos locais de mirrorlist do
runner, preservando suites, componentes, metadados e chaves. Timeouts de transporte de 30 segundos e
três retries limitam esperas de rede. A instalação `playwright install --with-deps chromium`, os
testes, os gates e o limite total do job continuam. Configuração aplicada somente ao runner efêmero;
nenhum APT, serviço ou banco local foi alterado.

Validação local: sintaxe Bash do bloco real e quatro fixtures passaram, cobrindo fonte legada,
Deb822, mirrorlist com prioridade/arquitetura e preservação de transportes `file`, fontes de
terceiros e HTTPS existente. Transformação idempotente; chaves, componentes e metadados preservados.
Prettier dos cinco arquivos alterados e diff-check passaram. A resolução documental foi conferida
contra os dois lados; as fontes das quatro correções visuais e `.gitleaksignore` permanecem iguais
às versões preservadas antes da composição. Nenhuma biblioteca Ubuntu foi instalada localmente.

Referências oficiais verificadas em 07/10/2026:
[configuração APT](https://manpages.ubuntu.com/manpages/noble/man5/apt.conf.5.html),
[mirrorlists](https://manpages.ubuntu.com/manpages/noble/man1/apt-transport-mirror.1.html) e
[instalação de dependências do Playwright](https://playwright.dev/docs/browsers). Os índices
`noble/InRelease` e `noble-security/InRelease` dos arquivos oficiais responderam por HTTPS nesta
verificação. O CI da nova ponta será a prova da integração e da instalação real; resultados finais
serão registrados no corpo do PR sem novo envio apenas documental. Revisão humana e homologação
permanecem independentes.
