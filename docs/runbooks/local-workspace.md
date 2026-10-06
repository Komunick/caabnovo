# Operação da cópia local

Este runbook define procedimentos comuns a qualquer checkout. Identificar o computador, a pasta
principal e a entrega antes de aplicar configurações locais. Autorizações ficam no
[AGENTS](../../AGENTS.md); execução e pedidos pendentes ficam no [caderno](../agentcache.md) da
pasta principal. Perfil de outra máquina e histórico de entrega não definem a configuração atual.

## Identificar a entrega e a pasta principal

Usar `git worktree list --porcelain`, `git rev-parse --git-common-dir` e
`git status --short --branch` para conferir pastas, branches, commits e alterações. A pasta
principal permanece em `dev`; mudanças versionadas são preparadas na worktree da entrega. Em
worktrees, usar somente o caderno da principal encontrada pelo Git. Em cópia independente, usar o
caderno daquela cópia.

Antes de usar uma pasta movida, conferir seu vínculo Git e os caminhos resolvidos. Não executar
prune, repair ou remoção apenas por um caminho antigo. Preservar alterações locais e conferir um
backup antes de retirá-las; não descartar trabalho nem reaplicar conteúdo histórico automaticamente.

## Conferir o perfil desta máquina

Antes de iniciar serviços autorizados, localizar o perfil operacional confirmado para este
computador e conferir portas disponíveis, memória, CPUs e processos existentes. Não adotar valores
de outra máquina como padrão. Se faltar perfil confirmado, obter os limites necessários antes da
inicialização. Registrar procedimentos locais duráveis no runbook da cópia principal e identificar
explicitamente a máquina a que se aplicam; andamento de entrega fica no caderno e nas evidências.

O [histórico operacional de 23/09 a 02/10](../history/local-workspace-2026-10-02.md) conserva um
perfil específico, reparos de caminhos e checkpoints documentais. Consultá-lo somente como
procedência, depois de verificar que corresponde a esta cópia e que suas restrições continuam
vigentes. Contagens de worktrees e estado de backups desse histórico não comprovam o estado atual.

## Serviços e preview

Localhost e serviços pausados permanecem desativados até ordem explícita. Quando autorizados,
preservar banco, contas, permissões, volumes, arquivos e backups; conferir versão local, branch,
commit e alterações antes de oferecer o preview. Usar a porta e os limites confirmados para esta
máquina, com [stack](../STACK.md#16-testes) e [fluxo de entrega](../DELIVERY-WORKFLOW.md).

Não executar builds ou E2E pesados junto ao preview quando os recursos forem insuficientes. Usar CI
ou ambiente descartável autorizado; testes não usam o banco do usuário. Worker e scanner pausados
exigem autorização correspondente. Registro antigo de dump não é prova de restauração; conferir
integridade e restauração antes de tratá-lo como backup recuperável.
