# Revisão do PRD por specs e tickets — 07/10/2026

## Pedido, método e limites

Revisão-CODEX-mafaltti. Pedido: analisar o estado atual do projeto, conferir todas as specs e
tickets e atualizar o [PRD](../PRD.md). A identificação da sessão foi confirmada pelo conector
GitHub e registrada no caderno principal; a CLI retornou 401. Essa autoria não reatribui decisões ou
homologações históricas.

Revisão documental com leitura de specs, planos, tarefas, contratos e evidências pertinentes;
inspeção estática de código nas divergências; Git local/remoto e consultas autenticadas Jira/GitHub.
Três subagentes revisaram 001–003, 004–007 e 008–010, com revisão posterior dos respectivos trechos
do PRD. A coordenação conferiu 011, plano/tarefas 012, fontes externas e a composição final.

A revisão não executou aplicação, banco, migrations, benchmark, testes de produto, inspeção de
ambiente implantado ou QA humano. Não atualizou tickets/PRs/Confluence, não abriu PR e não fez
merge. Publicação não é requisito de conclusão deste pedido documental.

## Base e cobertura

- Base: dev/origin/dev `1c21c9a711aa12f446918ac790bc6ede76490251`, conferida após fetch e
  fast-forward sem delta. Alterações preexistentes em AGENTS.md e CLAUDE.md na principal
  preservadas.
- Entrega: branch `docs/prd-current-20261007`, worktree `.cache/pr-prd-current-20261007`.
- Inventário de todas as worktrees registradas encontrou 12 diretórios distintos de especificação:
  001–010 integrados, 011 em entrega aberta e 012 em planejamento local.
- Jira: consulta `project = CAAB ORDER BY key ASC`, sem filtro de status, maxResults 100, resposta
  final `isLast=true`: **53 tickets**, com descrição, tipo, status nativo, pai, vínculos e data de
  atualização. Leitura inicial tinha 47; a frente de Chat interno criou seis subtarefas durante a
  revisão, lidas e incorporadas antes do fechamento. Retrato final consultado em 07/10/2026, antes
  de 18:19 UTC (15:19 America/Sao_Paulo).
- Distribuição nativa: 21 Backlog, 12 Concluído, 5 Em Desenvolvimento, 12 Em Teste / QA e 3 Code
  Review. Não é percentual de conclusão: há registros históricos, escopos parciais e aceites sem
  homologação humana.
- Consulta remota do PR #46 confirmou merged=true, merge em 07/10/2026 às 17:07:47 UTC, merge commit
  `1c21c9a`, ponta entregue `5f268480d82ddc55d59ca3800e0fef3db2a29828`. PRs #48 e #50 foram
  consultados abertos. Estado datado, não monitoramento contínuo.

## Fontes por especificação

As fontes abaixo são as responsáveis pelas regras detalhadas; o PRD não cria contratos paralelos.

