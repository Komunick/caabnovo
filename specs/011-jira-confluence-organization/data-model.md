# Modelo de informação

Modelo documental; não cria tabelas ou migrations no CAAB.

| Entidade              | Campos mínimos                                                                      | Relações e validações                                                       |
| --------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Ticket observado      | chave, título, tipo, status, pai, assignee, labels, updated, URL                    | Chave única; snapshot datado; inventário paginado inclui fechados.          |
| Evidência             | URL/origem, data, autor comprovado, escopo coberto, limite                          | Liga proposta a PR, histórico ou spec; merge e QA são fatos distintos.      |
| Alteração proposta    | ID estável, entidade, campo, antes, depois, justificativa, evidências, dependências | Apenas campos autorizados; divergência bloqueia operação afetada.           |
| Responsabilidade      | executor, accountId confirmado, evidência, validador humano opcional                | Não confundir autor automático, executor, solicitante e validador.          |
| Página                | ID, espaço, título, pai, versão, URL, estado de rascunho                            | Preservar ID em edição/movimento; versão confirmada antes de gravar.        |
| Decisão de produto    | tema, resultado, fonte, estado de definição                                         | Sugestão, prevista, em execução; transferência não significa implementação. |
| Registro de aplicação | ID da operação, resultado, data, antes/depois, confirmação                          | Proposto → revisado → aplicado → verificado; ou bloqueado/falhou.           |

Cada ticket pode ter várias evidências e alterações. Subtarefa tem um pai compatível e não admite
ciclo. Tarefa de motor pode ter várias dependências, sem virar filha de duas histórias. Página de
CAASSH/Portal relaciona os dois tickets; consolidação 21→2 preserva ambas as chaves.

O estado do registro de aplicação é local ao processo, não um novo workflow Jira. Ticket transferido
mantém status; as etiquetas regulam somente a visão ativa separada. Reexecução verifica o resultado
existente antes de criar ou alterar; não duplica páginas/subtarefas.
