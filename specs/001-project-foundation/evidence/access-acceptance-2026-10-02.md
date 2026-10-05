# Revisão de aceite de acessos — 02/10/2026

Autoria: CODEX. Solicitante não verificado (`gh api user`: HTTP 401 nesta sessão). Worktree:
`.cache/pr-access-review-20261002`; branch: `docs/access-review-20261002`. Base inspecionada:
`748539d28ec7c94af5ff3ca7a37c46c73ae102e4`, dev/origin/dev sincronizadas na entrada.

Escopo: Gerenciar cargos e acessos de Administrador, Gestor e Colaborador (CAAB-19), Restringir
criação de contas ao fluxo administrativo (CAAB-18) e Mostrar apenas funções autorizadas na
navegação (CAAB-20). Revisão local de código, critérios, testes e evidências; sem alteração de
aplicação, migrations, contas ou serviços, sem commit/push/PR/integração. Não houve QA humano,
inspeção de ambiente implantado ou nova consulta de resultados remotos de CI.

## Resultado e limites

A base integrada já contém bloqueio de autocadastro, cargos, concessão individual, cargo único,
promoção e descoberta filtrada. Não reconstruir esses controles nem reabrir tarefas históricas.
Passaram nesta base 31 testes unitários e 28 de contrato selecionados. Integração PostgreSQL,
migrations, E 2E e acessibilidade não foram executados nesta revisão: exigem serviços não
autorizados.

Há uma lacuna funcional confirmada por inspeção: o link **Novo agendamento**, em Mensagens, continua
visível para consulta sem escrita (G01). Não foi identificado bypass de gravação nesse caminho: o
repositório revalida `messages:access` e `messages:write` antes da mutação. Há também lacunas de
cobertura específicas (G02/G03) e decisão de produto pendente (P01). Esses limites impedem declarar
aceite integral dos três itens ou QA humano.

O contrato consultado foi o arquivo local
`C:/Projetos/caabnovo/.cache/pr-docs-roles-20260923/specs/001-project-foundation/contracts/roles.md`,
especialmente “Decisão pendente sobre o cargo base — 23/09/2026”. Colaborador está confirmado como
cargo base; o alcance para contas atualmente sem cargo continua pendente. A opção existente e
`roleIds: []` não foram removidos; nenhum backfill foi proposto como decisão aprovada. Esta
procedência local não é dependência de um clone: a pendência também está explicitada na spec desta
entrega. A atribuição histórica do pedido permanece como registrada pela fonte, sem reatribuição.

## Matriz de aceite

Legenda: **I** = implementação inspecionada; **T** = teste unitário/contrato executado nesta
revisão; **H** = cobertura existente e relato histórico, não reexecutados; **L** = lacuna; **P** =
decisão pendente. H não comprova execução na base atual nem aprovação humana. Os caminhos de
código/testes abaixo são relativos à raiz desta worktree.

