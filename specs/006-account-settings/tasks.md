# Tasks: Conta: conciliação e regressão dos controles existentes — incremento de 21/09/2026

**Pendências preservadas pela revisão de código — 21/09:** T025 (homologação SMTP, A12) continua pendente, dependente de ambiente/destinatários autorizados. T026–T029 não comprovam nem substituem entrega externa.

**Input:** [spec](spec.md), [plan](plan.md), [research](research.md), [modelo](data-model.md),
[contrato](contracts/exports.md), [quickstart](quickstart.md).
**Branch da entrega:** `docs/project-clarify-20260921`. Nenhuma tarefa nova executada.
**Lista ativa:** T026–T029; testes foram pedidos nas specs e nos gates do projeto.
Caminhos novos são destinos planejados; conferir referências contra o inventário de
artefatos deste incremento antes de editar. Nenhum arquivo de código foi criado agora.

## Rastreabilidade e escopo

Tarefas históricas preservadas; novo recorte limitado à conciliação/regressão de US3.

O histórico abaixo conserva marcadores e evidências originais. IDs provisórios
detalhados aqui não são uma segunda execução; usar a lista ativa. Pendências de
política/pesquisa/homologação e funções suspensas continuam pendentes e não são
autorizadas por constarem neste arquivo. Não repetir tarefas já concluídas.

## Setup

- [ ] T026 Conferir retirada de MFA/justificativas em `specs/006-account-settings/contracts/account-settings.md`, `specs/006-account-settings/data-model.md` e `specs/006-account-settings/authenticator-removal.md`; não criar exportação de credenciais.

## Foundational

- [ ] T027 Preparar cenários de concessão com catálogo convertido em `apps/web/tests/integration/user-permissions.test.ts`, usando `specs/001-project-foundation/contracts/roles.md`: três cargos, Gestor com consulta global/exportação/Relatórios completos, concedendo escrita de outro módulo que não possui, autogestão/cargos negados e Colaborador sem concessão; preservar último Administrador e configurações pessoais sem gestão de terceiros.

## US3 — Recusas de concessão

**Objetivo/aceite independente:** Concessões recusadas por causa correta; autorização válida sem MFA/motivo, sem acesso a outra conta nem remoção do último gestor.

- [ ] T028 [US3] Validar concessão/recusas sem MFA ou motivo em `apps/web/tests/integration/account-settings.test.ts` e `apps/web/tests/e2e/account-settings.spec.ts`; corrigir somente regressões comprovadas em `apps/web/modules/users/ui/role-grant-error.ts`, sem alterar política de senha/recuperação.

## Polish

- [ ] T029 Registrar regressão de titularidade, sessão e mensagens de erro em `specs/006-account-settings/evidence/plan-2026-09-21-validation.md` (novo), sem reexecutar limpeza ou migration do autenticador.

## Dependências e ordem de execução

Setup → Foundational → histórias → Polish. Dentro de cada história, contratos/testes
antecedem código e jornada; tarefas sem [P] seguem a ordem apresentada. Infraestrutura
de 001 (concessões, schemas, writers, rotas e UI) precede adaptadores/exportações dos
demais specs. Migração 0025 precede0026;0027 antes de transferências;0028 depende do
diagnóstico de conflitos e não altera dados automaticamente. Regressões004/006 e
regras008 podem avançar após catálogo/migrações mesmo antes do núcleo de exportação.
Aceite transversal002 depende das evidências das funções. Spec009 exige gate M016.
Não há dependência em retenção/P01/canais futuros para o recorte administrativo atual.

## Paralelismo por história

Após pré-requisitos, os adaptadores de domínios diferentes podem avançar em paralelo
porque têm arquivos próprios. Dentro desta função, manter testes→adaptador→UI→E2E
sequencial; não dividir edições no mesmo arquivo. [P] identifica arquivos independentes
prontos após a base da fase: writers separados em001 e relatórios de aceite em002.
Para cada história sem par de arquivos independente, não há paralelismo interno seguro;
ela pode avançar junto da história equivalente de outro domínio após as dependências.
Migrações/catálogo/registro central têm um único responsável na spec001, sem edições simultâneas.

## Estratégia incremental e MVP

