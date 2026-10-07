# Auditoria dos quatro repasses e ordem de integração — 02/10/2026

Autoria: CODEX; solicitante não verificado nesta sessão (consulta GitHub HTTP401). Pedido do
usuário: conferir agentcache, entregas e próximos passos, recomendar merges e corrigir ausências de
cobertura no Jira CAAB. Nenhum merge, aprovação de PR, serviço ou alteração de contas foi executado
pela coordenação. Snapshot remoto/local em
[merge-readiness-2026-10-02.json](merge-readiness-2026-10-02.json).

## Resultado da conferência

Os quatro repasses completos estão no caderno principal. Correspondem às pontas Git e aos jobs
remotos conferidos. Existiam notas operacionais superadas dizendo que Agendamentos estava pausado,
T107 pendente e as frentes sem commits/PRs. Esses estados não descrevem as entregas atuais. As
evidências históricas continuam nas respectivas specs; os quatro outputs completos ficam no caderno
por pedido específico do usuário, preservados sem reatribuir autoria.

Fetch confirmou dev/origin/dev em748539d, sem divergência. As quatro worktrees não têm alterações
rastreadas pendentes; Agendamentos mantém somente o agentcache local não versionado. Na principal,
AGENTS, agentcache, guia e runbook locais não rastreados foram preservados. A coordenação não é uma
quinta instância de implementação.

| Frente       | Ponta local / publicada | PR     | CI aprovado            | Limite atual                                                                    |
| ------------ | ----------------------- | ------ | ---------------------- | ------------------------------------------------------------------------------- |
| Documentação | 4b4a79b / 4b4a79b       | 42     | 37031233977            | Revisão humana documental; T099 transversal do programa não concluída.          |
| Agendamentos | b676974 / b676974       | 43     | 37037047877            | Revisão humana sensível e rollout; QA funcional humano pendente.                |
| Acessos      | 0cf18c8 / f804937       | Nenhum | 37034250928 em f804937 | Um commit documental local; conciliação após PR42 e PR funcional ainda ausente. |
| Relatórios   | c8a2614 / 0775bf3       | Nenhum | 37032398048 em0775bf3  | Correção SQL/teste local dependente de Agendamentos ainda não validada no CI.   |

Todos os jobs quality/browser/security dessas quatro execuções foram conferidos com success.
Checkout dos jobs de Acessos/Relatórios confirma os SHAs publicados. PR42/43 estão abertos para dev,
sem merge e mergeable na base consultada. Nenhum deles possui review humano submetido na consulta;
mergeable não substitui aprovação. Esta auditoria não reexecutou testes da aplicação nem fez revisão
funcional integral de cada mudança de código.

## O que integrar e o que aguardar

1. **PR42 — documentação:** primeiro candidato a merge em dev após leitura/aprovação documental
   humana. São36 arquivos documentais; não altera aplicação. QA funcional das outras frentes não
   bloqueia a consolidação. A matriz AC já está incluída: não criar PR duplicado de revisão.
2. **PR43 — Agendamentos:** próximo merge funcional prioritário. Depois de42, conferir a combinação
   dos acréscimos HIN no spec/plano de programa002 com a consolidação, os checks da base resultante
   e revisão humana de agenda, permissões, bloqueios, anexos e rollout0031–0034. A simulação somente
   leitura `git merge-tree 748539d 4b4a79b b676974` combina ambos os documentos sem marcadores de
   conflito; isso não comprova coerência semântica nem dispensa CI/revisão da versão integrada.
   T107/T039 estão tecnicamente concluídos:118 integrações de Agendamentos,101 E2E,6 a11y e revisão
   IA de18 capturas. Não aguardar recuperação do WSL para repetir essas provas já aprovadas. QA
   humano pode ser feito em DEV após integração revisada; registrar pessoa, ambiente, commit e
   resultado. Não confundir merge em dev com homologação ou autorização de promoção a main.
3. **Acessos:** aguarda42 para conciliar na própria branch, mantendo DS/AC/roles.md e eliminando do
   diff os66 acréscimos já integrados. Publicar também o commit documental local, validar a ponta
   conciliada e abrir PR funcional conforme autorização anterior. A correção G01 é isolável; não
   depende de concluir G02/G03 ou P01 para ser revisada, nem encerra aceite global de cargos.
