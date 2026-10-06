# Checkpoint vigente — Agendamentos, 02/10/2026

## Conciliação com dev após PR42 — 06/10/2026-CODEX-mafaltti

Pedido atual: resolver os conflitos do PR43 com dev, preservando a entrega administrativa.
Solicitante mafaltti, login Danilo-Komunick, identidade GitHub get_profile já consultada nesta
sessão. Base da branch `ffd8997`; PR42 integrado em dev `46a3417`. A retomada se limita a esta
conciliação e seus gates, sem novas regras, canais ou homologação.

Os dois conflitos em workspace/lockfile foram resolvidos mantendo o patch `source-map-js@1.2.2` de
dev. Código, testes de aplicação e migrations 0031–0034/0036 de Agendamentos preservados; 0035
continua pertencendo ao PR45. Composição documental conserva HIN do programa e DS/AC/cargo base da
Fundação. Instalação congelada aprovada. Versão publicada e CI da composição serão registrados no
corpo do PR43; os runs de `ffd8997` são históricos e não validam a nova ponta.

Evidência na [revisão existente](evidence/review-fixes-2026-10-05.md). T110 conserva revisão humana
sensível, rollout e homologação pendentes; a composição após PR42 não conclui esses gates. Nenhum
serviço, banco de uso ou merge do PR executado. Checkpoints anteriores permanecem históricos.

## Diagnóstico da finalização — 05/10/2026-CODEX-mafaltti

Revisão complementar de aa2deaa: T117 implementa preservação das causas originais por ocorrência,
logs com SQLSTATE/mensagem segura e serialização sem causas brutas na fila. Dezesseis unitários,
tipos web/worker/db e lint passaram; regressão PostgreSQL ampliada segue no CI da publicação.
Usuário confirmou PR43 como destino; PR44 de dependências preservado. Versão e resultados de CI
ficam no corpo do PR43; [evidência complementar](evidence/review-fixes-2026-10-05.md) distingue este
delta dos testes anteriores. R04 explicitamente histórico, sem mudança adicional de UI/índices.

## Correções da revisão — 05/10/2026-CODEX-mafaltti

Revisão do usuário recebida com um HIGH, dois MEDIUM, nove LOW e observações INFO. Decisões
confirmadas: contador desconhecido zero; preservar outras reservas confirmadas no modo capacidade.
Correções e fixture publicadas em e923e9d: quality/browser/security aprovados nos runs
37337887070/37337878171. São 577 unitários, 169 contratos, 357 integrações (um volume opcional
ignorado), 101 E2Es, três testes dedicados de Relatórios, seis de acessibilidade e build aprovados.
Isolamento completo de faltas (31/31) e consultas (13/13) executados. T111 e T112–T116 concluídas
tecnicamente, conforme [evidência](evidence/review-fixes-2026-10-05.md). A primeira rodada eeb5e42
falhou somente na fixture que ainda usava documento comum como nova prova; não afrouxamos produção.
Quatro documentos locais anteriores preservados em backup verificado por bytes em
.cache/local-backups/scheduling-review-20261005-123015 da principal. Publicação documental final e
seus checks ficam identificados no PR43. T110 depende de revisão humana sensível, composição após
PR42, preparo do rollout e homologação humana; sem merge ou alteração no ambiente de uso.

## Estado de fechamento delimitado — 05/10/2026-CODEX-mafaltti

Pedido do usuário: concluir no escopo administrativo atual, organizar Jira e parar esta coordenação.
[Plano](plan.md) e [tarefas](tasks.md) agora distinguem T111/T110 dos recortes futuros. Cinco
tickets administrativos permanecem em Code Review; app/site e e-mail real/homologação ficam no
Backlog. Nenhum aceite concluído por esta organização.

PR43/4e427ac ainda aberto na conferência; CI37061317002 e37061310305 terminaram com browser/security
aprovados, quality falhando na asserção de erro em scheduling-absence.test.ts:880. Falta concluir
matriz S01/S02, gates/revisão externa da ponta final, composição após PR42, preparo de implantação e
homologação humana. Os registros de 02/10 abaixo são históricos, não prontidão atual.

