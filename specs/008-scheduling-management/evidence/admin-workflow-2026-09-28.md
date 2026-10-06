# Operação administrativa de Agendamentos — validação local

## Escopo e autoria-CODEX-mafaltti

Solicitante mafaltti, login Danilo-Komunick, perfil GitHub autenticado conferido nesta sessão em
28/09. Pedido: adiar app/site e operar pelo painel/banco; interface mínima somente se indispensável.
Resposta explícita: mesmas regras de aceitação, prazo e duas trocas para a equipe; recuperação por
indisponibilidade do estabelecimento isenta. Implementação/testes locais e Docker autorizados.
Manter local, sem publicação/PR/merge/envio/WAHA. T078–T086 concluídas neste recorte.

Branch codex/scheduling-market-research-20260923, HEAD 500f84f com alterações não commitadas.
Principal dev=origin/dev 89d2356 confirmado por fetch final. O manifesto
[SHA-256 de código/migrations/testes](admin-workflow-2026-09-28.sha256) identifica os arquivos
locais verificados; HEAD sozinho não representa esta entrega. Nada integrado em origin/dev.

## Resultado implementado

- Migration 0032 administrativa após 0031, sem reescrever migrations anteriores. Pending_approval
  ocupa as duas exclusões, capacidade verifica pico simultâneo durante todo o intervalo [).
  procedure_id explícito, profissional/horário nulos conforme modo/estado, ator user existente.
- Confirmação imediata por padrão e desligável; política por serviço, prazo de 24h editável/zero,
  duas trocas confirmadas com uso reservado na pendência, mesma utilização entre alternativas.
  Recusa não restaura origem nem cobra novo uso; recuperação do estabelecimento isenta e bloqueia de
  fato o recurso/período, preservando outros atendimentos.
- Cadastro/publicação em uma ação, Salvar/Publicar com descrições e rascunho separado. Políticas,
  duração, nome e ativação publicados preservados ao salvar alterações. Catálogo operacional usa
  catalogView=booking, gestão lê rascunho. Unidade/profissional/horários/bloqueios continuam atuais.
- Pedido inicial pode mudar data/horário/profissional e ser transferido ao dependente elegível;
  edição de solicitação vencida permite nova data futura. Serviço preservado; sem override de ator.
- Fila prioriza remarcações pelo horário original; idade/atraso/urgência separados. Equipe da
  unidade e backup com read/write existentes, sem concessão implícita; autoria e histórico mantidos.
- Relatórios e exportações distinguem cinco estados e incluem capacidade/ausência de profissional.
  Relatórios usam coalesce(starts_at,original_start,created_at) como referência; exportação conserva
  intervalos nulos. Horários exportam também serviço/capacidade. usersExport preservado.
- Intenção de aviso e evento na mesma transação. Histórico exibe envio pendente ou estado
  persistido; não confunde registro com entrega. Nenhum dispatcher, provedor real ou preferência de
  app ativado.

## Validações e comandos

Executados da worktree com dependências locais; PostgreSQL 18 descartável. Ambiente Docker Windows:
DOCKER_HOST=npipe:////./pipe/dockerDesktopLinuxEngine; TESTCONTAINERS_HOST_OVERRIDE=127.0.0.1.
Comandos usam node_modules locais e --maxWorkers=1; dados exclusivamente sintéticos.

| Verificação                   | Resultado            | Entrada                                                                                               |
| ----------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------- |
| Unitários focados             | 98/98, 13 arquivos   | vitest run --project unit: scheduling, exports, workspace/areas e contratos scheduling/policy         |
| Contratos HTTP                | 169/169, 24 arquivos | vitest run --project contract --maxWorkers=1                                                          |
| Integração de agenda anterior | 37/37                | scheduling.test.ts com 0032                                                                           |
| Integração do fluxo novo      | 15/15                | scheduling-workflow.test.ts; rodada conjunta 52/52                                                    |
| Integração de exportação      | 20/20                | scheduling-export.test.ts, arquivos reais CSV/XLSX/PDF                                                |
| Navegador Chromium            | 6/6                  | scheduling-workflow.spec.ts, scheduling.spec.ts, scheduling-access.spec.ts, scheduling-export.spec.ts |
| Build/tipos                   | Aprovados            | node apps/web/node_modules/next/dist/bin/next build apps/web; 55 páginas                              |
| Lint e formato                | Aprovados            | ESLint/Prettier dos arquivos novos/alterados e git diff --check                                       |