| ID   | Item                                                                        | Cenário e resultado esperado                                                                                                                 | Implementação e evidência                                                                                                                                                                                    | Estado nesta revisão                                                                                                                             |
| ---- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| AC01 | Restringir criação de contas ao fluxo administrativo (CAAB-18)              | POST público válido em `/api/auth/sign-up/email` não cria usuário, credencial, sessão ou cookie.                                             | `apps/web/modules/auth/auth-factory.ts`: `disableSignUp` e allowlist; `apps/web/tests/integration/auth-session.test.ts`: espera 404, tabelas vazias e nenhum cookie.                                         | I/H; HTTP e banco não reexecutados.                                                                                                              |
| AC02 | Restringir criação de contas ao fluxo administrativo (CAAB-18)              | Criação interna exige sessão, `users:create`, origem, CSRF e idempotência; incluir cargo exige também Administrador atual com `roles:grant`. | `modules/users/http/users-route.ts`, `modules/users/user-service.ts` e `current-authority.ts` sob `apps/web`; contratos `users.test.ts` e `initial-password.test.ts`; integração `initial-password.test.ts`. | I/T/H; testes de contrato usam dependências simuladas. “Administrativo” é o fluxo protegido, não uma nova proibição de `users:create` concedido. |
| AC03 | Restringir criação de contas ao fluxo administrativo (CAAB-18)              | Criação autorizada fornece senha inicial uma vez; repetição não retorna o segredo; falha de auditoria desfaz conta/credencial.               | `apps/web/modules/users/user-service.ts`; integração `initial-password.test.ts`; contrato `initial-password.test.ts`.                                                                                        | I/T/H; atomicidade/login dependem da integração futura.                                                                                          |
| AC04 | Gerenciar cargos e acessos de Administrador, Gestor e Colaborador (CAAB-19) | Administrador vigente usa todo o catálogo, mesmo com override vazio/parcial; nova permissão registrada entra na base.                        | `packages/db/migrations/0026_explicit_module_access.sql`, `repositories/user-roles.ts`; integrações `access-foundation-migrations.test.ts` e `user-permissions.test.ts`.                                     | I/H; sem execução SQL atual.                                                                                                                     |
| AC05 | Gerenciar cargos e acessos de Administrador, Gestor e Colaborador (CAAB-19) | Gestor consulta módulos, exporta fontes autorizadas e tem Relatórios completos; escrita de outros módulos continua condicionada.             | Mesma view/base; teste de migration insere `future_test:read/write` e `reports:future_test`, nega `messages:write` e `members:write`; `direct-exports.spec.ts` nega POST em Associados.                      | I/H; não prova todos os adaptadores de exportação, que têm aceite próprio.                                                                       |
| AC06 | Gerenciar cargos e acessos de Administrador, Gestor e Colaborador (CAAB-19) | Gestor concede escrita a terceiro sem recebê-la; não altera a si, atribui cargos ou repassa chaves de gestão.                                | `apps/web/modules/users/user-access-service.ts`, `current-authority.ts`, `user-access-form.tsx`; integração `user-permissions.test.ts`, E 2E `direct-exports.spec.ts`.                                       | I/T/H; T cobre contrato/rota/política, não a transação; ampliar G02.                                                                             |
| AC07 | Gerenciar cargos e acessos de Administrador, Gestor e Colaborador (CAAB-19) | Colaborador só usa concessões; chaves legadas de gestão não permitem conceder cargos/acessos.                                                | View exclui chaves de gestão da parte ordinária; serviço exige cargo vigente; `access-foundation-migrations.test.ts` atribui `collaborator` e injeta chaves proibidas.                                       | I/T/H; E 2E existente usa destinatário sem cargo, não substitui jornada com cargo Colaborador (G02).                                             |
| AC08 | Gerenciar cargos e acessos de Administrador, Gestor e Colaborador (CAAB-19) | Revogação/expiração, conta desativada e sessão inválida removem autoridade; edição concorrente retorna 409, auditoria falha causa rollback.  | `current-authority.ts` e `user-access-service.ts` reconsultam após locks; integrações `user-permissions.test.ts`, `user-access.test.ts`, `auth-session.test.ts`.                                             | I/H; falta cenário dirigido de expiração durante espera pelo lock (G03).                                                                         |
| AC09 | Gerenciar cargos e acessos de Administrador, Gestor e Colaborador (CAAB-19) | Até um cargo vigente; segundo cargo retorna 409 e criação com dois retorna 422; último Administrador protegido.                              | Migration 0030, `role-assignment-service.ts`, integrações `single-role-migration.test.ts` e `user-access.test.ts`, contrato `users.test.ts`.                                                                 | I/T/H; não reaplicar migration no banco de uso.                                                                                                  |
| AC10 | Gerenciar cargos e acessos de Administrador, Gestor e Colaborador (CAAB-19) | Promoção avança um nível, preserva término/acessos e dois eventos atômicos; clique duplo não avança duas vezes.                              | `role-assignment-service.ts`; `user-access.test.ts`; contrato `roles.test.ts`; histórico de cargo único/promoção.                                                                                            | I/T/H; concorrência real não reexecutada.                                                                                                        |
| AC11 | Gerenciar cargos e acessos de Administrador, Gestor e Colaborador (CAAB-19) | Definir o alcance do cargo base para contas atualmente sem cargo antes de alterar dados ou opção existente.                                  | Contrato documental de 23/09; schema atual permite zero ou um cargo.                                                                                                                                         | P01; sem decisão inferida.                                                                                                                       |
| AC12 | Mostrar apenas funções autorizadas na navegação (CAAB-20)                   | Sem leitura, nenhum módulo/atalho/cartão/resultado; exportação isolada não dá descoberta. Conta/Sessões permanecem.                          | `apps/web/modules/workspace/areas.ts`, `search.ts`, `components/workspace-controls.tsx`, página `(admin)/page.tsx`; testes `areas.test.ts`, `search.test.ts`; E 2E `direct-exports.spec.ts`.                 | I/T/H; 20 testes de áreas/busca dentro dos 31 unitários, sem nova renderização de navegador.                                                     |
| AC13 | Mostrar apenas funções autorizadas na navegação (CAAB-20)                   | Perfil parcial mantém consulta e oculta atalhos de criação/alteração sem concessão; API/URL continuam protegidas.                            | Busca condiciona `user-new`, `news-new`, `scheduling-new`, `messages-new`; layouts/serviços conferidos. Mensagens apresenta exceção G01 em navegação interna.                                                | I/T/H/L; não declarar visibilidade integral aprovada.                                                                                            |
| AC14 | Mostrar apenas funções autorizadas na navegação (CAAB-20)                   | Revogação atualiza menu/busca e Início; o servidor nega a próxima ação independentemente do polling.                                         | `workspace-permissions.tsx`: GET `/api/v1/me` sem cache, intervalo 15s/foco/pathname e `router.refresh`; E 2E força evento focus e navega para Início após revogar.                                          | I/H; G03 cobre intervalo/foco/navegação separadamente. Erro transitório mantém UI anterior; não alegar ocultação instantânea/offline.            |

