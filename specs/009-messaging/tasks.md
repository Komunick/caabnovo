# Tasks: Mensagens: revisão de aderência e exportação condicionada — incremento de 21/09/2026

**Input:** [spec](spec.md), [plan](plan.md), [research](research.md), [modelo](data-model.md),
[contrato](contracts/exports.md), [quickstart](quickstart.md).
**Branch da entrega:** `docs/project-clarify-20260921`. Nenhuma tarefa nova executada.
**Lista ativa:** T001–T008; testes foram pedidos nas specs e nos gates do projeto.
Caminhos novos são destinos planejados; conferir referências contra o inventário de
artefatos deste incremento antes de editar. Nenhum arquivo de código foi criado agora.

## Rastreabilidade e escopo

M016: tarefa US6 da lista atual, mantendo gate. M009/M010 seguem adiadas. M015 documenta somente finalidade confirmada; US8 é construção condicionada, não liberada pelo simples planejamento.

O histórico abaixo conserva marcadores e evidências originais. IDs provisórios
detalhados aqui não são uma segunda execução; usar a lista ativa. Pendências de
política/pesquisa/homologação e funções suspensas continuam pendentes e não são
autorizadas por constarem neste arquivo. Não repetir tarefas já concluídas.

## Setup

- [ ] T001 Conferir o catálogo real de telas/abas e filtros contra `specs/009-messaging/contracts/exports.md`; mapear campos permitidos/defaults e projeções atuais, sem criar fonte ou ampliar permissão.

## Foundational

- [ ] T002 Após M016/US6 registrar continuidade, preparar fixtures sintéticas isoladas e contratos da função em `apps/web/modules/messaging/export-fixtures.ts` (novo, exclusivo de testes), com datas empatadas, zero resultados, texto longo, campos restritos e filtros combinados; depende dos schemas de 001.

## US6 — Aderência à finalidade

**Objetivo/aceite independente:** Matriz da finalidade e decisão de continuidade registradas, com evidências reais e lacunas; pesquisa não é homologação.

- [ ] T003 [US6] Revisar campanhas/públicos/programação/estados do protótipo e a distinção de consulta/mutação exigida pelos cargos de `specs/001-project-foundation/contracts/roles.md`, coordenando001 T114; registrar matriz e decisão de continuidade em `specs/009-messaging/evidence/purpose-review.md` (novo); M016 não é homologado por testes antigos. Interromper tarefas de construção seguintes até essa decisão, mantendo M009/M010 adiadas.

## US8 — Exportação autorizada

**Objetivo/aceite independente:** Após gate, campanhas/públicos/programações exportam três formatos sem diretório de contatos, entrega fictícia ou novos canais.

**Gate obrigatório:** executar somente depois de M016/US6 registrar decisão de continuidade; canais reais seguem fora.

- [ ] T004 [US8] Escrever testes do adaptador em `apps/web/modules/messaging/export-adapter.test.ts` (novo): filtro+sort, columns em ordem pedida, campo proibido, dados completos e matriz de autorização conforme `specs/009-messaging/contracts/exports.md`.
- [ ] T005 [US8] Implementar `apps/web/modules/messaging/export-adapter.ts` (novo) reutilizando as consultas/projeções do domínio, IDs/dependências para reautorização por lote e cursor do núcleo 001; cobrir todos os datasets do contrato, sem ampliar acesso ou alterar dados.
- [ ] T006 [US8] Integrar ação/tela em `apps/web/app/(admin)/messages/exportar/page.tsx` (nova) e nas listas/abas existentes de `apps/web/modules/messaging/ui/`; passar contexto/filtros, preservar rascunho e oferecer os três formatos com defaults e reordenação acessível.
- [ ] T007 [US8] Validar arquivos reais nos três formatos, ordem/contagem/IDs/filtros e negações em `apps/web/tests/integration/messaging.test.ts` e `apps/web/tests/e2e/messaging.spec.ts`; usar o parser independente do núcleo 001 e confirmar erro recuperável sem corte.

## Polish

