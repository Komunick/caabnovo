# Tarefas: organização do Jira e Confluence

## Complemento autorizado de coerência — 02/10/2026

- [x] T031 Conferir os 42 tickets e evidências; preparar manifesto complementar.
- [x] T032 Aplicar 19 descrições e quatro transições autorizadas, preservando os concluídos.
- [x] T033 Atualizar inventário local, referências de produto/stack e páginas do Confluence.
- [x] T034 Relê-se tickets/páginas, validar documentação e registrar resultados e bloqueios.
- [ ] T035 Concluir conversão nativa de Mostrar apenas funções autorizadas na navegação (CAAB-20) e
      salvar visão ativa separada. Chrome/IAB indisponíveis nesta sessão.

T035 acompanha as limitações existentes de T009/T027, sem nova demanda de produto. A regra de
referência por título e código, sem links de tickets, aplica-se às comunicações novas.

**Data:** 01/10/2026. **Branch:** `docs/jira-confluence-organization-20261001`. **Fontes:**
[spec](spec.md), [plano](plan.md), [pesquisa](research.md), [modelo](data-model.md),
[contrato](contracts/operations.md) e [modelos textuais](contracts/templates.md).

Esta lista descreve execução futura; gerar tasks.md não executa suas tarefas nem autoriza
publicação. Marcadores refletem somente tarefas efetivamente concluídas. Os caminhos são relativos à
raiz da worktree; arquivos de evidência indicados abaixo serão criados durante a execução. Não criar
tickets Jira para estas tarefas de procedimento: o limite inicial continua sendo até cinco novos
registros de produto. Não implementar funcionalidades, apagar recursos, iniciar serviços, abrir PR
ou integrar branches.

Formato: checkbox, ID sequencial, [P] apenas para trabalho em arquivos distintos e [USn] por
história. A ordem numérica organiza fases por prioridade; dependências explícitas prevalecem sobre a
numeração.

## Fase 1 — Preparação

- [x] T001 Conferir AGENTS, caderno da principal, branch/worktree e sincronização; registrar escopo,
      autorização e base em `specs/011-jira-confluence-organization/evidence/execution-context.md`.
- [x] T002 Conferir identidade das conexões e capacidades de leitura/edição/conversão de CAAB e
      CAABNOVO, sem escrita remota; registrar limites sem segredos em
      `specs/011-jira-confluence-organization/evidence/capabilities.md`.

## Fase 2 — Base comum

Depende de T001–T002. Deve terminar antes de preparar as histórias.

- [x] T003 [P] Inventariar todos os tickets CAAB com paginação, abertos e fechados, capturando
      campos, updated e histórico necessário; registrar os 37 iniciais e diferenças em
      `specs/011-jira-confluence-organization/evidence/jira-snapshot.md`.
- [x] T004 [P] Inventariar páginas CAABNOVO, incluindo IDs do contrato, pais, versões, conteúdo
      necessário e possibilidade de conferir rascunhos; registrar em
      `specs/011-jira-confluence-organization/evidence/confluence-snapshot.md`.
- [x] T005 [P] Atualizar PRs e evidências funcionais, incluindo PR13/36/40, specs e trabalho local
      não integrado, distinguindo integração de QA em
      `specs/011-jira-confluence-organization/evidence/source-evidence.md`.

## Fase 3 — US1: entender o trabalho real (P1)

**Objetivo:** cada item representa uma entrega compreensível, sem fragmentação artificial.
**Validação independente:** todas as chaves do inventário têm decisão justificada; comparação por
escopo distingue duplicata, dependência e recorte. A aplicação preserva chaves e histórico.

- [x] T006 [US1] Reconciliar cada ticket do inventário com a classificação inicial, comparar
      resultado/escopo/aceite e explicar redundâncias ou independência em
      `specs/011-jira-confluence-organization/ticket-preview.md`.
- [x] T007 [US1] Redigir textos finais e alterações de tipo/pai/categorias por ticket, com uma
      natureza, todos os módulos e labels de origem preservados; registrar antes/depois em
      `specs/011-jira-confluence-organization/evidence/jira-content-proposal.md`.
