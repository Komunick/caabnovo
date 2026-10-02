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

PostgreSQL, E2E, a11y e build serão validados pelo workflow existente após push. Nenhum serviço
local foi iniciado. A revisão AC anterior não constitui evidência da correção.
