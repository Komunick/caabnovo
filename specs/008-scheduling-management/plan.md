# Implementation Plan: Agendamentos

## Ajustes após análise do PR #50 — 07/10/2026-CODEX-mafaltti

Na mesma branch aberta, aplicar na lista diária o fallback já adotado no calendário e detalhe.
Conferir renderização com e sem profissional nos dois temas e em 320/390/1280 px, tipos, lint e
formatação; validar os gates da nova ponta no CI, sem iniciar servidor ou banco local.

Alinhar o comentário de `.gitleaksignore` à referência canônica da spec010, já integrada em dev pelo
PR #46, preservando a triagem local e as entradas dos fingerprints. Comparar o arquivo completo com
dev e o PR #48 e simular a combinação das branches para verificar a ausência de conflito nesse
arquivo. Título/corpo incluem CI/Gitleaks e o efeito de sua reversão, considerando a ordem de
integração dos PRs #46/#48/#50. Preservar provas anteriores por SHA; não atribuir o CI de `9edc288`
ao novo código.

## Correção visual após revisão — 06/10/2026-CODEX-mafaltti

Autorização atual: implementar VQA01–VQA04 na worktree da revisão, atualizada com origin/dev
`9dc6a7f` e branch renomeada para `fix/scheduling-visual-20261006`. Preservar relatório/capturas
originais e não reutilizar branches de PRs integrados.

1. Reservar no título do diálogo compartilhado a área do botão Fechar, com a medida existente do
   alvo, sem mudar paleta ou reduzir fonte; revisar o título longo nos dois temas e três larguras.
2. Guardar a referência do acionador das decisões de reserva e restaurar foco no fechamento, quando
   ainda conectado e habilitado; não executar comandos ao desistir.
3. Corrigir a identificação no calendário por capacidade e a apresentação de histórico/contadores,
   preservando conteúdo de snapshots, vínculos, datas e dados exportados.
4. Acrescentar regressões de componentes e ao E2E administrativo existente; validar tipos, lint,
   formatação e Chromium com componentes reais e respostas sintéticas interceptadas, sem iniciar
   servidor/banco. Registrar evidência distinguindo componentes locais de E2E com backend e do site
   hospedado. Build/CI, publicação, PR, deploy e homologação não são presumidos por este recorte.

Critérios no [incremento visual da spec](spec.md) e em VQA01–VQA04 de [tasks.md](tasks.md).

## Correções da revisão — 05/10/2026-CODEX-mafaltti

Tratar os achados confirmados na branch do PR43. Preservar migrations 0031–0034; acrescentar
migration 0036 (0035 reservada pela frente de cargo base) para contador legado, trigger e índices.
Validar atualização sobre schema anterior, manutenção de reserva confirmada após bloqueio e negação
de nova ocupação/aprovação. Isolar provas novas, revalidar upload após locks, auditar leitura/grant
e separar leitura de revisão do lock global. Savepoints isolam falhas do job; exceção após commit
mantém retry e observabilidade. Causas originais são preservadas por ocorrência em erro agregado;
handler registra SQLSTATE validado e mensagem segura. Serialização explícita protege a saída
persistida pelo pg-boss sem perder a causa em memória. Rascunhos de exportação incluem filtros de
origem. Política padrão de serviços legados (90 dias/24 horas) será explícita no roteiro de rollout.
Testes locais leves e CI completo; nenhum serviço de uso iniciado.

## Fechamento do escopo atual — 05/10/2026-CODEX-mafaltti

Decisão do usuário: concluir a entrega administrativa atual, sem ampliar funcionalidades. Este
recorte prevalece sobre sequências antigas de pesquisa, canais e roadmap abaixo. Autoria CODEX;
solicitante mafaltti (Danilo-Komunick), perfil GitHub consultado em 05/10. A atualização organiza o
fechamento; não declara implementação validada, integração ou homologação.

### O que entra nesta entrega

- Impedir sobreposição de agendamentos da mesma pessoa (CAAB-26).
- Sinalizar reservas de pessoa bloqueada sem cancelá-las (CAAB-27).
- Separar consulta e alteração em Agendamentos (CAAB-28), incluindo revisão dedicada de faltas.
- Operar aprovação, remarcação e recuperação de atendimentos (CAAB-40).
- Tratar faltas, justificativas e contestações (CAAB-41), com comprovantes privados.
- Preservar calendário, catálogo/horários, auditoria, exportações administrativas já implementadas e
  compatibilidade com consumidores existentes. Preservar migrations 0031–0034 e os dados.

As regras BF/2C e os contratos existentes não são redesenhados. Intenções de aviso persistidas
continuam no recorte; transporte e entrega real não entram.

### Sequência restante, sem frentes novas

| Ordem | Trabalho restante                                                                                                                                                                                                         | Controle                                                            |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 1     | Corrigir a asserção incompatível em scheduling-absence.test.ts:880, preservando tipo/status e negação sem efeitos; concluir a matriz de comprovantes e as provas S01/S02 na nova ponta.                                   | T111; permissões e faltas.                                          |
| 2     | Concluir CI aplicável ao delta e revisão das evidências de upload; tratar apenas falhas comprovadas. Não repetir pesquisa ou suítes já válidas sem mudança pertinente.                                                    | T111; mesma branch/PR43.                                            |
| 3     | Receber revisão externa da versão final de permissões, arquivos, agenda e concorrência; responder aos achados. Lacunas L01/L02 permanecem registradas, sem inventar funcionalidades ou presumir aprovação.                | T110; cinco tickets administrativos.                                |
| 4     | Após integração real do PR42, conferir composição documental por trechos, preservando DS/AC/roles/HIN e contratos. Verificar gates afetados da versão resultante.                                                         | T110.                                                               |
| 5     | Preparar diagnóstico de legado, backup/restore, janela/executor único e compatibilidade app/worker; solicitar decisão de merge com resultado concreto. Se merge dispara implantação, resolver condições do destino antes. | T110; revisão sensível humana.                                      |
| 6     | Após integração autorizada, registrar homologação humana em DEV por versão, responsável e resultado; corrigir somente defeitos que contrariem os critérios atuais.                                                        | Aceite dos tickets administrativos; sem promoção automática a main. |

Última versão conferida: PR43 aberto em 4e427ac. CI de PR/push com browser/security aprovados e
quality falhando: 351 integrações aprovadas, uma falha de asserção e uma opcional ignorada. A
resposta 403 não tem o campo code esperado pelo teste; o caso interrompido não prova toda a matriz
de isolamento. CI antigo de b676974 não cobre o delta. Não iniciar implementação nesta atualização
documental.

### O que fica para depois

- Permitir agendamento pelo app e site (CAAB-30): sessão externa, UI01/UI02, consumidores e
  reconciliação/migração externa; T041–T077 conservam seu escopo futuro, sem nova execução para
  repetir as contrapartes administrativas já entregues.
- Entregar os avisos operacionais de Agendamentos por e-mail (CAAB-42) e Homologar os avisos
  operacionais após disponibilizar o serviço de e-mail (CAAB-45): T089, dependentes de Serviço de
  e-mail transacional e definição da caixa de entrada (CAAB-2). Não bloqueiam esta entrega.
- WAHA, avaliações, expansões de horários/comunicação e novas equivalências de legado (T021–T024);
  cancelamento além do período contratado (T097) permanece possibilidade não autorizada.
- Exportações agrupadas, resumo/evolução e validação da combinação futura pertencem a Relatórios, em
  Exportar detalhe agrupado, resumo e evolução sem os limites antigos (CAAB-44). Não são
  pré-requisito invertido de Agendamentos.

### Critério de encerramento

Encerrar o recorte administrativo quando os cinco tickets atenderem seus critérios com revisão
externa, gates da versão final, integração autorizada e homologação identificada. O épico
Agendamentos (CAAB-37) pode continuar aberto pelos recortes futuros, sem prolongar este fechamento.
Nenhum item é concluído apenas por este limite de escopo. Novos pedidos vão ao backlog responsável e
exigem priorização explícita; defeitos do escopo atual continuam sendo corrigidos.

## Consolidação final em andamento — 02/10/2026-CODEX-Gabriel-Komunick

Os três pareceres de b676974 foram recebidos e consolidados, com autoria/hashes preservados em
[evidência](evidence/closeout-review-2026-10-02.md). S01/S02 de segurança confirmados por inspeção:
isolamento dos comprovantes e reautorização/prazo após espera pelo arquivo corrigidos localmente;
cinco regressões PostgreSQL reais preparadas e jornada de upload atualizada, aguardando CI próprio.
Passaram96 unitários pertinentes, tipos web e lint; não são prova de PostgreSQL.
Migrations0031–0034, HIN e contratos de Relatórios preservados. T107/T039 aprovados de b676974 não
cobrem o delta novo. PR42 ainda aberto: conciliação com dev pendente. T110/T111 controlam o
fechamento/correção desta rodada. QA humano e rollout no destino continuam pendentes; sem merge ou
serviços locais.

## Retomada e adiamento de e-mail — 02/10/2026-CODEX-SOLICITANTE_NAO_VERIFICADO

O usuário autorizou conciliar a worktree preservada com dev e concluir/validar sobreposição,
bloqueios, permissões, aprovação/remarcação e faltas. Em resposta posterior, informou que o serviço
de e-mail ainda não foi criado e adiou a integração e homologação dos avisos. O código SMTP de
contas é referência técnica, não prova de serviço disponível.

Entregar os avisos operacionais de Agendamentos por e-mail (CAAB-42)/T089 permanece pendente,
dependente de Serviço de e-mail transacional e definição da caixa de entrada (CAAB-2). A pedido
explícito foi criada a subtarefa Homologar os avisos operacionais após disponibilizar o serviço de
e-mail (CAAB-45), bloqueada por CAAB-2. Confirmar ambiente, transporte/remetente, destinatários de
teste autorizados e humano responsável na retomada; registrar versão e evidência que diferencie
intenção, processamento, aceite e entrega. Não criar transporte ou enviar agora. App/site, WAHA e
T097 permanecem adiados. O recorte administrativo segue independentemente.

## Implementação incremental — bloqueio por falta, 28/09/2026

Fonte canônica: BF-FR-01–06 e BF-D01–05 em [spec.md](spec.md). A equipe registra falta; o período é
de 30 dias corridos desde esse registro, somente para a pessoa que faltou, em todos os serviços. Há
sete dias corridos desde o mesmo registro para justificar/contestar. Preservar reservas nessa
oportunidade e durante análise de pedido tempestivo; permitir comparecimento e atendimento normal
nessas reservas, mantendo a restrição a novas reservas. Cobrir em aceite atendimento durante os sete
dias/análise e preservação do atendimento já realizado após rejeição. Sem pedido no prazo, efetivar
bloqueio e cancelar reservas abrangidas com histórico. Rejeição antes do fim dos 30 dias cancela
imediatamente as reservas futuras dentro do período, liberando vagas sem reiniciar a restrição.
E-mails: aviso do bloqueio, confirmação de envio do pedido e decisão. Manter ações OK/Justificar
falta/Contestar falta e acesso posterior no app/site. Ambos os pedidos exigem explicação em texto
não vazio e pelo menos um comprovante. Usar formatos, limites, autorização de acesso e tratamento de
falha do pipeline privado detalhado abaixo, conforme a constituição. Cobrir envio sem texto, texto
em branco, ausência de comprovante e distinção entre campos completos e mérito aceito.

Pedido posterior de 28/09 autorizou implementar em paralelo com o clarify. BF-D01–05 foram
respondidas em T088; T090–T096/T098 compõem o núcleo implementado. T089 continua com o detalhamento
da integração externa e da entrega de e-mail, sem bloquear a interface administrativa T099–T102.
Revisão de falta tem permissão dedicada scheduling:review_absences com consulta; read/write
existentes não são ampliadas automaticamente. Garantir leitura da permissão no servidor e revogação
enquanto espera lock. Ambos os prazos começam no registro. Cada falta gera período próprio de 30
dias e sete dias para revisão separada. Validar sobreposição sem soma automática de prazos,
aceitação/expiração independente e vínculo entre cancelamento e falta que o motivou. Ao completar 30
dias encerrar a restrição daquela falta mesmo com análise pendente; liberar novas reservas somente
sem outros impedimentos vigentes; decisão posterior altera o histórico, sem prolongar a restrição.
Validar **Falta abonada** para ambos os tipos de pedido aceitos, inclusive após expiração, com tipo
nos detalhes e preservação da decisão e auditoria original. Preservar eventos append-only, liberação
consistente de ocupação, idempotência e reautorização em concorrência, especialmente entre submissão
tempestiva, expiração e decisão. Não propagar punição à família nem cancelar reservas de pedido em
análise ao completar sete dias. Não reiniciar os 30 dias na efetivação. Justificativa/contestação
são solicitações próprias, sem reintroduzir motivo obrigatório em todas as ações. Distinguir
bloqueio cadastral manual, recuperação e remarcações.