## Lacunas e encaminhamento

### G01 — descoberta de criação sem escrita em Mensagens

Prioridade média; defeito de visibilidade confirmado por leitura, sem alegação de gravação indevida.
`apps/web/modules/messaging/ui/schedules.tsx:70` renderiza incondicionalmente o link para
`/messages/campaigns/new` com texto “Novo agendamento”. A variável `canWrite` existe na linha 38,
mas só condiciona outras ações. `MessageShell` protege seu próprio botão de inclusão; não filtra os
filhos recebidos. O layout permite consulta com `messages:access`, inclusive ao Gestor sem escrita.
Em contraste, `packages/db/src/repositories/messaging.ts:45` e `:80` revalidam a escrita.

Roteiro de reprodução futura: entrar com Gestor sem concessões adicionais, ou Colaborador com
somente `messages:access`; abrir `/messages/schedules`; verificar que Novo agendamento aparece.
Esperado: manter a consulta e esconder o atalho de criação; com `messages:write`, mostrá-lo.
Confirmar também revogação e negação do POST direto. Não iniciar envio real ou ampliar M016.
Correção registrada em AC-T002; coordenar com responsável por Mensagens. Nenhum arquivo desse módulo
foi alterado nesta revisão.

A suspeita inicial no botão de inclusão de `scheduling/ui/catalog.tsx` foi descartada ao seguir
`SchedulingShell`: `shared.tsx:151` envolve `action` em `canWrite`. Não registrar defeito de
Agendamentos com base apenas no JSX do chamador, nem interferir na frente prioritária.

### G02 — cobertura ponta a ponta dos cargos

Lacuna de teste, não defeito funcional demonstrado. Em `direct-exports.spec.ts`, a jornada do Gestor
cria o colega com `roleIds: []`, confere concessão/ausência dos controles de gestão, mas não executa
a escrita concedida como destinatário. O teste da view usa Colaborador real, porém não fecha a
jornada UI/API desse cargo. Complementar a regressão com cargo `collaborator` efetivamente
atribuído: terceiro escreve, Gestor continua negado e destinatário não concede por requisição
forjada. Usar dados sintéticos, sem decidir P01. AC-T003.

### G03 — revalidação temporal dirigida

Os testes existentes cobrem ator obsoleto, sessão revogada, disputa de versão, revogação do último
Administrador e promoção concorrente. Não foi localizado, no recorte lido, teste dirigido que faça a
validade do cargo do ator terminar enquanto a ação aguarda o lock, nem testes independentes de
polling 15s e mudança de pathname (o E 2E existente força focus). Código presente não equivale a
prova dessa sequência temporal. Complementar tais casos sem afirmar que o controle está ausente ou
quebrado. AC-T004.