Primeiro invariantes de acesso/migração e descoberta; depois fluxo completo de
Relatórios usando núcleo 001 como prova vertical (três formatos, todos os dados).
Isso é marco de validação, não redução do escopo: completar depois cada função
do contrato, incluindo003/004/005/007/008 e Colaboradores;009 permanece condicionada.
Reservas Q1/Q2 seguem incremento independente008 após permissões. Políticas adiadas,
chat/suporte, CAASSH, portal e app/site não são parte do MVP.

## Histórico e backlog anterior — não executar automaticamente

<details>
<summary>Tarefas anteriores, evidências e pendências preservadas</summary>

# Tarefas: Configurações da conta

- [x] T001 Criar branch própria baseada em dev e retirar o código de Configurações da branch de Associados.
- [x] T002 Registrar escopo e cenários em spec.md; incorporar a escolha de senha atual + link e a exigência de substituir o envio local fora do localhost.
- [x] T003 Implementar edição do próprio nome com validação de sessão e versão, auditoria e formulário.
- [x] T004 Implementar troca de senha com confirmação da senha atual e encerramento das outras sessões.
- [x] T005 Definir e implementar troca de e-mail conforme FR-006, com testes de disponibilidade, confirmação e preservação da identidade.
- [x] T006 Implementação inicial de MFA retirada por decisão explícita posterior do usuário; substituída por T022/FR-019.
- [x] T007 Exibir causas de recusa na concessão de funções; orientação de ativação de MFA retirada por FR-019.
- [x] T008 Executar integração, navegador, acessibilidade, lint e typecheck; registrar evidências e limitações.
- [x] T009 Disponibilizar preview local preservando a separação das branches. Em 10/09/2026, após as correções, o usuário autorizou abrir o PR de Configurações para dev condicionado aos testes aprovados. Essa autorização não equivale a homologação em DEV nem aprovação de merge. Nenhum PR de Associados.
- [x] T010 Aplicar o logo oficial enviado pelo usuário no componente de marca compartilhado e conferir login/menu lateral, conforme inclusão autorizada nesta branch.
- [x] T011 Aplicar nova política de senha (máximo 72, maiúscula, minúscula e número), retirar faixa numérica e avatar, mantendo o menu acessível.
- [x] T012 Implementar recuperação por e-mail com expiração, uso único, encerramento de sessões e auditoria; documentar envio real fora do localhost.
- [x] T013 Validar limites e requisitos, link vencido/reutilizado, recuperação pelo navegador e regressões de Configurações.

Preview de Configurações no endereço habitual `http://localhost:3105/settings`. Associados continua separado em `http://localhost:3106/members`. Autorização explícita posterior permite publicar esta branch e abrir seu PR para dev; revisão humana e CI continuam exigidos antes de merge.

## Pendências encontradas na revisão de 10/09/2026

Detalhes históricos e resolução em [review.md](review.md). Correções verificadas automaticamente; entrega por PR autorizada em T009.

- [x] T014 Revalidar sessão não revogada e conta ativa; testar sessão revogada e conta desativada. Endpoints MFA removidos retornam 404 (R01, FR-010/019, SC-004).
- [x] T015 Bloquear rotas nativas alternativas de alteração de conta para preservar auditoria, encerramento de sessões, versão e invalidação de pedidos; testar chamadas diretas (R02, FR-005/011).
- [x] T016 Garantir redefinição transacional de senha, token, auditoria, pedidos pendentes e sessões; testar falha injetada na auditoria e concorrência (R03, FR-011/016).
- [x] T017 Tratar indisponibilidade na recuperação sem confirmar envio indevido; verificar SMTP antes da consulta de conta e testar respostas equivalentes para endereços conhecidos/desconhecidos, falha e nova tentativa (R04, FR-002).
- [x] T018 Retirada: retomada do cadastro MFA deixou de existir por decisão explícita de remover o autenticador (R05, FR-019, T022).
- [x] T019 Apresentar erro específico de nome inválido, inclusive somente espaços, preservando os demais dados; validado no navegador (R06, US1/AC3).
- [x] T020 Validar concessão administrativa sem MFA, recusas traduzidas e jornadas de Configurações/recuperação por teclado em 390px; validar limites com rate limiting habilitado e executar os gates afetados (FR-009/012/019, SC-003/005).
- [x] T021 Adicionar ícone de olho nos sete campos atuais de senha de login, Configurações e redefinição, preservando valor, autocomplete, limites e teclado; sem envio ao alternar (FR-018). O oitavo campo pertencia ao autenticador retirado.
- [x] T022 Remover autenticador de Configurações, login, endpoints e regras administrativas; migrar dados legados com auditoria; atualizar constituição, spec e testes conforme decisão explícita (FR-019).
- [x] T023 Manter o botão Conta no rodapé quando a navegação estiver recolhida; incluir regressão no navegador (FR-001/017).
- [x] T024 Atualizar a suíte de acessibilidade que ainda esperava o desafio MFA removido; manter cobertura de Configurações administrativas sem autenticador e corrigir contraste transitório do botão primário de Notícias ao alternar o tema, identificado na CI do PR #13.

