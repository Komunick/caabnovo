# Retomada de Agendamentos — 18/09/2026

## Pedido e decisão vigentes

Usuário autorizou continuar o módulo e escolheu explicitamente evoluir o painel
administrativo, incluindo calendário com FullCalendar. Essa prioridade substitui
app/site como próximo incremento; app/site permanece pendente. Manter documentação
atualizada durante o trabalho para suportar pausas forçadas.

## Local de trabalho

- Caminho da worktree registrado no mapa local `.cache/WORKSPACE.md` da principal.
- Branch: `feature/reports-analytics-20260918`, HEAD inicial `df36ec7`.
- PR #34 aberto em rascunho: reutilizar a entrega ativa conforme AGENTS; preservar
  Relatórios. Atualizar título/descrição ao concluir o escopo agregado.
- Principal `dev` limpa em `8f12db4`, fetch e fast-forward conferidos nesta retomada.
- Localhost/banco pausados. Sem merge, aprovação, deploy ou alteração de estado do PR.
- Não disparar verificações/Actions intermediários: consolidar código, testes e
  documentação, depois validar e enviar o conjunto.

## Escopo do incremento

Calendário administrativo em mês, semana e dia; lista diária existente preservada.
Filtros por beneficiário/unidade/profissional/situação e data/visualização na URL.
Reservas abrem os detalhes e ações existentes. Nova reserva permanece explícita.
America/Bahia independentemente do fuso do navegador. Consulta de intervalo limitada,
sem apresentar uma página parcial como agenda completa; erro/sobrecarga explícitos.
Sem arrastar/redimensionar para remarcar, novos estados ou regras comerciais.
FullCalendar Standard 7.1.0, API React atual, sem plugins Premium.

## Estado e próximo passo

- Diagnóstico/spec antiga lidos; checklist histórico: 14/14 itens marcados, referente
  à etapa 1. Não constitui validação do calendário novo.
- Pré-requisitos da spec 008 resolvidos na worktree; hooks ausentes.
- Pesquisa/spec/plano/contratos atualizados. Dependências instaladas via cache pnpm
  existente com `--store-dir C:/Users/Gabriel/AppData/Local/pnpm/store`.
- GET calendar, FullCalendar, navegação/filtros e testes implementados. Sem migration.
- Validação local: 485 testes de unidade/contrato aprovados em 74 arquivos; typecheck
  da web aprovado após ajuste para API v7. Formatação geral aprovada.
- Próximo passo: concluir lint, consolidar commit/push para CI e revisar capturas reais.
- Integração/build/E2E ainda não executados; evidências em evidence/calendar-2026-09-18.md.
- Primeira validação: formatação e lint dos arquivos alterados aprovados; 19 testes
  unitários de Agendamentos aprovados. Typecheck global com heap 384 MB esgotou memória
  em packages/news; web isolado com 1.024 MB identificou slotLabelFormat renomeado para
  slotHeaderFormat na v7. Corrigido e typecheck da web aprovado antes do push final.

Atualizar este arquivo ao mudar de fase, registrar falhas e o comando exato de
retomada; atualizar também tasks.md e evidências, sem marcar testes não executados.