- [x] T008 [US1] Buscar equivalentes das três tarefas de Agendamentos e duas subtarefas de 24;
      especificar somente ausências, escopo parcial do PR40 e dependências, sem criar N1–N5 ou
      escopo da caixa de entrada, em
      `specs/011-jira-confluence-organization/evidence/new-items-proposal.md`.
- [ ] T009 [US1] Após T019 e releitura de concorrência, aplicar somente textos/tipos/pais/labels
      aprovados nos existentes, incorporar aceite de 21 em 2 antes de consolidar e preservar status
      históricos; verificar cada operação em
      `specs/011-jira-confluence-organization/evidence/jira-content-results.md`.
- [x] T010 [US1] Após T009, repetir busca de equivalentes e criar apenas novos registros aprovados,
      confirmando chave/pai e evitando retry duplicado; registrar resultado e status sustentado por
      evidência em `specs/011-jira-confluence-organization/evidence/new-items-results.md`.
- [x] T011 [US1] Após T025, vincular páginas confirmadas aos tickets 34/35/36 e sinalizar
      transferência sem mudar status; conferir consolidação 21→2 e históricos 4/5 em
      `specs/011-jira-confluence-organization/evidence/traceability-results.md`.

T007 não atribui responsáveis nem muda status: esses campos têm proposta própria em US2. T009 não
sinaliza transferência antes de T011.

## Fase 4 — US2: confiar em responsáveis e andamento (P1)

**Objetivo:** atribuição e avanço sustentados por evidências do recorte. **Validação independente:**
todo item além do Backlog tem executor comprovado ou pendência explícita; QA registra humano
identificado sem trocar automaticamente o Assignee.

- [x] T012 [P] [US2] Cruzar autor de PR, recorte e saída do Backlog de cada item, especialmente
      26–28, comprovando correspondência com accountId Jira ativo em
      `specs/011-jira-confluence-organization/evidence/responsibility-proposal.md`.
- [x] T013 [P] [US2] Separar evidência de revisão/testes IA, QA humano, merge e pendências de escopo
      por ticket; preservar status históricos sem QA e bloquear prontidão indefinida em
      `specs/011-jira-confluence-organization/evidence/workflow-proposal.md`.
- [x] T014 [US2] Após T007, T012 e T013, reconciliar campos com proposta de conteúdo; preservar
      executor no QA, validador identificado e compromisso da caixa de entrada, registrando
      conflitos em `specs/011-jira-confluence-organization/evidence/responsibility-review.md`.
- [x] T015 [US2] Após T019 e T009–T010, aplicar somente atribuições e eventuais transições
      comprovadas e aprovadas, sem herança do pai nem conclusão automática por merge, em
      `specs/011-jira-confluence-organization/evidence/responsibility-results.md`.
- [x] T016 [US2] Relê-se cada alteração de T015 e verificar campos de executor, QA, perguntas e
      status, registrando lacunas não resolvidas em
      `specs/011-jira-confluence-organization/evidence/workflow-results.md`.

## Fase 5 — US4: revisar antes de aplicar (P1)

**Objetivo:** prévia concreta com controle de concorrência e resultado rastreável. **Validação
independente:** manifesto mostra todos os campos antes/depois, dependências e evidências; simulação
com snapshot divergente impede escrita e reexecução não duplica criação.

- [x] T017 [US4] Após T007–T008, T014 e T021–T024, consolidar manifesto por operação com ID estável,
      alvo, campo, antes/depois, evidência, dependência e estado em
      `specs/011-jira-confluence-organization/evidence/change-manifest.md`.
- [x] T018 [US4] Conferir cobertura do manifesto e simular localmente conflito de updated/versão,
      resposta perdida e reexecução, sem chamadas de escrita, em
      `specs/011-jira-confluence-organization/evidence/preflight-validation.md`.
- [x] T019 [US4] Apresentar manifesto e corpos finais ao usuário, registrar revisão e alcance
      autorizado em `specs/011-jira-confluence-organization/evidence/preview-review.md`; se faltarem
      decisões, manter operações afetadas pendentes sem presumir aprovação.
