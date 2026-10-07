# Registro do processo de organização Jira/Confluence

Escrito por CODEX em 01/10/2026. Solicitante da sessão: mafaltti, login Danilo-Komunick, verificado
pela conexão GitHub em 30/09/2026. A identidade não atribui autoria retroativa aos tickets. Fonte
normativa: [spec 011](../../specs/011-jira-confluence-organization/spec.md).

## Pedido e evolução

O usuário pediu análise dos tickets abertos e fechados: redundâncias, granularidade, tipo, vínculos
e responsáveis comprovados por PRs e histórico. Determinou preservar registros e ver prévia antes da
reorganização.

A discussão passou a tratar entregas sem impor épicos/histórias/spikes. N1–N5 viraram checklist da
opção de download; motor compartilhado e autorização legada continuaram independentes. A proposta
inicial sem divisão do CAAB-24 foi substituída por duas subtarefas de acompanhamento independente.
Agora são até cinco registros novos: três tarefas de Agendamentos e duas subtarefas.

Code Review representa revisão/testes por IA; QA requer humano identificado. Executor permanece
Assignee. Merge histórico sem prova de QA mantém status e recebe registro da lacuna. Para 26–28,
buscar autor do PR correspondente, sem herdar responsável do épico.

CAASSH e Portal de Parceiros são funcionalidades previstas, juntos em página própria aguardando
revisão. RH é sugestão separada. Caixa de entrada é uma das próximas funcionalidades, com definição
ainda necessária, não sugestão descartável.

Confluence atende toda a equipe. Banco de Consulta da I.A. permanece; regras e stack precisam de
conciliação. Sugestão aprovada move a mesma página para previstas. Histórico visível dispensa cópia
no corpo. O relatório externo TMS/LH foi exemplo de escrita, não requisito funcional do CAAB nem
prova de identidade do solicitante desta reorganização.

## Ações efetivamente realizadas

