# Fechamento de Agendamentos — rollout e conciliação documental

Autoria: CODEX; solicitante mafaltti (login Danilo-Komunick), identidade consultada pelo conector
GitHub get_profile nesta sessão em 02/10/2026. Revisão somente por leitura, sem execução de
migrations, consultas ao banco, serviços, testes de aplicação, edição das worktrees ou merge.

Escopo: Conciliar a documentação do projeto (CAAB-38), Consolidar o guia de design do projeto
(CAAB-39), Impedir sobreposição de agendamentos da mesma pessoa (CAAB-26) e Operar aprovação,
remarcação e recuperação de atendimentos (CAAB-40). A instância de Agendamentos incorpora os
encaminhamentos pertinentes na spec008; este relatório local não substitui seus contratos.

## Versões e conclusão

Atualização de 05/10/2026-CODEX-mafaltti: R04 abaixo é o retrato de b676974 e está superado pela
decisão explícita do usuário e pela migration 0036. Contadores NULL passam a zero, com incremento de
versão; eventos e contadores conhecidos são preservados. Uma reserva com remarcações históricas e
contador desconhecido recebe o orçamento de remarcações a partir de zero. A política atual e sua
validação constam na [revisão de 05/10](../review-fixes-2026-10-05.md); não executar R04 como regra
vigente nem atribuir esta decisão ao autor da revisão original.

- PR42: 4b4a79b46dd5e274cc1730e04e3138c08216291a, worktree
  C:/Projetos/caabnovo/.cache/pr-docs-roles-20260923, preservada e sem alterações.
- PR43: b676974a3514f87fcdfbdc943d74e9a013e5dbac, worktree
  C:/Projetos/caabnovo/.cache/pr-scheduling-research-20260923; branch
  feature/scheduling-administrative-20261002. HEAD local coincide com o PR aberto. O arquivo local
  não rastreado docs/agentcache.md foi observado e preservado; não é fonte da fila.
- Base comum: 748539d28ec7c94af5ff3ca7a37c46c73ae102e4.
- CI do PR43, execução37037047877, relida pelo conector GitHub: quality/browser/security success. CI
  é evidência técnica daquele SHA, sem homologação humana.
- Comparação estática git merge-tree 748539d 4b4a79b b676974, forma de três argumentos sem escrita:
  nenhum marcador de conflito encontrado. Isso não valida a aplicação combinada nem substitui
  checks/revisão após a integração documental.

Não foi identificado defeito bloqueante nas migrations examinadas. A revisão humana específica de
agenda, bloqueios, permissões e dados continua obrigatória pelo workflow. Homologação humana em DEV
ainda não realizada. Preflight e retorno no banco de destino permanecem sem evidência; devem ser
tratados como gates de implantação. Se o merge dispara essa implantação sem pausa, resolver esses
gates antes do merge.

Nas tabelas abaixo, caminhos de código/spec008 referem-se ao PR43/b676974; caminhos de Fundação/guia
consolidados referem-se ao PR42/4b4a79b. Linhas pertencem a esses snapshots.

## Achados e encaminhamentos para a instância de Agendamentos

