# Preparação anterior ao implement — registro histórico

Estado atual exclusivamente no [checkpoint de 28/09](../checkpoint.md). Implementação administrativa
local e Docker/banco descartável autorizados; manter sem publicação. Os comandos, impedimentos e
pedidos de permissão abaixo foram registrados antes dessas decisões e não orientam execução.
Pré-requisitos 2C continuam gates factuais, não autorização para começar pelo T040–T048.

<details>
<summary>Preparação histórica: não executar nem repetir perguntas deste bloco</summary>
# Preparação para autorização do implement — 28/09/2026

## Atualização posterior — reconciliação de 28/09

Este checkpoint conserva a preparação anterior à inspeção local. O executor/Git foram recuperados e
o guia foi localizado na pasta principal. A [reconciliação com dev](reconciliation-2026-09-28.md)
corrige os estados administrativos, a numeração SQL e a ordem de retomada. ENV-01 deixou de bloquear
a leitura; UX-01 já tem guia localizado, mas ainda depende do vínculo com UI01/UI02 e da revisão
visual. T028/AC01/AC02 estão entregues pelo PR #36; não executá-los novamente. CAL06 e as pendências
T025–T039 precedem integração T022/2C. As 38 tarefas 2C e sua checklist continuam abertas. Não há
autorização para implementação. Os registros de falha de comandos abaixo descrevem tentativas
anteriores, não o estado atual.

## Pedido e autoria

**Registro:** preparação-implement-CODEX-mafaltti. **Solicitante:** name mafaltti, login
Danilo-Komunick, perfil autenticado GitHub consultado em 28/09/2026 nesta sessão. Essa atribuição
não substitui autores/solicitantes do histórico.

Pedido atual: continuar até a etapa implement e pedir permissão antes de começá-la. Escopo deste
checkpoint: documentação de 2C na branch `codex/scheduling-market-research-20260923`, sem código,
migration, teste novo, serviço, instalação WAHA, envio real, PR, merge ou deploy.

## Resultado documental

| Etapa                    | Resultado verificável e limite                                                                                                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pesquisa                 | research.md compara mercado e integrações com fontes oficiais; decisões de 28/09 prevalecem: login geral, WAHA escolhido/a instalar, e-mail já definido. Não comprova homologação.                      |
| Spec / clarify           | spec.md contém 25 requisitos 2C-FR e 24 critérios 2C-SC; respostas recebidas incorporadas, inclusive editar pedido inicial depois do horário antigo e transferir a dependente elegível antes do aceite. |
| Plan / design de domínio | plan.md, data-model.md e contracts/channels.md definem estados, ocupação, ciclos, autorização, contratos HTTP propostos e política operacional. Layout depende do guia.                                 |
| Tasks                    | 38 tarefas T040–T077, todas pendentes: 4 Setup, 7 Foundation, 23 US3, 4 Polish; 9 oportunidades [P]. Nenhuma execução iniciada.                                                                         |
| Checklist                | checklists/channels.md criada com 25 itens de qualidade de requisitos, todos abertos e sob responsabilidade do revisor.                                                                                 |
| Consistência             | Revisão documental manual dos artefatos e matriz de rastreabilidade; correções e limites abaixo. Não equivale ao workflow automatizado.                                                                 |
| Implement                | Aguardando autorização explícita do usuário, conforme pedido atual. A autorização não elimina gates de execução.                                                                                        |

Referências: [spec](../spec.md), [pesquisa](../research.md), [plano](../plan.md),
[modelo](../data-model.md), [contrato](../contracts/channels.md), [tarefas](../tasks.md),
[roteiro](../quickstart.md), [checklist](../checklists/channels.md).

## Revisão e rastreabilidade

A matriz em tasks.md associa todos os 25 requisitos a tarefas e cobre os 24 critérios de sucesso.
Cobertura documental nominal: 100%; isso não mede cobertura de código ou testes. Os IDs T040–T077
são únicos, todos [ ], e os grupos históricos permanecem fora da contagem.

| Conferência                     | Resultado                                                                                                                                                                                        |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Origem após recusa de troca     | Corrigida passagem antiga do plano: sucesso libera origem, recusa libera destino; não há restauração automática. Só falha anterior ao commit conserva a ocupação anterior.                       |
| Edição/transferência pendente   | Modelo e contrato conciliados; não tratar beneficiário/horário como imutáveis antes do aceite nem aplicar recusa terminal de pedido novo a uma troca.                                            |
| Edição depois do horário antigo | Pedido inicial pode selecionar destino futuro; edição genérica não contorna prazo de troca voluntária. Retomada/recuperação preservam exceções aprovadas.                                        |
| Consumidores app/site           | T072/T073 incluem edição/transferência, versão, histórico autorizado e seleção futura após horário antigo. Construção externa permanece na spec própria de UI01/UI02.                            |
| Contrato HTTP                   | Seção 1.3 fixa caminhos propostos para público, associado, equipe e callback; T041 verifica sessão/CSRF/revogação e compatibilidade antes da vinculação.                                         |
| Avisos                          | Seção 10.2 explicita orçamento, backoff, timeout, reconciliação e repetição de callback/job; T044 valida o adaptador, T069 implementa e testa após autorização.                                  |
| Constituição 2.1.0              | Desenho preserva monólito, fonte PostgreSQL, transação/constraints, autorização no servidor, auditoria, jobs idempotentes e gate de design/acessibilidade; nenhum gate de execução foi aprovado. |

