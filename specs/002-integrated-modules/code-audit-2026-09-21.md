# Revisão de código e reconciliação do backlog — 21/09/2026

## Resultado e limites

Base de implementação: `ed31baf` (principal `dev` e entrega documental com o mesmo
código). Fetch/fast-forward da principal verificados no início da revisão.
As decisões Q1–Q11 estão na documentação local da entrega e ainda exigem mudanças
de código. Rodada de clarify encerrada; não há pergunta de produto aguardando resposta.

Revisão estática transversal: rotas públicas/privadas, autenticação, permissões,
serviços, contratos, migrations, worker, arquivos, UI, testes existentes, workflow de
promoção e dez conjuntos spec/plano/tarefas. O inventário contém 578 arquivos
TS/TSX/SQL/CSS em apps/packages, incluindo testes; esse número é inventário, não
alegação de inspeção linha a linha ou certificação de ausência de defeitos.
Foram seguidos os caminhos das funcionalidades e dos controles relevantes abaixo.

Nenhum teste de aplicação, navegador, banco ou carga foi executado nesta revisão.
Testes mencionados são evidências de cobertura escrita, não resultados novos.
Não foram consultados produção, contas, SMTP, OAB ou estado atual de rulesets no
GitHub. Localhost permanece desligado. Nenhuma alteração de aplicação ou integração.

O pedido inclui corrigir documentação, portanto permite reconciliar spec/plano,
contratos e tarefas além do append-only do converge. Como as novas decisões ainda
não passaram por implementação, não se declara convergência formal nem homologação.
Pendências já existentes recebem evidências; novas tarefas cobrem apenas omissões.

## Correções à lista anterior

1. Notícias não está integralmente protegida pela implementação atual: comandos
   interativos revalidam concessões, mas o worker de publicação só verifica a conta
   ativa. AC02/AC03 precisam cobrir a revogação antes da execução programada.
2. A ausência de concessão de Agendamentos também alcança Relatórios: o dataset
   bookings não exige permissão de domínio e o resumo consulta cancelamentos sem guarda.
3. Início já contém rascunhos de Notícias e cadastros sem análise; Meu trabalho é
   parcial. A primeira interface externa completa está pendente, mas já existem
   páginas públicas de notícias e APIs públicas de notícias/benefícios.
4. Configurações da conta tem código administrativo entregue, porém a entrega real
   de e-mail não está comprovada nos registros consultados. Zero checkboxes abertos
   na spec 006 não significava ausência de pendências de homologação.
5. A correção do cadastro público e atualizações de dependências existem em outra
   branch preservada, fora da base integrada. Foram omitidas da lista anterior.
6. Relatórios inicial está implementado; não refazer T051–T054 do programa como se
   nada existisse. A seleção de colunas existe no detalhe; sua ordem ainda é a do
   catálogo, e Excel é recusado fora da Análise detalhada.
7. Preservação de campos existe, mas erros de concorrência em Notícias e acessos de
   Colaboradores ficam em useState e desaparecem ao desmontar o formulário.
8. A rodada documental já foi encerrada. O trabalho restante de conciliação DOC01
   foi atendido nos artefatos normativos/derivados identificados por esta revisão.

## Achados e encaminhamento

CRÍTICA = controle de menor privilégio ausente no caminho examinado; ALTA = lacuna
funcional/autorização; MÉDIA = parte secundária ou validação não comprovada.
Essas classificações não substituem teste dinâmico nem avaliação de produção.