Alteração desta coordenação somente documental, sem código, serviço, commit/push ou merge. Autoria
CODEX; solicitante mafaltti (Danilo-Komunick), consulta GitHub desta retomada em 05/10.

## Consolidação final em andamento — 02/10/2026-CODEX-Gabriel-Komunick

Os três pareceres de b676974 foram recebidos e consolidados, com autoria/hashes preservados em
[evidência](evidence/closeout-review-2026-10-02.md). S01/S02 de segurança confirmados por inspeção:
isolamento dos comprovantes e reautorização/prazo após espera pelo arquivo corrigidos localmente;
cinco regressões PostgreSQL reais preparadas e jornada de upload atualizada, aguardando CI próprio.
Passaram96 unitários pertinentes, tipos web e lint; não são prova de PostgreSQL.
Migrations0031–0034, HIN e contratos de Relatórios preservados. T107/T039 aprovados de b676974 não
cobrem o delta novo. PR42 ainda aberto: conciliação com dev pendente. T110/T111 controlam o
fechamento/correção desta rodada. QA humano e rollout no destino continuam pendentes; sem merge ou
serviços locais.

## Gates administrativos concluídos — 02/10/2026-CODEX-SOLICITANTE_NAO_VERIFICADO

Mesma worktree, branch feature/scheduling-administrative-20261002. Commit técnico validado
cac5cbb8a4c8f61352d5513f5f3e21748132e88c: CI37034671649 com quality/browser/security aprovados.
558unitários,169contratos,347integrações (118de Agendamentos),1volume opcional ignorado, build57,
101E2Es,3focados Relatórios,6a11y. Artefato72capturas;18revisadas e preservadas com manifesto.
T107/T039 concluídos tecnicamente.
[Critérios/evidências/limites](evidence/publication-2026-10-02.md). Próximo passo: commit
documental/push e PR para dev já autorizados; sem merge/serviços locais/WSL. QA humano pendente;
e-mails/app/site/WAHA adiados. Conciliação com Relatórios não executada.

Os checkpoints abaixo são registros anteriores: os impedimentos técnicos de banco/navegador foram
superados no CI descartável. Não recuperar WSL nem repetir implementação/histórico2733e01/4e9abac.

## Publicação autorizada — 02/10/2026-CODEX-SOLICITANTE_NAO_VERIFICADO

Branch efetiva: `feature/scheduling-administrative-20261002`, na mesma worktree
`.cache/pr-scheduling-research-20260923`. Renomeada de codex/scheduling-market-research-20260923
após fetch e ausência de colisão local/remota. Commits2733e01/4e9abac preservados, sem reescrita.
Usuário autorizou commits, push para CI existente e PR para dev após gates técnicos; não merge,
serviços locais ou recuperação WSL. T107 permanece aberto até evidência da versão publicada. QA
humano continua pendente; e-mails, app/site e WAHA adiados. Evidências anteriores não são resultado
do próximo CI:727 testes/build pertencem a4e9abac;107 posteriores não validam PostgreSQL.

## Compatibilidade com Relatórios — 02/10/2026-CODEX-SOLICITANTE_NAO_VERIFICADO

Revisão concluída no escopo sem serviços:
[evidência e instruções de conciliação](evidence/reports-compatibility-2026-10-02.md). Uma correção
local no aviso de cancelamento considera a data de referência de reservas sem horário; regressão
PostgreSQL ampliada, ainda não executada. Passaram 107 unitários/contratos, tipos e lint.
HEAD4e9abac com delta local; build e 727 testes anteriores não cobrem o novo filtro SQL. T107
permanece aberto. Ordem vigente: não recuperar WSL, não iniciar serviços; aguardar nova orientação
para validações de banco/navegador. E-mails seguem adiados. Relatórios somente lido; nenhuma
implementação copiada ou branch integrada.

## Validação da conciliação — 02/10/2026-CODEX-SOLICITANTE_NAO_VERIFICADO