Integrações cobrem upgrade 0001–0031→0032 com reserva anterior, contador NULL preservado, replay de
migrations/checksums, ambas as exclusões pendentes, capacidade 3 com 20 comandos concorrentes, 20
replays idempotentes e corrida decisão/cancelamento. Incluem transferência, prazo/vencimento,
recusa/retomada, limite, equipe/fila/revogação, publicação inválida/draft e relatório com NULLs. Não
se fez benchmark de produção nem homologação de dados importados.

Comando E2E: node node_modules/@playwright/test/cli.js test --config .cache/scheduling-e2e.config.ts
scheduling-workflow.spec.ts scheduling.spec.ts scheduling-access.spec.ts scheduling-export.spec.ts
--project chromium --workers=1 --output .cache/scheduling-admin-verified-results. Configuração/env
ignorados apontam exclusivamente ao banco sintético, MAIL_MODE local e preview de produção 3107. CI
remoto não executado.

### Falhas detectadas e corrigidas

Primeiras integrações encontraram ligação ausente dos horários por capacidade, corrigida antes da
matriz ampliada. Tipos identificaram nullable DTO e argumento do helper de contraste, corrigidos.
Revisão acrescentou proteção para rascunho inativo/nome/duração publicados. E2E então detectou
colisão de view com visualização da agenda: corrigida com catalogView e teste de regressão. Massa
acumulada expôs lista longa sem foco: listbox agora recebe Tab, setas/Enter e Escape retorna ao
campo; asserções de teclado e Axe permaneceram ativas. Rodada final aprovada, sem desabilitar checks
ou substituir sucesso por retry. Rodadas anteriores falhas ficam nos artefatos locais.

Logs locais também registraram avisos de NO_COLOR/FORCE_COLOR e pg sobre consultas concorrentes na
fixture; não são falhas dos asserts. Next registrou destination stream closed early durante algumas
navegações/interrupções da suíte; não foi classificado como prova de entrega de streaming. Downloads
foram verificados por testes próprios. Não alegar execução sem warnings.

## Revisão de interface pelo guia CAAB

Guia canônico: C:/Projetos/caabnovo/docs/caab-design.md. Shell, tokens, FormField, Button, Dialog,
seletores e navegação existentes preservados. Ações Salvar/Publicar têm descrições persistentes e
aria-describedby; decisões sensíveis usam diálogo. Reflow testado em 320px, fluxo em 390px, detalhe
em 1280px; temas claro/escuro, Axe e contraste. Seletores e jornada anterior usam teclado, incluindo
Tab/Shift+Tab/Enter/Escape. Não há inspeção em dispositivo físico ou leitor de tela real.

Capturas revisadas visualmente, sem recorte de ações ou rolagem horizontal da página:

- [Cadastro e regras, 390px claro](administrative-workflow-2026-09-28/administrative-policy-390-light.png).
- [Fila de pendências, 390px claro](administrative-workflow-2026-09-28/administrative-queue-390-light.png).
- [Recuperação/histórico, 1280px escuro](administrative-workflow-2026-09-28/administrative-recovery-1280-dark.png).

## Operação e limites preservados

Banco do navegador caab-scheduling-admin-20260928, label caab.task=scheduling-admin-20260928,
PostgreSQL 18-alpine, 256 MB/1 CPU, foi encerrado/removido ao concluir. Preview 3107 encerrado.
Testcontainers limparam seus recursos. Outros containers, volumes, banco de uso e contas reais
preservados. Nenhum seed aplicado fora de bancos descartáveis. Não desligar Docker Desktop ou outros
serviços apenas porque esta entrega acabou.

Contagem anterior desconhecida não é reconstruída; remarcação voluntária desses registros requer
conciliação antes de uso. Novas reservas iniciam em zero. App/site permanecem adiados e a checklist
de canais não foi marcada como concluída. Entrega/recibos WAHA e serviço de e-mail existente,
resolução final de destinatários e preferências dependem da integração posterior. Não houve envio.

Jira: CAAB-37 atualizado (comentário 10057) com a entrega administrativa local e seus limites;
CAAB-30 permanece em Backlog por adiamento explícito (comentário 10056).
CI/publicação/PR/merge/deploy continuam pendentes, sem impedir a conclusão do escopo local
autorizado. As tarefas externas T040–T077 não foram marcadas completas por esta implementação
administrativa.