- [x] T020 [US4] Após operações autorizadas de US1/US2/US3, reconciliar IDs do manifesto com
      releituras, falhas e bloqueios, diferenciando aplicado de verificado em
      `specs/011-jira-confluence-organization/evidence/application-summary.md`.

T019 é a condição para toda escrita remota. T017 aguarda apenas a preparação de US3, não sua
publicação. Não há dependência circular. Alteração do conteúdo aprovado exige revisão proporcional
da operação afetada, sem pedir novamente autorização para operações já aprovadas e inalteradas.

## Fase 6 — US3: encontrar decisões e propostas (P2)

**Objetivo:** Confluence útil à equipe, com sugestões e funcionalidades previstas distintas.
**Validação independente:** árvore e corpos preparados permitem localizar cada assunto; após
publicação, IDs/versões/links confirmam preservação das páginas e ausência de cópias normativas
concorrentes.

- [x] T021 [US3] Preparar árvore antes/depois de visão, previstas, sugestões, guias, decisões,
      referência técnica e Banco de Consulta da I.A., reutilizando páginas equivalentes em
      `specs/011-jira-confluence-organization/evidence/confluence-structure-proposal.md`.
- [x] T022 [P] [US3] Preparar corpos finais para página conjunta CAASSH/Portal e sugestão RH,
      preservando vínculo de origem e regra de mover a mesma sugestão aprovada em
      `specs/011-jira-confluence-organization/evidence/product-pages-proposal.md`.
- [x] T023 [P] [US3] Conciliar Regras e Skills/Ferramentas/Tecnologias com fontes vigentes e
      propostas não integradas, manter acesso pelo Banco e referência técnica única para equipe em
      `specs/011-jira-confluence-organization/evidence/technical-pages-proposal.md`.
- [x] T024 [US3] Preparar revisão da página 7143436 com decisões Clarify e modelos, sem histórico
      duplicado quando versões são visíveis, em
      `specs/011-jira-confluence-organization/evidence/organization-page-proposal.md`.
- [ ] T025 [US3] Após T019, reler versão/rascunho, aplicar árvore e corpos aprovados sem recriar
      páginas existentes e verificar ID/pai/corpo/links antes de permitir transferências Jira em
      `specs/011-jira-confluence-organization/evidence/confluence-results.md`.
- [ ] T026 [US3] Validar navegação para equipe e Banco, versões visíveis, ausência de cópias
      concorrentes e distinção prevista/sugestão/implementada em
      `specs/011-jira-confluence-organization/evidence/confluence-validation.md`.

## Fase 7 — Fechamento transversal

- [ ] T027 Validar JQL de visão ativa separada do contrato e, dentro da prévia aprovada, salvar sem
      modificar filtro compartilhado; confirmar que labels vazias continuam incluídas em
      `specs/011-jira-confluence-organization/evidence/active-view-results.md`.
- [ ] T028 Após T020 e T027, executar cenários aplicáveis de
      `specs/011-jira-confluence-organization/quickstart.md` e conferir SC01–SC06, preservação de
      histórico e zero atribuições sem evidência em
      `specs/011-jira-confluence-organization/evidence/final-validation.md`.
- [x] T029 Atualizar ações efetivas, decisões e pendências sem transcrição em
      `docs/history/reorganizacao-jira-confluence-2026-10-01.md`, distinguindo aplicação,
      implementação e homologação.
- [ ] T030 Conferir formatação, links, Git e sincronização final; registrar entrega e limitações em
      `specs/011-jira-confluence-organization/evidence/final-validation.md` e retirar apenas a nota
      de execução concluída do caderno da principal `docs/agentcache.md`.

## Dependências e ordem operacional

```text
T001 → T002 → (T003 || T004 || T005)
Base → US1 preparação T006–T008
Base → US2 preparação T012–T014 (T014 aguarda T007)
Base → US3 preparação T021–T024
Preparações → US4 T017 → T018 → T019
T019 → US1 T009 → T010 → US2 T015 → T016
T019 → US3 T025 → T026
T009 + T025 → US1 T011
T011 + T016 + T026 → US4 T020
T020 → T027 → T028 → T029 → T030
```

