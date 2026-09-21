## Clarify transversal — 20/09/2026

Q2 respondida (A): manter e sinalizar reservas futuras do associado bloqueado e
dependentes afetados para decisão manual. FR-017/SC-007, BLQ01/BLQ02 e coordenação
AE04 da spec 005 documentados; sem código ou testes. Reservas mantêm ocupação e
situação; criação/remarcação continuam impedidas. Checklist 008 segue 13/14.
Checklist 005 reavaliado: 16/16 → 13/16 por detalhes técnicos preexistentes
(locks, permissões técnicas e configuração); marcadores alterados, texto preservado.
Próximo assunto: autorização da exportação transversal; resposta ainda pendente.

Q1 respondida: impedir sobreposição por pessoa atendida entre quaisquer unidades
e profissionais, diferenciando associado e cada dependente pelo cadastro individual.
Specs/plan/modelo/contrato/tarefas atualizados; FR-016/SC-006 e BEN01–BEN03 documentam
regra e validação futura. Nenhum código, migration ou teste executado nesta sessão.
CAL06 e as tarefas novas permanecem pendentes; implementação não retomada.
Checklist reavaliado: 14/14 → 13/14; item sem frameworks desmarcado porque a spec
já contém FullCalendar no incremento anterior. Nenhuma regressão de código alegada.
Próximo passo: continuar perguntas do clarify e registrar decisões incrementalmente.

### Resultado final da retomada de CI — 20/09/2026

Runs 35392211021 (pull_request) e 35392206888 (push), tentativa 2, concluídos com
success no HEAD fb218fb429bab6c220ed1e3f0096760829cb41bf. Todos os seis checks
quality/browser/security concluídos com sucesso; os quatro anteriormente cancelados
foram reexecutados. E2E e acessibilidade concluídos em ambas as execuções.
Nenhuma mudança de implementação ou novo commit/push necessário. CAL06 e revisão
visual de produto não foram concluídas por este pedido restrito ao CI.
Principal dev 8f12db4 limpa e sincronizada por fetch/ff-only na conferência final.
PR continua aberto, sem aprovação/merge pelo agente; localhost desligado.
Próximo passo de produto permanece sujeito à retomada do escopo de Agendamentos.

## Retomada limitada aos checks do PR #34 — 20/09/2026

Usuário solicitou reiniciar os quatro checks cancelados e acompanhar todos até
terminarem. Retomada autorizada apenas para esta validação; demais pendências de
produto permanecem com o escopo anterior. HEAD remoto confirmado: fb218fb429bab6c220ed1e3f0096760829cb41bf.
Runs PR 35392211021 e push 35392206888 reiniciados pelo navegador na tentativa 2;
quality/browser em andamento. Nenhum resultado final presumido. CAL06 não marcada.
CLI com token inválido para mutação (401); conector sem Actions write (403).
Sessão autenticada do navegador permitiu o reinício. Principal dev limpa e
sincronizada com origin/dev por fetch/ff-only. Localhost permanece desligado.
Próximo passo: acompanhar as duas execuções e registrar conclusões finais.
Sem alteração de código, commit, push, aprovação ou merge nesta retomada.

# Retomada de Agendamentos — 18/09/2026

## PAUSA solicitada pelo usuário

Usuário ordenou parar. Trabalho interrompido após push de `fb218fb` (somente ajuste
de sincronização do E2E, documentação e capturas). Aplicação em `8819bce` passou no
CI do PR 35388527805 e foi revisada visualmente. Push 35388521920 falhou na captura;
correção do teste ainda aguarda validação. CAL06 não concluída. Não iniciar novos
checks nem continuar implementação sem retomada do usuário. CIs ativos de fb218fb
serão cancelados por esta ordem. PR34 continua rascunho, sem aprovação/merge.

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
- Lint final aprovado. Commit de implementação `2af7348` enviado ao PR34; título e
  descrição atualizados para Relatórios e calendário. PR continua rascunho.
- CI push 35387126094 e PR 35387129716 totalmente aprovados: 363 unitários,
  122 contratos, 219 integrações, 82 E2E, 2 focados Relatórios, 6 acessibilidade.