- [ ] T008 Executar gates/testes da função no CI e registrar resultados/capturas/limites em `specs/009-messaging/evidence/plan-2026-09-21-validation.md` (novo); marcar conclusão somente com evidência, preservando tarefas institucionais e históricas.

## Dependências e ordem de execução

Setup → US6/M016 (revisão documental) → Foundational → US8 → Polish. A numeração conserva o agrupamento do template, mas o gate US6 precede qualquer fixture/código novo. Dentro de cada história, contratos/testes
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

# Tarefas — Mensagens

**Decisão vigente — 21/09/2026:** a finalidade de Mensagens foi confirmada: comunicados e campanhas aos associados, com seleção de público e programação. O código existente continua sendo um protótipo, sem homologação do produto. A definição de finalidade substitui a pendência de 17/09; revisão de aderência do protótipo e critérios de continuidade permanecem em M016. Meios, provedores e envio real continuam adiados. Conversa interna do painel e suporte por tickets do app/site são possibilidades de módulos futuros separados, com nomes e funcionamento sujeitos a pesquisa posterior; não estão em implementação.

Tarefas marcadas abaixo comprovam trabalho técnico realizado no protótipo; não
representam conclusão do produto. A finalidade foi confirmada pelo usuário em Q5 (21/09).

- [x] M001 Pesquisa, escopo, plano, contratos e limites de canais registrados.
- [x] M002 Contratos e migration com permissão única, catálogos, supressões e execuções.
- [x] M003 Serviços transacionais, público, prévia, idempotência, versões e auditoria.
- [x] M004 Rotas autenticadas e scheduler durável sem envio fictício.
- [x] M005 UI completa no padrão do painel, persistência das edições e limpeza isolada de inclusões concluídas.
- [x] M006 Testes de contrato, autorização, concorrência, exclusões e programação.
- [x] M007 Navegador, acessibilidade e evidências responsivas no CI.
- [x] M008 Documentação integrada, PR atualizado, checks finais e principal sincronizada.

## Etapa posterior acordada

- [ ] M009 Definir meios/provedores, finalidade/consentimento, limites, conteúdo por canal, credenciais e homologação real.
- [ ] M010 Implementar entrega por destinatário/canal e callbacks autenticados com deduplicação e métricas comprovadas.

Evidências e execuções de CI: [validation.md](evidence/validation.md). Entrega anterior revisada pelo usuário; segmentação e agendamentos completados e validados; M009/M010 permanecem adiadas; M015 foi resolvida documentalmente em Q5 e M016 continua pendente.

## Correção solicitada — concluída

- [x] M011 Cadastro e filtros por categoria, gênero, vínculo, cidade, idade, UF e situação Ativa/Inativa.
- [x] M012 Remover teto de seleção e provar contagem integral com 100 registros sintéticos, com payload e UI controlados.
- [x] M013 Aba Agendamentos, criação visível, cancelamento e reagendamento auditado.
- [x] M014 Testes de contrato/integração/navegador, evidências e CI completo.

## Revisão de finalidade — decisão de 17/09/2026

- [x] M015 Confirmar a finalidade com o responsável pelo produto: comunicados e campanhas aos associados com público/programação, conforme Q5 de 21/09/2026; conversas internas e suporte são candidatos separados. Conclusão documental, sem homologação de implementação.
- [ ] M016 Revisar aderência do protótipo à finalidade confirmada em Q5, definir ajustes e critérios de aceite e registrar decisão de continuidade antes de nova construção; preservar M009/M010 adiadas.

## Exportação transversal — revisão de 21/09/2026

- [ ] DX01 Detalhar, implementar e validar a exportação de Mensagens e suas abas conforme 002 EXP06/EXP07 e docs/EXPORT-STANDARD.md: ação nomeada, filtros pertinentes, seleção/ordem de colunas, Excel/CSV/PDF integrais e download direto, consulta ao módulo mais permissão geral, recusa de campos restritos e revogação. Sem teto funcional, fila/histórico obrigatório ou prazo de download; sem alterar anexos/documentos. A07 (missing). Tarefa do módulo que executa a coordenação transversal, não um segundo projeto.

</details>
