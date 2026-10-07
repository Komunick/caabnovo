# Revisão visual de Agendamentos no DEV — 06/10/2026

Autoria: CODEX; solicitante mafaltti, login Danilo-Komunick, perfil GitHub get_profile consultado em
06/10/2026 nesta sessão. O usuário informou o endereço do painel, confirmou que o banco é de teste,
autorizou operar os fluxos e forneceu uma conta para login. Credenciais não integram esta evidência.

## Ambiente e método

- Painel observado: https://caabv2dev.komunick.com/.
- Referência local: dev/origin/dev `9dc6a7fa78dea304d9186c967dae63f8a42b22a2`, após fetch.
- Registro isolado: branch `audit/scheduling-visual-20261006`, worktree
  `.cache/pr-scheduling-visual-20261006`.
- Playwright 1.62.1, Chromium instalado, navegador visível; sessão administrativa da conta Codex.
- Viewports: 1280 × 900, 390 × 844 e 320 × 800; temas claro e escuro, locale pt-BR e America/Bahia.
  Capturas fullPage; o gutter pode reduzir a largura do PNG em 15 px.
- Revisão visual IA das capturas, operação da UI, seleção por teclado, Escape, inspeção de foco e
  geometria DOM; leituras finais dos endpoints administrativos existentes.
- Guia aplicado: [caab-design.md](../../../docs/caab-design.md); critérios CAL-F01–06, FR-014,
  US1/US2/US4 e evolução administrativa da [spec](../spec.md).

O SHA da aplicação hospedada não foi exposto/confirmado. Esta revisão comprova o comportamento do
endereço observado nesta sessão; não equivale a executar a suíte contra o SHA local, a revisar
deploy/migrations ou a homologação institucional humana. Nenhum servidor, worker, scanner ou banco
local foi iniciado. Não houve alteração de código, commit, push ou PR.

## Jornadas observadas

| Recorte                | Resultado e limite                                                                                                                                                                                                                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Agenda                 | Lista, filtros, calendário de dia/semana/mês e estado vazio carregaram. Busca preservada na URL; reserva cancelada permanece consultável.                                                                                                                                                  |
| Temas e responsividade | Campos e ações examinados em 1280/390/320 px. Sem overflow horizontal global nas medições; semana/mês rolam dentro da região do calendário. Defeito no título do modal em 320 px descrito abaixo.                                                                                          |
| Oferta                 | Unidade e serviço de teste criados. Serviço por capacidade, um atendimento simultâneo, duração de 30 minutos, aprovação manual, 90 dias e antecedência de remarcação de 24 horas. Publicar salvou o primeiro procedimento e seus horários.                                                 |
| Horários               | Expediente da unidade salvo por UI: sete dias, 08:00–18:00. Somente a unidade sintética criada foi alterada.                                                                                                                                                                               |
| Reserva/aprovação      | Pessoa sintética criada, selecionada por combobox/teclado. Pedido de 09/10 às 08:00 criado, exibido em Pendências e aprovado, com histórico.                                                                                                                                               |
| Remarcação             | Pedido para 10/10 às 08:00 enviado e aprovado. Contador passou a uma troca confirmada.                                                                                                                                                                                                     |
| Recuperação            | Indisponibilidade registrada; estado Aguardando nova data e horários ausentes exibidos corretamente. Nova data de 11/10 às 08:00 solicitada e aprovada. Contador permaneceu em uma troca.                                                                                                  |
| Cancelamento           | Confirmação aberta e executada. UI informou liberação da vaga; registro preservado no histórico e na agenda como Cancelado.                                                                                                                                                                |
| Faltas                 | Lista vazia, orientação e seção da reserva inspecionadas. Reserva futura não oferece registro de falta. Não havia ocorrência sintética passada controlada para validar submissão/comprovante/decisão nesta sessão.                                                                         |
| Exportação             | Tela, filtros, ordenação de colunas e três botões examinados em 390/320 px. Downloads reais de CSV, XLSX e PDF concluídos, com uma reserva na seleção. CSV contém cabeçalho e um registro; CSV/XLSX contêm o ID da reserva. PDF verificado pela assinatura, sem revisão do layout interno. |
| Formulários adicionais | Profissional, habilitação e procedimento inspecionados. Envio de profissional sem nome recusado com “Preencha este campo.”; nenhum registro criado nessa tentativa.                                                                                                                        |
| Edição preservada      | Nome do novo profissional preenchido; navegação por links para Horários e retorno a Profissionais preservaram o rascunho. Rascunho depois cancelado, sem gravação.                                                                                                                         |
| Modais/teclado         | Comboboxes e seleção de vagas operados por teclado; Escape fecha modal. Retorno de foco ao acionador falhou, conforme reprodução abaixo.                                                                                                                                                   |

As capturas de transição/loading e o efeito de elementos fixos em capturas fullPage não foram
classificados como defeitos de produto. Timeouts por nomes de locators incorretos foram corrigidos
na automação e não constituem falha da aplicação.

## Achados confirmados

### VQA01 — título sobreposto ao fechar em 320 px — moderado