### P01 — contas sem cargo

Decisão de produto pendente, não autorização para atribuição automática, alteração de schema ou
remoção da opção. Resolver o alcance e os critérios de transição com o usuário em frente própria
antes de implementação. AC-T005.

## Evidências históricas conciliadas

| Fonte local                                                      | O que sustenta                                                                                    | Limite                                                                                                           |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| [Segurança de 17/09](security-hardening-2026-09-17.md) e T096    | Bloqueio do cadastro público e teste sem criação de identidade.                                   | Checkpoints sobre PR pendente são históricos; o código já está nesta base.                                       |
| [Fundação de 21/09](plan-2026-09-21-validation.md)               | Relato do CI 35644236348 em 57d6b56, cargos, descoberta, exportação de Colaboradores e revogação. | Não revalidado remotamente nem executado em 748539d nesta sessão.                                                |
| [Colaboradores de 22/09](collaborators-2026-09-22-validation.md) | Incrementos de cadastro, ações e dados.                                                           | Não substitui matriz dos três cargos nem fecha G01.                                                              |
| [Cargo único/promoção](single-role-2026-09-22-validation.md)     | Migrations, promoção, concorrência, rollback e relatos dos CIs correspondentes.                   | Evidência de versões anteriores, sem nova execução SQL/browser.                                                  |
| [US1 de 08/09](us1-access.md) e [US2 de 08/09](us2-users.md)     | Procedência dos controles iniciais.                                                               | MFA e justificativas descritos ali foram substituídos; não reintroduzir. Aceite humano não consta desta revisão. |

AX01–AX04 aparecem desmarcadas no histórico de tasks, mas foram detalhadas por T101–T118 já
concluídas. Não transformar esses marcadores antigos em uma reconstrução. Novos achados usam IDs
AC-T, distintos de T139/T140 (cargo único) e DS-T133–DS-T140 da entrega documental.

## Verificações desta revisão

Instalação: `corepack pnpm install --offline --frozen-lockfile --ignore-scripts`, concluída sem
downloads ou mudança de lockfile. Comandos abaixo executados na worktree em 02/10/2026:

```powershell
corepack pnpm exec vitest run --project unit apps/web/modules/workspace/areas.test.ts apps/web/modules/workspace/search.test.ts apps/web/modules/auth/authorize.test.ts apps/web/modules/users/access-policy.test.ts apps/web/modules/users/http/user-access-route.test.ts --maxWorkers 1
corepack pnpm exec vitest run --project contract packages/contracts/tests/user-access.test.ts apps/web/tests/contract/users.test.ts apps/web/tests/contract/roles.test.ts apps/web/tests/contract/current-user.test.ts apps/web/tests/contract/initial-password.test.ts apps/web/tests/contract/reset-password.test.ts --maxWorkers 1
```

Resultados: **5 arquivos/31 testes unitários aprovados** e **6 arquivos/28 testes de contrato
aprovados**. Sem alterações de testes; não houve serviços, integração, E 2E, a11y ou build. A
mudança entregue é documental; não executar gates de implantação por inferência.

Fechamento documental: `corepack pnpm format:docs:check` nos quatro arquivos alterados e
`git diff --check` aprovados. Verificação de preservação comparou o conteúdo anterior de spec, plano
e tarefas com HEAD: preservado integralmente, com apenas 66 linhas acrescentadas no topo. Os seis
links locais desta evidência existem. Não houve mudança de aplicação/lockfile nem edição da worktree
documental ou de suas seções DS. Fetch final e fast-forward confirmaram dev/origin/dev em `748539d`,
divergência 0/0; quatro documentos locais não rastreados da principal preservados.

## Conciliação para a instância coordenadora

Conciliar apenas os blocos “Revisão de aceite de acessos — 02/10/2026” da spec/plano/tarefas e esta
evidência. Não substituir arquivos inteiros da worktree documental: ela mantém DS e outras
correções. Não copiar sua fila para esta worktree, nem sobrescrever contratos/transversais. A
entrega local conclui a revisão e a matriz solicitadas; correção G01, cobertura G02/G03, decisão P01
e validação de ambiente permanecem em tarefas, sem autorização implícita de execução. Nenhum ticket
ou estado remoto foi alterado.