T098 conecta o vencimento dos sete dias ao cron de um minuto do worker existente. O repositório
compartilhado revalida pedido/prazo após o mesmo lock transacional de elegibilidade, cancela somente
reservas futuras abrangidas e grava evento, vínculo causal e auditoria. O worker usa identidade de
sistema; nunca simula sessão humana. A migration 0034 complementa 0033 para preservar eventos
humanos e apresentar autoria de sistema. Processamento atrasado após os 30 dias registra
encerramento sem cancelar atendimento passado. A restrição de novas reservas expira pela consulta ao
relógio do banco, independentemente da execução do job.

Comprovantes reutilizam o fluxo privado existente de arquivos: PDF/JPEG/PNG, até 25 MiB por arquivo,
disponibilidade somente após validação e varredura limpa. A submissão vincula somente arquivo da
pessoa atendida e do operador que o enviou; falha ou varredura pendente impede protocolo. A
permissão de analisar falta acessa apenas os comprovantes vinculados à ocorrência, sem abrir o
acervo geral de Associados. O projeto apenas intermedeia: recebe pedido/comprovantes, apresenta à
equipe autorizada e registra a decisão humana. Critérios institucionais de mérito pertencem à
equipe; não criar lista de documentos aceitos, validação automática de mérito ou nova pendência para
o usuário definir essas regras no projeto.

OK apenas fecha o aviso e mantém o prazo; não há comando de reconhecimento com efeito sobre a
penalidade. A implementação local do núcleo confirmado está autorizada. Não alterar a evidência
T078–T086 nem aplicar bloqueios/cancelamentos em dados reais, enviar e-mails reais ou ativar
app/site nesta rodada. A interface administrativa T099–T101 segue o guia canônico e aguarda
validação T102 concluída; consumidores externos continuam dependentes de UI01/UI02.

Regra adicional confirmada: registrar falta somente após término previsto de compromisso confirmado.
Cancelamento atinge confirmadas e pendentes com início futuro dentro do período da ocorrência.
Cancelar também reservas posteriores ao bloqueio é somente possibilidade para discussão futura
(T097), sem configuração ou código nesta entrega. Não retroagir sobre atendimentos passados nem
cancelar reservas sem horário.

Decisão de destinatários confirmada nesta continuação: quando a falta for de dependente, aviso,
protocolo e decisão devem ir ao próprio dependente e ao titular. Isso não propaga bloqueio à
família. Os três e-mails são avisos operacionais e devem ser enviados mesmo com
comunicados/campanhas desativados, conforme resposta explícita do usuário. Nenhuma entrega real foi
ativada.

Delimitação confirmada pelo usuário: o projeto atua como intermediário e não define nem executa a
análise de mérito dos comprovantes. Receber pedido e arquivos, disponibilizar à equipe responsável
com permissão específica e registrar/comunicar a decisão humana. Validação de campos e segurança dos
arquivos é técnica; não constitui aceitação da justificativa. Critérios institucionais de mérito
ficam fora do escopo de definição deste projeto.

## Continuação visual administrativa — T099–T102

T099–T102 implementadas e validadas localmente ([evidência](evidence/absence-ui-2026-09-28.md)). O
detalhe de reserva permite registrar/consultar ocorrência e enviar/analisar pedido; a aba Faltas
oferece consulta paginada e filtros. DTOs do contrato compartilhado representam prazos, situação e
versão sem importar código de servidor no cliente. API de consulta geral contém somente metadados;
rota protegida de revisão fornece texto e arquivos. Leituras e comandos revalidam permissões no
servidor. Exportação usa o catálogo existente e preserva os mesmos filtros, sem anexos/texto
sensível.

Reutilizar SchedulingShell, Button, Dialog, FormField, tabela, paginação e rascunhos em memória.
Confirmação de registro explica 30 dias/7 dias e preservação das reservas; decisão de rejeição
explica cancelamento futuro abrangido. Texto e anexos obrigatórios, upload privado existente com
estado de processamento e erro corrigível. Revisores podem decidir com consulta + permissão
dedicada, sem alteração geral; leitores não recebem texto/comprovantes. A interface não atribui
entrega às intenções pendentes. Formulários, erro geral, conflito de versão e foco precisam
preservar contexto por ocorrência.

App/site e identidade externa continuam adiados; seus botões/área de acesso não são apresentados
como implementados pelo painel. Avisos iniciais do painel usam OK apenas para fechar, sem reiniciar
prazos ou acionar penalidade. Validar o guia no navegador com dados sintéticos, sem iniciar preview
de uso.

Consulta usa GET /absences com bookingId/memberId opcionais, busca literal q e status, devolvendo
{items,page,pageSize,total}; página padrão 25 e limite técnico de 100 por página. DTO inclui prazos,
autores nominais e finalizedAt. Situação do processo é independente da restrição e não muda para
encerrada só por completar 30 dias. Explicação/comprovantes ficam exclusivamente na revisão
protegida; exportação scheduling.absences permite somente metadados por allowlist.

Próximo de T089: adaptar o núcleo à identidade externa quando UI01/UI02 forem retomadas; planejar
textos e resolução de contatos/vínculo vigente, deduplicação e estados observáveis dos três e-mails
operacionais; conectar intenções ao transporte existente com recibos/reconciliação sem entrega
falsa. Preferência por comunicados não suprime os e-mails de BF-FR-06, mas continua aplicável aos
avisos gerais quando prevista em 2C-FR-23/24. Não ativar provedores ou envio real nesta entrega.

## Plano ativo — operação administrativa antes do app/site

Diretriz posterior de 28/09: continuar localmente pelo painel e banco. T025–T038 já validados; T039
é somente CI pendente de autorização para publicação. A execução T078–T086 está concluída localmente
e registrada em [tasks.md](tasks.md), extraindo a operação administrativa das regras 2C sem criar
consumidor externo. As seções anteriores que condicionavam toda evolução a T041/UI01 foram superadas
para esse escopo. T041/T049/T070/T072/T073 continuam condicionando exclusivamente identidade e
integração externas.

1. Reconciliar contratos/aceite e confirmar a aplicação dos limites de autosserviço ao operador.
2. Definir schema administrativo e contratos executáveis. Migration administrativa implementada:
   `0032_scheduling_administrative_workflow.sql`, reconferindo a numeração antes de criar. Não criar
   também `0032_scheduling_channels.sql`. Autor/eventos/idempotência preservam FK para user.
3. Implementar políticas, oferta com rascunho/publicação e agenda por profissional/capacidade.
4. Implementar pedidos/edição/decisão, ciclos de remarcação, recuperação e fila pelo painel.
5. Integrar as telas existentes, histórico e projeções de Relatórios/exportação. Persistir intenções
   de comunicação sem ativar entrega; homologação WAHA/e-mail permanece separada.
6. Validar o fluxo administrativo completo, concorrência, constraints, regressões e revisão visual.

UI existente: `apps/web/modules/scheduling/ui/catalog.tsx`, `hours.tsx`, `booking-form.tsx`,
`booking-detail.tsx`, `agenda.tsx` e `calendar.tsx`; extensões implementadas `service-policy.tsx` e
`approval-queue.tsx`. APIs permanecem em `/api/v1/scheduling`, com guardas administrativas e
Origin/CSRF/idempotência. Usar componentes do guia canônico localizado na principal
`C:/Projetos/caabnovo/docs/caab-design.md`; não construir shell/login alternativo.

O banco e os serviços de domínio não dependem de um frontend de associado. Não relaxar autoria para
inventar conta externa: futura adaptação de identidade terá contrato/migration próprios. Os testes
podem representar pedidos por colaboradores sintéticos; isso comprova o fluxo administrativo, não
autorização familiar do canal nem homologação de provedor. Interface mínima apenas se uma lacuna
concreta de teste exigir; por ora, nenhuma é necessária.

**Decisão confirmada:** aplicar no painel as mesmas regras de aprovação, prazo e limite de duas
trocas; recuperação por indisponibilidade do estabelecimento continua isenta. Não implementar
override genérico. As referências abaixo a aguardar autorização de implementação são históricas.

**Conclusão local:** T078–T086 implementadas e validadas pelo painel. Resultados e limites em
[evidência administrativa](evidence/admin-workflow-2026-09-28.md). Não há consumidor externo ou
entrega real de avisos; publicação/CI permanecem pendentes.

## Registro anterior à mudança de prioridade — sem instrução de execução

Estado de autorização e gates no [checkpoint vigente](checkpoint.md): implementação administrativa
local T025–T039 e testes com Docker/PostgreSQL descartável autorizados; manter sem publicação. 2C
aguarda identidade/UI01/contrato físico. CAL06 encerrada; pré-grant, 0031, disponibilidade por
pessoa, aviso aditivo e exportação implementados localmente. 81 unitários, 37 integrações de agenda
e 20 de exportação aprovados; build/tipos/lint aprovados. Cinco jornadas Chromium e revisão visual
aprovadas; 169 contratos aprovados. Evidência em
[validação administrativa](evidence/plan-2026-09-21-validation.md); CI desta entrega não executado.
Declarações anteriores de ausência de execução ou espera por permissão descrevem a etapa documental
histórica.