| ID | Tipo / gravidade | Evidência estática | Trabalho responsável |
| --- | --- | --- | --- |
| A01 | contradiz / CRÍTICA | `apps/web/modules/scheduling/access.ts::schedulingAccess` só verifica sessão e lock; `packages/contracts/src/user-access.ts` não contém permissões do módulo. UI/rotas beneficiários, catálogo, horários e reservas usam esse acesso. | 008 AC01–AC03, 001 AX04, 002 ACC01: consulta/alteração separadas, transição e testes negativos. |
| A02 | parcial / ALTA | `packages/contracts/src/reports.ts::reportCatalog.bookings.permission` vazio; `report-summary.ts` consulta reservas canceladas incondicionalmente; worker captura somente permissões catalogadas. | 010 T025: estender Q8/Q9 a detalhes/resumo/apresentação, arquivos e revalidação. |
| A03 | contradiz / CRÍTICA | `auth-factory.ts` permite `/sign-up/email`; handler público delega a Better Auth, sem `disableSignUp`. Teste auth-session usa cadastro HTTP. Com A01, uma sessão nova não encontra concessão específica na agenda. | 001 T096: reconciliar correção já preparada fora de dev, validar bloqueio por HTTP e criação administrativa. Sem reaplicar escopo de infraestrutura retirado pelo usuário. |
| A04 | parcial / ALTA | `packages/news/src/action-runner.ts::runNewsAction` verifica status do usuário, sem consulta a effective_user_permission; publication/database não acrescentam essa guarda. `newsTransaction` faz a verificação para ações web. | 004 AC02/AC03: revalidar consulta/alteração/publicação no worker e testar revogação com conta ainda ativa. |
| A05 | parcial / ALTA | `apps/worker/src/jobs/audit-export.ts` não relê concessões; `file-service.ts::createDownloadGrant` trata report_export, member, partner e news, mas audit_export passa com files:read. Grant binário é temporário e não relê o solicitante. | 003 EX01/EX02: autorizar a cadeia completa, impedir bypass pelo download genérico e validar revogação. Não alterar anexos/documentos pela regra de exportação. |
| A06 | contradiz / MÉDIA | `app/(admin)/page.tsx` sempre renderiza a seção PublishedNews; `canReadNews` só condiciona atalhos/rascunhos. `workspace/areas.ts` inclui Agendamentos sem filtro; busca e atalhos consomem esse catálogo. | 001 AX02/AX03 e 004 AC02/AC03: ocultar no Início sem concessão, preservando rotas públicas. CAASSH continua aviso de desativado por decisão específica. |
| A07 | parcial / ALTA | Exportação geral ausente no catálogo; AuditExportDialog enfileira JSONL; Reports mantém fila, reports:export, 50 mil linhas e 366 dias. Busca de ações não encontrou exportação própria em Notícias/Associados/Parceiros/Colaboradores/Agendamentos/Mensagens/Processamentos. | 002 EXP01–EXP07, 001 AX01/DX01, 003 EX01/EX02/DX01/DX02, 010 EX01/EX02/DX01–DX03 e DX01 das specs 004/005/007/008/009. |
| A08 | contradiz / MÉDIA | `queryReport` filtra Object.entries do catálogo, sem seguir a ordem de query.columns. Schema e botões restringem XLSX a details. | 010 DX01–DX03: ordem idêntica nos três formatos e formatos em todas as abas. Seleção parcial existente deve ser reutilizada. |
| A09 | ausente / ALTA | Migration 0020 tem EXCLUDE por professional_id; booking-service/availability consultam ocupação do profissional, sem restrição do beneficiário. | 008 BEN01–BEN03: proteção por pessoa, diagnóstico de conflitos legados e concorrência. |
| A10 | parcial / MÉDIA | `findSchedulingBeneficiary` calcula bloqueio por titulares vigentes e comandos o recusam; bloqueio em member-service não cancela reservas. Projeção Booking/agenda/detalhes não inclui indicação de bloqueio posterior. | 008 BLQ01/BLQ02 + 005 AE04: implementar indicação e provar manutenção/decisão manual. Não reconstruir o impedimento já existente. |
| A11 | parcial / MÉDIA | `workspace-drafts.tsx` preserva valores em memória; NewsEditor.error/fieldErrors e UserAccessForm.error usam useState. O cache não restaura esses estados após sair/voltar. | 001 T097, coordenada com 004/006: preservar erro e versão por formulário e validar save/cancel/logout. |
| A12 | parcial / MÉDIA | `account-mail.ts` implementa SMTP/TLS e links; evidências 006 e DEPLOYMENT-CONFIG-AUDIT registram Mailpit/configuração sintética, sem comprovar entrega externa. | 006 T025: homologar SMTP/recuperação/troca de e-mail quando ambiente e destinatários de teste forem autorizados. Não presume SMTP defeituoso. |
| A13 | parcial / MÉDIA | `reports/ingest.ts` recebe fontes externas autenticadas, mas este repo não contém app/site consumidores nem prova de instrumentação externa. | 010 T026 + 002 UI01/UI02: integração e comprovação de coleta por fonte/canal quando esses consumidores forem retomados. Não fabricar histórico. |

## Cobertura por função e estado real