| Fonte                                                                  | Artefatos conferidos e conclusão                                                                                                                                                                                                                                                                                                      |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [001 — Fundação](../../specs/001-project-foundation/spec.md)           | Spec/plano/tarefas, contratos de autenticação/cargos/contato, evidências de acessos e cargo base. Cargo único/base integrados; matriz/QA e ativação no destino separados.                                                                                                                                                             |
| [002 — Programa integrado](../../specs/002-integrated-modules/spec.md) | Spec/plano/tarefas, auditoria, contratos de exportação e histórico individual. Programa não comprova construção de todos os candidatos; HIN continua documental.                                                                                                                                                                      |
| [003 — Auditoria](../../specs/003-audit-operations/spec.md)            | Spec/plano/tarefas/contratos e código de exportação/arquivos legados. Eventos/jobs reunidos; exportação direta própria ainda pendente; guardas antigas apontadas como ausentes já existem.                                                                                                                                            |
| [004 — Notícias](../../specs/004-news-publishing/spec.md)              | Spec/plano/tarefas/contrato/evidências e worker. Permissões próprias, API pública por consulta; exportação e revalidação editorial no worker pendentes; vídeo sem provedor habilitado.                                                                                                                                                |
| [005 — Associados](../../specs/005-members-management/spec.md)         | Spec/plano/tarefas/contratos/decisões/evidências. Adaptador OAB existe; homologação positiva, POL01/POL02, exportação e carteirinha são recortes separados.                                                                                                                                                                           |
| [006 — Conta](../../specs/006-account-settings/spec.md)                | Spec/plano/tarefas/contratos/evidências. Perfil/senha/sessões/tema existentes; transporte real não comprovado; Cores Legado ainda futuro.                                                                                                                                                                                             |
| [007 — Parceiros](../../specs/007-partners-management/spec.md)         | Spec/plano/tarefas/contratos/evidências. Cadastros/benefícios/avaliações existentes, exportação própria pendente; portal externo não implementado.                                                                                                                                                                                    |
| [008 — Agendamentos](../../specs/008-scheduling-management/spec.md)    | Spec/plano/tarefas/admin/channels/exports/evidências e deltas de branches. PR #43 integrado; uploads #48 e visuais #50 separados; app/site/e-mail/QA continuam próprios.                                                                                                                                                              |
| [009 — Mensagens](../../specs/009-messaging/spec.md)                   | Spec/plano/tarefas/contratos e revisão de finalidade. Protótipo persistido de campanhas, consulta/escrita separadas, sem envio real ou exportador próprio.                                                                                                                                                                            |
| [010 — Relatórios](../../specs/010-reports-analytics/spec.md)          | Spec/plano/tarefas/contratos/validações e PR #46 final. Todos os modos diretos integrados; C1/T038 e aceite humano permanecem.                                                                                                                                                                                                        |
| 011 — Organização Jira/Confluence                                      | Spec/plano/tarefas/contratos/registro de aplicação em `.cache/pr-orphans-20261006/specs/011-jira-confluence-organization`, HEAD `e5c94c796299b8998ad3bc3bf35a0022d9f88aa6`, PR #48 aberto. Não integra esta branch de PRD.                                                                                                            |
| 012 — Chat interno                                                     | Plano, tarefas e evidência em `.cache/pr-internal-chat-plan-20261007/specs/012-internal-chat`, branch `docs/internal-chat-plan-20261007`, base `1c21c9a`, arquivos locais sem commit. Ticket principal conserva plano integral; seis subtarefas organizam trabalho futuro. Ainda faltam spec/contratos próprios; código não iniciado. |

As specs em outras entregas foram consultadas, sem copiá-las para a principal ou para esta branch.
Os requisitos CHAT-001–CHAT-015 foram conciliados a partir do PRD 0.5 dessa frente e do plano no
ticket; autoria e organização permanecem nas fontes de origem. Mudanças de conteúdo feitas pela
frente de Chat interno durante esta revisão foram relidas; a decomposição não altera a entrega
única.

## Resultado incorporado ao PRD

- Versão 0.6 com situação datada por domínio, sem tratar código integrado como homologado.
- Preservação dos identificadores anteriores e dos 15 requisitos CHAT da frente própria.
- Cargo único/base, ciclo de vida de Colaboradores e Associados, e limites de delegação.
- Permissões editoriais próprias; disponibilidade pública por canal distinta de recebimento.
- Integração OAB existente, matriz documental parcialmente aplicada e reanálise ainda a definir.
- Estados reais de Agendamentos, duas trocas por reserva, recuperação isenta, prazos desde registro
  da falta, comprovante obrigatório, privacidade e dependências de e-mail.
- Relatórios completos integrados, métricas sem inferências indevidas e C1/QA ainda abertos.
- Exportação direta por módulo, exceções de Consulta OAB e Chat interno, histórico individual
  futuro.
- Mensagens/campanhas, Chat interno, caixa de entrada e suporte externo separados.
- Portal previsto, CAASSH suspenso e RH como sugestão, fora do aceite atual do núcleo.

## Divergências e pendências preservadas

1. O PRD anterior tratava Agendamentos administrativo como incremento local e a autorização como
   acesso por sessão. PR #43, contratos e código integrado superaram esse estado.
