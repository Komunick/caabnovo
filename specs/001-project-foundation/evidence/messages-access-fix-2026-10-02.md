# G01 — criação de Mensagens condicionada à escrita

Data: 02/10/2026. Autoria: CODEX. Solicitante: mafaltti (login Danilo-Komunick), verificado pelo
conector GitHub get_profile nesta retomada; CLI retornou HTTP401. A identidade não reatribui a
[revisão anterior](access-acceptance-2026-10-02.md).

Worktree `.cache/pr-access-review-20261002`, branch `docs/access-review-20261002`, base inicial
`748539d`. Revisão AC preservada no commit `bb53ff2`, já incorporada à entrega documental por outra
instância. Este incremento corresponde a Mostrar apenas funções autorizadas na navegação (CAAB-20),
Fundação AC-T002/G01. Commit/push para CI autorizados; PR funcional depende de gates e conciliação
após integração documental humana. Nenhum merge ou serviço local autorizado.

## Mudança e critérios

`apps/web/modules/messaging/ui/schedules.tsx` usa o `canWrite` já existente para renderizar o link
Novo agendamento somente com `messages:write`. Mantidos Link/buttonVariants/Plus, texto, destino,
consulta, filtros e guardas de gravação. Não alterados catálogos de autoridade, schemas, migrations,
dados, canais ou envio real. O protótipo de Mensagens e M016 continuam sem homologação global.

| Cenário                 | Critério                                                                                                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Leitura sem escrita     | Gestor sem concessão adicional e Colaborador com leitura consultam Agendamentos de Mensagens; não há link Novo agendamento; POST de campanha retorna403.                 |
| Escrita concedida       | API administrativa concede escrita; mesmo usuário vê o link, consulta e cria rascunho sintético por POST; foco e Enter abrem o destino existente.                        |
| Escrita revogada        | Próximo POST retorna403 independentemente de atualização visual; link desaparece após atualização de permissões, mantendo consulta.                                      |
| Gatilhos de atualização | Provider real, transporte simulado: foco, intervalo15s e pathname removem criação após revogação e solicitam refresh. Não são prova de banco ou expiração durante locks. |

## Cobertura

- `apps/web/modules/messaging/ui/schedules.test.tsx`: cinco testes de DOM com provider real,
  consulta simulada e relógio controlado; sem snapshot de código ou serviço local.
- `apps/web/tests/e2e/messages-access.spec.ts`: duas jornadas, cargos `manager` e `collaborator`
  realmente atribuídos na criação via API administrativa; concessão/revogação versionadas, consulta
  preservada, negação/escrita no servidor, teclado, Axe e capturas nos estados leitura, escrita e
  revogação. Somente rascunhos; não programa nem envia comunicação.
- Playwright `--list` conferiu os dois cenários sem iniciar globalSetup, banco ou servidor.

G02/AC-T003 não concluída: o teste novo não substitui a delegação entre Gestor e terceiro em
`direct-exports.spec.ts`. G03/AC-T004 recebeu cobertura dos gatilhos visuais, mas expiração de
autoridade durante espera por lock continua pendente. P01/AC-T005 não resolvida; nenhuma atribuição
retroativa e nenhuma remoção da opção Sem cargo. Gerenciar cargos e acessos de Administrador, Gestor
e Colaborador (CAAB-19) e AC-T006/aceite global permanecem pendentes onde falta prova/decisão.

## Validação e design

Guia consultado na principal: `docs/caab-design.md`, versão1.1. Regras aplicadas: ocultar ações não
autorizadas, preservar consulta, link nativo/teclado, variante de inclusão e ícone decorativo. Não
há CSS, token, componente ou layout novo. O teste prepara imagens1280/claro,390/escuro e 320/claro,
com nome `messages-access-*`, recolhidas pelo artefato existente de Mensagens. Inspeção visual das
imagens e resultados CI ainda pendentes; não declarar QA humano.

Validação local antes do push: `pnpm test:unit --maxWorkers 1` aprovou417 testes em62 arquivos;
`pnpm test:contract --maxWorkers 1` aprovou169 testes em24 arquivos. `pnpm typecheck`, `pnpm lint` e
`pnpm format:check` aprovados. `pnpm security:scan` passou sem high/critical (um alerta low e dois
moderate). A listagem Chromium encontrou os dois novos testes de navegador.

## Primeiro CI e revisão das capturas