| ID  | SHA, arquivo e linha                                                                                                                                                                        | Evidência e impacto                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Bloqueia merge?                                                                                                                                                                                |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R01 | b676974, packages/db/migrations/0031_scheduling_beneficiary_overlap.sql:4, :8, :23; packages/db/scripts/check-scheduling-beneficiary-overlaps.sql:3                                         | Diagnóstico retorna pares de IDs/intervalos; não altera reservas. A migration repete a checagem sob lock e aborta com23P01 diante de conflito. Exclusão global por member_id, intervalo [), apenas scheduled nesta etapa. Conflitos no destino exigem decisão explícita; não cancelar, trocar pessoa ou apagar histórico automaticamente. IDs do diagnóstico também exigem proteção de acesso.                                                                                      | Não há falha de código observada. Resultado conflitante bloqueia aplicação de0031/ativação; se acopladas ao merge, bloqueia esse fluxo até resolução autorizada.                               |
| R02 | b676974, packages/db/src/migrate.ts:20, :30, :38, :44; migrations0031:4 e0032:3                                                                                                             | Runner ordena nomes, verifica SHA-256 e confirma cada arquivo em transação própria. Ordem0031 →0032 →0033 →0034. A falha de0032 não desfaz0031 já confirmada; checksum divergente interrompe execução. ALTERs/exclusões podem exigir locks mais fortes e varredura/backfill da tabela. Não há lock_timeout nem coordenação global de runners aqui. Usar um único executor, janela definida e controle dos escritores/worker.                                                        | Plano de janela/estado parcial é gate operacional, não defeito novo. Precisa estar aprovado antes do merge se DEV atualizar automaticamente.                                                   |
| R03 | b676974, packages/db/migrations/0032_scheduling_administrative_workflow.sql:26, :40, :43, :47, :66, :105                                                                                    | Backfill apenas de procedure_id derivado da assignment existente. Contadores anteriores ficam NULL; DEFAULT0 vale para novas linhas. Constraints preservam coerência por modo/estado e duas exclusões abrangem scheduled/pending_approval. Capacidade usa pico simultâneo por serviço sob advisory lock5010/1; profissional nulo não dispensa limite nem exclusão por pessoa. Reserva sem horário não ocupa.                                                                        | Não há falha bloqueante observada. Conferir integridade, volume/tempo de backfill e capacidade efetiva no destino antes de ativar escrita.                                                     |
| R04 | b676974, apps/web/modules/scheduling/booking-workflow.ts:249; specs/008-scheduling-management/contracts/admin.md:146; specs/008-scheduling-management/spec.md:155                           | NULL provoca SCHEDULING_COUNTER_UNKNOWN em nova troca voluntária; não presumir zero por falta de eventos. Recuperação isenta é processo separado e conserva contador. Falta decisão/processo autorizado para conciliar históricos; não há ferramenta de conciliação comprovada por esta revisão.                                                                                                                                                                                    | Não bloqueia o recorte novo seguro. Bloqueia permitir troca voluntária de registros com contador desconhecido. Registrar decisão e evidência antes de qualquer backfill; não inventar solução. |
| R05 | b676974, packages/db/migrations/0033_scheduling_absence_penalties.sql:34, :64; packages/db/migrations/0034_scheduling_system_events.sql:2, :8; apps/worker/src/jobs/finalize-absences.ts:13 | 0033 cria trilha/intenções e permission, sem atribuir cargos ou concessões.0034 conserva eventos antigos como user e admite actor_id NULL somente para system/cancelled ou system/finalized. Worker finaliza a cada minuto, com causalidade e idempotência. App e worker novos só podem operar após0034; sem usuário fictício, seed de concessões ou dispatcher de e-mail.                                                                                                          | Revisão sensível humana obrigatória. Coordenação de versão/schema/worker é gate de implantação. Nada autoriza executar o worker ou migrations nesta análise.                                   |
| R06 | b676974, specs/008-scheduling-management/plan.md:338, :915; packages/db/src/migrate.ts:45; PR42, docs/DELIVERY-WORKFLOW.md:97 e:190                                                         | Transação falha conserva o arquivo corrente; lote inteiro não é atômico. Novos estados/NULLs e eventos de sistema tornam binário antigo um retorno inseguro. Preparar backup verificável, ensaio de restauração isolada e correção para frente. Não remover migrations, reescrever checksum nem apagar registros para recuperar. Restore anterior sobre banco que recebeu novas escritas perde essas escritas; exige retenção/reconciliação delas antes de qualquer decisão humana. | Falta evidência específica do ambiente de destino. Bloqueia rollout sem plano de recuperação aprovado; merge depende de esse rollout estar desacoplado ou preparado.                           |
| R07 | b676974, specs/008-scheduling-management/contracts/channels.md:83, data-model.md:172; PR42, specs/002-integrated-modules/spec.md:3                                                          | Trechos históricos dizem que o schema não aceita NULL/pending e usam nome0032_scheduling_channels; o topo do modelo/contrato administrativo define a evolução implementada0032_administrative_workflow. Retratos do PR42 registram validação local anterior ao CI final de PR43. Acrescentar checkpoint datado com SHA/CI e delimitação do histórico, sem substituir textos completos nem reatribuir autoria.                                                                       | Não é defeito funcional. Ajuste documental recomendado antes do fechamento para evitar executar proposta antiga; a instância dona deve incorporar.                                             |
| R08 | b676974, specs/002-integrated-modules/spec.md:445, plan.md:469; PR42, specs/001-project-foundation/tasks.md:12, :42, :1136; specs/001-project-foundation/contracts/roles.md:111             | PR43 modifica o programa somente com acréscimos HIN e não altera Fundação nem MODULES/STACK contra a base comum. Preservar HIN-FR-01–05 e planejamento, DS-T133–140, AC01–14/AC-T001–006, T139/T140 originais e decisão pendente de roles.md. Não copiar versões inteiras da base de PR43 sobre PR42.                                                                                                                                                                               | Sem conflito textual observado. Perda de qualquer bloco na conciliação bloqueia fechamento documental/merge até correção. HIN não comprova visão unificada/compras implementadas.              |

