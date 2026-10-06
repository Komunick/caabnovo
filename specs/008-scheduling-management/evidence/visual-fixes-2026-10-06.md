# Correção dos achados visuais de Agendamentos — 06/10/2026

Autoria CODEX; solicitante mafaltti, login Danilo-Komunick, perfil GitHub get_profile verificado
nesta sessão em 06/10. Pedido explícito: usar uma worktree de Agendamentos, atualizar e corrigir os
problemas encontrados na [revisão hospedada](visual-hosted-2026-10-06.md).

## Entrega e escopo

- Worktree `.cache/pr-scheduling-visual-20261006`, branch `fix/scheduling-visual-20261006`.
- Base `9dc6a7fa78dea304d9186c967dae63f8a42b22a2`; fetch e atualização com origin/dev confirmados. A
  branch local de auditoria foi renomeada; evidências e trabalho local preservados.
- A versão validada é a árvore local com estes deltas; hashes dos arquivos de produção no
  [manifesto](visual-fixes-2026-10-06/manifest.json).
- Alterações de apresentação/foco. Nenhuma migration, regra de disponibilidade, estado, contador
  persistido, autorização ou transporte de avisos foi alterado.
- Não houve commit, push, PR, merge, deploy ou mudança no site hospedado nesta correção.

## Resultado por achado

| Item  | Correção                                                                                                                                                                       | Evidência                                                                                                                                    |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| VQA01 | O título do diálogo compartilhado reserva 2,75 rem para a área do botão Fechar, mantendo fonte, cores e o tamanho do alvo existentes.                                          | Geometria sem interseção nos viewports 320/390/1280, claro/escuro; seis capturas e Axe.                                                      |
| VQA02 | Os quatro acionadores de decisão guardam sua referência. Escape, Fechar e Voltar restauram foco quando o botão permanece conectado e habilitado. Fechamento não envia comando. | 12 combinações de ação/fechamento em componentes e Chromium; nenhum POST durante desistência. Cancelamento mantém o DialogTrigger existente. |
| VQA03 | O calendário usa “Atendimento por capacidade do serviço” na ausência de profissional, no texto, tooltip e aria-label.                                                          | Seis regressões de componentes (três vistas, com/sem nome) e três vistas reais do FullCalendar no Chromium, sem `null`/`undefined`.          |
| VQA04 | Histórico junta somente os campos presentes; contadores usam “1 confirmada”, “1 registro” e “1 selecionada”.                                                                   | Contagens 0/1/2/desconhecida, profissional presente/ausente e status da exportação verificados. Dados e horários permanecem iguais.          |

## Validações executadas

- Vitest: 34 testes aprovados em booking-detail.test.tsx, calendar.test.tsx, export-screen.test.tsx
  e ui-contracts.test.tsx. Após detectar o singular de colunas na captura, export-screen.test.tsx
  foi ampliado/reexecutado: sete testes aprovados. Total de 35 casos únicos.
- TypeScript web:
  `node --max-old-space-size=1536 node_modules/typescript/bin/tsc --noEmit -p apps/web/tsconfig.json`,
  aprovado.
- ESLint dos arquivos TSX alterados, aprovado. Formatação dos arquivos de código/documentação e
  `git diff --check`, aprovados.
- Chromium com Playwright 1.62.1: 24 cenários, dez PNGs; exportação revalidada depois do ajuste
  final de colunas selecionadas. Sem erros de página na execução final.
- Axe: zero violações nos seis estados de modal por tema/largura, tags WCAG 2 A/AA, 2.1 AA e 2.2 AA.
- O E2E administrativo existente foi atualizado com singular, geometria em 320 px e retorno de foco
  por três formas de fechamento. Sua execução com backend permanece não realizada aqui.

Na primeira execução dos testes novos, o mock de Next/link não fornecia useLinkStatus. Corrigido sem
alterar produto. As verificações de Escape passaram a esperar o retorno assíncrono de foco do Radix;
a asserção de identidade do acionador e a ausência de mutação foram mantidas. Uma fixture ganhou
eligibilityWarning=null para cumprir o tipo existente. Ajustes de resolução de React, variáveis de
compilação do Next e rota de download foram feitos somente no harness local.

## Método de navegador e limites

O harness local empacotou os componentes reais de detalhes, diálogo, FullCalendar, exportação,
WorkspaceDrafts/Permissions e o CSS/tokens desta worktree. Next/navigation e Next/link usam um
adaptador de navegação para o teste de componentes. Todas as respostas HTTP foram interceptadas pelo
Playwright em `https://scheduling-ui.test/`, com dados sintéticos e bloqueio de pedidos inesperados.
Nenhum servidor/localhost ou banco foi iniciado; nenhum pedido foi enviado ao DEV. Scripts em
`.cache/visual-fixes/` da worktree.

Isso valida renderização, geometria, foco, texto e acessibilidade desses estados no Chromium. Não
comprova integração HTTP/PostgreSQL, downloads reais da versão corrigida, concorrência,
comprovantes, entrega de mensagens, outros navegadores ou homologação humana. A revisão anterior do
site e seus downloads continuam evidências distintas; não reatribuir suas capturas à correção. Build
de produção, suíte E2E com backend e CI não foram executados nesta etapa.

## Revisão pelo guia

[caab-design.md](../../../docs/caab-design.md) aplicado: legibilidade sem sobreposição, alvo Fechar
preservado, foco ao acionador, texto compreensível e datas/histórico intactos. As dez capturas foram
inspecionadas por IA. Elementos fixos em screenshots fullPage cobrem apenas o viewport; áreas
inferiores não cobertas não foram interpretadas como defeito de modal.

- [Modal corrigido em 320 px, claro](visual-fixes-2026-10-06/dialog-320-light.png).
- [Modal corrigido em 320 px, escuro](visual-fixes-2026-10-06/dialog-320-dark.png).
- [Exportação com um registro](visual-fixes-2026-10-06/export-single-390-light.png).

VQA01–VQA04 concluídas localmente em [tasks.md](../tasks.md). T110 e demais pendências
institucionais não são encerradas. A entrega está disponível na worktree para revisão/publicação
quando solicitada.

## Preparação do PR — 06/10/2026-CODEX-mafaltti

Pedido explícito posterior: abrir PR para análise. Código, testes e evidências publicados em
`d5f8885824a6287617678d0963193aa0b5e78cec`. O limite de ausência de publicação registrado acima
descreve a etapa local anterior.

O primeiro [CI de push](https://github.com/Komunick/caabnovo/actions/runs/37524336230) reprovou
security por Payload <3.90.0 (cinco HIGH e um CRITICAL), já existente na base `9dc6a7f`.
Quality/browser ainda estavam em execução quando o usuário informou a integração do PR #49. Não
contornar o gate nem atribuir essa falha à alteração de interface.

Integração confirmada: PR #49 em dev `2b30f538025121253c336425b6c8c6b5264193cd`. Principal
atualizada por fast-forward e base incorporada à branch por merge local
`8d7979c1fd2ec75842a75c9ba22933ff602c0f86`, sem reescrever histórico publicado ou executar merge de
PR nesta frente. Os cinco arquivos de produção da correção conservam os hashes do manifesto. O diff
do PR será contra o novo dev, excluindo a atualização de dependências já integrada.

O novo CI da ponta publicada será conferido antes da declaração de prontidão. A descrição do PR
registra a versão e seus gates reais; captura/validação de componentes local não substitui E2E,
integração, build ou segurança do CI. Sem autorização de merge/deploy desta correção.