- Leitura dos 37 tickets, consulta a 41 PRs e históricos e elaboração de propostas nesta sessão.
- Em 30/09/2026, criação autorizada e conferida da página
  [Organização do Jira e Confluence — proposta e modelos](https://komunick.atlassian.net/wiki/spaces/CAABNOVO/pages/7143436).
  Ela antecede as últimas decisões de Clarify e ainda precisa ser conciliada.
- Discussão de Specify e Clarify. O modo anterior impedia escrita; os artefatos foram materializados
  somente nesta execução autorizada de 01/10/2026.
- Em 01/10/2026, fetch e fast-forward da principal até 748539d, preservando arquivos locais, e
  criação da worktree .cache/pr-jira-confluence-20261001, branch
  docs/jira-confluence-organization-20261001.
- Gravação da spec, prévia, checklist e registro separado; execução de setup-plan, pesquisa delegada
  somente leitura e elaboração do plano, modelo de informação, contratos e guia de validação.

## Evidências e limites

[PR40](https://github.com/Komunick/caabnovo/pull/40) entrou em dev e possui
[evidência do recorte detalhado](../../specs/010-reports-analytics/evidence/caab-24-2026-09-30.md).
Não conclui resumo/evolução/agrupamento nem comprova isoladamente QA humano.
[PR36](https://github.com/Komunick/caabnovo/pull/36) sustenta autoria da base de Agendamentos por
Gabriel-Komunick; trabalho local adicional sem PR não atribui automaticamente 26/27.
[PR13](https://github.com/Komunick/caabnovo/pull/13) fundamenta a retirada da referência obsoleta a
MFA.

Nenhum ticket Jira foi alterado ou apagado. A única publicação anterior foi a página de proposta.
Nenhuma reorganização remota, atualização de regras/stack, implementação de função, início de
serviço, commit, push, abertura ou merge de PR foi executado nesta etapa. Validações locais estão na
[evidência](../../specs/011-jira-confluence-organization/evidence/planning-validation.md).

## Próximos passos

Verificar consistência com speckit-analyze e preparar manifesto atualizado com antes/depois,
responsáveis comprovados e textos finais. Revisar a prévia concreta antes de aplicar. Pendências
ficam nos itens responsáveis; este plano não retoma Agendamentos pausados.

## Geração de tarefas — CODEX — 01/10/2026

Executado setup-tasks e gerado tasks.md na spec 011: 30 tarefas pendentes, organizadas pelas quatro
histórias, com dependências, caminhos, critérios de verificação e revisão da prévia antes da escrita
remota. Nenhuma dessas tarefas foi executada por sua geração. O próximo comando sugerido é
speckit-analyze. Jira e Confluence permanecem sem alterações nesta etapa.

## Analyze e início de implement — CODEX — 01/10/2026

O usuário autorizou seguir até implement. Analyze apresentado na conversa: 12 requisitos e seis
critérios cobertos, 30 tarefas, sem achados materiais ou conflitos constitucionais. A fase de
análise foi somente leitura. Implement iniciou após checklist 11/11 e pré-requisitos válidos.

Inventários atualizados: 37 tickets com históricos/comentários, sete páginas e 41 PRs. Descoberto
checkpoint local de Agendamentos com correções T103–T105 em 30/09, posterior ao resumo do caderno;
consultado como evidência sem alterar/retomar essa frente. A consulta Git da outra worktree precisou
de safe.directory limitado ao comando, sem alteração global. Novas evidências não atribuem
retroativamente solicitante ou executor.

Preparadas 127 operações em manifesto: antes/depois e corpos finais dos tickets, cinco novos
registros, responsáveis, status, árvore e textos de 13 páginas (sete existentes/seis novas). Regras
remotas têm duplicação e instruções antigas; stack ainda descrevia FullCalendar como não instalado.
A prévia corrige essas divergências e preserva páginas/histórico.

17 de 30 tarefas concluídas. T019 aguarda revisão do
[manifesto](../../specs/011-jira-confluence-organization/evidence/change-manifest.md). Validação
local conferiu cobertura, dependências sem ciclo, preservação de labels/status concluídos e
simulações de concorrência/retry. JQL executada somente em leitura; filtro não salvo.
Jira/Confluence não receberam alterações. Limites: conversão nativa, atribuição permitida e
verificação de rascunho/concorrência devem ser confirmados na aplicação; resposta HTML não retornou
snapshotToken solicitado.

Próximo passo: revisão concreta da prévia, depois aplicação somente do lote autorizado com
releitura/verificação por operação. Não declarar implement concluído enquanto faltarem essas
tarefas.

## Aplicação autorizada — CODEX — mafaltti — 01/10/2026

Após a prévia, o usuário determinou “Aplique as mudanças”. Aplicadas e verificadas123/127 operações:
37 tickets existentes atualizados, cinco novos40–44, seis páginas novas e seis existentes
atualizadas. Zero exclusões. Nove atribuições ao responsável técnico da base de Agendamentos; o
responsável original do24 foi preservado e atribuído ao recorte43. 37 tornou-se épico;19/23/29/30
histórias;43/44 são subtarefas de24. CAAB-24 passou para Desenvolvimento, 43 ficou em QA e44 em
Backlog. Histórico e status dos demais existentes foram preservados.

CAASSH e Portal estão juntos em Funcionalidades previstas (7700572), RH separado em Sugestões
(7700596). Regras2621487 e Stack2588776 reconciliados, Stack movida para Referência técnica2588761.
Página de modelos7143436 atualizada e inicial1867914 reorganizada. Seis novas páginas, sem duplicar
fontes normativas. Rascunhos lidos por CQL; atualização HTML usada nas páginas com macros após
recusa de substituição Markdown por perda de representação. Macro de filhos da inicial preservada.

Três pendências concretas: conversão de20 para subtarefa de19 recusada pelo Jira (400), índice do
Banco3244094 com edição ativa, e salvamento do filtro não exposto pelo conector. Usuário informou
“não sou eu” sobre a edição ativa; preservamos a página. Não há navegador conectado para operações
nativas. A consulta ativa funciona por link, validada com36 resultados; quadro compartilhado
intacto.

24/30 tarefas concluídas; implement parcial. Não é uma nova entrega de software, ativação de
integração, retomada de Agendamentos ou homologação humana. Sem commits/push/PR.
[Resultado detalhado e pendências](../../specs/011-jira-confluence-organization/evidence/application-summary.md)
e
[manifesto conciliado](../../specs/011-jira-confluence-organization/evidence/application-results.json).

Próximo passo: executar somente as três pendências quando cessar a edição ativa e houver ferramenta
compatível, sem repetir criação nem reconfirmar a aprovação já dada.

# Complemento de coerência — 02/10/2026-CODEX-SOLICITANTE_NAO_VERIFICADO

Aplicação autorizada dos achados da auditoria: 19 descrições, quatro transições, duas páginas do
Confluence e inventário local. Homologação não presumida; conversão nativa e filtro salvo seguem
limitados pela ausência de navegador.
[Evidência do complemento](../../specs/011-jira-confluence-organization/evidence/coherence-2026-10-02.md).