4. **Relatórios:** aguarda a base de Agendamentos em dev. Conciliar por trechos runtime.ts,
   export-screen.tsx, reports.ts, report-summary.ts e report-overview-export.ts, preservando os três
   grupos de adaptadores, hooks aditivos, projeção bookings, helpers e gerador agrupado. Executar
   T041/T042 na versão real combinada, publicar c8a2614 conciliado e validar o novo CI. Ainda faltam
   C1/T038, inspeção visual e QA humano. Não abrir/mergear o recorte completo usando como prova o CI
   de0775bf3: esse SHA não contém a correção dependente de original_start.

Antes de aplicar0031, diagnosticar sobreposições legadas; a migration aborta diante de conflitos e
não cancela reservas. As quatro migrations foram validadas em banco descartável; banco de uso não
foi alterado. Contadores históricos desconhecidos continuam nulos. Rollout deve preservar dados e
compatibilidade. O workflow exige revisão humana específica de mudanças sensíveis e homologação de
DEV; não estabelece homologação funcional em DEV como pré-requisito circular do próprio merge em
dev. Serviços locais permanecem desativados sem nova ordem.

## Cobertura Jira: entregas, execução e próximo trabalho

| Frente/recorte                                   | Ticket responsável                                                                                                                                        | Estado ou próximo critério                                                                       |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Consolidação e coordenação documental            | Conciliar a documentação do projeto (CAAB-38)                                                                                                             | PR42 em Code Review; T099 de spec002 acompanha revisão final por função após combinação.         |
| Guia de design e DS                              | Consolidar o guia de design do projeto (CAAB-39)                                                                                                          | Recorte documental no PR42, agora Code Review; não significa UI implantada.                      |
| Organização administrativa da agenda             | Agendamentos (CAAB-37)                                                                                                                                    | Épico mantém desenvolvimento; revisão, rollout e QA das entregas próprios.                       |
| Conflitos de beneficiário e diagnóstico0031      | Impedir sobreposição de agendamentos da mesma pessoa (CAAB-26)                                                                                            | Em Teste / QA; critério de rollout explícito.                                                    |
| Pessoa bloqueada                                 | Sinalizar reservas de pessoa bloqueada sem cancelá-las (CAAB-27)                                                                                          | Em Teste / QA, coberto por PR43.                                                                 |
| Consulta/escrita de agenda                       | Separar consulta e alteração em Agendamentos (CAAB-28)                                                                                                    | Em Teste / QA, coberto por PR43.                                                                 |
| Aprovação/remarcação/recuperação e schema0032    | Operar aprovação, remarcação e recuperação de atendimentos (CAAB-40)                                                                                      | Em Teste / QA; dependência de compatibilidade de Relatórios vinculada.                           |
| Faltas/comprovantes/revisor                      | Tratar faltas, justificativas e contestações (CAAB-41)                                                                                                    | Em Teste / QA, coberto por PR43.                                                                 |
| Revisão e aceite global de cargos                | Gerenciar cargos e acessos de Administrador, Gestor e Colaborador (CAAB-19)                                                                               | AC01–AC14; G02/AC-T003, G03/AC-T004 e AC-T006 explícitos nos critérios.                          |
| Autocadastro e criação administrativa            | Restringir criação de contas ao fluxo administrativo (CAAB-18)                                                                                            | Base integrada, QA humano pendente; não reconstruir.                                             |
| G01: link Novo agendamento em Mensagens          | Mostrar apenas funções autorizadas na navegação (CAAB-20)                                                                                                 | Correção f804937 e CI aprovados, aguarda conciliação/PR/QA.                                      |
| P01: alcance do cargo base para contas sem cargo | Definir o tratamento das contas atualmente sem cargo (CAAB-47)                                                                                            | Nova subtarefa de19, Backlog, decisão humana pendente; nenhum backfill autorizado.               |
| Conjunto completo de Relatórios                  | Exportar o conjunto completo de dados em Relatórios (CAAB-24)                                                                                             | Pai mantém desenvolvimento e responsável existente.                                              |
| Detalhe já integrado                             | Exportar análise detalhada sem agrupamento (CAAB-43)                                                                                                      | Em Teste / QA; preservar recorte e motor.                                                        |
| Modos agrupado/resumo/evolução e compatibilidade | Exportar detalhe agrupado, resumo e evolução sem os limites antigos (CAAB-44)                                                                             | Agora Em Desenvolvimento; T040–T042 e dependência de40 explícitos.                               |
| Provas remanescentes de Relatórios               | Retomar validações de Relatórios bloqueadas pelo WSL (CAAB-46)                                                                                            | Aberto; CI remoto reduziu bloqueio, ainda cobre versão combinada, C1 e imagens/QA.               |
| Motor compartilhado preservado                   | Disponibilizar motor compartilhado de download direto (CAAB-22)                                                                                           | Reutilização, sem reconstrução autorizada.                                                       |
| Downloads antigos                                | Revalidar acesso ao baixar arquivos antigos (CAAB-25)                                                                                                     | Critérios existentes preservados; teste de preservação não declara entrega nova concluída.       |
| Envio real adiado                                | Entregar os avisos operacionais de Agendamentos por e-mail (CAAB-42) e Homologar os avisos operacionais após disponibilizar o serviço de e-mail (CAAB-45) | Backlog, dependentes de Serviço de e-mail transacional e definição da caixa de entrada (CAAB-2). |
| Consumidores externos adiados                    | Permitir agendamento pelo app e site (CAAB-30)                                                                                                            | Backlog; nenhuma ativação por estes merges.                                                      |