Versão conciliada: `4e9abac`, com dev `748539d` incorporada após backup verificado e commit local de
preservação `2733e01`. Passaram 727 unitários/contratos, tipos sequenciais, lint, formatação, build
(57 páginas), auditoria de dependências sem high/critical e Gitleaks. Detalhes e limites em
[evidência da retomada](evidence/resume-2026-10-02.md).

T107 ainda pendente: 118 integrações não executadas por runtime Docker/WSL indisponível; E2E/revisão
visual atual não iniciados. Usuário autorizou ambiente temporário e depois reinício do WSL.
`wsl --shutdown` excedeu 35 s; reinício de WslService negado pelo Windows por acesso administrativo.
Solicitada recuperação do serviço em PowerShell administrativo e reinício do Docker. Conferência
posterior: WslService em StopPending, Docker ainda sem endpoint. Nenhum banco de uso alterado e
nenhum servidor na porta 3107 iniciado nesta etapa. Após recuperação, executar as cinco suítes
scheduling em PostgreSQL descartável e jornadas de Agendamentos/Relatórios com build atual,
preservando evidências antigas. Não repetir gates aprovados sem nova mudança/falha que justifique.
Não houve push/PR nem CI remoto.

Jira atualizado por acréscimo de oito comentários, preservando informações anteriores. Os cinco
recortes administrativos entraram em Code Review (revisão/testes por IA); o épico continua Em
Desenvolvimento e os dois itens de e-mail no Backlog. Títulos, códigos, resultados e limites na
evidência acima. Atualizar Jira a cada etapa e conferir o estado antes de transicionar.

## Retomada e adiamento de e-mail — 02/10/2026-CODEX-SOLICITANTE_NAO_VERIFICADO

O usuário autorizou conciliar a worktree preservada com dev e concluir/validar sobreposição,
bloqueios, permissões, aprovação/remarcação e faltas. Em resposta posterior, informou que o serviço
de e-mail ainda não foi criado e adiou a integração e homologação dos avisos. O código SMTP de
contas é referência técnica, não prova de serviço disponível.

Entregar os avisos operacionais de Agendamentos por e-mail (CAAB-42)/T089 permanece pendente,
dependente de Serviço de e-mail transacional e definição da caixa de entrada (CAAB-2). A pedido
explícito foi criada a subtarefa Homologar os avisos operacionais após disponibilizar o serviço de
e-mail (CAAB-45), bloqueada por CAAB-2. Confirmar ambiente, transporte/remetente, destinatários de
teste autorizados e humano responsável na retomada; registrar versão e evidência que diferencie
intenção, processamento, aceite e entrega. Não criar transporte ou enviar agora. App/site, WAHA e
T097 permanecem adiados. O recorte administrativo segue independentemente.

## Diagnóstico de retomada, 02/10/2026-CODEX-SOLICITANTE_NAO_VERIFICADO

Pedido restrito a conferir onde parou e o necessário para continuar. Inspeção documental e estática
confirma HEAD 500f84f na worktree original, com alterações locais preservadas, incluindo T103–T105
de 30/09. O caderno principal ainda destaca a pausa de 28/09; o avanço mais recente está registrado
abaixo. Não foram executados testes ou iniciados serviços neste diagnóstico.

Antes de consolidar a entrega, reconciliar as atualizações de dev relativas aos PRs #40 (exportação
de Relatórios) e #41 (dependências), preservando alterações locais e conferindo arquivos
compartilhados de exportação/Relatórios. Fetch de 02/10 concluído; dev e origin/dev em 748539d, sem
divergência. Não houve merge, commit, push ou abertura de PR.

Próximos recortes: T089 para integração de e-mails (contatos/vínculo, textos, transporte,
deduplicação e prova de entrega); T039 para CI quando houver publicação autorizada. App/site
continuam adiados, com T041/T043/UI01/UI02 e inventário de reservas legadas T042 antes da ativação
externa; WhatsApp depende de preparação e homologação WAHA em T044/T069. T097 permanece
possibilidade futura, sem autorização de implementação. As validações de 28/09 e 30/09 são
evidências históricas, não uma execução sobre uma base reconciliada hoje. Identidade consultada por
gh api user em 02/10: HTTP 401; solicitante não verificado.