Commit funcional `cfb1f946cd34ca33e8a1649a776900ffd202493f`, publicado com o título
`fix(acessos): oculta criação em Mensagens sem permissão de escrita`.
[CI37032166038](https://github.com/Komunick/caabnovo/actions/runs/37032166038): security, quality e
browser aprovados. Foram417 unitários,169 contratos,253 integrações aprovadas e uma integração
preexistente ignorada em Relatórios; build, tipos, lint, formato e segurança aprovados. Navegador:
três testes prévios de Relatórios,98 E2E e seis testes de acessibilidade aprovados. As duas jornadas
novas de Mensagens passaram na primeira tentativa, incluindo concessão/revogação, POST200/403,
consulta, teclado e Axe.

Artefato `messages-synthetic-screenshots`, ID11238232993; ZIP SHA-256
`18a33f7a2304aaf368487aaa5668574db79f72b89d1b237da9ed4509874a63a4`, conferido após download. Cópia
local em `.cache/ci-access-37032166038` da principal. Seis capturas de Gestor/Colaborador
inspecionadas por CODEX: leitura1280/claro e revogação320/claro mostram consulta preservada e
criação ausente; as duas capturas de escrita390/escuro pegaram a transição do menu lateral após
redimensionamento. A regra funcional passou, mas essas duas imagens não encerram a revisão visual.

O incremento de teste usa `animations: "disabled"` na captura para finalizar as transições finitas
antes da imagem, sem alterar CSS ou a UI de produção. Reexecução pelo CI e inspeção dessas novas
imagens permanecem necessárias; AC-T002 não é marcada concluída por antecipação. O texto de estado
vazio preexistente ainda sugere criar campanha mesmo sem escrita; registrado como observação de
conteúdo fora da correção do link, sem ampliar o protótipo.

PR documental42 permanece aberto na conferência de02/10; nenhum PR funcional aberto antes de sua
integração humana e da conciliação. Nenhum serviço local foi iniciado. A revisão AC anterior não
constitui evidência da correção. QA humano e aceite global continuam pendentes.

## Resultado final do recorte técnico

[Segundo CI37034250928](https://github.com/Komunick/caabnovo/actions/runs/37034250928), SHA
`f8049372b1defbde002301a25df97793776773b9`: security, quality e browser aprovados. Reconfirmados417
unitários,169 contratos,253 integrações aprovadas/uma ignorada preexistente, três testes prévios de
Relatórios,98 E2E e seis a11y. Os dois cenários novos passaram novamente na primeira tentativa.
Tipos, lint, formato, build, auditoria e scan de segredos aprovados. Nenhum serviço local iniciado.

Artefato final `messages-synthetic-screenshots`, ID11240165263; ZIP SHA-256
`16f8a04af34c01e80fdcdac3d331ac4d4d9795b8818d4a9f907d3932abb3d78a`, conferido após download. Cópia
preservada na principal em `.cache/ci-access-37034250928`, com as seis imagens em `images/`. CODEX
inspecionou os três estados para ambos os cargos: sem criação em leitura1280/claro e após
revogação320/claro; criação disponível em escrita390/escuro, com ícone e consulta preservados. Menu
recolhido nas imagens móveis finais, sem sobreposição transitória; textos, filtros e ações legíveis
no recorte. A observação de conteúdo vazio acima permanece fora desta correção. Revisão visual por
IA e Axe não substituem QA humano ou homologação global de Mensagens.

AC-T002/G01 tecnicamente concluída nesta versão; G02/G03/P01 e aceite global mantêm os limites já
descritos. A tarefa histórica AC-T002 é atualizada apenas para registrar este resultado posterior.
PR funcional ainda não aberto: PR42 segue aberto/sem merge na última consulta. Fetch final confirmou
dev/origin/dev em0/0 na base748539d; arquivos locais da principal e outras instâncias preservados. O
registro final de evidência fica preservado em commit documental local para compor a conciliação
após integração humana; o SHA executado pelo CI é f804937, não um commit documental posterior.

## Compatibilidade do fixture de identidade — 07/10/2026-CODEX-mafaltti

Solicitante desta sessão: mafaltti/login Danilo-Komunick, perfil GitHub get_profile consultado pela
coordenação em 07/10/2026 e reutilizado. Pedido autorizado: adaptar somente o fixture G01 do PR #48
para o contrato de identidade do provider publicado no PR #46. Autoria e resultados históricos
acima permanecem preservados. PR #48 aberto, worktree limpa antes do incremento, base publicada
`e24ce056804c27eccd548569db353ba3e9a024d4`.

Incompatibilidade concreta: `schedules.test.tsx` passava somente `initial`, e a resposta simulada de
`/api/v1/me` não continha `id`. O provider de `62a761f6c84d7446adcf242514f8ba8dd1a549b5` exige
`initialIdentityId` e ignora respostas 200 sem identidade válida; sem adaptar o fixture, a futura
combinação falharia em tipos e os gatilhos de revogação não atualizariam a tela. O teste passa agora
um UUID sintético estável por spread de `testIdentity` e devolve o mesmo `id` em `/me`. O spread é
estruturalmente compatível com a assinatura antiga e fornece a propriedade obrigatória da nova.
Nenhuma asserção, produção, permissão, grant, endpoint ou cenário foi alterado. G01 continua cobrindo
leitura sem criação, escrita concedida e revogação por foco, polling de 15 segundos e pathname.

Verificações locais sem instalar dependências ou iniciar serviços:

- Formato do fixture aprovado com Prettier existente da worktree do PR #46.
- Lint focado aprovado com ESLint/configuração existente dessa worktree.
- Cinco casos G01 aprovados com o provider real da branch PR #48 na base `e24ce05`.
- Os mesmos cinco casos aprovados com o provider real do PR #46 em `62a761f`.
- `git diff --check` e preservação das asserções conferidos neste incremento.

A worktree PR #48 continua sem `node_modules`. O runner temporário ignorado fica em
`.cache/compat-g01-20261007/` da worktree PR #46: cópia byte a byte do teste adaptado, aliases para a
UI real de Mensagens do PR #48 e para o provider selecionado, usando dependências já instaladas no
peer. Não houve cópia de produção do PR #46 para o PR #48 nem mock do provider. A primeira tentativa
de usar diretamente a raiz externa falhou na resolução de caminho Windows antes de executar casos;
somente o runner isolado foi ajustado, e as duas execuções posteriores passaram integralmente.

Comandos executados no peer: `node node_modules/vitest/vitest.mjs run --config
.cache/compat-g01-20261007/vitest.compat.mts`; para o provider novo, a mesma execução com
`CAAB_G01_PROVIDER=current`. Cada execução reconheceu e aprovou os cinco testes. Isso comprova o
comportamento DOM do fixture nos dois providers, sem substituir typecheck completo ou CI da futura
combinação. Typecheck/CI da nova ponta PR #48 e gates da combinação com PR #46 permanecem pendentes;
o CI verde da base `e24ce05` não é promovido a aprovação deste incremento ainda sem commit. QA
humano e homologação global continuam independentes. Nenhum commit, push, CI novo ou metadado de PR
foi enviado por esta frente.
