# Delimitação de Agendamentos — 05/10/2026-CODEX-mafaltti

Pedido do usuário: fechar o plano no escopo atual, organizar e formatar o Jira e parar. Autoria
CODEX; solicitante mafaltti, login Danilo-Komunick, perfil GitHub consultado via get_profile em
05/10/2026.

## Resultado

Spec, plano, tarefas e checkpoint da spec008 atualizados na worktree
`.cache/pr-scheduling-research-20260923`, branch `feature/scheduling-administrative-20261002`, sobre
4e427ac. Somente quatro documentos rastreados alterados; sem código, commit, push ou merge. A fila
de fechamento ficou limitada a T111 e T110: corrigir a falha de asserção, validar o delta, obter
revisão externa, conciliar documentos, preparar rollout e registrar integração e homologação
autorizadas. App/site, e-mail, WAHA e expansões permanecem fora desta entrega; critérios aceitos
preservados.

## Jira conferido após gravação

Nove descrições reescritas e relidas em ADF nativo, com títulos de seção e listas reais. Objetivo,
critérios, estado e próximo passo separados. Histórico de comentários preservado. Status, títulos,
responsáveis e hierarquia não alterados; etiquetas diferenciam coordenação, escopo atual e adiados.

| Ticket                                                                             | Estado preservado  |
| ---------------------------------------------------------------------------------- | ------------------ |
| Impedir sobreposição de agendamentos da mesma pessoa (CAAB-26)                     | Code Review        |
| Sinalizar reservas de pessoa bloqueada sem cancelá-las (CAAB-27)                   | Code Review        |
| Separar consulta e alteração em Agendamentos (CAAB-28)                             | Code Review        |
| Permitir agendamento pelo app e site (CAAB-30)                                     | Backlog            |
| Agendamentos (CAAB-37)                                                             | Em Desenvolvimento |
| Operar aprovação, remarcação e recuperação de atendimentos (CAAB-40)               | Code Review        |
| Tratar faltas, justificativas e contestações (CAAB-41)                             | Code Review        |
| Entregar os avisos operacionais de Agendamentos por e-mail (CAAB-42)               | Backlog            |
| Homologar os avisos operacionais após disponibilizar o serviço de e-mail (CAAB-45) | Backlog            |

Os vínculos nativos Blocks 10050/10051 que fazem o e-mail bloquear os recortes de aprovação e faltas
continuam pendentes de remoção manual: o conector disponível não expõe exclusão individual. As
descrições esclarecem que essa dependência foi superada por decisão do usuário. A dependência real
do serviço de e-mail permanece preservada. Não declarar o grafo totalmente corrigido.

## Validação e preservação

Prettier aplicado aos quatro documentos; git diff --check aprovado. Não foram executados testes de
aplicação nem iniciados serviços ou CI. Não houve declaração de homologação. Backups anteriores à
alteração em `.cache/local-backups/scheduling-scope-20261005`: quatro documentos conferidos por
SHA-256, jira-before.json e jira-proposed.json. Os demais registros e alterações locais foram
preservados.

## Parada

Esta coordenação está parada por pedido explícito após concluir a atualização. A retomada exige nova
orientação; preservar as quatro alterações documentais locais de Agendamentos. Pendência residual:
remover pela interface os dois vínculos obsoletos de e-mail.