## Correções do converge, 30/09/2026-CODEX-SOLICITANTE_NAO_VERIFICADO

Pedido: implementar T103–T105. Correções locais na mesma worktree, sem commit/push/PR: aprovação
revalida bloqueios do intervalo retido; auditoria do formulário distingue publicação e registra
políticas anteriores/posteriores e estado publicado; edição de troca pendente que confirma gera
intenção de confirmação no mesmo commit. Sem mudança de UI, schema ou transporte.

Validação concluída em 30/09/2026: tipos, lint e formato aprovados; 125 unitários do módulo, 37 dos
contratos compartilhados e 19 integrações de scheduling-workflow aprovados. A suíte inclui quatro
novas regressões: bloqueio superveniente com fronteira/decisões concorrentes, duração original após
edição do procedimento, auditoria de publicação/rascunho/republicação/rollback/replay e confirmação
por edição sem intenção duplicada. T103–T105 marcadas concluídas.

Execução:
`node node_modules/vitest/vitest.mjs run --project integration apps/web/tests/integration/scheduling-workflow.test.ts --maxWorkers=1`,
com `NODE_OPTIONS=--dns-result-order=ipv4first --max-old-space-size=384`. Resultado: 19/19 em
58,72s. PostgreSQL 18 sintético, 256 MB/1 CPU, autorizado nesta conversa; container e auxiliar Ryuk
removidos automaticamente ao terminar. Nenhum painel, worker ou banco CAAB de uso iniciado. Aviso
não impeditivo do driver pg sobre chamadas concorrentes a client.query; nenhuma falha. Fetch final
concluído e dev/origin/dev sem divergência; worktree com alterações preservada. Identidade desta
instância não verificada (gh api user retornou HTTP 401 nesta sessão).

## Faltas e interface administrativa validadas localmente-CODEX-mafaltti

Em 28/09, o usuário autorizou implementar o núcleo confirmado enquanto o clarify continua.
T090–T095/T098 implementados localmente; T096 validou o recorte, incluindo build e 94 integrações.
OK apenas fecha o aviso, mantendo os sete dias. Cancelar reservas após os 30 dias é somente
possibilidade futura T097. Foram adicionadas persistência, proteção de criação/transferência,
comprovantes privados, revisão dedicada e rotina automática com autoria de sistema. Registros em
banco de uso, ativação de worker/preview e entrega real de mensagens não foram executados. As
evidências administrativas antigas abaixo não cobrem esta política.

T088 concluída: e-mails operacionais para dependente e titular, independentemente de comunicados;
projeto somente intermediário, mérito da equipe responsável. T099–T102 implementam e validam lista,
registro, pedido com comprovante, decisão protegida e exportação. Duas jornadas Chromium aprovadas
com revisão em 1280/390/320px, claro/escuro, Axe, foco, rascunho e privacidade. 62 integrações
aprovadas neste incremento; build com 56 páginas.

Consumidor externo e integração de entrega de e-mail continuam em T089, sem presumir envio ou
ativação. Evidência atual, capturas e manifesto em
[interface de faltas](evidence/absence-ui-2026-09-28.md).

Evidências, comandos, hashes e limites em
[validação de faltas](evidence/absence-policy-2026-09-28.md).

## Entrega administrativa local concluída-CODEX-mafaltti

Solicitante mafaltti (Danilo-Komunick), GitHub autenticado nesta sessão em 28/09. O usuário adiou
app/site e autorizou painel/banco, testes locais e Docker; confirmou as mesmas regras de aprovação,
prazo e duas trocas, com recuperação isenta por indisponibilidade do estabelecimento.

T078–T086 concluídas localmente, preservando T025–T038/AC03/LC01. Migrações 0031 e 0032 testadas em
bancos descartáveis; 0032 substitui ambas as exclusões para scheduled/pending_approval e adiciona
capacidade, processo, equipe, publicação e intenção transacional. Nenhuma identidade externa criada.
Jornada administrativa funciona no painel existente; interface provisória dispensada.