No modal “Registrar indisponibilidade do estabelecimento?”, o título ocupa a região do botão X. Em
viewport de 320 px, a primeira linha do texto tem limites x=33,58–273,68 e y=295,80–322,26; o botão
Fechar tem x=251,14–294,26 e y=289,92–333,04. Há interseção de aproximadamente 22,54 × 26,46 px
entre texto e área do botão. A inspeção visual confirma o X sobre o final da primeira linha.
Reproduzido após a recuperação ser concluída, ao reabrir o modal sem executar nova
indisponibilidade.

Critério: título e ações legíveis no celular, sem corte/sobreposição, conforme o guia e FR-014.
Evidência: [modal em 320 px](visual-hosted-2026-10-06/18-recovery-modal-320-confirm.png). Fonte
compartilhada: [dialog.tsx](../../../apps/web/components/ui/dialog.tsx); confirmar a solução no
componente e nas demais utilizações antes de alterar.

### VQA02 — Escape perde o retorno de foco — moderado

Abrir o modal de indisponibilidade pelo botão da reserva e pressionar Escape fecha o diálogo, mas
`document.activeElement` passa a BODY, sem nome/acionador focalizado. Reproduzido duas vezes; a
segunda sem blur dentro do modal. Fechamento ocorreu sem executar o comando de domínio.

Critério: retorno de foco ao acionador e continuidade de teclado, conforme o guia e CAL-F06. Fonte:
[booking-detail.tsx](../../../apps/web/modules/scheduling/ui/booking-detail.tsx) e diálogo
compartilhado. O modal controlado desta ação não define retorno explícito ao botão acionador.

### VQA03 — calendário expõe `null` para atendimento por capacidade — baixo

A reserva sem profissional aparece no dia/semana/mês com texto terminado em `· null`. O tooltip e o
aria-label também incluem `null`. Exemplo observado: “Cancelado · QA Visual Pessoa 061026 · QA
Visual Atendimento 30min · null”. Os detalhes da mesma reserva apresentam corretamente “Atendimento
por capacidade do serviço”.

Critério: identificação compreensível da reserva e textos de interface em português, CAL-F03.
Evidência visual: [calendário diário](visual-hosted-2026-10-06/27-calendar-day-desktop-light.png);
leitura do evento confirmou texto, title e aria-label. Fonte:
[calendar.tsx](../../../apps/web/modules/scheduling/ui/calendar.tsx:40), que interpola
professionalName sem alternativa para null.

### VQA04 — separadores e singular no histórico — baixo

O histórico de atendimentos sem profissional mostra `08:00 · · QA Visual Atendimento 30min`. O
contador mostra “1 confirmadas” após uma troca; a conclusão de exportação mostra “1 registros”. São
problemas de apresentação, sem alteração de dados/ocupação comprovada.

Evidências: `11-booking-pending-mobile-dark.png`, `17-recovery-detail-320-dark.png` e
`25-export-320-light-completed.png`. Fontes: booking-detail.tsx e exports/ui/export-screen.tsx.
Corrigir separadores condicionais e singular/plural sem mudar as regras de negócio.

## Dados de teste e estado final

- Unidade: `QA Visual Playwright 061026`, ID `c20955d1-42c7-4511-ad1c-24babf1399bd`.
- Serviço: `QA Visual Playwright 061026`, ID `91de2bbb-ea50-4606-b33b-349f8f0385a6`.
- Procedimento: `QA Visual Atendimento 30min`, ID `31f01813-849d-4d5b-b2ac-0a0f2a9afe8e`.
- Pessoa: `QA Visual Pessoa 061026`, ID `0bec0cf1-14ec-45af-9afe-721bb051ccdf`.
- Reserva: `5450788f-c843-42ac-966b-d34acc2bd3eb`, cancelada ao final; uma remarcação voluntária
  confirmada e oito eventos históricos. Recuperação não incrementou o contador. Leituras finais das
  APIs retornaram 200 e confirmaram status `cancelled` e contador 1.
- Os cadastros de teste permanecem identificados para revisão. O bloqueio de recurso de 10/10,
  08:00–08:30, criado pela indisponibilidade, pertence somente ao serviço sintético.
- Nenhum registro preexistente foi alterado; nenhum cargo, permissão ou credencial foi modificado.
- Tema final claro; navegador permanece aberto na agenda filtrada da pessoa de teste.

## Evidências e pendências

Capturas selecionadas e hashes: [manifesto](visual-hosted-2026-10-06/manifest.json). São 26 PNGs
selecionados e examinados; a pasta principal conserva capturas intermediárias que não foram usadas
como evidência de interface final. Os screenshots do formulário de serviço foram recapturados no
início da página, após estabilização, para evitar artefatos de elementos fixos. Downloads locais e
verificações: `.cache/scheduling-visual-20261006/downloads/` e `downloads-validation.json` da pasta
principal; não são dados de produção.

VQA01–VQA04 foram registradas em [tasks.md](../tasks.md), sem implementação nesta revisão e sem
reabrir gates antigos. Não foram executados Axe, suítes completas, matriz de permissões/revogação,
concorrência, justificativa/contestação com arquivos, processamento do worker ou entrega real de
avisos. A revisão visual não substitui esses critérios nem encerra T110.

Validação documental: Prettier nos três arquivos documentais desta entrega e `git diff --check`
aprovados. O diff de tasks.md contém somente 16 linhas novas; não houve reformatação do histórico.
Manifesto conferido contra os 26 arquivos PNG por SHA-256 e links relativos conferidos. Esses checks
validam a evidência; não são testes de aplicação.