- Capturas revisadas: temas/tamanho/grade coerentes; em colunas estreitas a situação
  podia ficar cortada no fim do cartão. Ajuste final coloca situação no início,
  identifica mês/intervalo semanal no título e captura evento após rolar no celular.
- Próximo passo: enviar ajuste visual consolidado, confirmar CI final e revisar novas
  capturas. CAL06 ainda pendente até essa revisão. Localhost permanece desligado.
- Ajuste enviado em `8819bce`, CIs finais push 35388521920 e PR 35388527805 em execução.
- Resultado: PR aprovado por completo e capturas revisadas; push falhou no scroll
  de captura por substituição do nó durante dimensionamento. Correção só no teste:
  re-resolver nó e verificar viewport com espera condicionada de até 10s. Próximo
  passo: enviar correção com evidências e acompanhar os checks da revisão corrigida.
- Integração/build/E2E da primeira revisão passaram; evidências em evidence/calendar-2026-09-18.md.
- Primeira validação: formatação e lint dos arquivos alterados aprovados; 19 testes
  unitários de Agendamentos aprovados. Typecheck global com heap 384 MB esgotou memória
  em packages/news; web isolado com 1.024 MB identificou slotLabelFormat renomeado para
  slotHeaderFormat na v7. Corrigido e typecheck da web aprovado antes do push final.

Atualizar este arquivo ao mudar de fase, registrar falhas e o comando exato de
retomada; atualizar também tasks.md e evidências, sem marcar testes não executados.

## Continuidade documental — 21/09/2026

PR34 integrado em dev ed31baf. Decisões Q1/Q2 não integradas foram preservadas e
transferidas após comparação de bases idênticas; nenhuma implementação retomada.
Q3 definida: permissão geral de exportação combinada com acesso ao módulo/dados.
Complemento: módulos sem acesso somem da barra lateral, busca e Início. Regras
transversais em specs 001/002; não criar permissão nova de acesso a Agendamentos.
BEN01–BEN03, BLQ01/BLQ02, CAL06 continuam com os estados anteriores. Próximo passo:
continuar clarify. Q4 resolveu a transição: converter automaticamente quem já tem
permissão antiga de exportação na geral, sem alterar acesso aos módulos; conversão
ainda não executada. Próximo ponto transversal: finalidade de Mensagens.

## Q8 — acesso por módulo — 21/09/2026

Usuário escolheu A: Notícias e Agendamentos exigem acesso concedido por usuário.
Exceção de acesso a qualquer conta administrativa substituída; ocultar sem concessão
na barra lateral, busca e Início e negar URL/API. Specs 001/002/004/008, planos,
contratos e tarefas atualizados; AC01–AC03 pendentes. Nenhuma implementação/teste.
Próxima pergunta: granularidade de permissões internas desses dois módulos.

## Q9 — preservar consulta e alteração separadas — 21/09/2026

Usuário confirmou B e destacou que o padrão já existe. Notícias de fato possui
news:read/write/publish no código e guardas; diagnóstico anterior baseado em docs
estava desatualizado, corrigido nas specs 004/001/002. Não unificar permissões.
Agendamentos ainda verifica sessão sem concessão e é incluído incondicionalmente
no catálogo; registrar/adequar lacuna ao padrão consulta/alteração (AC01–AC03).
Leitura estática apenas; nenhum teste, código ou concessão alterado nesta etapa.


## Checkpoint vigente — revisão de código de 21/09/2026

PR34 integrado na base ed31baf; referências anteriores a PR aberto/branch ativa
são histórico. CAL01–CAL05 têm implementação; CAL06 permanece revisão final de
produto/evidências. Não alterar PR34 nem trabalhar novamente em sua branch.
BEN01–BEN03, BLQ01/BLQ02, AC01–AC03, DX01 e expansões continuam pendentes.
Revisão estática executada; nenhum teste de aplicação ou serviço iniciado.
Detalhes: [revisão transversal](../002-integrated-modules/code-audit-2026-09-21.md).