Validação: 98 unitários, 169 contratos, 72 integrações (37 anteriores, 15 do fluxo e 20
exportações), seis jornadas Chromium, build/tipos/lint e revisão visual aprovados. Comandos, falhas
corrigidas, capturas e limites em [evidência administrativa](evidence/admin-workflow-2026-09-28.md).
Constituição vigente: 2.1.0.

Branch codex/scheduling-market-research-20260923, worktree .cache/pr-scheduling-research-20260923,
HEAD 500f84f com alterações não commitadas. Principal dev=origin/dev 89d2356 por fetch final.
Entrega mantida local, sem commit/push/PR/merge/deploy. Não está integrada em origin/dev.

## Pendências fora da entrega administrativa

- T039: CI depende de publicação autorizada. Nenhuma nova execução remota alegada.
- App/site adiados: T041/UI01/UI02 e tarefas de canal conservam seus gates. Checklist channels
  continua aberta; testes administrativos não comprovam autorização familiar ou identidade externa.
- WAHA/e-mail: somente intenções persistidas e estado real no histórico. Instalação, pareamento,
  dispatcher, preferências e entrega real ainda não implementados/homologados nesta entrega.
- Registros antigos: contador de trocas permanece NULL. Nova troca voluntária exige conciliação; não
  deduzir valor do histórico de edições. Nenhuma importação/banco de uso foi alterado.

Para retomar, consultar [tasks.md](tasks.md) e [contrato administrativo](contracts/admin.md), sem
reexecutar migrations antigas nem reutilizar a proposta 0032_scheduling_channels.sql. O histórico
abaixo não constitui instrução de execução nem autorização atual.

## Histórico — sem instruções de execução

<details>
<summary>Registros anteriores: estados, permissões e próximos passos abaixo foram superados</summary>

## Clarify transversal — 20/09/2026

Q2 respondida (A): manter e sinalizar reservas futuras do associado bloqueado e dependentes afetados
para decisão manual. FR-017/SC-007, BLQ01/BLQ02 e coordenação AE04 da spec 005 documentados; sem
código ou testes. Reservas mantêm ocupação e situação; criação/remarcação continuam impedidas.
Checklist 008 segue 13/14. Checklist 005 reavaliado: 16/16 → 13/16 por detalhes técnicos
preexistentes (locks, permissões técnicas e configuração); marcadores alterados, texto preservado.
Próximo assunto: autorização da exportação transversal; resposta ainda pendente.

Q1 respondida: impedir sobreposição por pessoa atendida entre quaisquer unidades e profissionais,
diferenciando associado e cada dependente pelo cadastro individual.
Specs/plan/modelo/contrato/tarefas atualizados; FR-016/SC-006 e BEN01–BEN03 documentam regra e
validação futura. Nenhum código, migration ou teste executado nesta sessão. CAL06 e as tarefas novas
permanecem pendentes; implementação não retomada. Checklist reavaliado: 14/14 → 13/14; item sem
frameworks desmarcado porque a spec já contém FullCalendar no incremento anterior. Nenhuma regressão
de código alegada. Próximo passo: continuar perguntas do clarify e registrar decisões
incrementalmente.

### Resultado final da retomada de CI — 20/09/2026

Runs 35392211021 (pull_request) e 35392206888 (push), tentativa 2, concluídos com success no HEAD
fb218fb429bab6c220ed1e3f0096760829cb41bf. Todos os seis checks quality/browser/security concluídos
com sucesso; os quatro anteriormente cancelados foram reexecutados. E2E e acessibilidade concluídos
em ambas as execuções. Nenhuma mudança de implementação ou novo commit/push necessário. CAL06 e
revisão visual de produto não foram concluídas por este pedido restrito ao CI. Principal dev 8f12db4
limpa e sincronizada por fetch/ff-only na conferência final. PR continua aberto, sem aprovação/merge
pelo agente; localhost desligado. Próximo passo de produto permanece sujeito à retomada do escopo de
Agendamentos.

## Retomada limitada aos checks do PR #34 — 20/09/2026