2. Gerenciar cargos e acessos de Administrador, Gestor e Colaborador (CAAB-19) está nativamente em
   Em Teste / QA; trecho da descrição de 07/10 ainda diz Em Desenvolvimento. PR #45 integrou cargo
   base e provas G02/G03; checkboxes antigos de AC-T003/004 não negam essa evidência.
3. Exportar detalhe agrupado, resumo e evolução sem os limites antigos (CAAB-44) permanece Code
   Review no Jira, com descrição anterior ao merge. Git/API comprovam PR #46 integrado. A descrição
   final do PR fecha T049 tecnicamente; T038/C1 e QA não foram encerrados por inferência.
4. Entregar os avisos operacionais de Agendamentos por e-mail (CAAB-42) ainda tem vínculos Blocks
   para Operar aprovação, remarcação e recuperação de atendimentos (CAAB-40) e Tratar faltas,
   justificativas e contestações (CAAB-41). As decisões vigentes explicitam que e-mail não bloqueia
   as regras administrativas. A remoção nativa desses vínculos pertence à frente 011.
5. A relação entre Operar aprovação, remarcação e recuperação de atendimentos (CAAB-40) e Exportar
   detalhe agrupado, resumo e evolução sem os limites antigos (CAAB-44) preserva dependência técnica
   já satisfeita pela integração/composição; não é bloqueio atual por ausência de schema.
6. Mostrar apenas funções autorizadas na navegação (CAAB-20) ainda é Tarefa sem pai nativo; a
   conversão para subtarefa de Gerenciar cargos e acessos de Administrador, Gestor e Colaborador
   (CAAB-19) permanece operação própria. Sua correção G01 está no PR #48.
7. Disponibilizar chat interno e comentários operacionais com notificações configuráveis (CAAB-49)
   mudou de Backlog para Em Desenvolvimento pela frente responsável durante a revisão; a consulta
   final confirmou o estado e as seis subtarefas em Backlog. Não há implementação ou QA.
8. Auditoria tem exportação legada e reautorização atuais. Checkpoints que diziam faltar as guardas
   do worker/download foram superados; a migração para Excel/CSV/PDF diretos continua pendente.
9. Notícias ainda tem lacuna de revalidação de permissões editoriais no worker; a guarda no Início
   já existe. Não repetir a antiga lacuna do Início como defeito atual.
10. Alguns contratos/checkpoints conservam regras antigas de motivo obrigatório, publicação por
    sessão ou permissões únicas. Prevaleceram as decisões mais recentes verificadas nas specs e
    código; os artefatos históricos foram preservados nesta revisão de PRD.
11. Os 12 tickets Concluído mantêm suas conclusões históricas. Não foi reconstruído aceite humano
    com pessoa/versão/resultado ausente, nem foi produzido percentual global de progresso.

## Inventário completo dos tickets

Campos nativos são o retrato consultado; a coluna de análise explica a relação com as fontes.
Títulos/códigos preservados, sem links de tickets. Nenhum item foi alterado por esta revisão.