| Spec / área | Código e cobertura escrita examinados | Situação / restante |
| --- | --- | --- |
| 001 Fundação / Colaboradores | auth-factory/session-dal; users/user-access/initial-password; contracts/user-access; migrations 0001–0005/0012/0014/0019; arquivos/worker; testes auth-session, user-access, initial-password | Contas, permissões individuais, senha inicial, sessões e retirada de MFA existem. A01/A03/A05/A06/A11, exportação geral, T089 e T095 permanecem. |
| 002 Integração / Início | app/(admin)/page.tsx, workspace/areas/search, app-shell, workspace-drafts, testes workspace-experience/drafts | Início com atalhos, notícias, rascunhos e cadastros sem análise. Meu trabalho parcial; restantes UI01/UI02, T053, T055–T057 e futuros. |
| 003 Auditoria / Processamentos | audit-query/export-service; jobs/job-service; repositories audit/job-execution; worker audit-export/job-runtime; testes audit/job-query | Eventos e Processamentos funcionais no código, reenvio/listagem implementados. Exportação JSONL legada e A05; padrão direto ainda pendente. |
| 004 Notícias | news-service/schedule-service, payload/transaction, packages/news publication/action-runner/config, public-service e rotas content; testes news/news-worker | Editor, versões, mídia, publicação e páginas públicas presentes. Worker A04, Início A06, exportação DX01; T027 só carece da evidência HTTP específica já registrada. |
| 005 Associados | member-service/access, repositories/members, OAB provider/service, migrations 0010/0013/0015/0023, testes members/oab-lookup | Cadastro, dependentes, análise manual, foto, situação e consulta OAB existem. AE04, POL01, T028, decisões P02/P03/P04/D02 e exportação DX01. Sem cartão/QR institucional emitido. |
| 006 Conta | account-settings-service, password-recovery-service, account-mail, account-menu/form, migration 0011/0012, testes account-settings/auth-hardening | Perfil/senha/e-mail/recuperação/menu implementados; MFA retirado. T025 cobre comprovação SMTP ausente; OAuth e tema Vitória futuros. |
| 007 Parceiros | partner-service/access/directory-service, contratos/diretório públicos, migrations 0016/0017, testes partners/partner-directory | Administração, unidades, categorias, contratos, benefícios, publicação e moderação existentes. Coleta externa de avaliações, portal/QR e exportação DX01 ainda não entregues. |
| 008 Agendamentos | access/catalog/hours/availability/booking/beneficiary-service, calendar/UI, migration 0020, testes scheduling/calendário | Primeira versão e FullCalendar mês/semana/dia presentes. BEN/BLQ/AC/DX, CAL06 e expansões T021–T024 pendentes. |
| 009 Mensagens | repositories/messaging, rotas/UI, migrations 0021–0023, prepare-messages; testes messaging | Preparação, segmentação, preferência, histórico e programação presentes. processScheduledMessages termina NO_CHANNEL/NO_RECIPIENTS ou ACCESS_REVOKED, sem transporte. M016/M009/M010 e DX01. |
| 010 Relatórios | reports/report-summary/report-storage/report-analytics; http/ingest/collector/UI, migration 0024, worker report-export/report-format, testes reports | Três abas, consultas salvas, coleta painel e exportadores presentes. A02/A07/A08/A13, EX/DX e homologação DEV não registrada. |

Arquivos: PostgreSQL bytea é o armazenamento atual; upload/quarentena/scan/promoção
existem. Não reabrir migração dos dois arquivos de teste nem inspeção de MinIO/VM
dispensadas. Não confundir prazo técnico de grant de anexos com o padrão de exportação.

## Pendências não inferíveis apenas pelo código

- OAB T028: adaptador existe e ignora OAB_API_ENABLED; depende de credenciais e
  homologação autorizada. Não foi testado provedor nem lido segredo nesta revisão.
- Retenção T089: applyRetention e requireProductionReadiness recusam política não
  aprovada e sempre recusam controles não implementados. Gate de promoção permanece;
  definição de prazos e descarte seguem adiados. Não marcar conformidade concluída.
- T095: arquivos de rulesets e testes locais existem; rejeição remota completa não
  comprovada aqui. Não executar push direto proibido para produzir evidência.
- CAL06: código e CI histórico existem; leitura estática não encerra revisão visual.
  PR34 já integrado conforme mapa; jamais alterar seu título/descrição nem sua branch.
- T027 Notícias: preservar comprovação UI de 16/09 e pendência de captura HTTP 201/200.
- M016: aderência funcional requer revisão do produto; a inspeção confirma finalidade
  compatível, mas não homologa nem autoriza envio real.

## Futuro e suspensões preservadas

App/site completos, login Google/Apple/outros, tema Vitória, portal de parceiros,
credencial institucional, coleta externa de avaliações e extensões da agenda seguem
pendentes de seus recortes/decisões. Chat interno (FUT01), suporte por tickets (FUT02),
Recursos Humanos e salas/equipamentos/restaurantes são possibilidades a pesquisar,
sem construção autorizada por esta revisão. CAASSH T041–T045 continua desativado.

## Critério documental

T022–T026 do programa são referências históricas substituídas por 008; T051/T052/T054
têm execução inicial em 010 e não devem gerar trabalho duplicado. T053 permanece
parcial para Meu trabalho. As tarefas EX/DX descrevem o novo comportamento alvo,
não o contrato já em produção. Contagem de checkboxes não mede trabalho único nem
percentual de produto. Evidências datadas e migrations não foram reescritas.

Constituição/princípio V, PRD, STACK, MODULES, contratos/modelos/quickstarts e
specs/planos recebem conciliação das decisões vigentes, sem reintroduzir MFA,
justificativa obrigatória, S3 ou congelamento de PR aberto.

## Verificação desta revisão

Verificados: diff restrito à documentação, `git diff --check` sem erros, links locais
dos documentos alterados resolvidos e 224 arquivos do backup conferidos por SHA256,
sem divergências. Principal em `dev`, limpa, `ed31baf`, fetch/fast-forward final
confirmado com `origin/dev`. Testes de aplicação não executados.

Planos e listas incrementais receberam atualizações paralelas durante esta revisão;
foram preservados. Referências AX/EX/DX e tarefas da auditoria continuam rastreáveis
no histórico, sem cancelar pendências por sua movimentação. A revisão final dos novos
planos/contratos permanece em 002 T099; DOC01 registra a conciliação normativa realizada.
Próximo passo funcional: planejar/implementar as tarefas autorizadas em nova retomada;
este pedido não implementa correções nem dispara CI.