## O que o banco descartável já comprova

Evidência durável: specs/008-scheduling-management/evidence/publication-2026-10-02.md:120 e :147,
com manifesto JSON adjacente. A publicação descreve PostgreSQL18 descartável,347 integrações
aprovadas, sendo118 de Agendamentos; um teste opcional de volume de Relatórios ignorado. Esta
revisão leu evidência/código/checks; não repetiu suítes nem inspecionou banco ou imagens.

| Garantia                                                                                                      | Teste/linha no SHA b676974                                       | Limite da prova                                                                                                          |
| ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Instalação ordenada desde banco vazio e reexecução sem reaplicar                                              | packages/db/tests/migrations.test.ts:23 e:65                     | Prova runner em fixture; não verifica ledger/checksums nem privilégios do destino.                                       |
| Sobreposição parcial, adjacência, cancelados e familiares distintos                                           | apps/web/tests/integration/scheduling.test.ts:265                | Valida banco sintético e exclusão por pessoa; não inventaria reservas reais.                                             |
| Diagnóstico, recusa de0031 e retenção dos registros                                                           | apps/web/tests/integration/scheduling.test.ts:303                | Recria conflito em transação/savepoint e verifica IDs/status/versão; não mede lock em volume de destino.                 |
| Upgrade pré0032, procedure_id, contador NULL e exclusões para pendências                                      | apps/web/tests/integration/scheduling-workflow.test.ts:334       | Fixture com uma reserva antiga; não é ensaio completo de banco histórico volumoso/restore ou upgrade populado de0033–34. |
| Capacidade3 sob20 requisições, pendência e conflito pessoal                                                   | apps/web/tests/integration/scheduling-workflow.test.ts:813 e:728 | Essa prova não fornece benchmark do lock global nem de todas as distribuições de duração/ocupação do destino.            |
| Redução incompatível de política e edição conflitante conservam dados; recuperação isenta não reoferta origem | apps/web/tests/integration/scheduling-workflow.test.ts:435 e:831 | Confirmar operação humana/publicação e disponibilidade na implantação real.                                              |
| Sem profissional/horário, estados explícitos e cancelamento no resumo                                         | apps/web/tests/integration/scheduling-workflow.test.ts:632       | Cobre projeções do PR43; não valida a implementação local combinada de Relatórios ainda não integrada.                   |
| Finalização system, cancelamentos causais e retry sem duplicação                                              | apps/web/tests/integration/scheduling-absence.test.ts:628        | Não confirma cron, privilégios, backlog ou heartbeat do worker implantado.                                               |

