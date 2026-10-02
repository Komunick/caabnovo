# Faltas e bloqueio — núcleo administrativo, 28/09/2026

Registro: implementação-de-faltas-CODEX-mafaltti. Solicitante mafaltti (Danilo-Komunick), perfil
GitHub autenticado verificado em 28/09 nesta sessão. Fonte: pedido explícito de implementar em
paralelo com o clarify e respostas registradas na [spec](../spec.md).

Worktree `.cache/pr-scheduling-research-20260923`, branch
`codex/scheduling-market-research-20260923`, HEAD `500f84f` mais alterações locais. A versão dos 26
arquivos de código/testes/schema está no [manifesto SHA-256](absence-policy-2026-09-28.sha256). O
incremento administrativo T078–T086 já existia; foi preservado. As evidências anteriores não validam
automaticamente este núcleo. Principal `dev` e `origin/dev` em `89d2356`, divergência 0/0 após fetch
final. Não houve commit, push, PR, merge, deploy, migration no banco de uso, ativação de
preview/worker/scanner ou envio real de mensagens.

## Comportamento implementado

- A equipe registra falta em reserva confirmada após seu término previsto. O relógio do PostgreSQL
  fixa os prazos de sete e 30 dias, sem retroação ao compromisso.
- Ocorrências individuais e sobrepostas impedem criação de reservas em todos os serviços, inclusive
  transferência para a pessoa bloqueada. Familiares não herdam essa restrição. Não foi aplicada uma
  proibição genérica ao atendimento ou às reservas preservadas.
- Justificativa e contestação exigem texto e comprovante privado, limpo e pertencente à pessoa.
  Pedido tempestivo preserva reservas durante a análise. Revisão usa `scheduling:review_absences`
  com consulta, sem exigir alteração geral e sem concedê-la implicitamente a quem só altera agenda.
- Aceitação encerra apenas a restrição daquela falta e exibe Falta abonada. Ao completar 30 dias a
  restrição expira mesmo com análise pendente; decisão tardia altera histórico.
- Rejeição ou vencimento dos sete dias sem pedido cancela somente reservas confirmadas/pendentes com
  início futuro dentro do período. Histórico, evento causal, ocupação, versão, auditoria e intenções
  são transacionais. Reservas após os 30 dias permanecem.
- Worker usa o mesmo cancelamento do domínio, cron por minuto, lock de elegibilidade, revalidação,
  retry e autoria de sistema. Repetição não duplica efeitos. Atraso após 30 dias apenas registra
  encerramento, sem cancelamento retroativo.
- Aviso, protocolo e decisão geram três tipos de intenção de e-mail. Nenhum estado pendente foi
  apresentado como entregue. Comprovantes e texto livre ficam fora da auditoria.

Migrations novas 0033/0034; migrations 0001–0032 preservadas por este incremento. 0034 conserva
autoria humana dos eventos existentes e permite autoria de sistema somente nos eventos automáticos
previstos. Histórico identifica Sistema sem ocultar esses eventos.

## Validação

| Verificação                                                    | Resultado                                                                                                                         |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Unitários de Agendamentos, contratos locais, permissões e cron | 136/136 em 13 arquivos                                                                                                            |
| Unitários do worker (regressão das filas/jobs)                 | 28/28 em nove arquivos; inclui o caso do cron já contado no recorte de 136                                                        |
| Contratos da aplicação                                         | 169/169 em 24 arquivos                                                                                                            |
| Integrações de falta em PostgreSQL descartável                 | 22/22; prazos, provas, autorização, concorrência, rollback, sobreposição, restrição individual, transferência e rotina automática |
| Regressão conjunta de agenda/fluxo/faltas/exportações          | 94/94 em quatro arquivos, 186,63 s; inclui os 22 cenários acima e 72 anteriores                                                   |
| Typecheck web                                                  | Aprovado após integração do helper compartilhado                                                                                  |
| Typecheck contratos, DB e worker                               | Aprovado pelos agentes responsáveis                                                                                               |
| Lint dos arquivos do incremento                                | Aprovado                                                                                                                          |
| Formatação de código/documentos e diff-check                   | Aprovados na consolidação final                                                                                                   |
| Links locais dos documentos alterados                          | 153 destinos conferidos, sem ausências                                                                                            |
| Build de produção                                              | Aprovado: Next 16.3.4, compilação, TypeScript e 55 páginas geradas                                                                |
| Interface e E2E novos de falta                                 | Não executados: formulários de falta não foram construídos neste recorte                                                          |

Comandos reproduzíveis a partir da worktree:

```powershell
node node_modules/vitest/vitest.mjs run --project unit apps/web/modules/scheduling packages/contracts/src/scheduling packages/contracts/src/user-access.test.ts apps/worker/src/jobs/finalize-absences.test.ts --maxWorkers=1
node node_modules/vitest/vitest.mjs run --project contract --maxWorkers=1
$env:NODE_OPTIONS = "--dns-result-order=ipv4first"
node node_modules/vitest/vitest.mjs run --project integration apps/web/tests/integration/scheduling.test.ts apps/web/tests/integration/scheduling-workflow.test.ts apps/web/tests/integration/scheduling-absence.test.ts apps/web/tests/integration/scheduling-export.test.ts --maxWorkers=1 --no-file-parallelism
node node_modules/typescript/bin/tsc -p apps/web/tsconfig.json --noEmit
node apps/web/node_modules/next/dist/bin/next build apps/web
```