Usuário solicitou reiniciar os quatro checks cancelados e acompanhar todos até terminarem. Retomada
autorizada apenas para esta validação; demais pendências de produto permanecem com o escopo
anterior. HEAD remoto confirmado: fb218fb429bab6c220ed1e3f0096760829cb41bf. Runs PR 35392211021 e
push 35392206888 reiniciados pelo navegador na tentativa 2; quality/browser em andamento. Nenhum
resultado final presumido. CAL06 não marcada. CLI com token inválido para mutação (401); conector
sem Actions write (403). Sessão autenticada do navegador permitiu o reinício. Principal dev limpa e
sincronizada com origin/dev por fetch/ff-only. Localhost permanece desligado. Próximo passo:
acompanhar as duas execuções e registrar conclusões finais. Sem alteração de código, commit, push,
aprovação ou merge nesta retomada.

# Retomada de Agendamentos — 18/09/2026

## PAUSA solicitada pelo usuário

Usuário ordenou parar. Trabalho interrompido após push de `fb218fb` (somente ajuste de sincronização
do E2E, documentação e capturas). Aplicação em `8819bce` passou no CI do PR 35388527805 e foi
revisada visualmente. Push 35388521920 falhou na captura; correção do teste ainda aguarda validação.
CAL06 não concluída. Não iniciar novos checks nem continuar implementação sem retomada do usuário.
CIs ativos de fb218fb serão cancelados por esta ordem. PR34 continua rascunho, sem aprovação/merge.

## Pedido e decisão vigentes

Usuário autorizou continuar o módulo e escolheu explicitamente evoluir o painel administrativo,
incluindo calendário com FullCalendar. Essa prioridade substitui app/site como próximo incremento;
app/site permanece pendente. Manter documentação atualizada durante o trabalho para suportar pausas
forçadas.

## Local de trabalho

- Caminho da worktree registrado no mapa local `.cache/WORKSPACE.md` da principal.
- Branch: `feature/reports-analytics-20260918`, HEAD inicial `df36ec7`.
- PR #34 aberto em rascunho: reutilizar a entrega ativa conforme AGENTS; preservar Relatórios.
  Atualizar título/descrição ao concluir o escopo agregado.
- Principal `dev` limpa em `8f12db4`, fetch e fast-forward conferidos nesta retomada.
- Localhost/banco pausados. Sem merge, aprovação, deploy ou alteração de estado do PR.
- Não disparar verificações/Actions intermediários: consolidar código, testes e documentação, depois
  validar e enviar o conjunto.

## Escopo do incremento

Calendário administrativo em mês, semana e dia; lista diária existente preservada. Filtros por
beneficiário/unidade/profissional/situação e data/visualização na URL. Reservas abrem os detalhes e
ações existentes. Nova reserva permanece explícita. America/Bahia independentemente do fuso do
navegador. Consulta de intervalo limitada, sem apresentar uma página parcial como agenda completa;
erro/sobrecarga explícitos. Sem arrastar/redimensionar para remarcar, novos estados ou regras
comerciais. FullCalendar Standard 7.1.0, API React atual, sem plugins Premium.

## Estado e próximo passo

- Diagnóstico/spec antiga lidos; checklist histórico: 14/14 itens marcados, referente à etapa 1. Não
  constitui validação do calendário novo.
- Pré-requisitos da spec 008 resolvidos na worktree; hooks ausentes.
- Pesquisa/spec/plano/contratos atualizados. Dependências instaladas via cache pnpm existente com
  `--store-dir C:/Users/Gabriel/AppData/Local/pnpm/store`.
- GET calendar, FullCalendar, navegação/filtros e testes implementados. Sem migration.
- Validação local: 485 testes de unidade/contrato aprovados em 74 arquivos; typecheck da web
  aprovado após ajuste para API v7. Formatação geral aprovada.
- Lint final aprovado. Commit de implementação `2af7348` enviado ao PR34; título e descrição
  atualizados para Relatórios e calendário. PR continua rascunho.
- CI push 35387126094 e PR 35387129716 totalmente aprovados: 363 unitários, 122 contratos, 219
  integrações, 82 E2E, 2 focados Relatórios, 6 acessibilidade.