CI remoto conferido: https://github.com/Komunick/caabnovo/actions/runs/37037047877. A versão
PostgreSQL de teste vem de packages/db/tests/postgres-container.ts:7 (18-alpine). Não foi consultada
versão/extensões/volume do banco de destino.

## Conferência no destino e recuperação

Responsável humano de implantação/DBA e mantenedor técnico: nomes ainda a designar.

1. Antes da janela: registrar ambiente DEV separado, banco/versão/extensões, aplicação/worker atuais
   e ledger/checksums até0030 ou último estado real. Conferir ausência de numeração concorrente,
   permissões do executor e btree_gist. Inventariar reservas futuras, ligações assignment/procedure,
   eventos e contagens de linhas/IDs sem exportar nomes/documentos. Distinguir banco atual do CAAB
   de importação futura do legado externo; esta entrega não autoriza importação/coexistência.
2. Preparar backup datado e verificável, responsáveis/janela e restauração em destino isolado.
   Conferir schema/constraints, reservas, autores, histórico, arquivos e grants na cópia restaurada,
   além da simples contagem de tabelas. Guardar hash, log e critério de recuperação.
3. Executar diagnóstico read-only de0031 no destino sob autorização operacional própria. Resultado
   vazio permite prosseguir; pares exigem decisão explícita. Revalidar imediatamente antes da
   aplicação; a checagem na migration protege contra conflitos criados após o diagnóstico.
4. Controlar escritores/API/worker na janela. Aplicar o runner uma única vez, em ordem0031–34, com
   binário aprovado e ledger/log por arquivo. Definir previamente limite de espera por lock, duração
   da janela e critério de abortar, sem contornar a verificação de checksum.
5. Em falha, interromper ativação, registrar último COMMIT do ledger e erro. Não assumir rollback
   total. Reexecutar pendentes somente após resolver a causa e reconferir checksums/preflight.
   Correção de schema aplicado deve ser nova migration validada em cópia descartável.
6. Depois de0034: confirmar ambas exclusões com predicado scheduled/pending_approval, CHECKs por
   modo/estado, contador histórico NULL/novo0, autoria user/system, privilégios e ausência de
   concessão automática. Publicar app/worker compatíveis, verificar cron/logs e smoke sintético.
   Conservar intervalos de referência históricos sem apresentá-los como horários confirmados.
7. Se necessário recuperar a aplicação, selecionar versão compatível com esse schema/dados ou
   corrigir para frente. Preservar IDs/eventos/intenção e todas as escritas posteriores ao backup.
   Retorno SQL/restauração sobre o destino requer plano e decisão humanos próprios; não apagamento
   de tabelas/arquivos ou uso de snapshot antigo com perda silenciosa.

## Roteiro curto de homologação humana em DEV

Estado de todos os itens: **não executado nesta revisão**. Só executar após disponibilização
autorizada. Registrar nomes reais dos responsáveis, data, URL/identificador de DEV, banco isolado,
SHA efetivamente implantado e resultado observado. Referências de entrada: PR42/4b4a79b e
PR43/b676974; o SHA integrado/deployado será outro e deve ser preenchido. Usar contas e pessoas
sintéticas, America/Bahia na apresentação, temas claro/escuro e desktop/móvel. Não enviar e-mail.