Não foi identificado requisito 2C sem tarefa na matriz. As tarefas de Setup/Foundation/Polish cobrem
pré-requisitos e critérios transversais, sem criar funcionalidades por inferência. Nenhuma nova
decisão de negócio foi presumida para suprir uma dependência técnica.

## Impedimentos e gates na entrada

| ID     | Gravidade / alcance                 | Evidência                                                                                                                                      | Próximo passo                                                                                                                                            |
| ------ | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ENV-01 | Alta: execução local                | exec_command e leitor local alternativo falham antes de iniciar por helper_unknown_error/setup refresh; check-prerequisites também não inicia. | T040: restaurar acesso, ler AGENTS/agentcache, verificar Git/worktree/base/sincronização e rodar prerequisites antes de código.                          |
| UX-01  | Alta: trabalho visual               | docs/caab-design.md não localizado pela leitura remota; acesso local indisponível.                                                             | T043: localizar versão vigente e spec própria UI01/UI02 antes de planejar layout ou alterar UI.                                                          |
| INT-01 | Média: dependência técnica prevista | Mapeamento da sessão geral para pessoa/revogação não homologado.                                                                               | T041/T049: provar integração; não inventar segundo login, associação por nome ou autenticação administrativa para associado.                             |
| INT-02 | Média: adaptadores/ativação         | WAHA escolhido mas não instalado; serviço de e-mail escolhido pelo sistema, contrato/remetente real ainda por conferir.                        | T044: confirmar interfaces e plano operacional; T069/T077: validar em ambiente autorizado. Instalação/contatos reais não autorizados por este documento. |
| DB-01  | Média: persistência/transição       | Número livre de migration e reservas futuras reais não verificados.                                                                            | T045 antes de T048; T042/T077 antes do corte. Histórico antigo detalhado é opcional e não bloqueia a função nova.                                        |
| REV-01 | Gate de revisão                     | Checklist 2C tem 25 itens abertos. Checklist histórica requirements.md tem 13/14, limitada à etapa 1.                                          | Revisor aprova itens ou usuário autoriza explicitamente prosseguir com itens abertos; implement não modifica os marcadores.                              |

Esses gates têm tarefas e não são funcionalidades implementadas. A aprovação para começar pode
autorizar a preparação de entrada; não permite contornar ambiente, guia, identidade ou integridade.
Não declarar entrega ou homologação completa enquanto as evidências respectivas estiverem ausentes.

## Limitações do ambiente e do workflow

A continuação usa a API GitHub na branch documental existente. Não foi possível conferir a pasta
principal em dev, worktrees, fetch/fast-forward ou formatação local. docs/agentcache.md não está
acessível localmente e a consulta remota retornou 404; não foi criado caderno remoto concorrente. Na
retomada local, reconciliar este checkpoint com o caderno principal.

Os arquivos e skills foram lidos remotamente; a geração e revisão foram manuais. A tentativa de
executar `.specify/scripts/powershell/check-prerequisites.ps1 -Json -RequireTasks -IncludeTasks`
falhou antes do processo iniciar. Não afirmar que specify/clarify/plan/tasks/checklist/analyze
rodaram integralmente pelo CLI. A consulta remota de .specify/extensions.yml retornou 404; isso não
prova configuração local inexistente. Sem testes, lint, types, build ou CI novos.

Os arquivos documentais são conferidos por SHA antes de alteração e relidos depois de salvar; esse
controle não substitui formatter nem teste do produto. O checkpoint não atribui resultados de suites
históricas ao novo incremento.

## Escopo a autorizar

Solicitar ao usuário autorização para iniciar speckit-implement em T040, com os gates acima e a
checklist apresentada ainda aberta. Sequência prevista: preparação e integração → contratos/
persistência → oferta e reservas → trocas/recuperação → equipe/histórico/avisos → consumidores e
validações. Nenhuma etapa foi iniciada por este checkpoint.

PR, merge, deploy, corte real, instalação/ativação de WAHA e mensagens reais continuam sujeitos à
autorização própria. O pedido atual exige parar antes de começar a implementação.

</details>