- [x] CF-A Aplicar e validar avisos comuns de e-mail em login, recuperação e Configurações, conforme CF01–CF03 da fundação.

## Padronização de justificativas — 14/09/2026

- [x] JP01 Inventariar criação/alteração e registrar regra, pesquisa e plano.
- [x] JP02 Implementar contrato, serviço, auditoria e formulário desta área.
- [x] JP03 Validar criação sem motivo, edição recusada sem motivo e auditoria preservada.
- [x] JP04 Concluir gates e evidências da entrega compartilhada em branch nova antes do PR.

Validação de justificativas e resultado OAB: [evidências de 14/09/2026](../001-project-foundation/evidence/justification-oab.md).


## Regra vigente: nenhuma justificativa obrigatória — 14/09/2026

- [x] RM01 Remover exigências de justificativa nos contratos, serviços e persistência desta função.
- [x] RM02 Retirar campos e bloqueios de motivo em todas as telas da função.
- [x] RM03 Validar fluxos sem motivo, auditoria preservada e controles de autorização; registrar evidências da entrega compartilhada.

Evidências RM03: [validação final de 15/09/2026](../001-project-foundation/evidence/reason-removal-2026-09-14.md).

## Âncoras e streaming — 15/09/2026

- [x] AN01 Restaurar posição das seções após montagem da tela progressiva.
- [x] AN02 Validar atalho de senha móvel e âncoras diretas no CI, registrando evidência no spec001/evidence/navigation-speed-2026-09-15.md. CI34990339186 aprovado.


## Navegação sem perda de edição — 16/09/2026

- [x] DP01 Integrar a preservação compartilhada às abas e formulários desta função.
- [x] DP02 Validar retorno, sucesso, cancelamento e isolamento; registrar [evidências](evidence/drafts-2026-09-16.md) no PR.

## Senha inicial — 17/09/2026

- [x] IP001 Registrar pesquisa e contratos do formato palavra + seis dígitos.
- [x] IP002 Criar hash/credencial atomicamente e proteger idempotência.
- [x] IP003 Exibir recibo de senha e permitir geração inicial para cadastro sem senha.
- [x] IP004 Testar login, recuperação, autorização, concorrência, rollback e não exposição.
- [x] IP005 Validar interface desktop/mobile, acessibilidade, gates e preparar PR para dev.

## Phase 1: Convergence — revisão de 21/09/2026

- [ ] T025 Homologar envio SMTP real de recuperação de senha e confirmação de troca de e-mail, com destinatários de teste autorizados, URL HTTPS, entrega/expiração/uso único e revogação; registrar evidências sem substituir entrega externa por Mailpit/configuração sintética. Origem: FR-013/FR-016, A12 (partial). Código de transporte existe; ambiente remoto não conferido nesta revisão.

</details>


## Consolidação de segurança — 21/09/2026

Correção preparada em 17/09 incorporada nesta entrega: cadastro público por e-mail bloqueado, provisionamento sintético dos testes sem endpoint de cadastro e atualizações de dependências preservadas. Payload foi alinhado em 3.89.0 no worker, web e packages/news, preservando os usos existentes e evitando duas versões incompatíveis. Nenhuma migration ou alteração de infraestrutura retirada anteriormente foi reintroduzida. As decisões do clarify e as 108 tarefas novas continuam planejadas, sem execução implícita. Validação do conjunto conciliado em andamento; localhost permanece desligado. Evidências: [segurança](../001-project-foundation/evidence/security-hardening-2026-09-17.md).