Integrações usam somente PostgreSQL Testcontainers descartável, um contêiner por vez, 256 MiB/uma
CPU. O ambiente usa Docker Desktop Linux por named pipe e host de teste 127.0.0.1. Nenhum seed/dado
de uso foi manipulado.

Ocorrências da validação:

- A disputa entre duas decisões inicialmente falhou ao abrir a segunda conexão do pool (ECONNRESET),
  sem query ou lock concorrente no PostgreSQL. IPv4 e pré-aquecimento de duas conexões reais
  corrigiram a preparação; as operações continuam concorrentes, exigindo exatamente uma decisão
  válida. A suíte de 22 casos passou conjuntamente.
- A primeira regressão ampla foi interrompida após reproduzir o handshake com localhost nas fixtures
  antigas. A flag IPv4 apenas no processo principal do Vitest não foi herdada pelo processo de
  teste: conferência dos processos confirmou a diferença, e o fluxo antigo passou 14/15 cenários,
  com falha na abertura de conexões do cenário concorrente. Com NODE_OPTIONS herdado, o cenário
  concorrente isolado passou (1/1), seguido pela regressão completa 94/94. Uma advertência de
  depreciação do pg permaneceu em preparação de teste legado, sem falha ou alteração de suas
  assertivas.
- Typecheck web com limite artificial de heap de 384 MiB terminou por falta de memória. Reexecução
  normal do mesmo comando passou; nenhum diagnóstico TypeScript foi contornado.
- O teste do worker que verifica o bloqueio da promoção falhou dentro do sandbox porque tsx não
  conseguiu consultar o perfil local do Windows (uv_os_get_passwd). Reexecução autorizada fora dessa
  restrição passou 28/28, sem alteração no teste nem promoção/ativação de serviços.
- Revisão independente encontrou transferência de pendência que permitia atribuir reserva a
  dependente bloqueado. A guarda foi adicionada somente quando muda o beneficiário; teste de
  integração comprova negação e preservação do titular.
- Revisão estática adicional de shared repository, migration, histórico e wrapper do worker não
  encontrou novos problemas bloqueantes. Não substitui homologação em ambiente implantado.

## Clarify e coerência documental

Esta continuação registrou cinco respostas: permissão dedicada de análise; cancelamento de
confirmadas/pendentes futuras; registro somente após o término; cancelamento além do período adiado
para discussão; OK apenas fecha aviso e mantém sete dias. Respostas anteriores permanecem na spec.
Atualizados requisitos BF, decisões abertas, plano, tarefas, modelo físico e contratos, sem
transformar a hipótese futura em configuração.

| Área                                                          | Estado                                                 |
| ------------------------------------------------------------- | ------------------------------------------------------ |
| Regras funcionais, prazos, ciclo da ocorrência e concorrência | Resolvidos no núcleo confirmado                        |
| Papéis, permissão de revisão e comprovantes privados          | Resolvidos no backend administrativo                   |
| Modelo de dados, auditoria e execução repetida                | Resolvidos e testados                                  |
| UX/área de acesso posterior                                   | Regra de OK resolvida; interfaces pendentes            |
| E-mail e representação de dependentes                         | Adiados: destinatários, preferências e integração real |
| Mérito documental e critérios humanos de aceitação            | Adiados: campos completos não equivalem a deferimento  |
| Terminologia e fronteira entre bloqueio cadastral e falta     | Claras; P02/FR-017 preservados                         |
| Aceite visual, canal externo e operação implantada            | Pendentes, sem homologação presumida                   |

Checklist histórica `requirements.md`: 13/14 → 13/14, sem mudança de marcadores; item sobre ausência
de frameworks/código segue aberto. Checklist de canais externos permanece 0/25; nenhum teste
administrativo a aprova. Hooks de clarify/implement ausentes nesta worktree. O núcleo pode avançar
independentemente das interfaces e da entrega real de e-mail; continuar a definição dos pontos
abertos em T088/T089.

## Limites e próximos passos

T090–T095/T098 entregam domínio, persistência, API administrativa e processamento automático em
código. Não há formulários específicos de falta no painel nem avisos/ações no app/site; a escolha OK
está especificada sem comando que antecipe penalidade. O pipeline de upload já existente continua
com suas permissões próprias e precisa do scanner para uso real; testes utilizam arquivos sintéticos
em estado controlado. A nova permissão de revisão não concede acesso ao acervo geral de Associados.

App/site seguem adiados e dependem de UI01/UI02/identidade. Antes de desenhar formulários, aplicar o
guia canônico; não inferir aceite visual destes testes. O catálogo apenas recebeu o rótulo da nova
permissão, dentro do padrão existente. T088/T089 conservam critérios humanos e destinatários em
aberto. T097 registra somente a possibilidade futura de cancelar reservas posteriores aos 30 dias.
Remarcação de reserva própria preservada não recebeu regra adicional inventada; nova atribuição a
outra pessoa respeita o bloqueio.

Nenhuma dependência ou lockfile foi alterado por este incremento; revisão dos arquivos novos não
encontrou credenciais reais (dados e credenciais de teste são sintéticos).

CI, revisão humana das mudanças sensíveis e homologação de jornada completa continuam necessários
antes de publicação autorizada. Esta evidência não declara prontidão para PR/produção enquanto esses
gates e as parcelas do fluxo estiverem pendentes.
