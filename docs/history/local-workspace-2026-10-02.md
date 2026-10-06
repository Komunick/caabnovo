# Histórico operacional de uma cópia local — 23/09 a 02/10/2026

Registro histórico transferido do runbook em 06/10/2026 por CODEX/mafaltti. Conserva a autoria e os
limites originais. Caminhos, recursos, portas e contagens abaixo descrevem somente a máquina
registrada; não são configuração padrão nem diagnóstico atual de outro computador. O procedimento
vigente está no [runbook geral](../runbooks/local-workspace.md). Trabalho em andamento pertence ao
caderno da pasta principal identificada pelo Git.

## Perfil local registrado em 23/09/2026

Consolidado por CODEX/mafaltti a partir do registro operacional anterior, cujo solicitante não
estava verificado. Pasta desta máquina: `C:/Projetos/caabnovo`. O caminho antigo do Desktop não
existe. Os cinco registros de worktrees que ainda apontavam ao Desktop foram reparados em
23/09/2026, após conferência das pastas e backup dos metadados. Todas as sete pastas registradas
(principal e seis worktrees) são reconhecidas sob a raiz atual; branches, commits, índices e estados
locais das cinco pastas reparadas foram preservados. Conferir o Git antes de reutilizar.

Localhost está desautorizado até pedido explícito. Quando autorizado, preservar banco/contas, usar
preview na porta 3107 e respeitar o perfil registrado: Node 384 MB, duas CPUs e prioridade baixa;
PostgreSQL 256 MB e uma CPU; WSL 768 MB e duas CPUs. Worker/scanner permanecem pausados até
autorização correspondente. Não executar build/E2E junto ao preview com pouca memória; usar CI ou
ambiente descartável autorizado. Estes valores são restrições registradas, não uma medição do estado
atual dos processos.

O dump local `.cache/local-backups/caab-before-preview-20260922.dump` foi registrado como
parcial/não validado. Não tratá-lo como restaurável. Preservar dados, volumes, runtimes e backups.

## Entrega documental de 23/09/2026

Correções preparadas na branch `docs/documentation-roles-20260923`, pasta
`.cache/pr-docs-roles-20260923`, a partir de `dev` em `89d2356`. Conferir o Git antes de retomar;
este registro identifica a entrega, sem autorizar PR, publicação ou integração. Evidência em
[revisão documental](../../specs/001-project-foundation/evidence/documentation-roles-2026-09-23.md).

## Consolidação de 02/10/2026

A mesma entrega documental foi atualizada por fast-forward para `748539d` depois do backup
verificado de 20 arquivos em `.cache/local-backups/docs-roles-20261002-114857`. Conciliação e
verificações na
[evidência atual](../../specs/001-project-foundation/evidence/documentation-consolidation-2026-10-02.md).
Os caminhos de outras frentes registrados no manifesto são procedência local; conferir Git/caderno
antes de reutilizá-los. A divisão posterior separou aceite de acessos e documentação; conciliar
somente os trechos correspondentes da spec 001, preservando IDs DS e tarefas de cargo único.