- Capturas revisadas: temas/tamanho/grade coerentes; em colunas estreitas a situação podia ficar
  cortada no fim do cartão. Ajuste final coloca situação no início, identifica mês/intervalo semanal
  no título e captura evento após rolar no celular.
- Próximo passo: enviar ajuste visual consolidado, confirmar CI final e revisar novas capturas.
  CAL06 ainda pendente até essa revisão. Localhost permanece desligado.
- Ajuste enviado em `8819bce`, CIs finais push 35388521920 e PR 35388527805 em execução.
- Resultado: PR aprovado por completo e capturas revisadas; push falhou no scroll de captura por
  substituição do nó durante dimensionamento. Correção só no teste: re-resolver nó e verificar
  viewport com espera condicionada de até 10s. Próximo passo: enviar correção com evidências e
  acompanhar os checks da revisão corrigida.
- Integração/build/E2E da primeira revisão passaram; evidências em evidence/calendar-2026-09-18.md.
- Primeira validação: formatação e lint dos arquivos alterados aprovados; 19 testes unitários de
  Agendamentos aprovados. Typecheck global com heap 384 MB esgotou memória em packages/news; web
  isolado com 1.024 MB identificou slotLabelFormat renomeado para slotHeaderFormat na v7. Corrigido
  e typecheck da web aprovado antes do push final.

Atualizar este arquivo ao mudar de fase, registrar falhas e o comando exato de retomada; atualizar
também tasks.md e evidências, sem marcar testes não executados.

## Continuidade documental — 21/09/2026

PR34 integrado em dev ed31baf. Decisões Q1/Q2 não integradas foram preservadas e transferidas após
comparação de bases idênticas; nenhuma implementação retomada. Q3 definida: permissão geral de
exportação combinada com acesso ao módulo/dados. Complemento: módulos sem acesso somem da barra
lateral, busca e Início. Regras transversais em specs 001/002; não criar permissão nova de acesso a
Agendamentos. BEN01–BEN03, BLQ01/BLQ02, CAL06 continuam com os estados anteriores. Próximo passo:
continuar clarify. Q4 resolveu a transição: converter automaticamente quem já tem permissão antiga
de exportação na geral, sem alterar acesso aos módulos; conversão ainda não executada. Próximo ponto
transversal: finalidade de Mensagens.

## Q8 — acesso por módulo — 21/09/2026

Usuário escolheu A: Notícias e Agendamentos exigem acesso concedido por usuário. Exceção de acesso a
qualquer conta administrativa substituída; ocultar sem concessão na barra lateral, busca e Início e
negar URL/API. Specs 001/002/004/008, planos, contratos e tarefas atualizados; AC01–AC03 pendentes.
Nenhuma implementação/teste. Próxima pergunta: granularidade de permissões internas desses dois
módulos.

## Q9 — preservar consulta e alteração separadas — 21/09/2026

Usuário confirmou B e destacou que o padrão já existe. Notícias de fato possui
news:read/write/publish no código e guardas; diagnóstico anterior baseado em docs estava
desatualizado, corrigido nas specs 004/001/002. Não unificar permissões. Agendamentos ainda verifica
sessão sem concessão e é incluído incondicionalmente no catálogo; registrar/adequar lacuna ao padrão
consulta/alteração (AC01–AC03). Leitura estática apenas; nenhum teste, código ou concessão alterado
nesta etapa.

## Checkpoint vigente — revisão de código de 21/09/2026

PR34 integrado na base ed31baf; referências anteriores a PR aberto/branch ativa são histórico.
CAL01–CAL05 têm implementação; CAL06 permanece revisão final de produto/evidências. Não alterar PR34
nem trabalhar novamente em sua branch. BEN01–BEN03, BLQ01/BLQ02, AC01–AC03, DX01 e expansões
continuam pendentes. Revisão estática executada; nenhum teste de aplicação ou serviço iniciado.
Detalhes: [revisão transversal](../002-integrated-modules/code-audit-2026-09-21.md).

</details>