Dentro dos intervalos, executar em sequência salvo paralelismo explícito. As histórias são
verificáveis por suas evidências; a aplicação completa compartilha a revisão de US4. Conversão
indisponível, autoria incerta ou rascunho desconhecido bloqueia só a operação e dependentes.
Registrar bloqueio em vez de marcar tarefa concluída sem cumprir seu critério.

## Oportunidades de paralelismo

- Base: T003, T004 e T005 leem fontes distintas e escrevem arquivos distintos.
- US1: T006–T008 são sequenciais; preparação pode coexistir com T012/T013 e T021.
- US2: T012 e T013 podem correr juntas; T014 consolida depois.
- US3: após T021, T022 e T023 podem correr juntas; T024 conclui o pacote.
- US4: T017–T019 são sequenciais; após revisão, operações em sistemas distintos podem avançar
  independentemente, respeitando o vínculo T025→T011. Não paralelizar escritas no mesmo
  ticket/página.

Essas possibilidades não são ordem para criar agentes; dependem de autorização/instruções
aplicáveis.

## Estratégia incremental e cobertura

MVP sugerido: base + preparação US1 (T006–T008), entregando classificação e textos concretos dos
tickets sem escrita remota. Completar preparações US2/US3 e revisão US4 antes de aplicar o conjunto.
Publicar por dependência, confirmar resultado e só então prosseguir; nunca presumir aplicação
integral.

| Requisitos | Tarefas principais                      |
| ---------- | --------------------------------------- |
| FR01–FR03  | T003, T006–T011                         |
| FR04       | T007, T009, T027                        |
| FR05       | T011, T025, T027                        |
| FR06–FR07  | T013–T016                               |
| FR08       | T008, T014, T022                        |
| FR09       | T004, T021–T026                         |
| FR10       | T007, T022–T024                         |
| FR11       | T008, T010                              |
| FR12       | T017–T020 e releitura em cada aplicação |

30 tarefas: US1 6; US2 5; US4 4; US3 6; preparação/base 5; fechamento 4. Validações operacionais
acompanham as entregas; nenhuma suíte de testes de aplicação é criada.

## Checkpoint de implementação — 01/10/2026

Complemento de 02/10/2026:

- [x] T036 Publicar inventário e coordenação em 17 tickets, preservando critérios e estados.
- [x] T037 Atualizar as duas páginas Confluence e conferir versão 5.
- [x] T038 Atualizar documentação e encaminhamento das instâncias; conferir leitura posterior.

- [x] T039 Auditar os quatro repasses finais, pontas Git, PRs e CI; mapear entrega/execução/próximos
      passos nos tickets existentes, criar somente a decisão ausente e definir ordem de merge.
      Resultado em [auditoria](evidence/merge-readiness-2026-10-02.md); sem merge ou QA humano.
- [ ] T040 Remover somente os vínculos Blocks históricos10050/10051 de avisos por e-mail para os
      recortes administrativos40/41 quando houver operação nativa disponível; preservar dependência
      do serviço de e-mail para42/45. Descrições corrigidas, conector sem delete e Chrome
      indisponível.

Evidência: [publicação das frentes](evidence/worktree-publication-2026-10-02.md). Essas tarefas não
encerram as pendências anteriores de capacidade.

24/30 concluídas. Aplicação autorizada explicitamente por “Aplique as mudanças”. 123/127 operações
verificadas; quatro operações representam três pendências: tipo/pai de CAAB-20, índice do
Banco3244094 com edição ativa e salvamento do filtro sem ferramenta disponível.
T009/T025/T026/T027/T028/T030 permanecem abertas por essas limitações e fechamento dependente.
T010/T011/T015/T016 concluídas para recursos independentes, conforme contrato de falhas; conversão
do20 não bloqueou criações/atribuições nem páginas de produto. T020 registra todos os resultados,
inclusive bloqueados. Nenhuma criação deve ser repetida. Resultado em
[evidence/application-summary.md](evidence/application-summary.md).