| Ticket                                                                                          | Status nativo      | Análise e fonte responsável                                                                                                                                    |
| ----------------------------------------------------------------------------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Serviço de e-mail transacional e definição da caixa de entrada (CAAB-2)                         | Backlog            | 006; transporte de recuperação/convite e caixa de entrada com definição própria. Bloqueia e-mail de Agendamentos e chat, sem bloquear os demais canais/regras. |
| Ajustar informações recebidas pela consulta a OAB (CAAB-3)                                      | Concluído          | 005; consulta OAB implementada. Conclusão histórica não substitui homologação institucional positiva.                                                          |
| Implementação (CAAB-4)                                                                          | Em Desenvolvimento | 002; registro genérico histórico, não execução ativa de funcionalidade.                                                                                        |
| UI e UX (CAAB-5)                                                                                | Em Desenvolvimento | 002; registro genérico histórico de interface, não prova de execução atual.                                                                                    |
| Adição de fotos de perfil para associados (CAAB-7)                                              | Concluído          | 005; foto privada do associado implementada; sem homologação retroativa inferida.                                                                              |
| Implementação do modulo: Parceiros (CAAB-8)                                                     | Concluído          | 007; módulo administrativo de Parceiros implementado; portal externo permanece previsto.                                                                       |
| Brainstorme com chatgpt (CAAB-9)                                                                | Concluído          | PRD/002; brainstorming histórico, sem comprovação de código ou QA.                                                                                             |
| Geração do plano e PRD (CAAB-10)                                                                | Concluído          | PRD/002; plano e PRD existentes, sem implicar entrega funcional.                                                                                               |
| Spec kit (CAAB-11)                                                                              | Concluído          | TOOLING; estrutura Spec Kit existente, sem presumir execução de cada workflow.                                                                                 |
| Analise do codex sobre os modulos (CAAB-12)                                                     | Concluído          | 002; auditoria documental histórica, sem reconstruir autoria/QA ausentes.                                                                                      |
| Implementação do modulo: Noticias (CAAB-13)                                                     | Concluído          | 004; Notícias implementadas; exportação própria e revalidação do worker ainda pendentes.                                                                       |
| Implementação da aba: configurações (CAAB-14)                                                   | Concluído          | 006; Conta/Configurações implementadas; transporte real de e-mail continua aberto.                                                                             |
| Implementação do modulo: Associados (CAAB-15)                                                   | Concluído          | 005; Associados implementados; matriz documental, reanálise, exportação e decisões próprias permanecem.                                                        |
| Substituição do modulo usuários por Colaboradores (CAAB-16)                                     | Concluído          | 001/002; Usuários e Colaboradores são o mesmo cadastro/RBAC, sem RH duplicado.                                                                                 |
| Implementação inicial da aba: Agendamentos (CAAB-17)                                            | Concluído          | 008; primeira versão histórica; não encerra os incrementos administrativos.                                                                                    |
| Restringir criação de contas ao fluxo administrativo (CAAB-18)                                  | Em Teste / QA      | 001; cadastro público bloqueado, fluxo administrativo integrado; aceite humano pendente.                                                                       |
| Gerenciar cargos e acessos de Administrador, Gestor e Colaborador (CAAB-19)                     | Em Teste / QA      | 001; cargos/cargo único/base e provas G02/G03 integrados. Descrição ainda diz Em Desenvolvimento, divergindo do status nativo; AC-T006/QA permanecem.          |
| Mostrar apenas funções autorizadas na navegação (CAAB-20)                                       | Code Review        | 001/009; navegação base integrada; G01 de Mensagens ainda no PR #48, com conversão nativa para subtarefa pendente.                                             |
| Validação de e-mail incorporada ao CAAB-2 (CAAB-21)                                             | Backlog            | 006; aceite incorporado a Serviço de e-mail transacional e definição da caixa de entrada (CAAB-2), sem frente duplicada.                                       |
| Disponibilizar motor compartilhado de download direto (CAAB-22)                                 | Em Teste / QA      | 001/002; motor e Colaboradores integrados; status não comprova todos os consumidores ou QA humano.                                                             |
| Baixar dados dos módulos em Excel, CSV e PDF (CAAB-23)                                          | Backlog            | 002 e contratos por módulo; Colaboradores/Agendamentos/Relatórios diretos existentes; demais adaptadores e aceites pendentes.                                  |
| Exportar o conjunto completo de dados em Relatórios (CAAB-24)                                   | Em Desenvolvimento | 010; todos os modos integrados; C1/T038 e homologação humana mantêm o aceite aberto.                                                                           |
| Revalidar acesso ao baixar arquivos antigos (CAAB-25)                                           | Backlog            | 001/010; guardas de autorização legada já existem; backlog não significa ausência total nem aceite global.                                                     |
| Impedir sobreposição de agendamentos da mesma pessoa (CAAB-26)                                  | Em Teste / QA      | 008; sobreposição individual global integrada; homologação humana pendente.                                                                                    |
| Sinalizar reservas de pessoa bloqueada sem cancelá-las (CAAB-27)                                | Em Teste / QA      | 008; sinalização e preservação de reservas integrada; não cancelar por bloqueio cadastral automaticamente.                                                     |
| Separar consulta e alteração em Agendamentos (CAAB-28)                                          | Em Teste / QA      | 008; consulta/escrita/revisão dedicadas integradas; endurecimento adicional de uploads no PR #48.                                                              |
| Disponibilizar o tema Cores Legado (CAAB-29)                                                    | Backlog            | 006/002; tema alternativo planejado, preserva padrão CAAB e dois temas; não implementado.                                                                      |
| Permitir agendamento pelo app e site (CAAB-30)                                                  | Backlog            | 008; autoatendimento externo adiado, com identidade, jornadas, contratos e critérios próprios.                                                                 |
| Homologar a consulta oficial à OAB-BA (CAAB-31)                                                 | Backlog            | 005; retorno positivo do adaptador institucional precisa de homologação no destino.                                                                            |
| Definir a carteirinha digital do aplicativo (CAAB-32)                                           | Backlog            | 005; situação/validade de credencial não é emissão de carteirinha ou QR; definição própria pendente.                                                           |
| Definir canais institucionais de comunicação (CAAB-33)                                          | Backlog            | 009; finalidade de campanhas confirmada; aderência M016/T003, canais e envio real pendentes.                                                                   |
| Portal de Parceiros — funcionalidade prevista (CAAB-34)                                         | Backlog            | 002; portal externo previsto em revisão; não se confunde com cadastro/API pública de Parceiros.                                                                |
| CAASSH — funcionalidade prevista (CAAB-35)                                                      | Backlog            | 002; CAASSH suspenso, sem autorização de construção ou regra financeira presumida.                                                                             |
| RH — sugestão em avaliação (CAAB-36)                                                            | Backlog            | 002; RH é sugestão, sem escopo aprovado.                                                                                                                       |
| Agendamentos (CAAB-37)                                                                          | Em Desenvolvimento | 008; épico parcial: base administrativa integrada, correções em PRs e canais futuros separados.                                                                |
| Conciliar a documentação do projeto (CAAB-38)                                                   | Em Teste / QA      | 001/002/011; PR #42 integrado; revisão humana/T099 do programa e delta documental do PR #48 são distintos.                                                     |
| Consolidar o guia de design do projeto (CAAB-39)                                                | Em Teste / QA      | 001/guia; guia canônico integrado; não comprova homologação de todas as telas.                                                                                 |
| Operar aprovação, remarcação e recuperação de atendimentos (CAAB-40)                            | Em Teste / QA      | 008; aprovação/remarcação/recuperação integradas; transporte de e-mail não bloqueia o recorte administrativo.                                                  |
| Tratar faltas, justificativas e contestações (CAAB-41)                                          | Em Teste / QA      | 008; política de faltas integrada; QA e endurecimento de uploads separados. E-mail não bloqueia a regra administrativa.                                        |
| Entregar os avisos operacionais de Agendamentos por e-mail (CAAB-42)                            | Backlog            | 008/006; intenções não são transporte real. Vínculos nativos antigos ainda apontam bloqueio indevido das regras administrativas.                               |
| Exportar análise detalhada sem agrupamento (CAAB-43)                                            | Em Teste / QA      | 010; detalhe simples direto integrado pelo PR #40; aceite humano permanece.                                                                                    |
| Exportar detalhe agrupado, resumo e evolução sem os limites antigos (CAAB-44)                   | Code Review        | 010; PR #46 integrado em 1c21c9a, apesar do status Code Review e descrição anterior ao merge. T049 técnica concluída na evidência final; C1/QA pendentes.      |
| Homologar os avisos operacionais após disponibilizar o serviço de e-mail (CAAB-45)              | Backlog            | 008/006; homologação real dos e-mails depende de transporte; separada do aceite administrativo.                                                                |
| Retomar validações de Relatórios bloqueadas pelo WSL (CAAB-46)                                  | Backlog            | 010; CI já cobriu banco/E2E da composição; C1/recursos/impacto e QA continuam. Recuperar WSL não é a única via de validação.                                   |
| Definir o tratamento das contas atualmente sem cargo (CAAB-47)                                  | Em Teste / QA      | 001; regra de contas sem cargo decidida e integrada pelo PR #45; CB06 de ativação no destino pendente.                                                         |
| Integrar a revalidação de uploads de comprovantes e o fechamento de Agendamentos (CAAB-48)      | Code Review        | 008/001/011; PR #48 aberto: revalidação própria de arquivos/Associados após locks, G01 e evidências; não integrado.                                            |
| Disponibilizar chat interno e comentários operacionais com notificações configuráveis (CAAB-49) | Em Desenvolvimento | 012; plano e organização de uma entrega funcional, com seis subtarefas. Implementação explicitamente não iniciada.                                             |
| Definir contratos, dados e permissões da colaboração interna (CAAB-50)                          | Backlog            | 012; primeira etapa planejada: spec/modelo/contratos/permissões; nenhum código autorizado por este registro.                                                   |
| Implementar conversas, grupos, supervisão e sincronização do chat (CAAB-51)                     | Backlog            | 012; núcleo futuro de conversas/grupos/supervisão/sync, dependente dos contratos.                                                                              |
| Integrar comentários e referências aos seis tipos de registro (CAAB-52)                         | Backlog            | 012; comentários/referências nos seis registros, dependentes do núcleo, sem ampliar edição cadastral.                                                          |
| Proteger anexos de conversas e comentários em todas as etapas (CAAB-53)                         | Backlog            | 012; anexos com autorização no upload/finalização/bytes, dependentes de núcleo e comentários.                                                                  |
| Configurar e entregar avisos do chat por painel, navegador e e-mail (CAAB-54)                   | Backlog            | 012; avisos por painel/navegador/e-mail; somente parcela de e-mail depende do transporte, aceite final permanece único.                                        |
| Construir a interface integrada de conversas e supervisão (CAAB-55)                             | Backlog            | 012; interface integrada de conversas/supervisão, dependente do núcleo; gate final inclui anexos/avisos/QA.                                                    |