| Passo                           | Responsável humano                     | Ação e resultado esperado                                                                                                                                                                                                                                                                        | Evidência a registrar                                                                                             |
| ------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| H01 — versão/rollout            | Implantação/DBA + mantenedor           | Conferir release/worker/ledger0031–34 e preflight sem conflitos; antigas reservas/IDs/autores mantidos, NULL histórico preservado.                                                                                                                                                               | SHA implantado, ambiente, ledger/checksums, diagnóstico e backup/restore protegido; decisão operacional assinada. |
| H02 — pessoa e capacidade       | Operador de Agendamentos + homologador | Reservar a mesma pessoa em unidades/profissionais distintos com sobreposição: recusar sem alterar origem. Adjacentes e familiares com IDs distintos: permitir quando elegíveis. Capacidade3: confirmadas e pendentes disputam três vagas; quarta recusa.                                         | IDs sintéticos, horários, telas e histórico antes/depois; estados/ocupação esperados.                             |
| H03 — aprovação/rascunho        | Equipe responsável + homologador       | Salvar rascunho conserva oferta publicada; publicar valida e muda revisão. Pedido manual ocupa; confirmar conserva intervalo/duração, recusar libera apenas destino. Decisão em versão antiga e leitor sem escrita recusados.                                                                    | Capturas de política/fila, versões, autores/eventos e resultado de cada tentativa.                                |
| H04 — troca/recuperação         | Operador + homologador                 | Duas trocas voluntárias confirmadas permitidas, terceira negada; recusa/alternativa mantém um ciclo e não restaura origem. Histórico NULL recusa nova troca sem conciliação. Indisponibilidade inicia recuperação no mesmo ID, bloqueia origem e não cobra troca; falha conserva tudo.           | ID constante, contador/processo antes/depois, origens/destinos, conflitos e histórico auditável.                  |
| H05 — autoria e compatibilidade | Mantenedor + revisor autorizado        | Observar em massa sintética controlada finalização de sistema sem duplicata, sem afetar familiares/fora do período; conferir cron e histórico Sistema. Reservas sem profissional/horário aparecem com estado correto em agenda/Relatórios/CSV-Excel-PDF; intenção pending não significa enviado. | Logs do worker sem segredos, IDs/eventos, exportações sintéticas, amostra de telas1280/390/320 e teclado/foco.    |

H05 é smoke de compatibilidade/autoria de0033–34, não substitui o roteiro completo de faltas nem a
revisão de permissões/comprovantes da instância de Acessos. Mérito das justificativas pertence à
equipe.

Assinatura final: responsável de negócio + mantenedor; registrar aprovado/reprovado/pendente por
cenário e impedimentos. QA em DEV após integração revisada não autoriza promoção a main.

## Preservação documental e próximos passos

PR43 não tem delta na Fundação contra748539d. Portanto seu roles.md é a versão-base; PR42 acrescenta
a decisão pendente em:111 e deve prevalecer nesse contrato. Os blobs são diferentes por essa adição,
não por regressão funcional. Preservar blocos DS/AC e autoria de PR42, sem deduzir cargo retroativo.
Programa002 deve reunir a consolidação de PR42 com HIN de PR43. A frase do plano HIN sobre guia
inacessível refere-se à sessão histórica de24/09; o guia canônico hoje existe no PR42.

Ordem recomendada: revisar PR42 e43 em paralelo; integrar42 antes de43 sob autorização humana,
conferir composição/checks, revisão sensível e plano de destino. Depois homologar DEV no SHA
implantado. E-mails, app/site e WAHA continuam adiados; sua ausência não bloqueia o recorte
administrativo. A entrega independente de Relatórios não é dependência de merge do PR43; sua
conciliação futura exige testes próprios. T099 transversal, DS/AC, decisões de contas sem cargo e
homologações não são encerrados por este relatório.

A instância de Agendamentos deve incorporar o checkpoint documental R07 e o plano de destino/
recuperação aplicável, anexar os repasses das demais revisoras e responder a cada risco. Nenhuma
edição, aprovação de PR, migration, teste de aplicação, QA humano ou merge foi realizado aqui.

## Verificações desta revisão

Formatação explícita Prettier aprovada.27 referências completas de arquivo/linha conferidas por git
show nos SHAs de origem; referências abreviadas adicionais confrontadas nas leituras numeradas.
Diff-check sem falhas. Diferença de migrations contra a base inclui somente0031–0034: 0001–0030 não
foram reescritas pelo PR43. Confronto de três árvores sem escrita não encontrou conflitos textuais.
Worktree documental permanece limpa em4b4a79b; os novos documentos locais de revisão da instância
dona de Agendamentos foram apenas observados e preservados. Sem teste novo de aplicação/banco,
leitura de credenciais ou mudança de PR nesta atividade.
