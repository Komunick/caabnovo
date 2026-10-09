# Registro do ticket e do PRD — 07/10/2026

## Pedido e autoria

Registro-CODEX-mafaltti. Solicitante verificado nesta sessão pelo perfil GitHub autenticado
`get_profile`, em 07/10/2026: nome mafaltti, login Danilo-Komunick. O usuário pediu criar um ticket
em Em Desenvolvimento a partir do plano definido na conversa, seguindo os modelos existentes, e
atualizar o PRD. Escopo executado: documentação e Jira.

## Resultado

- Disponibilizar chat interno e comentários operacionais com notificações configuráveis (CAAB-49)
  criado como História, prioridade Medium, sem responsável atribuído; status Em Desenvolvimento
  confirmado por releitura após a transição nativa 31.
- Modelos consultados: Disponibilizar o tema Cores Legado (CAAB-29), Gerenciar cargos e acessos de
  Administrador, Gestor e Colaborador (CAAB-19) e itens recentes de entregas técnicas. Aplicados
  objetivo, justificativa, critérios de aceite, limites, dependências e referências.
- A descrição contém o plano completo, incluindo as escolhas do usuário, interfaces, limites, testes
  e pesquisa. Comparação do texto relido com o preparado, após normalizar marcadores de Markdown,
  resultou em igualdade: 14.688 caracteres. Nenhum link de ticket no corpo relido.
- [PRD](../../docs/PRD.md) atualizado para 0.5, com 15 requisitos CHAT, modelo conceitual,
  interface, autorização, avisos, entrega única e aceite. [Plano](plan.md) conserva o detalhamento
  funcional.
- [Mapa de módulos](../../docs/MODULES.md) e FUT01 nas
  [tarefas do programa](../002-integrated-modules/tasks.md) conciliados: pesquisa/escopo concluídos,
  implementação e homologação pendentes. FUT02 e Mensagens preservam seus escopos próprios.

## Base e preservação

Worktree `.cache/pr-internal-chat-plan-20261007`, branch `docs/internal-chat-plan-20261007`, base
`1c21c9a` de dev. Fetch e fast-forward da principal concluídos; alterações preexistentes de
AGENTS.md e CLAUDE.md permaneceram na principal, com hashes conferidos antes/depois. O código de
proteção de troca de identidade do PR46 já está na base integrada; a função nova precisa de suas
próprias regressões. Nenhuma mudança de código, conta, permissão, banco ou serviço nesta entrega.

Documentação preparada localmente, sem commit, push ou PR solicitado. O ticket publicado contém o
plano integral, sem depender de um link para arquivo ainda não publicado no Git.

## Validações

Prettier dos documentos e `git diff --check` aprovados na etapa inicial. Destinos dos links locais e
a nova âncora do PRD conferidos. Revisão independente do plano/PRD/mapa/tarefas preservou as
decisões do usuário e apontou somente uma ambiguidade na exclusão de chat do MVP de exportações:
texto corrigido para indicar aquele recorte e a entrega própria 012. Testes de aplicação não se
aplicam a esta mudança documental e não foram executados. Critérios de implementação/QA permanecem
abertos no ticket.

## Subtarefas e subagentes — complemento solicitado em 07/10/2026

O usuário pediu dividir o ticket em subtarefas e subagentes e explicitou que a implementação não
deve começar. Três subagentes revisaram somente a decomposição de backend, interface e aceite.
Nenhum subagente implementador foi iniciado. Distribuição executável futura em [tasks.md](tasks.md).

- Definir contratos, dados e permissões da colaboração interna (CAAB-50).
- Implementar conversas, grupos, supervisão e sincronização do chat (CAAB-51).
- Integrar comentários e referências aos seis tipos de registro (CAAB-52).
- Proteger anexos de conversas e comentários em todas as etapas (CAAB-53).
- Configurar e entregar avisos do chat por painel, navegador e e-mail (CAAB-54).
- Construir a interface integrada de conversas e supervisão (CAAB-55).

Releitura JQL por pai confirmou as seis como Subtarefa nativa sob Disponibilizar chat interno e
comentários operacionais com notificações configuráveis (CAAB-49), todas no Backlog, sem responsável
humano atribuído e com restrição explícita de não iniciar implementação. Sete vínculos Blocks
criados e conferidos na direção correta, incluindo o transporte de Serviço de e-mail transacional e
definição da caixa de entrada (CAAB-2) para o aceite dos avisos por e-mail. Essa dependência não
impede preparar os demais canais, conforme descrição da subtarefa e do pai.

O pai conserva Em Desenvolvimento e o plano integral, acrescido de organização de seis subtarefas,
três papéis de subagentes e coordenação, sem aceite parcial. PRD e plano apontam para tasks.md.
Gates de integração/carga/segurança/homologação permanecem no pai; testes de cada fatia ficam em seu
próprio aceite. Nenhum código, PR, commit, push, banco ou serviço executado por essa organização.

Validação final do complemento: seis documentos aprovados no Prettier e `git diff --check`; 99 links
locais sem destinos ausentes e nova âncora do PRD conferida. As seis descrições relidas coincidiram
com as preparadas após normalizar Markdown, sem links de tickets. Releitura final do pai confirmou
seis filhos, Em Desenvolvimento, plano integral e ordem explícita de não implementar. O aceite de
comentários foi esclarecido para deixar a integração de anexos/avisos no pai, evitando que a
dependência sequencial comentários → anexos forme um ciclo de encerramento.

Revisão independente final encontrou somente esse ciclo lógico, resolvido no Jira e em tasks.md;
releitura remota confirmou a correção. Nenhum outro problema acionável de distribuição,
dependências, escrita exclusiva, restrição de implementação ou entrega única foi apontado. Fetch
final confirmou dev/origin/dev sem divergência; arquivos locais preexistentes preservados.