## Evidências técnicas e seu alcance

O [PR #46 integrado](https://github.com/Komunick/caabnovo/pull/46) registra os CIs
[37651807004](https://github.com/Komunick/caabnovo/actions/runs/37651807004) e
[37651798005](https://github.com/Komunick/caabnovo/actions/runs/37651798005) aprovados na ponta
`5f26848`: 672 unitários, 178 contratos, 404 integrações e uma opcional ignorada, build, seis
cenários focados de Relatórios, 106 E2E e seis de acessibilidade sem repetição. Esses são resultados
históricos confirmados pela leitura do PR, não execução desta revisão. Não comprovam grande volume,
C1, homologação humana ou ambiente implantado.

Os [PR #48](https://github.com/Komunick/caabnovo/pull/48) e
[PR #50](https://github.com/Komunick/caabnovo/pull/50) são deltas abertos distintos. Não atribuir
sua implementação à base integrada nem a seu CI uma validação da combinação futura.

## Validação documental desta entrega

Validações executadas na entrega:

- Prettier existente do repositório, com `--ignore-path .gitignore --write` e `--check`, aplicado
  explicitamente aos dois Markdown. Verificação aprovada, sem instalação de dependências.
- `git diff --check` aprovado.
- 40 referências locais de arquivo válidas; nenhum link local com fragmento de âncora nesses
  documentos. URLs externas não foram varridas integralmente.
- 72 identificadores distintos explicitamente presentes no PRD anterior preservados, incluindo
  referências históricas; 98 linhas de requisitos sem IDs duplicados, incluindo os 15 CHAT.
- Inventário com os 53 tickets e respectivos títulos/status nativos; nenhum link de ticket Jira nos
  dois documentos. A cobertura foi conferida contra a consulta final, não só contada por linhas.
- Revisão independente por domínio e ajustes de precisão incorporados, sem alterar as decisões de
  produto das fontes responsáveis.
- Fetch e fast-forward finais confirmaram principal dev/origin/dev em `1c21c9a`, sem divergência.
  AGENTS.md modificado e CLAUDE.md não rastreado preexistentes permaneceram na principal.

Não se aplicam testes de aplicação, build ou serviços a esta alteração documental. Nenhuma nova
validação funcional, visual ou homologação foi declarada. Entrega preparada localmente; publicação e
integração não solicitadas.
