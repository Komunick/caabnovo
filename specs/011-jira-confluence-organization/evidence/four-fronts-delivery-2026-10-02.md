# Coordenação de commits e PRs — quatro instâncias, 02/10/2026

Autoria: CODEX; solicitante não verificado nesta sessão (consulta GitHub HTTP401). Pedido: alinhar
commits, PRs elegíveis e próximos passos nos prompts das quatro instâncias. GitHub consultado:
nenhum PR aberto; fetch confirmou dev/origin/dev748539d. Orientações preparadas para execução pelo
usuário; nenhum commit, push, PR ou merge realizado aqui.

## Recortes

- Documentação: consolidar apenas documentos na branch docs/documentation-roles-20260923,
  base748539d; inclui matriz de acessos já incorporada. Preparar commit coeso, validação documental
  e PR para dev. T099 e homologações funcionais continuam pendentes.
- Agendamentos: preservar2733e01/4e9abac e adicionar commit da correção SQL/regressão e evidências.
  T107 pendente. CI atual não dispara por push em codex/*; orientar renomear a branch da mesma
  worktree para feature/scheduling-administrative-20261002 após conferir colisões e referências.
  Push para CI antes do PR; resolver os gates na versão entregue. Sem operação Windows/WSL.
- Relatórios: implementar ajuste notice:cancelled com a data de referência antes de preservar a
  entrega em commits coesos, branch feature/reports-complete-20261002. Push para CI; completar
  validação dos três formatos/C1 e demais gates antes do PR. Não importar toda a branch de agenda.
- Acessos: não abrir PR duplicando os66 acréscimos já incorporados na documentação. Preservar
  revisão em commit local se necessário, trabalhar G01/AC-T002 e cobertura independente, e conciliar
  com dev após integração documental explicitamente autorizada. PR funcional condicionado aos gates
  da correção; P01 permanece decisão do usuário.

## Dependências

PR documental primeiro na ordem proposta; nenhum merge está autorizado por esta coordenação.
Agendamentos tem prioridade funcional. Relatórios coordena arquivos compartilhados por trechos,
preservando modelo de reservas, adapters, extensões da tela e helpers. Testes de Relatórios na base
antiga não comprovam compatibilidade com a futura versão de Agendamentos. A branch de Agendamentos
ainda contém diferenças históricas em MODULES/STACK/programa002: reconciliar com a versão documental
vigente antes de publicar, sem apagar decisões da spec008.

## Limites

Prompts deverão autorizar expressamente as ações que o usuário decidir encaminhar: commits, push
para CI e abertura de PR quando os gates estiverem concluídos. Esta preparação não executa nem
concede autorização externa por si. QA humano não é inferido de CI. Abrir PR não autoriza merge,
deploy, serviços locais ou promoção a main. Preservar worktrees e caderno principal compartilhado.