**Entrega local ativa**: `codex/scheduling-market-research-20260923` | **Data**: 28/09/2026.
**Spec**: [spec.md](spec.md). **Estado de 2C**: decisões funcionais incorporadas; contrato lógico,
modelo, roteiro de validação e tarefas T040–T077 propostos. Integrações e evidências operacionais
ainda pendentes. Ver [continuação 2C](#continuação-do-plano--incremento-2c-appsite-23092026),
[contrato](contracts/channels.md) e [checkpoint](evidence/plan-2026-09-24.md).

O recorte administrativo de 21/09 abaixo pertence à entrega histórica
`docs/project-clarify-20260921`; seu desenho não comprova prontidão do novo recorte externo.

## Ordem única de retomada — revisão de 28/09/2026

Base conferida: `origin/dev` em `89d2356`; alterações de código posteriores estão locais nesta
entrega. Primeiro reconciliar evidências/CAL06; depois concluir as pendências administrativas
T025–T039 com os estados corrigidos abaixo; em seguida executar a integração T022/T040–T077 (2C).
T022 já tem [contrato de canais](contracts/channels.md), modelo e tarefas: falta implementação/
homologação. FullCalendar (PR #34) e guardas/ciclo de vida (PR #36) são preservados. Implementação
administrativa local autorizada em 28/09; 2C depende dos gates de identidade/UI e schema abaixo. A
exportação é independente tecnicamente do domínio 2C, mas segue a sequência de entrega acima.

Revisão dos oito achados e evidências: [reconciliação](evidence/reconciliation-2026-09-28.md).

## Decisões vigentes — 28/09/2026

- **Login geral:** Agendamentos utiliza a conta/sessão geral do app/site. Não cria login,
  credencial, recuperação ou escolha de fornecedor de identidade próprios do módulo. Usuário já
  conectado entra na agenda sem nova autenticação específica; permissões familiares são revalidadas
  no servidor. Evolução do login pertence à experiência transversal do app/site.
- **Histórico antigo:** importar registros antigos de recusa/cancelamento/edição é opcional e de
  baixa prioridade, conforme esclarecimento do usuário. Sua classificação detalhada ou reconstrução
  do número de trocas não bloqueia esta especificação. Se importados, preservar a informação
  disponível sem inventar distinções/contadores. Isso não autoriza apagar a origem e não altera o
  histórico individual exigido para os novos registros.
- **Edição antes do aceite:** edição comum altera data, horário e profissional quando a escolha
  estiver habilitada, mantendo pessoa e serviço. Como ação adicional, permitir transferir o
  atendimento a dependente quando o serviço for compatível e disponível para ele. Titular só
  representa dependentes com vínculo vigente; dependente continua operando somente para si.
  Revalidar autorização, elegibilidade e disponibilidade antes de persistir; falha mantém o pedido
  anterior. Pedido já confirmado segue as regras existentes de remarcação, sem autorização implícita
  para transferência após aprovação.
- **WhatsApp:** WAHA foi escolhido pelo usuário. Configuração e comprovação de entrega seguem como
  trabalho técnico, sem reabrir comparação de fornecedores por este módulo.

## Summary

A execução ativa cobre T025–T039 do painel. O incremento posterior 2C planeja integrar a jornada
autenticada do associado à mesma agenda, com beneficiário primeiro, publicação conjunta, confirmação
imediata/manual, ciclos de troca, recuperação isenta e avisos por preferências pessoais. O contrato
v1 define operações e caminhos HTTP propostos; identidade real, entrega por provedor e transição dos
dados precisam das verificações descritas.

Resumo administrativo de 21/09: exigir acesso concedido, impedir sobreposição da mesma pessoa,
sinalizar reservas mantidas após bloqueio e exportar a agenda/oferta.

O recorte administrativo pendente cobre US1 configuração/reserva, US2 operação e US4 exportação.
US3/2C é o incremento seguinte, já planejado nesta entrega; preservar FullCalendar integrado.

## Technical Context

TypeScript 6.0.3, Node 24, Next 16.3.4, React 19.2.8, Zod 4.5.4 e pg8.23.0 do checkout; PostgreSQL
18 no CI. Monólito modular; banco também armazena arquivos legados. Sem S3/MinIO novo. Testes Vitest
4.1.11, Playwright 1.62.1 e Axe existentes. UI desktop/390 px, temas, teclado e tokens
compartilhados. Reutilizar o núcleo de exportação existente (consulta incremental/cursor e writers),
conferindo manifests/lockfile; não repetir a criação do registry nem selecionar nova biblioteca.

**Performance/escala**: preservar p95 de 2s das telas comuns; não aplicar esse alvo a transferência
integral arbitrária. Exportações não têm teto funcional de registros/período. Aplicar o
[perfil C1 de100 registros](../002-integrated-modules/export-validation-100.md): medir
tempo/recursos e validar integridade, resposta do painel e recuperação. Sem prova de estresse/grande
volume nesta rodada; manter produto sem teto funcional de registros. **Restrições**: banco único,
autorização atual por ação; sem deploy, seed real ou limpeza de dados. Implementação e validação
local com Docker/banco descartável autorizadas; publicação permanece negada. Q10/Q11 e módulos
futuros continuam adiados.

## Constitution Check

Pré-pesquisa: escopo decorre de Q1–Q11 e complementos, sem política institucional inferida.
Pós-desenho: monólito/fonte única, negação por padrão, auditoria mínima, integridade no PostgreSQL e
UI compartilhada preservados. Constituição 2.1.0 concilia justificativas já retiradas; autenticação
continua sem MFA. Abstração de exportação cobre oito consumidores reais, sem CRUD genérico. Não há
violação de desenho sem justificativa. Aprovações institucionais/produção permanecem pendentes;
compatibilidade do desenho não é execução de gates.

## Phase 0 — Research

Decisões, alternativas e fontes em [research.md](research.md), com pesquisa transversal
[de 21/09](../002-integrated-modules/research-2026-09-21.md). Leitura estática conclui as escolhas
necessárias para este recorte; limitações operacionais viram validações de implementação, não
requisitos indefinidos. Sem consulta a contas/dados de produção.

## Transição física antes de 2C — 28/09/2026

A invariante e os gates físicos estão no
[modelo](data-model.md#invariante-de-ocupação-e-transição-física--28092026). T030/0031 é
transitória, exclusiva do schema administrativo scheduled/cancelled. Antes de aceitar
pending_approval, T045/T048 usam migration posterior 0032 (número a reconferir), com DROP CONSTRAINT
nomeado e recriação atômica de scheduling_beneficiary_no_overlap e scheduling_no_overlap, cobrindo
scheduled/pending_approval. Não alterar migrations aplicadas nem habilitar 2C antes de T030–T032.

T041 + UI01/T043 definidos precedem T049/T070; UI02/consumidor real precede T072/T073.
T045/T047/T048 tratam NULLs por modo/estado, autoria/idempotência próprias do canal e
compatibilidade dos joins/enums de Relatórios. Better Auth administrativo não prova identidade de
associado. Público oferece somente catálogo. T040 confere gates, sem schema.

## Phase 1 — Design

- Guardas read/write já integradas pelo PR #36 (AC01/AC02/T028); falta a matriz T027/AC03. Para
  reduzir contenção, T027 deve cobrir e orientar o ajuste mínimo: autenticar e conferir read/write
  antes de adquirir 5010/1 nas escritas, repetir sessão/grants após a espera e antes do efeito.
  Leituras não adquirem 5010/1. Não reconstruir a guarda já existente.
  Catálogo/busca/páginas/HTTP/UI usam mesmas dependências; visitante com apenas read não muta
  oferta, horários, reservas ou arquivo.
- Preservar projeção mínima de beneficiário autorizada pela agenda; reports.bookings já exige
  scheduling:read em packages/contracts/src/reports.ts. Não acrescentar scheduling:write para
  consultar esse dataset: preservar Gestor e demais leitores. Não conceder members:read por efeito
  colateral.
- Pré-diagnóstico SQL lista pares scheduled com mesmo member_id e ranges sobrepostos, inclusive
  datas passadas (T029, antes de T030). Próximo número livre conferido em dev: 0031; caminho
  planejado packages/db/migrations/0031_scheduling_beneficiary_overlap.sql, a reconferir
  imediatamente antes da criação. Constraint própria scheduling_beneficiary_no_overlap: EXCLUDE
  USING gist(member_id WITH =, tstzrange(starts_at,ends_at,'[)') WITH &&) WHERE(status='scheduled').
  Preservar scheduling_no_overlap por profissional e 0020/0028–0030. O migrador usa nome
  completo/checksum: não adicionar outro 0028_*.sql nem editar SQL aplicado. Se houver conflitos,
  parar sem alterar dados e pedir decisão sobre casos concretos.
- Criar/remarcar deve revalidar ambos os conflitos na transação; mapear constraint/SQLSTATE para
  mensagem recuperável. Hoje availability só considera profissional e não recebe beneficiaryId. T031
  adiciona beneficiaryId opcional e validado; consumidores passam a enviá-lo quando selecionado.
  Ausência mantém contrato antigo; criar/remarcar sempre usa o memberId real e a constraint final.
  Não torná-lo obrigatório abruptamente nem aceitar exclusão de reserva alheia. Remarcação falha
  mantém origem.
- Projetar eligibilityWarning: blocked|null em lote em lista/calendário/detalhe, usando
  vínculos/lock existentes. Aviso desaparece ao cessar bloqueio efetivo. Não mudar status, versão,
  horário, histórico ou ocupação da reserva; cancelamento manual autorizado permanece possível.
  Campo aditivo: preservar memberDeleted, memberDeletionEffectiveAt, keptAfterMemberDeletion,
  memberDeletionKeptAt/By e a ação keep de LC01. Bloqueio e exclusão são sinais independentes;
  mostrar ambos quando aplicável. Bloqueio não remove Manter reserva de uma ocorrência de exclusão.
- Exportação usa mesma projeção com aviso e intervalo solicitado, independente de limites visuais do
  calendário. Oferta e horários são datasets próprios; não fabricar agenda de funcionamento futuro
  sem reservas. Registrar adapters ao lado de usersExport em apps/web/modules/exports/runtime.ts;
  SQL incremental com cursor no núcleo existente, sem materializar uma listagem limitada em memória.
  Exportar fica no cabeçalho do quadro, acima dos filtros; Nova reserva mantém sua ação original.
  E2E de exportação em scheduling-export.spec.ts, preservando scheduling.spec.ts e /users/exportar.

Modelo em [data-model.md](data-model.md), interface em [contracts/exports.md](contracts/exports.md)
e [contrato comum](../002-integrated-modules/contracts/direct-exports.md). UI preserva
rascunhos/filtros e dados em falhas, sem exigir justificativa. Catálogo de colunas é allowlist por
função; servidor não confia no catálogo antigo do navegador.

## Project Structure

- `apps/web/modules/scheduling/access.ts` (existente).
- `apps/web/modules/scheduling/booking-service.ts` (existente).
- `apps/web/modules/scheduling/availability-service.ts` (existente).
- `apps/web/modules/scheduling/beneficiary-service.ts` (existente).
- `packages/contracts/src/scheduling.ts` (existente).
- `apps/web/modules/scheduling/ui/booking-detail.tsx` (existente).
- `packages/db/src/repositories/members.ts` (existente).
- `apps/web/modules/scheduling/export-adapter.ts` e `export-adapter.test.ts` (novos planejados).
- `apps/web/app/(admin)/scheduling/exportar/page.tsx` (nova planejada).

## Rollout, migração e rollback

Uma entrega/worktree; mudanças SQL aditivas e numeradas coordenadas pela spec001. Preparar
compatibilidade de leitura de chaves/snapshots antes de ativar migrações e novos botões. Conta sem
acesso não ganha concessão para preservar conveniência. Diagnosticar conflitos antes da
restrição008; parar sem corrigir registros automaticamente. Rollback da UI/API deve preservar grants
convertidos, dados e arquivos; não publicar binário antigo que dependa exclusivamente de
audit:export/reports:export após conversão. Preferir correção compatível para frente; reversão SQL
exige plano e evidência próprios.

## Validation e próximo passo

Duas reservas concorrentes da mesma pessoa em profissionais/unidades distintos: uma aceita;
titular/dependentes distintos podem coincidir. Bloqueio mantém reserva/vaga e mostra aviso. Sem read
some/nega; só read não altera. Exportação não herda teto visual.

Executar roteiro [quickstart.md](quickstart.md) na implementação. Evidência anterior nunca conclui
tarefa nova. Em T025–T039, T028 já foi entregue pelo PR #36; as demais tarefas mantêm seus gates.
T027 inclui testes e a correção pontual da ordem de grants/lock; não reexecutar 0025/0026. O desenho
2C abaixo é apenas documental; T040–T077 detalham verificações e implementação futura, com gates
factuais antes de código.

## Complexity Tracking

Núcleo comum necessário para aplicações repetidas em oito funções; adaptadores mantêm as regras dos
domínios. Sem microserviço, linguagem nova ou nova fonte de verdade. Estado operacional serve
somente à transferência atual; não é fila/histórico obrigatório.

## Continuação do plano — incremento 2C app/site (23/09/2026)

**Estado em 24/09:** regras funcionais consolidadas em [US3/2C](spec.md),
[contrato lógico v1](contracts/channels.md), [modelo](data-model.md) e
[roteiro de validação](quickstart.md). Não conclui T022/T023/T024, não altera entregas
administrativas anteriores nem autoriza implementação/publicação. A interface completa do app/site
terá especificação própria no programa 002; reconciliar esse contrato com UI01/UI02 antes de
executar tarefas de consumidor. A lista 2C T040–T077 foi gerada com essas dependências explícitas;
nenhuma tarefa foi executada.

### Direção da reformulação e recomendação atual — 25/09/2026

Aplicar a [comparação de mercado](research.md#reformulação-orientada-pelo-mercado--25092026). O
usuário pediu reformulação com práticas atuais: continuidade de dados e acesso individual não exige
manter implementação ou fornecedor do legado. Inspeção antiga orienta migração, sem bloquear
pesquisa/seleção de solução nova.

| Função                | Recomendação para avaliar primeiro                            | Alternativa e critério                                                                     |
| --------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Identidade externa    | Sessão geral do app/site, conforme decisão de 28/09.          | Nenhum login/fornecedor específico para Agendamentos.                                      |
| Experiência de acesso | Entrar na agenda com a sessão geral já válida.                | Primeiro acesso/recuperação pertencem a UI01/UI02; agenda só integra o contrato.           |
| Avisos internos       | Caixa, preferências e histórico CAAB; worker/jobs existentes. | Novu/Knock se economia operacional em vários módulos justificar nova plataforma.           |
| E-mail                | Serviço já definido para o sistema, por decisão de 28/09.     | Integrar seu contrato/remetente; não selecionar fornecedor exclusivo da agenda.            |
| WhatsApp              | WAHA escolhido, ainda não instalado (28/09).                  | Planejar preparação, versão/motor, sessão e recibos; instalação/homologação ainda futuras. |

WhatsApp foi definido como WAHA; a comparação anterior de fornecedores fica como pesquisa histórica.
Número e identidades devem ter continuidade e portabilidade planejadas. Controle de acesso familiar
permanece no CAAB, independente do provedor. Seleção deve avaliar recuperação, revogação,
compatibilidade nativa, diagnóstico de entrega, duplicatas, retenção, suporte e custo total;
preços/fontes/limites estão na pesquisa.

T041 integra o login geral, sem criar cadastro ou seleção de provedor por módulo. T044 detalha WAHA
para WhatsApp (a instalar) e o serviço de e-mail do sistema. Registrar plano de instalação,
responsável, versão/motor, guarda de segredos, callbacks e validação em ambiente autorizado; não
instalar, parear número nem enviar mensagens neste trabalho documental. Manter intenções e recibos
duráveis, preferências e permissão/opt-out, sem associar automaticamente regras de templates e
preços da Cloud API ao transporte WAHA. Detalhes em contracts/channels.md.

Edição pendente: serviço responsável pelo pedido recebe versão e alterações permitidas, incluindo
beneficiaryId de dependente autorizado. Validar pessoa anterior/nova, serviço e vaga; manter ID,
estado pendente e ciclos/contador. Troca de ocupação é atômica; não debitar remarcação confirmada ao
editar. Pedido inicial pode escolher destino futuro válido mesmo após o horário solicitado anterior;
validar políticas de nova reserva no destino. Edição de troca voluntária usa prazo original de
FR-08/10 e retomada/recuperação seguem FR-18/20, qualquer que seja a rota. Preservar
posição/prioridade e entrada original em análise; recalcular urgência pelo destino vigente.
Aprovação exige a versão atual. Projeções de histórico e avisos não expõem dados de antigo
beneficiário a pessoa sem acesso; intenção obsoleta é reavaliada. Transferência após confirmação não
foi autorizada.

### Evidência de integração localizada em 25/09/2026

Código do legado identificado em `Komunick/caab-caapp`: acesso individual por código/token
intermediário e JWT de sessão; família consultada por critérios diferentes; estados/logs não
permitem conversão automática uniforme. Ver [matriz de equivalência](legacy-parity.md) e
[pesquisa de integração](research.md#inspeção-das-integrações-existentes--25092026). T041 deve
provar validação/revogação da solução selecionada e mapeamento para member.id, conservando
origem/User.id na transição. Não aceitar token intermediário antigo como sessão; aceitar qualquer
token legado exige ponte explícita e verificada. Ator e vínculo vêm do servidor, sem inferir
autorização pela mesma OAB. A revisão publicada permanece não verificada.

Se a importação opcional desses registros antigos for escolhida, T042 preserva informação
verificável e registra ambiguidades, sem exigir reconstrução detalhada como gate: reject também
representa cancelamento; EDITED não prova troca confirmada; finished/not_appear são histórico, sem
novas ações de comparecimento em 2C. A decisão de 05/10/2026 inicializa em zero o contador
desconhecido na transição administrativa; não converter horário sem fuso comprovado. T045 fecha a
representação histórica apenas se essa importação entrar na entrega; conflitos e casos sem
correspondência permanecem para resolução explícita. Nenhum inventário real executado.

Comunicação: jobs/worker existentes são reutilizáveis; SMTP de contas é candidato à extração
compatível. `mafaltti/caab-whatsapp-router` contém cliente Evolution conversacional, sem recibo de
entrega/ID de saída e sem diferenciação de timeout incerto. Não atende sozinho aos avisos
transacionais. T044/T069 integram e-mail do sistema e WAHA escolhido; sua ativação depende de
conta/remetente autorizados, correlação/recibos e política segura de tentativas, além de FR-23/24.
Identificar o serviço antigo é necessário para transição, não para recomendar a solução nova. Isso
não seleciona Evolution como provedor nem autoriza contratar/ativar canais.

Testes adicionais de contrato/transição estão em legacy-parity.md e quickstart.md.
T041/T042/T043/T044 permanecem abertas; houve inspeção de código, não homologação.

### Contexto técnico e verificação de princípios de 2C

Reutilizar TypeScript/Next/PostgreSQL, contratos Zod, monólito modular e worker da stack. Nenhuma
dependência nova foi instalada. A versão consultada do package.json mantém Node 24, pnpm 11.25.0 e
suites unit/contract/integration/E2E/a11y; versões não provam ambiente executado. API externa deve
ser versionada. O contrato v1 fixa operações/dados/invariantes e rotas propostas na seção 1.3;
vinculá-las ao mecanismo de identidade validado, sem reutilizar sessão de painel.

| Princípio               | Aplicação no desenho 2C                                                                       | Evidência ou limite                                                                  |
| ----------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Simplicidade e monólito | Um domínio de agenda e PostgreSQL como fonte de verdade; infraestrutura de jobs existente.    | Sem serviço/SDK de fornecedor ou framework genérico novo.                            |
| Contratos e integridade | Contrato v1, processo/proposta separados, contagem voluntária e ocupação única transacional.  | Migrations e testes concorrentes ainda futuros.                                      |
| Menor privilégio        | Identidade → pessoa resolvida no servidor, vínculos revalidados, equipe/backup sob permissão. | Solução externa selecionada e transição ainda não comprovadas.                       |
| Auditoria               | Ator, evento, versão, correlação e snapshots mínimos; sem justificativa humana obrigatória.   | Recuperação isenta usa classificação de causa, não texto obrigatório.                |
| Integrações             | Intenção durável, jobs idempotentes e resultado de entrega distinto do evento de reserva.     | Fornecedores/contatos/retries e entrega real não homologados.                        |
| Acessibilidade          | Jornada e textos funcionais definidos; validação por teclado/390 px/temas prevista.           | Guia localizado em 28/09; conformidade e integração com UI01/UI02 ainda por validar. |

Revisão documental segundo constituição 2.1.0: desenho preserva esses princípios; nenhum gate de
execução foi declarado aprovado. O setup local do speckit-plan falha antes de iniciar; esta é
continuação manual dos artefatos na branch existente, sem conclusão automatizada da fase.

### Dependências e ordem

1. Concluir ou incorporar no mesmo incremento as garantias de consulta/alteração, conflito por
   beneficiário e sinalização de bloqueio descritas em AC/BEN/BLQ. A exportação DX01 tem entrega
   própria e não é pré-requisito técnico para a reserva externa. CAL06 é revisão da interface
   administrativa, sem alterar o núcleo de vagas.
2. O usuário confirmou em 24/09 que titulares e dependentes já possuem acessos individuais no
   app/site atual. Integrar o login geral e mapear identidades ao cadastro individual em Associados,
   com transição verificável e separação do painel; aplicar as decisões de 23/09: titular reserva
   para si e seus dependentes; dependente reserva somente para si. O titular consulta e, quando
   permitido, gerencia reservas do dependente enquanto o vínculo estiver vigente; o dependente
   acessa todas as próprias reservas, inclusive as feitas pelo titular. Revogar o acesso do titular
   quando o vínculo cessar. Não usar conta administrativa como conta do app/site nem expor a seleção
   administrativa de beneficiários como API pública.
3. Inventariar reservas, contas e identificadores do legado antes de definir coexistência, migração
   ou corte. Reservas futuras em uso ainda não foram confirmadas nem descartadas pelo usuário
   (resposta C); inventário é necessário antes de selecionar estratégia. Sem correspondência
   confiável, não criar contas ou reservas duplicadas.
4. Aplicar as decisões de 23/09: serviços publicados ficam visíveis no app e no site antes do login;
   vagas exigem autenticação. Confirmação imediata é o padrão por serviço e pode ser desativada pela
   equipe para exigir aprovação de novos envios. Solicitação pendente ocupa a vaga até aprovação ou
   recusa da equipe, sem expiração automática. Em 24/09 foi autorizado remarcar e cancelar reservas
   futuras confirmadas no app/site; a remarcação segue a aceitação do serviço. Remarcações vêm
   primeiro na fila, pelo início atual mais próximo; novos pedidos vêm depois. Para solicitar
   remarcação, exigir 24 horas de antecedência por padrão, editável/desativável por serviço.
   Cancelamento externo é permitido até antes do início, sem antecedência mínima e sem aprovação da
   equipe.
5. Contrato/modelo/quickstart consolidados nesta etapa documental; conferir compatibilidade com o
   acesso externo e UI01/UI02 e detalhar integrações restantes nas tarefas T040–T050; T051–T077
   organizam implementação/validação futuras. Analisar o conjunto antes de executar. Código, CI e
   ativação dos canais pertencem a uma etapa posterior.

### Arquitetura candidata e fronteiras

- O módulo scheduling continua proprietário da oferta, disponibilidade, reservas e histórico no
  PostgreSQL. Painel e canais externos chamam os mesmos serviços de domínio; a API externa tem
  contrato versionado e projeções próprias, sem compartilhar endpoints/sessão administrativos.
  Nenhum SDK, iframe ou banco de fornecedor é fonte de verdade.
- O domínio Associados resolve a pessoa atendida e o direito vigente do ator externo de agir por
  ela. Para leitura e ações sobre reservas do dependente, revalidar o vínculo do titular a cada
  comando; o dependente mantém acesso às próprias reservas independentemente de quem as criou. A
  fronteira recebe identificadores mínimos e resultado autorizado; documentos, finanças, papéis e
  dados de titular não são copiados para Agendamentos.
- Separar ator, beneficiário e origem do comando. Antes de escolher migration, conferir se
  created_by e eventos atuais exigem FK de usuário administrativo; uma identidade externa não pode
  ser gravada falsamente como colaborador nem como beneficiário autor. Planejar adaptação aditiva de
  autoria/auditoria com compatibilidade para eventos antigos.
- Cadastro com Salvar/Publicar (2C-FR-19): distinguir persistência administrativa de publicação
  externa. Salvar serviço novo persiste sem publicação; Publicar valida, salva e publica no mesmo
  comando/transação, sem navegação intermediária obrigatória. Usar permissão existente de alteração,
  controle de versão e idempotência, mantendo valores no formulário em erro. Modelar estado único de
  publicação externa, independente de ativo, compartilhado por app e site, sem seleção de destino no
  formulário nem configurações distintas por canal. Revalidar oferta, duração, agenda e
  profissional/capacidade conforme modo. Ausência de vagas livres não impede publicar agenda
  configurada. Não criar serviço duplicado quando publicar um já salvo nem tornar a oferta pública
  por alterações diretas de ativo. Invalidar projeções/cache público de app e site após commit
  válido, com a mesma revisão publicada como fonte para ambos. Não manter versões vigentes
  independentes por canal. Na edição publicada, Salvar alterações persiste revisão de rascunho
  separada; Publicar alterações valida e persiste/publica a revisão num único comando atômico, sem
  salvamento prévio obrigatório. Manter o mesmo ID do serviço e controlar as versões do rascunho e
  da publicação para impedir perda de edição ou publicação concorrente desatualizada. Reabrir a
  edição recupera o rascunho; catálogo, vagas e reservas externas leem a revisão publicada. O
  rascunho não altera as políticas em vigor. Consultar ocupações, bloqueios e elegibilidade atuais
  independentemente da revisão, sem congelar a disponibilidade operacional. Falha mantém publicação
  anterior e valores editados. A publicação respeita as guardas de alterações que afetem reservas
  futuras e preserva snapshots e histórico existentes. Exibir abaixo de cada botão a descrição curta
  definida em 2C-FR-19, sempre visível e associada ao controle para leitores de tela, tanto no
  cadastro quanto na edição publicada. Revisar disposição responsiva conforme guia de design quando
  disponível; não depender de tooltip.
- Visibilidade externa deve usar o mesmo estado de publicação nas leituras e comandos de app e site.
  Antes do login, expor o mesmo catálogo publicado, com projeção mínima; nunca o catálogo
  administrativo inteiro, dados privados ou horários disponíveis. Consultas de vagas exigem
  identidade externa validada. Delimitar cache por tipo de resposta; respostas privadas não recebem
  cache compartilhado.
- Continuar com datas UTC, intervalos [início, fim) e apresentação em America/Bahia. A consulta de
  vagas usa as regras existentes e as políticas externas aprovadas; envio e aprovação revalidam tudo
  na transação. Restringir sobreposições do beneficiário em ambos os modos e do profissional quando
  atribuído; no modo sem profissional, proteger a capacidade simultânea do serviço na unidade.
  Incluir confirmadas, aguardando aprovação e retenções de troca, inclusive disputas entre painel e
  canal externo. Ao recusar, liberar a ocupação; ao aprovar, preservar a mesma reserva e intervalo,
  sem nova ocupação. Uma prévia ou calendário externo não reserva a vaga.
- Criação, remarcação e cancelamento mantêm idempotência, versão, histórico e auditoria; falha antes
  de persistir o pedido não altera a reserva anterior; recusa posterior segue a política de
  liberação da origem já aplicada ao envio. Modelar confirmação imediata como padrão do serviço, com
  opção administrativa de exigir aprovação para novos envios. Distinguir estado aguardando aprovação
  de reserva confirmada; aprovação/recusa pela equipe requer permissão de alteração, revalidação,
  concorrência segura e auditoria. A pendência ocupa a vaga até decisão humana e não expira
  automaticamente. A equipe precisa de fila com identificação e idade das pendências para evitar
  vagas presas por falta de análise. Nenhum status de comparecimento ou avaliação é inferido do
  horário.
- Responsabilidade e alerta (2C-FR-21/22): vincular equipe ao estabelecimento como responsável
  principal, preservando consulta/alteração existentes; colaborador com alteração pode atuar como
  backup. Registrar ator e natureza principal/apoio da decisão, sem concessão automática por
  vínculo, aprovação dupla ou escalonamento automático. Concorrência entre ambos passa pelo mesmo
  comando versionado. Prazo de alerta por serviço: 24 horas corridas, editável/desativável; guardar
  entrada em análise e política aplicável, calcular idade no servidor e derivar atraso sem expirar
  pedido/liberar vaga. Exibir idade com alerta desligado e não mudar a prioridade de remarcações.
  Modelar antecedência de urgência independente, padrão 24 horas corridas, configurável por serviço:
  início solicitado - instante do servidor <= antecedência. Na troca, usar destino atual, mantendo
  origem só para prioridade já definida. Desativar alerta de atraso não desativa urgência; pedido
  novo pode ser urgente. Após início sem decisão, manter sinalização e pendência sem confirmar
  retroativamente. Decisão concluída retira os alertas de análise.

- Remarcação externa voluntária: registrar origem imutável (horário, modo/recurso e versão) para
  histórico, prioridade e cálculo do prazo; validar destino e liberar origem/ocupar destino na mesma
  transação. Pedido aceito deixa somente destino ocupado, confirmado ou pendente conforme serviço.
  Se a transação falhar, rollback conserva origem; não confundir falha técnica com recusa posterior.
  No fluxo manual, registro em remarcação pendente deixa de ter horário confirmado; origem histórica
  não participa dos conflitos nem aparece como reserva ativa nos canais. Aprovar mantém destino e,
  no ciclo voluntário, converte a utilização reservada em confirmada uma vez; recuperação isenta de
  2C-FR-20 não incrementa o contador. Recusar/retirar libera destino e deixa registro sem horário
  confirmado, sem retorno automático à origem, inclusive se estiver livre. Manter no máximo uma
  proposta ativa por reserva, sem expiração automática. Substituir destino troca sua retenção
  atomicamente e conserva o anterior em caso de falha; não reocupa origem. Prazo de substituição e
  limite para desistência usam início original registrado, preservando as fronteiras já decididas.
  Avisar antes do envio/retirada que o horário antigo não é garantido.
- Retomada aceita após recusa/desistência: novo comando/tentativa no mesmo registro sem horário
  confirmado; conservar identidade, contador, histórico e snapshot original para prioridade.
  Distinguir de remarcação de compromisso confirmado: não exigir origem futura nem reaplicar as 24
  horas nessa continuação, mesmo após o início original. Destino precisa ser futuro, dentro do
  horizonte e disponível, com autorização/elegibilidade/aceitação revalidadas. Não reaplicar
  antecedência de nova reserva. Estado sem horário ocupa zero vagas; envio válido retém apenas
  destino. Versão/idempotência/limite de uma proposta ativa impedem duplicação. Vincular
  alternativas à mesma troca em andamento e utilização reservada (2C-FR-11); confirmação converte-a
  em confirmada uma vez, sem nova cobrança. Permitir cancelar registro sem horário mesmo após início
  original; encerrar ciclo e reserva de utilização sem restaurar origem ou alterar o histórico de
  trocas confirmadas.
- Decisão B da rodada 3: aprovação de proposta recebida em tempo pode ocorrer após o início
  original. Separar validação de solicitar nova troca da validação de decidir proposta existente; a
  segunda exige destino futuro no relógio real do servidor, além de versão, acesso, elegibilidade,
  disponibilidade e contagem. Não reaplicar a exigência de origem futura a essa decisão; preservar
  eventos anteriores e registrar a aprovação tardia. Se o destino também passou, não aprovar
  retroativamente e não expirar automaticamente; manter para decisão explícita. Passagem do tempo
  não registra atendimento/falta. A origem já está liberada desde o envio bem-sucedido; conservar
  sua referência histórica para a decisão tardia.
- Ordenar a fila por classe (remarcação antes de novo pedido) e, nas remarcações, pelo início
  original capturado antes de liberar a origem, em ordem crescente. Desempatar por envio e
  identificador estável; para novos pedidos, usar envio e identificador. Não usar o horário proposto
  nem a antiguidade do pedido como primeiro critério entre remarcações. Projetar essa ordem na
  consulta/paginação do servidor, mantendo visibilidade da idade dos demais pedidos; não tomar vagas
  ocupadas nem dispensar a aceitação do serviço.
- Modelar antecedência mínima para novas reservas externas separada da remarcação, desativada por
  padrão e configurável por serviço (2C-FR-15). Usar duração não negativa e instantes do servidor;
  início deve continuar estritamente futuro mesmo com prazo zero/desativado. Consulta de vagas e
  comando partilham o cálculo; revalidar configuração sob lock e tempo antes de persistir, inclusive
  depois de espera. Com valor positivo, igualdade ao limite é aceita. Mudanças valem para novos
  pedidos, preservando reservas e pendências anteriores; cruzar o limite durante a análise não cria
  expiração. A regra vale nos dois modos de ocupação e de aceitação. Não reutilizar esse campo como
  prazo de remarcação ou impor esse prazo ao destino de uma troca sem decisão própria.
- Horizonte futuro externo (2C-FR-16): adicionar política por serviço com padrão de 90 dias
  corridos, editável e desativável. Usar instante do servidor + duração em dias de 24 horas;
  comparar início da reserva/destino de troca com limite inclusivo. Recalcular nas consultas e
  comandos, sem job diário para abrir vagas. O horizonte não gera expediente ou capacidade.
  Revalidar configuração sob lock entre prévia e envio; alterações valem para novos pedidos, sem
  invalidar reservas ou propostas anteriormente recebidas. Campos de antecedência mínima, horizonte
  e prazo de remarcação são independentes; combinar somente regras aplicáveis. Horizonte desativado
  não significa consulta ilimitada: paginar intervalos de disponibilidade e manter limites técnicos
  de cada endpoint, sem impor outro teto comercial oculto.
- Modelar antecedência mínima de remarcação por serviço com padrão de 24 horas e desativação
  explícita. Ao receber um pedido externo, comparar o relógio do servidor ao início atual da
  reserva; exatamente no limite é permitido. Revalidar sob o mesmo protocolo transacional da
  reserva/configuração, sem confiar em horário do cliente. Guardar a política aplicada para
  auditoria; cruzar o limite durante análise não invalida pedido aceito dentro do prazo. Mudar a
  configuração afeta novos envios e não cria expiração automática.

- Cancelamento externo de reserva confirmada ou pedido novo aguardando aprovação verifica no
  servidor que o início confirmado/solicitado ainda é futuro, sem aplicar prazo de remarcação nem
  aguardar aprovação da equipe. Pedido novo vai a cancelled, libera ocupação e sai da fila/ alertas
  no mesmo commit; preservar ID/histórico e intenção de aviso sem alterar contador de trocas.
  Coordenar com aprovar/recusar e revalidar acesso/vínculo, inclusive em replay. Replay de
  cancelamento concluído não é novo cancelamento após início. Validar a versão, autorizar e cancelar
  em transação. Encerrar troca pendente libera apenas destino, pois origem já está livre; para a
  ação externa, manter a fronteira baseada no início original registrado. Uma aprovação concorrente
  precisa detectar mudança de versão/situação; não reativar reserva cancelada nem deixar retenção
  órfã. Cancelamento do atendimento e desistência da troca têm eventos distintos. Desistência não
  restaura a consulta original; impedir aprovação de proposta retirada ou substituída usando versão
  e estado da proposta.

- Limite por troca voluntária lógica: separar contador confirmado e ciclo debitável em andamento.
  Primeiro pedido válido reserva uma utilização, com invariantes confirmed_count +
  active_cycle_count <= 2 e active_cycle_count em 0/1 conta somente ciclos debitáveis; recuperação
  do estabelecimento é identificada separadamente e não entra no limite, mantendo no máximo um
  processo ativo por reserva. Falha antes de commit não reserva utilização. Revalidar sob lock da
  reserva; usar identificador estável do ciclo e IDs/versionamento das tentativas. Recusa, retirada,
  substituição e retomada preservam o ciclo; só o destino atual ocupa agenda, e o estado aguardando
  escolha ocupa zero vagas. Aprovar qualquer tentativa converte utilização reservada em confirmada e
  fecha ciclo atomicamente, sem segunda cobrança. Nova solicitação após confirmação abre novo ciclo
  e reserva próxima utilização. Não usar quantidade de pedidos ou eventos como contador. Duas
  confirmadas bloqueiam terceiro ciclo voluntário, sem bloquear recuperação isenta por
  indisponibilidade do estabelecimento. Cancelamento definitivo encerra ciclo sem consolidar
  utilização; não restitui confirmadas nem apaga histórico. Novo agendamento tem outra
  identidade/contador zero. Projeções mostram confirmadas/em andamento separadas. Conciliar eventos
  legados; contador desconhecido recebe zero pela política de transição aprovada em 05/10/2026, sem
  reconstruir histórico.
- Indisponibilidade do estabelecimento (2C-FR-20): comando explícito da equipe autorizada para
  atendimento confirmado, com ator/causa e snapshot do horário afetado. Na mesma transação,
  registrar a indisponibilidade efetiva do recurso/período, remover a ocupação da reserva e iniciar
  recuperação isenta no mesmo ID, exibindo “Aguardando nova data — alteração pelo estabelecimento”.
  Não liberar o período para novas reservas por remover essa ocupação. Manter histórico e contador
  voluntário; ciclo isento não reserva nem consolida utilização, mesmo com duas trocas confirmadas.
  Alternativas/recusas/retomadas herdam a causa isenta até confirmar ou cancelar. Só uma
  proposta/destino pode ocupar vaga; sem escolha ocupa zero. Reutilizar guardas de destino futuro,
  horizonte, autorização, elegibilidade, disponibilidade, aceitação e prioridade pelo início
  afetado. Não reaplicar as 24 horas da origem ou antecedência de nova reserva, inclusive após
  início original. Após confirmar, nova mudança voluntária volta ao limite/prazo usuais. Registrar
  aviso devido de forma durável e idempotente junto à decisão; canais/preferências/destinatários
  seguem 2C-FR-23/24; provedores e entrega serão detalhados. Cliente não pode forjar a causa isenta.
  Falha/concorrência não produz bloqueio parcial, retenção órfã nem alteração de terceiros. Não
  substituir guardas atuais de edição de agenda por movimentação automática em massa.
- Comunicação transacional (2C-FR-23/24): planejar avisos internos app/site, e-mail e WhatsApp para
  confirmação, recusa, cancelamento e necessidade de remarcar. Preferências por pessoa, todos os
  meios habilitados inicialmente, editáveis no app; aviso interno não equivale a push móvel nem
  oculta histórico quando desativado. Resolver destinatários pela pessoa atendida: titular recebe os
  próprios; dependente e titular vigente recebem os do dependente, qualquer que seja o autor.
  Aplicar preferências de cada destinatário, revalidar vínculo/acesso antes do envio/reenvio e
  deduplicar por evento/pessoa/canal. Persistir intenção de entrega junto ao evento de domínio e
  executar envio separadamente, com resultado rastreável; indisponibilidade ou falta de contato não
  desfaz reserva nem simula entrega. Definir provedores/templates e operação de reenvio na
  integração, sem misturar campanhas de Mensagens ou pressupor entrega. Os três e-mails operacionais
  de falta seguem a exceção BF-FR-06; não estender a exceção aos demais eventos.
- Jornada e público-alvo (2C-FR-25): após autenticação, resolver beneficiário antes de serviço/
  unidade, profissional quando aplicável e vaga. Configuração publicada distingue serviço para
  titulares/dependentes de exclusivo para titulares. Reutilizar perfil/vínculo de Associados;
  aplicar ao beneficiário, nunca só ao usuário que opera. Filtrar oferta e revalidar no domínio em
  vagas, envio, aprovação e remarcação/recuperação; mudanças de beneficiário invalidam escolhas
  incompatíveis. Descoberta pública continua com indicação de público-alvo; ao iniciar reserva,
  validar o beneficiário antes da oferta pré-selecionada. Preservar reservas existentes e regras
  legadas na transição; rascunho não altera elegibilidade publicada.
- Projetar eventos da agenda para o histórico individual do beneficiário, preservando autor, origem
  e registro de referência. A integração transversal é responsabilidade do programa 002; compras
  dependem do domínio responsável e da política de acesso própria. Não conceder acesso financeiro
  por herdar a representação familiar de agenda.

- Escolha de profissional: configuração do estabelecimento/unidade controla a oferta de nome
  específico ou qualquer disponível. Projetar o controle somente quando a escolha estiver habilitada
  e houver profissionais ativos habilitados para o procedimento. Escolha desativada com equipe
  cadastrada e opção “qualquer” usam atribuição pelo servidor entre profissionais livres e aptos;
  mostrar o responsável antes de concluir. Revalidar configuração, vínculo e disponibilidade, sem
  confiar no identificador fornecido pelo cliente nem trocar o responsável exibido silenciosamente.
  Algoritmo avançado de distribuição de carga não integra esse recorte. Sem profissionais
  cadastrados, ocultar o controle e oferecer reserva pelos horários e capacidade configurados para o
  serviço na unidade (2C-FR-14). Diferenciar explicitamente os modos de ocupação; falta de
  vaga/profissional apto não autoriza fallback para capacidade. A migration aditiva deve preservar
  assignments existentes e permitir vínculo direto à oferta no modo sem profissional, com
  invariantes por modo, sem profissional fictício.
- Agenda por capacidade: exigir inteiro positivo e horários definidos no painel; intersectar
  funcionamento da unidade e duração do procedimento. Serializar alterações da capacidade, horários
  e ocupações da mesma oferta, recontando intervalos sobrepostos na transação antes de aceitar.
  Restrições de exclusão por profissional não resolvem capacidade maior que um. Reservas
  confirmadas, pendentes e destinos retidos usam o mesmo controle. No envio da troca, retirar origem
  e incluir somente destino atomicamente, inclusive em sobreposição parcial; terceiros continuam
  protegidos. Aprovação conserva destino; recusa/retirada libera destino. A referência histórica da
  origem não ocupa capacidade nem conflito do beneficiário. Preservar modo e referências em cada
  reserva; mudanças que invalidem ocupação futura exigem resolução explícita antes de efetivar.
  Cadastro posterior de equipe não converte nem cancela reservas existentes.

### Contrato lógico produzido e vinculações restantes

O [contrato lógico v1](contracts/channels.md) documenta: oferta com publicação conjunta para
app/site e política de confirmação por serviço, antecedência mínima de novas reservas, horizonte
futuro e permissão de escolha de profissional por estabelecimento; consulta de vagas por
procedimento/unidade, modo de ocupação, profissional quando aplicável e beneficiário quando
necessário; público-alvo por beneficiário, preferências pessoais de comunicação e destinatários;
envio com situação confirmada ou aguardando aprovação; próximas e históricas próprias; detalhe;
remarcação; cancelamento. Planejar comandos administrativos de aprovação/recusa com permissão e
auditoria, incluindo indisponibilidade do estabelecimento e recuperação isenta no mesmo agendamento.
Definir autenticação, autorização, campos mínimos, paginação/limites de consulta, fuso, códigos de
conflito e sessão revogada. Operações e dados lógicos estão definidos; implementar schemas e
vincular os caminhos HTTP da seção 1.3 após verificar identidade/transporte, sem simular
compatibilidade já implementada. Manter o contrato administrativo em
[contracts/admin.md](contracts/admin.md); sua extensão 2C referencia o contrato externo sem
substituir consumidores históricos do painel.

### Destinos de implementação de 2C — tarefas de 24/09

Destinos abaixo são planejamento, sem criação de código. Manter os serviços existentes quando a
responsabilidade já estiver em booking/catalog/hours/availability; novos arquivos separam fronteiras
concretas de acesso, processo, fila e entrega, sem framework genérico.

| Destino                                                                         | Responsabilidade e condição                                                                                                                   |
| ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/contracts/src/scheduling-channels.ts` e `scheduling-channels.test.ts` | Novos: schemas v1 e testes após vínculo HTTP/identidade verificado.                                                                           |
| `packages/db/migrations/`, `packages/db/src/schema.ts`                          | Extensão aditiva conforme T045; nome SQL exato somente após conferir sequência. 0028 já é citado no ciclo de vida e não pode ser reutilizado. |
| `apps/web/modules/scheduling/channel-access.ts`                                 | Novo: adapter da identidade existente, representação e negação por padrão.                                                                    |
| `apps/web/modules/scheduling/channel-query-service.ts`                          | Novo: projeções pública/privada, elegibilidade e histórico, sem copiar cadastro.                                                              |
| `apps/web/modules/scheduling/reschedule-service.ts`                             | Novo: processos/propostas/ciclos, sob protocolo transacional único.                                                                           |
| `apps/web/modules/scheduling/approval-service.ts` e `approval-queue-service.ts` | Novos: decisões versionadas, responsabilidade, ordenação e alertas.                                                                           |
| `apps/web/modules/scheduling/provider-recovery-service.ts`                      | Novo: indisponibilidade operacional/recuperação isenta; integra hours/reschedule sem alterar terceiros.                                       |
| `apps/web/modules/scheduling/notification-service.ts`                           | Novo: preferências, evento/intenção e avisos internos; transporte fora da transação.                                                          |
| `apps/worker/src/jobs/scheduling-notifications.ts`                              | Novo: handler de avisos integrado a `apps/worker/src/main.ts`, com jobs existentes; depende de T044.                                          |
| `apps/web/modules/scheduling/http/channel-routes.ts`                            | Novo: adaptador HTTP conforme channels §1.3; T041 verifica sessão e colisões antes de T070.                                                   |
| `apps/web/modules/scheduling/ui/`                                               | Extensões dos componentes administrativos identificados em T043; guia é gate.                                                                 |
| Clientes app/site                                                               | Caminhos pertencem à spec própria de 002 UI01/UI02; T043/T072 registram correspondência, sem duplicar implementação.                          |

Testes novos de contratos, políticas, integração e worker estão nomeados em T046–T073 de
[tasks.md](tasks.md). Aplicação continua modular, com PostgreSQL como única fonte; não ativar
adapters sintéticos no ambiente real. Evidências futuras: `evidence/channels-validation.md` e
`evidence/channels-ui-validation.md`.

### Experiência e acessibilidade

O planejamento de navegação externa cobre descoberta de serviços antes do login e, depois de
autenticar, identificação do beneficiário, serviço/unidade elegível, profissional quando aplicável,
data/horário, revisão/envio e “Minhas reservas”, com situação explícita de confirmação ou espera de
aprovação e recuperação de conflito sem perder escolhas. O painel mantém Lista/Dia/Semana/Mês e
ações existentes. A pesquisa identifica padrões, mas não define aparência: ler o guia canônico
docs/caab-design.md da pasta principal e a spec da interface app/site antes de desenhar telas. O
guia local estava inacessível nesta revisão remota; nenhuma conformidade visual foi presumida.
Validar teclado, foco, mensagens de estado, tela móvel e WCAG 2.2 AA em protótipo e na entrega.

### Validação planejada

- Equipe/backup e alerta (2C-SC-20/21): acesso de consulta/alteração, vínculo e revogação,
  concorrência, autor auditado, 23h59min59s/24h, configuração/desativação, idade e ausência de
  transições automáticas. Urgência a 24h00min01s/24h/menos de 24h, prazo configurado, pedido
  recém-recebido, destino alterado, atraso desativado e passagem do início sem decisão; preservar
  ordenação pela origem e não aprovar retroativamente.
- Avisos (2C-SC-22/23): três meios inicialmente ativos, alterações individuais persistidas, eventos
  cobertos, destinatários independentes de autoria, vínculo encerrado antes de envio/ retry,
  ausência de contato, falha, deduplicação e reserva preservada. Separar testes simulados de
  evidência real de entrega com o provedor escolhido.
- Elegibilidade e jornada (2C-SC-24): beneficiário primeiro, titular por si autorizado e titular por
  dependente/dependente por si negados no serviço exclusivo, incluindo APIs, aprovação e
  recuperação; mudança de beneficiário, oferta para ambos e rascunho sem efeito público.

- Recuperação pelo estabelecimento (2C-SC-19): testar zero/uma/duas trocas voluntárias já usadas,
  aviso devido uma vez, autenticação/causa autorizada, ambos os modos de agenda, liberação da
  ocupação sem reofertar indisponibilidade, continuidade do mesmo ID e histórico, recuperação dentro
  das 24 horas/após início original, confirmação imediata/manual, alternativas recusadas,
  cancelamento, retry e concorrência. Contador voluntário permanece igual; após recuperação
  confirmada, volta a reger mudanças voluntárias. Entrega real do aviso depende da definição de
  comunicação e terá evidência própria.

- Publicação (2C-SC-18): Salvar novo serviço mantém invisibilidade externa; Publicar salva e publica
  numa ação para app e site, sem escolha de canal. Validar oferta incompleta, permissão de consulta
  sem alteração, modo sem profissionais, agenda válida esgotada, repetição, concorrência e falhas
  sem perda de campos, publicação parcial ou duplicação. Ativo sem publicado continua privado. Em
  serviço publicado, verificar persistência/reabertura do rascunho com Salvar alterações e
  isolamento dos valores públicos em catálogo/vagas/comandos; Publicar alterações sem salvar
  previamente substitui a revisão vigente atomicamente. Cobrir erro/concorrência preservando
  publicação anterior, idempotência sem duplicação, reservas existentes e disponibilidade
  operacional atual enquanto houver rascunho. Conferir rótulos distintos entre cadastro e edição
  publicada e descrições persistentes logo abaixo de cada botão, legíveis em telas estreitas e
  acessíveis. Verificar a mesma revisão publicada em ambos, atualização das projeções/caches dos
  dois e isolamento do rascunho nos dois; falha mantém a publicação anterior compartilhada.

- Contagem por troca voluntária (2C-SC-10): verificar sequência (confirmadas, em andamento) 0/0 →
  0/1; substituições/recusas/retomadas mantêm 0/1; aprovação resulta em 1/0; próxima troca em 1/1;
  segunda aprovação em 2/0; terceiro ciclo negado. Retry e corrida não cobram duas vezes nem deixam
  ciclo órfão. Cancelamento sem horário, inclusive após início original, encerra o ciclo sem
  incrementar confirmadas. Projetar contagem corretamente na experiência do usuário.

- Retomada (2C-SC-17): recusa e desistência, antes/depois do horário original; identidade e contador
  preservados, sem aplicação das 24 horas, com destino futuro/horizonte/aceitação e todas as
  guardas. Falha e conflito conservam estado sem horário; corrida/retry não duplica proposta.
  Recusas sucessivas não consomem limite; origem ocupada por terceiro é intocada.

- Aprovação tardia (2C-SC-16): início original alcançado/passado com proposta válida mantém análise;
  destino futuro pode ser aprovado, destino atual/passado não. Contagem/histórico exatamente uma
  vez, sem inferir comparecimento/falta ou permitir novo pedido fora do prazo. Decisão
  concorrente/cancelamento continua protegida por versão e transação.

- Horizonte (2C-SC-15): limite de 90 dias inclusivo e um segundo além, avanço diário, edição para 30
  dias, desativação, mudança entre prévia e envio e preservação de reservas/propostas anteriores.
  Conferir novo pedido/destino de remarcação, fusos, duração completa no expediente, ambos os modos
  de ocupação/aceitação e consulta por intervalos quando não houver teto comercial.

- Novas reservas (2C-SC-14): padrão sem prazo, início futuro versus início atual/passado, limite
  configurado exato e imediatamente abaixo, mudança/desativação entre prévia e envio, relógio do
  servidor/fusos e tempo decorrido esperando locks. Cobrir profissional/capacidade,
  confirmação/aprovação e preservação de pendências/reservas existentes. Verificar que a
  configuração de novas reservas não altera o prazo separado de remarcação.

- Contratos: visitante sem login consulta o mesmo catálogo publicado no app e no site, sem dados
  privados/rascunhos; consulta anônima de vagas é negada. Identidade revogada não consulta vagas ou
  reservas; ator sem vínculo não enumera nem lê reserva de terceiro.
- Integração em PostgreSQL descartável: painel versus app/site disputam mesma vaga; mesmo
  beneficiário em unidades/profissionais distintos não sobrepõe; titular e dependente distintos
  podem coincidir; retry não duplica; recusa de remarcação libera destino e mantém histórico, sem
  restaurar origem. Falha antes de registrar a troca conserva a ocupação anterior. Serviço novo
  confirma imediatamente; ao desativar a opção, novos envios ficam pendentes sem alterar reservas já
  confirmadas. Pendência impede reservas conflitantes por profissional ou beneficiário no painel e
  no app/site; aprovação não duplica ocupação, recusa a libera uma vez. Não há expiração automática.
  Aprovação/recusa exige acesso de alteração, revalida dados e não duplica eventos.
- Jornada com identidades sintéticas: titular reserva para si e dependente; dependente reserva para
  si e é negado ao tentar reservar para titular ou outro dependente. Ambos consultam a reserva do
  dependente criada pelo titular; após cessar o vínculo, só o dependente a consulta. Cobrir
  remarcação/cancelamento de reservas futuras confirmadas por ambos com vínculo vigente e negar o
  titular após revogação. Validar remarcação imediata e com aprovação conforme serviço. Recarregar
  painel e canal externo, revogar sessão, revalidar bloqueio, testar fuso diferente e mudança de
  oferta entre prévia e confirmação.
- Troca com aprovação: envio libera origem e retém só destino; um terceiro pode reservar origem
  antes da análise. Aprovar mantém destino; recusar/desistir libera destino sem restaurar origem ou
  tocar reserva de terceiro. Falha antes de persistir pedido preserva origem; falha posterior ao
  substituir preserva destino anterior, sem reocupar origem. Cobrir sobreposição parcial,
  profissional/capacidade, conflito de beneficiário, retry, versões e falta de autorização. Provar
  aviso antes do envio e projeções sem compromisso confirmado na origem. Aprovação tardia segue
  2C-SC-16, sem pendência de decisão sobre o simples decurso do horário original.
- Fila/prazo: provar que remarcação para amanhã precede outra para o próximo mês mesmo enviada
  depois, e que ambas precedem novos pedidos; verificar desempates e paginação estáveis. Cobrir
  limite exato de 24 horas, instante imediatamente anterior, prazo editado, desativado, navegador em
  outro fuso e pedido que cruza o limite durante análise. A idade do pedido e o horário pretendido
  não podem inverter o critério principal de prioridade.
- Cancelamento (2C-SC-08): para confirmado e pedido novo em análise, permitir um segundo antes do
  início e negar exatamente no início/depois, sem antecedência mínima ou aprovação da equipe.
  Conferir liberação única, saída da fila/alertas, histórico/avisos/contador, acesso familiar e
  ambos os modos de agenda. Repetição após início retorna resultado já concluído sem nova mutação;
  corrida com aprovação/recusa não reativa pedido cancelado nem libera vaga adquirida por terceiro.
  Encerramento de troca vinculada mantém suas fronteiras específicas.
- Limite/histórico: duas remarcações confirmadas permitidas, terceira negada; pendência,
  recusa/desistência e substituição de proposta não consomem limite. Validar retry e confirmação
  concorrente na última troca disponível. Cancelar e agendar de novo preserva a linha do tempo
  individual e reinicia contagem só no novo registro. Titular como autor não muda o beneficiário.
- Seleção de profissional: matriz de escolha habilitada/desativada e equipe apta ausente/presente;
  nome específico versus qualquer disponível; responsável identificado antes de concluir;
  profissional inativo/sem vínculo não elegível; alteração de configuração e concorrência entre
  prévia e envio. Provar que a API não aceita escolha forçada quando desativada e não troca
  silenciosamente o profissional apresentado.
- Capacidade por serviço sem profissionais (2C-SC-13): concorrência com capacidade 1 e 3,
  sobreposição parcial, duração, limites do expediente, confirmação/aprovação, remarcação,
  substituição e liberação. Provar ausência de sobrelotação, dupla contagem da mesma troca e
  retenções órfãs; proteger beneficiário entre modos. Conferir criação sem equipe, leitura em
  lista/calendário/detalhe/histórico e exportação sem nome fictício, além de preservação das
  reservas existentes ao mudar cadastro/configuração.
- Interface: estados vazio/carregamento/erro, recuperação, teclado, 390 px, temas e revisão pelo
  guia CAAB; evidências por versão e canal. Medir tempo para encontrar vaga, conflito recuperável e
  trabalho manual, sem inventar metas antes de medir a linha de base.
- Gates do workflow e homologação dos consumidores externos só depois do contrato e ambiente
  autorizados. Usar dados sintéticos; não ativar localhost, seed real ou serviço pausado por este
  plano.

### Transição e rollback

Fatos informados em 24/09/2026: titulares e dependentes já têm acessos individuais no sistema atual;
reservas futuras em uso ainda precisam ser conferidas. Isso não comprova provedor, compatibilidade
de sessão/credencial, integridade de vínculos ou volume de reservas. Inspecionar contrato/mecanismo
de acesso e amostra autorizada/inventário, sem extrair segredos nem criar login paralelo por módulo.
Mapear identificador da conta à pessoa de Associados por correspondência verificável; ambiguidades
ficam para reconciliação, sem ligar pessoas apenas por nomes iguais. Planejar testes com identidades
sintéticas de titular/dependente, revogação, continuidade de histórico e acesso às reservas
próprias. A conta individual não concede acesso administrativo.

O inventário deve registrar fonte/versão/data, quantidade e situações das reservas futuras,
identificadores de beneficiário/unidade/serviço/profissional e correspondências de contas. Acesso
aos dados reais e execução da transição dependem do fluxo autorizado. Se houver reservas futuras,
conciliá-las antes de ativar escrita no novo fluxo; se a ausência for comprovada, registrar essa
evidência. Importação de logs/estados históricos antigos é opcional e não bloqueia as funções novas;
não apagar a origem. Resultado desconhecido mantém o corte pendente, sem presumir importação
concluída ou agenda vazia.

Planejar compatibilidade de leitura dos consumidores e migração verificável de reservas/contas que
precisem sobreviver ao corte. Não fazer escrita dupla cega entre legado e CAAB. Definir responsável,
janela de corte, deduplicação, reconciliação e retorno antes de publicar o canal. Rollback do
cliente/API preserva reservas, autores e histórico; não remover migrations ou dados para desfazer
uma interface. A ativação em produção depende de evidências e autorização do fluxo de entrega.

### Decisões ainda bloqueadoras

Cancelamento de pedido novo em análise foi autorizado pelo usuário: antes do início solicitado, sem
aprovação da equipe, com liberação imediata e histórico preservado (2C-FR-09/2C-SC-08).

Verificação e integração dos acessos individuais já existentes, mapeamento de pessoas e revogação de
vínculo; instalação futura/configuração WAHA, integração ao e-mail do sistema, textos e operação de
entrega/reenvio; existência de reservas futuras do legado ainda por conferir. Histórico antigo
detalhado é opcional. Equipe principal/backup, alerta de 24 horas configurável,
canais/preferências/destinatários e ordem da jornada e urgência a 24 horas do atendimento
configurável foram definidos em 24/09/2026. O contrato lógico e o roteiro podem ser revisados com
adaptadores sintéticos identificados; ativação externa permanece bloqueada por essas dependências.
Este plano não serve como ordem de implementação. A continuidade depende da autorização solicitada
ao usuário para iniciar T040–T077; conferir ambiente/base, provar integração/inventário e
compatibilidade com UI01/UI02 conforme T040–T050, respeitando os gates antes de cada etapa.

### Entrada no implement — revisão de 28/09

[Checklist de requisitos](checklists/channels.md) e
[checkpoint para autorização](evidence/pre-implement-2026-09-28.md) acompanham o recorte. Política
técnica de tentativas/callbacks/retenção operacional: contracts/channels.md §10.2. Os números são
decisões de desenho e precisam de prova no adaptador, sem alterar histórico de negócio. A lista
permanece com 38 tarefas pendentes; nenhuma execução autorizada por este plano.

O impedimento anterior do executor foi resolvido em 28/09. Worktree e sincronização foram
conferidas, o guia de design foi localizado na pasta principal e a revisão documental está em
[evidence/reconciliation-2026-09-28.md](evidence/reconciliation-2026-09-28.md). Isso não equivale à
execução integral dos workflows do Spec Kit nem conclui T040/T043: permanecem as verificações de
integração e conformidade da entrega. Os marcadores da checklist são do revisor; a futura etapa
implement precisa ler seu estado e obter autorização explícita se houver itens abertos.

## Histórico anterior — referência, não sequência executável atual

O conteúdo abaixo preserva decisões/evidências anteriores. Em caso de divergência, valem o desenho
vigente de 28/09 acima e a spec atual; não reabrir branches/PRs já integrados.

<details>
<summary>Plano anterior preservado</summary>

# Implementation Plan: Agendamentos em três etapas

**Branch**: `feature/scheduling-management-20260915` | **Date**: 2026-09-15 **Spec**:
[spec.md](spec.md) **Status**: etapa 1 (US1 + US2) implementada e validada; resultados em
[evidence/release-review.md](evidence/release-review.md). O setup-plan resolveu os caminhos da spec;
seu campo BRANCH inferiu o nome da pasta. A branch real foi conferida com git e é a indicada acima.

## Summary

### Continuidade vigente — 18/09/2026

Entrega original do calendário: `feature/reports-analytics-20260918`, PR34 integrado em ed31baf;
branch encerrada para trabalho novo. Incremento CAL-F01–CAL-F06: FullCalendar Standard 7.1.0/React e
temporal-polyfill 1.0.1, importação dinâmica somente ao abrir a grade. Plugins daygrid/timegrid e
tema classic adaptado aos tokens; locale pt-BR e America/Bahia. Toolbar com Button/Link existentes,
visualização/data controladas pela URL. Novo GET /api/v1/scheduling/calendar, limites 42 dias/1.000
registros e mesmas guardas. Nenhuma migration ou alteração dos comandos transacionais. Carregamento
abortável pela infraestrutura existente; limpar eventos anteriores ao trocar consulta/erro. Testar
contratos, limites/isolamento no banco, navegação, fuso e ações no navegador. Consolidar
implementação/testes/documentação antes dos checks locais e CI final. App/site permanece posterior;
não executar automaticamente o restante do roadmap.

### Implementação autorizada em 15/09/2026

Branch atual feature/scheduling-management-20260915, mesma worktree do planejamento. T001–T020
autorizadas pelo pedido de execução. Hipóteses da primeira versão mantidas conforme recorte
apresentado: lista diária, reservas individuais futuras, Agendado/Cancelado. Migration0020;
envelopes de erro seguem padrão existente (validação422, não400). Escritas da agenda e mudanças de
elegibilidade usam o advisory lock transacional5010/1, já existente para vínculos de Associados,
antes de locks de linhas. Esta primeira versão serializa escritas curtas para eliminar corridas
entre catálogo, horários, titulares e reservas; leituras continuam concorrentes. GiST impede
sobreposição também no banco. Otimização por profissional só se medição posterior justificar
complexidade. Horários semanais têm uma faixa por dia; almoço divide a jornada e reinicia a grade de
vagas pela duração do procedimento. Alterar pai de um cadastro existente é recusado; criar
vínculo/cadastro novo preserva referências e histórico. Busca mínima de pessoas retorna nome, ano de
nascimento e OAB quando disponível, sem CPF/contato/documentos.

Primeiro entregar catálogo mínimo + horários + lista diária + criar/consultar/remarcar/ cancelar no
painel. Após essa primeira versão validada, o próximo passo do produto será a primeira versão da
interface do usuário no app/site, com especificação própria e integração de reservas coordenada
nesta spec. Depois retomar os demais incrementos até o legado e, por último, selecionar sugestões
novas. [Roadmap e limites](roadmap.md).

## Technical Context

- **Language/Version**: TypeScript 6, Node 24, versões da base atual.
- **Primary Dependencies**: Next.js 16.3.4/React 19, pg, Zod, formulários e componentes existentes.
  Não instalar Cal.com. Lista inicial com componentes existentes; decisão documentada de adiar
  FullCalendar apesar da referência anterior em STACK.
- **Storage**: PostgreSQL, migrations aditivas; nenhuma migration escrita nesta fase.
- **Testing**: Vitest para contratos/unidade/integração real, Playwright e axe.
- **Target Platform**: painel web desktop/mobile; serviços locais desligados.
- **Project Type**: monólito modular; scheduling é domínio próprio.
- **Performance Goals**: lista diária paginada (25 padrão/100 máximo), sem carregar
  catálogo/histórico inteiro; alvo de primeira resposta útil em 2s em ambiente de validação com 10
  mil reservas sintéticas. É alvo proposto, não SLA comprovado.
- **Constraints**: UTC persistido, America/Bahia exibido; Q8 exige acesso concedido a Agendamentos.
  Sem motivo obrigatório, dados clínicos ou créditos.
- **Scale/Scope**: várias unidades e serviços; uma pessoa e um profissional por reserva na primeira
  entrega. Um profissional pode ter vínculos válidos em várias unidades, mantendo prevenção global
  de conflito para sua identidade.

## Constitution Check

Pré/pós-design: solução coesa no monólito, PostgreSQL como autoridade, contratos versionados,
auditoria, minimização e acessibilidade. Sem nova infraestrutura. Decisões explícitas do usuário
prevalecem sobre trechos históricos locais: Q8 de 21/09 exige acesso concedido a Agendamentos além
da sessão administrativa; motivos não são obrigatórios. Não ampliar permissões de outros módulos.
Branch feature vigente conforme instrução do ambiente; exceção de Processamentos em outra branch
está registrada no mapa local. Gates de implementação continuam exigidos; planejamento não equivale
a aprovação de CI, teste, merge ou deploy. Nenhuma integração Cal.com necessária identificada.

## Project Structure

Documentação em specs/008-scheduling-management: spec, plan, research, roadmap, data-model,
contracts/admin.md, quickstart, tasks e checklists/requirements.md.

Estrutura implementada:

- apps/web/modules/scheduling/ — catálogo, horários, disponibilidade, comandos e UI.
- apps/web/app/(admin)/scheduling/ — lista, configuração e detalhes.
- apps/web/app/api/v1/scheduling/ — endpoints autenticados do painel.
- packages/contracts/src/scheduling.ts — contratos.
- packages/db/migrations/ — 0020_scheduling.sql.
- packages/db/src/repositories/members.ts — leitura mínima e coerente da elegibilidade.
- apps/web/modules/members/ — coordenação de bloqueios/vínculos com confirmação.
- apps/web/modules/workspace/ — navegação e busca.
- apps/web/modules/audit/ — descrições humanas dos eventos.
- apps/web/tests/integration/scheduling.test.ts e tests/e2e/scheduling.spec.ts.

**Structure Decision**: reaproveitar componentes/auth/auditoria e cadastro de associados. Unidades
da agenda não são automaticamente unidades de Parceiros; profissionais não são contas de login. Não
antecipar motor genérico de recursos, turmas ou pagamentos.

## Sequência da entrega

1. Contratos/modelo, migrations e testes de integridade.
2. US1: catálogo mínimo, autorização e horários, busca de beneficiário e criar reserva.
3. US2: lista/detalhes, remarcação/cancelamento, integração com auditoria e navegação.
4. Executar roteiro, CI e revisão visual; abrir PR somente quando a entrega for funcional.
5. Após validar a primeira entrega, priorizar a primeira interface do usuário no app/site: preparar
   seu spec/plano/tarefas próprios e detalhar a integração de reservas nesta spec (incremento
   2C/T022), antes dos demais incrementos da etapa 2.
6. Entregar e validar o recorte definido para app/site; depois retomar os demais incrementos de
   Agendamentos, atualizando esta spec.
7. Novidades só após seleção explícita; não executar roadmap como backlog já autorizado.

## Integridade e concorrência

- Decisão de 20/09/2026 (FR-017; implementação pendente): bloqueio administrativo não modifica
  reservas existentes nem libera ocupação. Consultas de agenda/detalhes devem projetar a sinalização
  do impedimento próprio ou de titular vigente com a mesma regra de elegibilidade dos comandos, sem
  copiar o status para dependentes. Preservar Agendado/Cancelado e a auditoria; não criar rotina
  automática de cancelamento. Validar lista/calendário/detalhes e cancelamento manual com pessoas
  sintéticas.

- Intervalos [início,fim); exclusion constraint GiST por profissional e intervalo para status
  scheduled. Extensão btree_gist aplicada pela migration.
- Decisão de 20/09/2026 (FR-016; implementação pendente): acrescentar proteção transacional e
  restrição no PostgreSQL por member_id e intervalo para scheduled, preservando a restrição por
  profissional. member_id identifica a pessoa atendida; nunca usar o titular para agrupar
  dependentes nem user.id do operador. Antes de aplicar nova migration, diagnosticar sobreposições
  preexistentes e exigir resolução explícita, sem cancelar, apagar ou remarcar dados
  automaticamente. Criar/remarcar deve revalidar ambos os conflitos; a própria reserva fica excluída
  da comparação ao remarcar. Canceladas não ocupam intervalo; limites são [início,fim). Cobrir
  concorrência, rollback e independência de titular/dependentes em banco descartável e na jornada da
  interface quando a implementação for retomada.
- Criar/remarcar em transação, com lock de configuração/identidades e releitura. Escritas em
  horários/catálogo usam a mesma ordem de locks. Erro na remarcação faz rollback.
- Mudanças em bloqueio/vínculo de dependência precisam participar do mesmo protocolo. Apenas reler o
  associado não elimina corrida; cobrir criação/encerramento de vínculos e bloqueio de titular em
  testes de integração da spec005 também.
- Repetição: idempotency key por ator/operação, hash do pedido e resultado persistidos junto da
  alteração. Chave reutilizada com outro conteúdo retorna conflito.
- Edição: versionamento otimista; datas, duração e vínculo definidos no servidor.
- Busca mínima de beneficiários sob autorização de Agendamentos retorna apenas id/nome/indicação
  suficiente para seleção; não exige members:read nem libera o cadastro completo de Associados.
  Validar contra nomes iguais e dados sensíveis.

## Rollout, migração e rollback

Primeira entrega independente do legado, uso administrativo; sem sincronização, seed real ou
migração automática. Preservar dados de qualquer preview existente. Mudanças aditivas no schema;
rollback da aplicação preserva registros gravados. Antes da conexão app/site, documentar contrato,
autenticação de beneficiário, ambiente, mapeamento de identidades/dados e corte de escrita para
evitar duas agendas concorrentes. Homologação com dados sintéticos; nenhum tráfego público muda
nesta etapa.

## Gates e próximos passos

Format/lint/types, contratos, integração real concorrente, E2E, a11y, build, segurança e revisão
humana conforme DELIVERY-WORKFLOW. Executar no CI quando houver código; não reativar localhost/banco
sem pedido. Resultados em evidence/; tarefas atualizadas conforme implementação e validação.

## Revisão autorizada de UI/UX — 16/09/2026

Branch fix/scheduling-ui-20260916, criada de dev96ea6f6 após PR28 integrado. Worktree
.cache/pr-scheduling-ui-20260916. Este ciclo substitui a indicação de branch ativa no cabeçalho
histórico.

1. Comparar UI atual com Parceiros/Associados e reutilizar componentes/layout existentes; registrar
   orientação permanente no AGENTS local.
2. Cabeçalho com inclusão e abas por cadastro; catálogo com kind na URL, busca e tabela; formulários
   com título específico, salvar/cancelar e foco acessível.
3. Agenda com busca/data e filtros adicionais recolhíveis; tabela com link de reserva, vazio com
   ação. Melhorar organização da reserva, horários, detalhes e histórico no mesmo padrão.
4. Atualizar a jornada E2E para navegar pelas ações visíveis e provar inclusões/persistência,
   filtros, teclado/390px/temas; revisar capturas no CI.
5. Qualidade/build/banco/navegador/segurança no CI; sem build ou E2E no PC. Abrir novo PR após
   revisão, sem aprovação ou merge pelo agente. Conferir estado do PR antes de qualquer atualização
   posterior.

Sem migration, dependência ou alteração de dados existentes. Rollback somente da UI/testes.

## Preservação compartilhada — 16/09/2026

Branch fix/scheduling-select-20260916, baseada em dev após PR29. Usar armazenamento temporário em
memória no layout autenticado, por rota/formulário/cadastro, com controles nativos e estado React
preservados. Integrar sucesso/cancelamento aos descartes e testar navegação entre módulos. Não usar
cache público, localStorage ou salvamento automático no banco.

## Acesso concedido a Agendamentos — Q8 de 21/09/2026

Adequar catálogo/gestão de acesso, shell e todas as guardas do módulo: páginas, calendário, oferta,
disponibilidade, busca mínima de beneficiários e comandos. Sem concessão, ocultar módulo na barra
lateral, busca e Início; URL/API continuam protegidas no servidor e revalidam revogação. Não
conceder leitura completa de Associados como efeito colateral. Exportação exige também permissão
geral. Q9 define consulta/alteração separadas; AC01 detalha a adequação/transição técnica. A
conversão Q4 de exportação não autoriza conceder novos acessos de módulos. AC01–AC03 pendentes, sem
código ou teste novo.

Leitura do código em 21/09: `scheduling/access.ts` verifica sessão e usa o parâmetro write para lock
de elegibilidade, sem conferir concessões de consulta/alteração; `workspace/areas.ts` inclui
Agendamentos incondicionalmente. Catálogo de permissões e `user-access.ts` ainda não incluem
Agendamentos. Registrar a lacuna e adequar ao padrão existente dos demais módulos, sem alterar
Notícias para uma permissão única. Consulta controla descoberta/leitura; alteração depende de
consulta e controla mutações de oferta/horários/reservas. Exportação continua independente de
alteração, sob consulta + permissão geral. Leitura estática, sem testes nesta sessão.

## Checkpoint de revisão de código — 21/09/2026

Primeira versão administrativa e FullCalendar estão na base integrada. Falta concessão
consultar/alterar (AC01–AC03), conflito do beneficiário (BEN01–BEN03), indicação de bloqueio
posterior (BLQ01/BLQ02) e exportação DX01. CAL06 permanece validação visual/documental, sem
alteração de PR34 já integrado. Horários semanais/almoço e conflito do profissional já existem;
T021–T024 são expansões.

Revisão estática da base `ed31baf`; nenhum teste de aplicação ou homologação nesta etapa. Evidências
e limites: [revisão transversal](../002-integrated-modules/code-audit-2026-09-21.md).

Executar adequações e seus testes em retomada de implementação. Preservar dados e decisões adiadas;
a revisão atual altera somente documentação.

</details>

## Integração com exclusão lógica — 21/09/2026

Projetar a vigência da exclusão no DTO da reserva; guardar data de exclusão analisada, responsável e
instante da decisão de manter. Acrescentar comando versionado/auditado de manutenção; reutilizar
cancelamento. Validar fronteira de sete dias, autorização, concorrência, restauração e preservação
da ocupação até cancelamento explícito.

Checkpoint de execução do ciclo de vida,21/09/2026: incremento implementado e validado no
CI35641862727, com migração0028 aditiva, controle de versão e auditoria. Tarefas LC e evidências
atualizadas; exportação própria continua planejada. Sem aplicação ao banco local. Clarify do recorte
concluído; analyze restrito às alterações concluído sem achados relevantes; gates compartilhados
aprovados em57d6b56.