G02 é o cenário de delegação Gestor-terceiro com Colaborador efetivamente atribuído e escrita
concedida executada. G03 ainda exige expiração durante espera por lock; polling/foco/navegação já
provados para G01 não equivalem a essa prova. São lacunas de cobertura, não defeitos confirmados.
Mantidas nos critérios do ticket funcional, sem duplicar testes rotineiros em novos tickets.

## Alterações aplicadas e verificadas no Jira

- Criada e relida a subtarefa Definir o tratamento das contas atualmente sem cargo (CAAB-47), pai19.
- Atualizadas13 descrições, preservando conteúdo e histórico, marcando o inventário inicial como
  retrato anterior e acrescentando versão/limites/critério atual.
- Conciliar a documentação do projeto (CAAB-38) e Consolidar o guia de design do projeto (CAAB-39)
  encaminhados para Code Review; Exportar detalhe agrupado, resumo e evolução sem os limites antigos
  (CAAB-44) para Em Desenvolvimento. Não marcou funções concluídas ou homologadas.
- Criado e relido vínculo Blocks de Operar aprovação, remarcação e recuperação de atendimentos
  (CAAB-40) para Exportar detalhe agrupado, resumo e evolução sem os limites antigos (CAAB-44).
- Não alterou responsáveis humanos, comentários anteriores, contas, permissões ou dados.

**Correção ainda manual:** remover os vínculos históricos Blocks IDs10050/10051 de Entregar os
avisos operacionais de Agendamentos por e-mail (CAAB-42) para os recortes40/41. Os e-mails adiados
não bloqueiam os recortes administrativos. A interpretação vigente foi corrigida nas descrições
de42/40/41, mas os vínculos nativos continuam. O conector não oferece delete e o controle de
interface retornou nenhuma superfície disponível/Chrome indisponível. Preservar os vínculos de
Serviço de e-mail transacional e definição da caixa de entrada (CAAB-2) para42/45. Não afirmar
correção integral dos vínculos enquanto essa ação não for confirmada. A conversão nativa de20 para
subtarefa de19, o índice Banco e filtro salvo já tinham impedimentos próprios; não foram
reexecutados nesta auditoria.

## Próxima instrução para cada instância

- **Documentação:** entrega publicada; aguardar revisão/merge humano de42, preservar worktree e
  evidências. Não reutilizar branch após merge. T099 final fica explícita para a versão combinada.
- **Agendamentos:** revisar o resultado após42, conservar HIN, conferir checks/revisão e diagnóstico
  de rollout antes do merge humano de43; acompanhar QA em DEV com versão identificada. Não repetir
  T107 por falta de WSL nem ativar e-mails/app/site/WAHA.
- **Acessos:** depois de42, atualizar mesma branch e conciliar apenas acréscimos funcionais/G01;
  publicar documentação local, validar e abrir PR da correção. Próximas provas G02/G03 ficam em19;
  decisão P01 fica em47, sem atribuição retroativa de cargos.
- **Relatórios:** depois de43, atualizar mesma branch, preservar arquivos compartilhados por
  trechos, executar T041/T042 e C1, obter/revisar artefatos e publicar ponta conciliada para CI.
  Abrir PR somente após gates completos; QA humano continua separado. Não copiar migrations.

Instruções respeitam autorizações anteriores de cada frente para commits/push/PR e não concedem
merge ou promoção a main. Enquanto aguarda dependências, não iniciar serviços nem ampliar produto.
