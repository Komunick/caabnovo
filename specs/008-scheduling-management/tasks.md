# Tasks: Agendamentos externos — incremento 2C

**Data:** 24/09/2026. **Branch documental:** `codex/scheduling-market-research-20260923`.
**Entrada:** [spec](spec.md), [plan](plan.md), [modelo](data-model.md),
[contrato externo](contracts/channels.md), [contrato administrativo](contracts/admin.md),
[pesquisa](research.md) e [validação](quickstart.md).
**Lista deste incremento:** T040–T077, todas pendentes. Nenhuma implementação iniciada.
Geração documental orientada por speckit-tasks; setup local indisponível, sem execução integral do workflow.

## Escopo, rastreabilidade e condição de execução

As 38 tarefas detalham **US3 (P2), somente recorte 2C**. Não criam histórias novas nem incluem
avaliações, turmas, pagamentos, lista de espera, portal de parceiros ou outras expansões de US3.
Planejamento autorizado não constitui autorização de implementação, envio, migração real ou corte.
Testes são exigidos pelos critérios 2C-SC e pela constituição para agenda, autorização e UI.

T022 continua como coordenação do contrato/acesso/interface: T041/T043/T046/T047/T049/T070/T073
produzem suas evidências, sem marcá-la concluída antecipadamente.
A parcela transacional de T023 é detalhada por T044/T050/T067–T069; avaliações e demais expansões
continuam fora deste recorte. T024 depende de T042/T077; massa sintética não comprova inventário real.
Não executar novamente tarefas históricas concluídas nem contar coordenação e execução duas vezes.

**Gates factuais:** transição das contas existentes, reservas legadas, guia visual e homologação dos
provedores selecionados ainda precisam de evidência. Cada gate tem tarefa e saída abaixo. Seleção
atual de tecnologia pode avançar; preservar identidade/histórico não exige o login antigo. Sem
evidência, registrar impedimento de ativação/corte; não apresentar simulação como homologação.
Tarefas de consumidores externos dependem da spec própria prevista em 002 UI01/UI02.

Caminhos marcados **novo** são destinos propostos, não arquivos existentes. Migrações são a exceção:
T045 deve conferir o próximo número livre e registrar o caminho SQL exato antes de T048; não fixar
0028, já citado na entrega do ciclo de vida. Confirmar a base integrada e dependências administrativas
em T040, sem copiar alterações antigas automaticamente.

## Checkpoint de pesquisa — 25/09/2026

Diretriz posterior do usuário incorporada: reformular com práticas e opções atuais, mantendo dados
individuais e histórico. Comparativo e recomendações em [research.md](research.md#reformulação-orientada-pelo-mercado--25092026).
T041/T044 incluem seleção moderna; tecnologia do legado não é critério obrigatório. Pesquisa
não conclui homologação, contratação ou tarefas de implementação.

Avanço parcial de T041/T042/T044, sem marcar tarefas concluídas: código do legado e fluxo
individual de login localizados; diferenças de status/autoria/vínculo em
[legacy-parity.md](legacy-parity.md). Testes de T046/T049 devem negar token intermediário e
IDs de ator impostados; T042/T045/T077 devem preservar estados legados ambíguos, contagem
desconhecida e fuso verificado. Não mapear reject ou EDITED automaticamente.
SMTP/worker são referências reutilizáveis; cliente Evolution conversacional não prova
transporte transacional pronto. T044/T069 devem selecionar provedor adequado, correlação/recibos,
timeout incerto e reenvio seguro conforme [pesquisa](research.md).
Guia visual, versão publicada, inventário real e homologação ainda pendentes.

## Phase 1 — Setup e fechamento das dependências

**Saída:** fontes e contratos verificáveis, sem decisão de negócio reaberta por falta de acesso.

- [ ] T040 Conferir branch/worktree, versões integradas e estado de AC/BEN/BLQ/LC/CAL em
      `specs/008-scheduling-management/evidence/tasks-2026-09-24.md`; resolver a correspondência
      de T027–T034 com os pré-requisitos reais e registrar dependências ainda abertas. Exportação
      T035–T038 é independente de 2C; não repetir código já integrado nem usar CI antigo como
      prova de autorização, capacidade ou pendências novas.
- [ ] T041 Selecionar solução atual de identidade/sessão e planejar transição das contas app/site em
      `specs/008-scheduling-management/contracts/channels.md`, coordenando
      `specs/005-members-management/contracts/members.md` e UI01/UI02. Comparar Better Auth/Clerk
      pela pesquisa e justificar escolha; avaliar passkey opcional, primeiro acesso e recuperação
      sem instituir MFA obrigatório. Fechar transporte, caminhos HTTP versionados, revogação,
      proteção de origem/CSRF e limites; provar continuidade identidade→pessoa e web/iOS/Android.
      Nova credencial/sessão não cria novo associado. Não copiar credenciais ou reutilizar sessão
      administrativa. Fonte inacessível mantém gate de transição aberto, sem impedir comparação.
- [ ] T042 Inventariar fonte/data/versão, contas, reservas futuras/histórico, status e contadores
      verificáveis em `specs/008-scheduling-management/legacy-parity.md`; especificar
      correspondências, duplicatas, coexistência, único escritor, corte e retorno em
      `specs/008-scheduling-management/plan.md`. Desconhecido não significa zero; não importar,
      alterar dados reais ou escolher estratégia sem evidência e autorização de execução.
- [ ] T043 Localizar e ler `docs/caab-design.md`; vincular a spec própria de 002 UI01/UI02 aos
      critérios de agenda em `specs/008-scheduling-management/plan.md`. Registrar caminhos reais
      dos consumidores e responsabilidades antes de planejar layout ou editar UI; não criar uma
      segunda interface de associado dentro do painel para contornar essa dependência.

## Phase 2 — Foundational

**Dependências:** Setup concluído, pré-requisitos administrativos de T040 comprovados.
**Saída:** contratos e persistência que protegem ambos os modos, autoria e eventos.

- [ ] T044 Selecionar provedores atuais por canal com justificativa de custo total, suporte,
      portabilidade e compatibilidade conforme pesquisa; não obrigar SMTP/Evolution do legado.
      Fechar textos/templates dos quatro eventos e política finita de tentativas,
      backoff, timeout, resultado incerto, redrive autorizado e retenção operacional em
      `specs/008-scheduling-management/contracts/channels.md`, conforme
      `specs/001-project-foundation/contracts/jobs.md`. Inventariar preferências/supressões
      antigas, contatos válidos e permissão/opt-out do WhatsApp, separados da preferência inicial
      ativa. Definir autenticação/deduplicação dos callbacks e eventos fora de ordem; considerar
      vigência das tarifas. Não contratar, enviar ou ativar campanhas nesta tarefa.
      Documentar dependência externa quando não houver evidência; não aceitar defaults implícitos.
- [ ] T045 Detalhar modelo físico e protocolo único de locks em
      `specs/008-scheduling-management/data-model.md`: revisão publicada/rascunho, políticas,
      ocupação, processo/proposta, autoria externa, equipe, bloqueio e intenção de aviso.
      Definir constraints por modo, exclusão global por beneficiário incluindo pendências,
      unicidade de processo/proposta e contagem <= 2; confirmar sequência em
      `packages/db/migrations/` e registrar nomes SQL exatos em plan/tasks antes de T048.
      Provar estratégia aditiva sem reescrever 0020/0028 ou zerar contadores desconhecidos.
- [ ] T046 [P] Escrever testes de contratos em
      `packages/contracts/src/scheduling-channels.test.ts` (novo): projeções mínimas, enums,
      datas/fuso, paginação, corpo limitado, versões, erros, idempotência e negação de
      papel/causa/contador impostos pelo cliente. Cobrir nulidade de profissional/horário conforme
      modo/estado e compatibilidade dos consumidores administrativos. Executar antes da implementação.
- [ ] T047 Implementar schemas v1 em `packages/contracts/src/scheduling-channels.ts` (novo),
      exportar em `packages/contracts/src/index.ts` e conciliar
      `packages/contracts/src/scheduling.ts` com T041/T045/T046. Distinguir reserva, processo,
      proposta e entrega; histórico/autor não se confundem com beneficiário.
- [ ] T048 Criar as migrations aditivas cujos nomes foram registrados em T045, dentro de
      `packages/db/migrations/`, e alinhar `packages/db/src/schema.ts` quando aplicável.
      Validar upgrade, constraints, autoria e compatibilidade em banco descartável; diagnosticar
      conflitos existentes e parar sem alterar reservas para fazer a migration passar.
      Não aplicar ao banco de uso nem registrar aprovação por simples geração de SQL.
- [ ] T049 Implementar fronteira externa em
      `apps/web/modules/scheduling/channel-access.ts` (novo), com resolução do adaptador
      verificado em T041 e vínculos de `packages/db/src/repositories/members.ts`.
      Criar `apps/web/tests/integration/scheduling-channel-access.test.ts` (novo) antes das
      guardas: titular por si/dependente vigente, dependente por si, sessão/vínculo revogado
      durante lock/replay, terceiro e acesso administrativo separado; negar por padrão.
- [ ] T050 Implementar persistência transacional de eventos/intenção em
      `apps/web/modules/scheduling/notification-service.ts` (novo), usando jobs da fundação;
      preparar `apps/web/tests/integration/scheduling-notifications.test.ts` (novo).
      Evento e intenção sobrevivem juntos; falha/retry não duplica, payload contém IDs mínimos,
      chamada externa fica fora da transação. Não criar infraestrutura paralela de filas.

## Phase 3 — US3 (P2): reserva e gestão externas, recorte 2C

**Objetivo:** associado encontra a oferta, reserva para beneficiário autorizado, acompanha,
remarca/cancela e recebe os avisos devidos; a equipe opera a mesma agenda no painel.
**Aceite independente:** fixtures sintéticas de titular/dependente, equipe/backup, ambos os
modos de agenda e aceitação; executar V01–V12, com PostgreSQL real descartável para concorrência.
Simulação valida o domínio, mas não conclui identidade/provedor/cliente real.

### Oferta publicada e disponibilidade

- [ ] T051 [P] [US3] Escrever
      `apps/web/tests/integration/scheduling-publication.test.ts` (novo) para Salvar/Publicar e
      suas variantes de edição: mesmo ID, rascunho isolado, publicação conjunta, conflito/retry,
      configuração inválida e agenda válida esgotada; reservas existentes e bloqueios continuam
      protegidos. Referências: 2C-FR-01/19/25; 2C-SC-03/18/24.
- [ ] T052 [US3] Implementar salvar/publicar revisão em
      `apps/web/modules/scheduling/catalog-service.ts`, com versões e transação; usar a mesma
      revisão externa em app/site e invalidar projeções após commit. Ativo não implica publicado,
      rascunho não afeta vagas/comandos e erro conserva a publicação anterior. Atender T051.
- [ ] T053 [US3] Implementar catálogo público mínimo, beneficiários autorizados e ofertas
      elegíveis em `apps/web/modules/scheduling/channel-query-service.ts` (novo), usando
      `apps/web/modules/scheduling/beneficiary-service.ts`. Sem vagas anônimas ou cache privado
      compartilhado; público exclusivo é avaliado pela pessoa atendida. Referências:
      2C-FR-01/02/25; 2C-SC-03/24.
- [ ] T054 [P] [US3] Escrever `apps/web/modules/scheduling/channel-policy.test.ts` (novo) para
      profissional específico/qualquer/controle desativado, modo capacidade, inexistência de
      expediente, prazos independentes e horizonte; 0/2h/24h/90dias, fronteiras exatas e fuso.
      Testar políticas alteradas entre prévia e envio sem invalidar pendências anteriores.
      Referências: 2C-FR-08/13–16; 2C-SC-07/12–15.
- [ ] T055 [US3] Adequar `apps/web/modules/scheduling/availability-service.ts`,
      `apps/web/modules/scheduling/availability.ts` e
      `apps/web/modules/scheduling/hours-service.ts` aos dois modos e à revisão publicada.
      Revalidar após lock com relógio do servidor; contar toda duração [início,fim), pendências
      e beneficiário global; não usar fallback de profissional indisponível para capacidade.
      Profissional atribuído é apresentado antes do envio e nunca substituído silenciosamente.

### Reserva, remarcação e recuperação

- [ ] T056 [P] [US3] Escrever `apps/web/tests/integration/scheduling-channel-booking.test.ts`
      (novo): criação imediata/manual, autorização/público-alvo, 20 disputas por profissional,
      capacidade 1 e 3, beneficiário global, adjacência, falha e 20 retries; uma única ocupação
      por vencedor. Referências: 2C-FR-02/03/14/25; 2C-SC-01/02/03/13/24.
- [ ] T057 [US3] Adequar `apps/web/modules/scheduling/booking-service.ts` para criação pelos
      canais e painel sobre a mesma ocupação, com estados explícitos, política por serviço,
      autoria externa, idempotência/auditoria e intenção de aviso. Pendência ocupa vaga sem
      confirmar nem expirar; passagem do tempo não gera presença/falta. Atender T056.
- [ ] T058 [P] [US3] Escrever `apps/web/tests/integration/scheduling-channel-reschedule.test.ts`
      (novo): liberar origem/reter só destino, terceiro ocupando origem, rollback inicial,
      substituir/retirar/recusar/retomar, 0+1 → 1+0 → 1+1 → 2+0 e terceira troca negada.
      Cobrir aprovação após início original com destino futuro, destino passado negado e ambas
      as modalidades. Referências: 2C-FR-04/08/10/11/17/18; 2C-SC-05/07/09/10/16/17.
- [ ] T059 [US3] Implementar ciclo/propostas em
      `apps/web/modules/scheduling/reschedule-service.ts` (novo), usando a transação/locks
      comuns de T045. Envio válido libera origem e retém só destino; substituir conserva destino
      anterior em falha; retirar/recusar não restaura origem. Retomada mantém ID/ciclo mesmo
      após origem, sem prazo de nova reserva/24h da origem. Contar apenas ciclo confirmado,
      mantendo utilização reservada e confirmadas + reservada <= 2. Atender T058.
- [ ] T060 [US3] Implementar aprovação/recusa versionadas em
      `apps/web/modules/scheduling/approval-service.ts` (novo), com equipe/backup autorizados,
      destino futuro, elegibilidade e proposta vigente. Aprovar mantém ocupação e consolida
      uso voluntário uma vez; recusa inicial termina pedido, recusa de troca mantém mesmo
      registro aguardando escolha. Não reaplicar horizonte reduzido a proposta recebida antes.
      Cobrir concorrência em T056/T058, inclusive cancelamento e revogação.
- [ ] T061 [US3] Implementar cancelamento em
      `apps/web/modules/scheduling/booking-service.ts` e ampliar
      `apps/web/tests/integration/scheduling-channel-booking.test.ts`: confirmado/pedido novo
      pendente antes do início, sem prazo mínimo/equipe; exatamente no início é negado.
      Pedido cancelado sai da fila/alertas, libera só sua vaga, preserva ID/histórico/contador e
      avisa. Troca pendente e registro sem horário seguem suas guardas específicas; replay
      autorizado após início retorna resultado original e disputa com decisão não reativa.
      Referências: 2C-FR-09/10/18/20; 2C-SC-08/09/17/19.
- [ ] T062 [P] [US3] Escrever `apps/web/tests/integration/scheduling-provider-recovery.test.ts`
      (novo) com 0/1/2 trocas usadas, ambos os modos, origem passada, causa forjada, falta de
      permissão, falha/concorrência e alternativas recusadas; comprovar bloqueio efetivo,
      preservação de terceiros e zero cobrança. Referências: 2C-FR-20; 2C-SC-19.
- [ ] T063 [US3] Implementar ocorrência e recuperação em
      `apps/web/modules/scheduling/provider-recovery-service.ts` (novo), coordenada com
      `apps/web/modules/scheduling/hours-service.ts` e `reschedule-service.ts`.
      Registrar indisponibilidade efetiva e retirar confirmação/ocupação atomicamente;
      recuperação isenta no mesmo ID, sem impor hora/alterar terceiros, aviso devido e contador
      preservado. Nova troca voluntária após confirmar volta às regras usuais. Atender T062.

### Operação, histórico e comunicação

- [ ] T064 [P] [US3] Escrever `apps/web/modules/scheduling/approval-queue.test.ts` (novo):
      remarcações antes de pedidos novos, origem mais próxima, desempate envio/ID; urgência
      pelo destino e atraso pela entrada em análise, 24h e limites adjacentes, configuração,
      desativação de atraso, fim dos alertas após decisão e nenhuma transição automática.
      Referências: 2C-FR-07/21/22; 2C-SC-06/20/21.
- [ ] T065 [US3] Implementar fila paginada em
      `apps/web/modules/scheduling/approval-queue-service.ts` (novo) e estender
      `apps/web/modules/scheduling/access.ts` para vínculo operacional de equipe sob permissões
      existentes, sem concessão implícita. Aplicar a mesma ordenação no servidor/paginação;
      registrar atuação principal/backup, idade e alertas independentes. Ampliar
      `apps/web/tests/integration/scheduling-channel-access.test.ts` para disputas/revogação.
- [ ] T066 [US3] Implementar listagem/detalhe/histórico autorizados em
      `apps/web/modules/scheduling/channel-query-service.ts` e projeção para histórico individual
      em `apps/web/modules/scheduling/booking-service.ts`. Não ocultar registros aguardando
      nova data quando origem passou; conservar autor e beneficiário distintos, LC/bloqueios
      atuais e histórico append-only. Testar em
      `apps/web/tests/integration/scheduling-channel-access.test.ts`; integrar à fronteira
      existente de 002 sem criar histórico/contas de compras. Referências: FR-04/12; SC-01/03/11.
- [ ] T067 [P] [US3] Ampliar `apps/web/tests/integration/scheduling-notifications.test.ts`:
      quatro eventos/três meios, titular/dependente independentemente do autor, preferências
      distintas, vínculo revogado antes de envio/retry, ausência de contato, falha/resultado
      incerto e deduplicação. Sem confirmação falsa de pendência ou reversão da reserva.
      Referências: 2C-FR-23/24; 2C-SC-22/23.
- [ ] T068 [US3] Implementar preferências pessoais e avisos internos em
      `apps/web/modules/scheduling/notification-service.ts` e schemas de T047; aplicar padrão
      dos três meios somente conforme conciliação de T044, sem apagar supressões antigas.
      Resolver destinatários pelo beneficiário/vínculo atual, permitir edição pessoal
      versionada no app e preservar consulta de estado/histórico com avisos desligados.
- [ ] T069 [US3] Implementar handler em
      `apps/worker/src/jobs/scheduling-notifications.ts` (novo), integrado ao bootstrap
      `apps/worker/src/main.ts`, registro permitido em `apps/worker/src/queues.ts` e jobs existentes.
      Validar envelope versionado/IDs e revalidar pessoa/vínculo/preferências/contato
      imediatamente antes de cada envio/reenvio; usar correlação e reconciliação para resultado
      incerto, tentativas finitas e redrive auditado de T044. Validar falhas sintéticas em
      `apps/worker/src/jobs/scheduling-notifications.test.ts` (novo); prova real de entrega só em
      ambiente/contatos autorizados. Não ativar campanhas bloqueadas ou prometer exactly-once.

### Contratos HTTP e integração das experiências

- [ ] T070 [US3] Vincular todas as operações de `contracts/channels.md` em
      `apps/web/modules/scheduling/http/channel-routes.ts` (novo) e rotas versionadas cujo
      caminho exato foi fechado por T041. Criar
      `apps/web/modules/scheduling/http/channel-routes.test.ts` (novo) antes da vinculação:
      autorização, entrada inválida, versão/replay, limite de corpo/página, não cachear privado,
      isolamento entre público/associado/equipe e compatibilidade administrativa.
- [ ] T071 [US3] Integrar gestão de políticas/equipe, fila/decisão/recuperação e publicação em
      `apps/web/modules/scheduling/ui/`, preservando componentes e navegação existentes.
      Rótulos Salvar/Publicar e Salvar alterações/Publicar alterações, cada descrição sempre
      visível abaixo do botão e acessível; erro preserva edição e estado real. Caminhos de
      componentes concretos devem constar do mapeamento de T043 antes de editar. Cobrir
      `apps/web/tests/e2e/scheduling.spec.ts` com teclado/390px/temas e guia CAAB.
- [ ] T072 [US3] Especificar o encaixe verificável dos consumidores de 002 UI01/UI02 em
      `specs/008-scheduling-management/contracts/channels.md`: beneficiário primeiro,
      profissionais condicionais, revisão, aviso da liberação da origem, situação manual,
      contagem confirmada/em andamento, recuperar/cancelar, preferências e histórico.
      Conservar caminhos/IDs da spec própria definida em T043 e seus testes; não duplicar
      tarefas de construção da interface externa dentro de 008.
- [ ] T073 [US3] Validar consumo por app/site/painel e revisão única em
      `apps/web/tests/integration/scheduling-channel-contract.test.ts` (novo), com clientes
      sintéticos identificados; registrar compatibilidade da interface real de UI02 em
      `specs/008-scheduling-management/evidence/channels-validation.md` (novo).
      Exigir mesma reserva/estado/histórico e revisão publicada após recarga em ambos os canais;
      cliente sintético sozinho não conclui a integração real. Referências: SC-01/03/04/18/24.

## Phase 4 — Polish e saída

- [ ] T074 Executar matriz concorrente completa V01–V12 de
      `specs/008-scheduling-management/quickstart.md` no PostgreSQL descartável, incluindo
      20 envios/retries, capacidade 1/3, recurso/beneficiário global, clocks após lock, vínculos/
      políticas concorrentes, rollback e versões. Registrar commit, casos e resultados em
      `specs/008-scheduling-management/evidence/channels-validation.md`; zero testes encontrados
      ou suite histórica não é aprovação.
- [ ] T075 [P] Validar jornada real de UI01/UI02 e painel por teclado, 390px, temas, foco,
      mensagens e contraste conforme WCAG 2.2 AA e `docs/caab-design.md`; registrar capturas,
      negações, perda de sessão, conflitos e decisões por ambos os canais em
      `specs/008-scheduling-management/evidence/channels-ui-validation.md` (novo). Exige clientes
      implementados na spec responsável, não só contratos/simulações.
- [ ] T076 Executar gates da stack e revisão específica de autorização, privacidade, agenda,
      jobs, migrations e auditoria; verificar p95 <= 2s das telas comuns com massa/ambiente/
      amostra documentados, sem aplicar alvo a entrega de provedor. Registrar resultados e
      limitações em `specs/008-scheduling-management/evidence/channels-validation.md`.
      Rodar formatação documental explícita dos arquivos alterados, lint/types/testes/build/
      segurança aplicáveis; não repetir CI só por documentação ou reativar localhost.
- [ ] T077 Ensaiar upgrade/retorno compatíveis com dados sintéticos e concluir reconciliação
      de integração/inventário em `specs/008-scheduling-management/legacy-parity.md`,
      `specs/008-scheduling-management/plan.md` e
      `specs/008-scheduling-management/evidence/channels-validation.md`.
      Registrar pré-condições, único escritor, IDs/contadores preservados, sinais de falha e
      rollback sem perda; prova real de acesso/entrega e revisão humana específica são gates.
      Preparar resultado revisável; ativação/corte, PR e merge dependem de autorização própria.

## Dependências e ordem

T040–T043 → T044–T050 → US3/T051–T073 → T074–T077.
Na fundação: T041 → T046 → T047; T045 → T048; T047/T048 → T049/T050.
Testes de cada grupo antecedem seu código. Dentro de US3, oferta → vagas → criação →
troca/decisão/cancelamento → recuperação → fila/histórico/avisos → HTTP/integração.
T068 → T069; T044 bloqueia adaptador/entrega; T041 bloqueia acesso real;
T043/UI01 bloqueiam UI e UI02 bloqueia homologação dos consumidores.
T042 bloqueia conclusão da transição/corte; não autoriza banco real.
AC/BEN/BLQ são dependências técnicas a conciliar em T040, não novas entregas duplicadas.

T048 e T070 só iniciam quando T045/T041 tiverem registrado os caminhos concretos faltantes.
Essa condição é explícita: a lista está gerada, mas ainda não está toda liberada para execução.

## Paralelismo seguro

[P] indica trabalho em arquivo próprio após os pré-requisitos comuns, não autorização para
iniciar agentes. T046 pode ser preparado junto de T044/T045, após Setup, pois muda arquivo distinto.
Em US3, os testes T051/T054/T056/T058/T062/T064 podem ser preparados em paralelo com contratos/
modelo estáveis; implementações que compartilham booking-service, access, contratos ou migrations
seguem em sequência. T067 depende da base de testes criada em T050, mas não dos demais testes de
US3. T075 pode executar junto de T074 com ambientes e relatórios separados; T076 reúne as evidências. Não editar o mesmo arquivo simultaneamente.

## Estratégia incremental

Primeiro marco: publicação e primeira reserva imediata/manual com identidade, autoria, ocupação
e avisos devidos comprovados em ambiente sintético. É validação interna, não lançamento parcial.
Segundo: ciclo completo de troca/cancelamento/recuperação e operação da equipe.
Terceiro: consumidores reais, comunicação e transição homologados.
MVP externo conserva todo o recorte 2C aceito; não omitir remarcação, cancelamento, histórico ou
canais acordados para antecipar publicação. Não executar implementação sem sua autorização.

## Cobertura dos requisitos de 2C

Todas as referências FR/SC desta tabela usam o prefixo 2C. T074–T077 consolidam as evidências;
cobertura documental não significa teste aprovado.

| Requisitos | Tarefas principais | Critérios |
| --- | --- | --- |
| FR-01/02 | T041/T047/T049/T053/T070/T073 | SC-01/03 |
| FR-03 | T045/T048/T056/T057/T060 | SC-01/02 |
| FR-04 | T058/T059/T061/T066 | SC-05/08/11 |
| FR-05 | T046/T057/T060/T074 | SC-16 |
| FR-06 | T042/T077 | Inventário/compatibilidade e retorno; sem SC numérico exclusivo |
| FR-07 | T064/T065 | SC-06 |
| FR-08 | T054/T055/T058/T059 | SC-07 |
| FR-09 | T061 | SC-08 |
| FR-10 | T058/T059 | SC-09 |
| FR-11 | T045/T048/T058/T059/T060 | SC-10 |
| FR-12 | T066/T073 | SC-11 |
| FR-13 | T054/T055/T071/T072 | SC-12 |
| FR-14 | T045/T048/T054–T057/T074 | SC-13 |
| FR-15/16 | T054/T055/T060 | SC-14/15 |
| FR-17 | T058/T060 | SC-16 |
| FR-18 | T058/T059/T061 | SC-17 |
| FR-19 | T051/T052/T071/T073 | SC-18 |
| FR-20 | T061/T062/T063/T067 | SC-19 |
| FR-21 | T049/T060/T064/T065 | SC-20 |
| FR-22 | T064/T065/T071 | SC-21 |
| FR-23/24 | T044/T050/T067–T069/T072 | SC-22/23 |
| FR-25 | T047/T049/T053/T055/T060/T072 | SC-24 |
| Acessibilidade/UX | T043/T071–T073/T075 | SC-04 |

## Listas administrativas e históricas preservadas

Os itens abaixo conservam estado/evidências e pendências próprias; não são o plano ativo de 2C.
T025–T039 exigem conciliação por T040, especialmente acesso/conflitos e numeração SQL.

<details>
<summary>Recortes anteriores: preservar IDs, estados e evidências</summary>

### Lista administrativa de 21/09/2026 — acesso, integridade por pessoa e exportação

**Input:** [spec](spec.md), [plan](plan.md), [research](research.md), [modelo](data-model.md),
[contrato](contracts/exports.md), [quickstart](quickstart.md). **Branch da entrega:**
`docs/project-clarify-20260921`. Nenhuma tarefa nova executada. **Lista administrativa desta seção:** T025–T039; testes
foram pedidos nas specs e nos gates do projeto. Caminhos novos são destinos planejados; conferir
referências contra o inventário de artefatos deste incremento antes de editar. Nenhum arquivo de
código foi criado agora.

## Rastreabilidade e escopo

AC01–AC03/BEN01–BEN03: US1; BLQ01/BLQ02: US2; exportação: US4. CAL06 continua verificação de
evidências, mas PR34 já integrado não pode receber edição; registrar revisão no ciclo atual. US3
futura não inicia automaticamente.

O histórico abaixo conserva marcadores e evidências originais. IDs provisórios detalhados aqui não
são uma segunda execução; usar a lista ativa. Pendências de política/pesquisa/homologação e funções
suspensas continuam pendentes e não são autorizadas por constarem neste arquivo. Não repetir tarefas
já concluídas.

## Setup

- [ ] T025 Conferir o catálogo real de telas/abas e filtros contra
      `specs/008-scheduling-management/contracts/exports.md`; mapear campos permitidos/defaults e
      projeções atuais, sem criar fonte ou ampliar permissão.

## Foundational

- [ ] T026 Preparar fixtures sintéticas isoladas e contratos da função em
      `apps/web/modules/scheduling/export-fixtures.ts` (novo, exclusivo de testes), com datas
      empatadas, zero resultados, texto longo, campos restritos e filtros combinados; depende dos
      schemas de 001.

## US1 — Configurar e reservar

**Objetivo/aceite independente:** Sem read não acessa; só read não muda dados; mesma pessoa em
profissionais/unidades diferentes conflita no banco, familiares distintos podem coincidir,
remarcação falha preserva original.

- [ ] T027 [US1] Atualizar fixtures e testes de acesso em
      `apps/web/tests/integration/scheduling.test.ts`, `packages/contracts/src/scheduling.test.ts` e
      `apps/web/modules/scheduling/http/routes.test.ts`; cobrir nenhum grant, read, read+write,
      write sem read e ator revogado após lock.
- [ ] T028 [US1] Aplicar concessões atuais read/write no banco em
      `apps/web/modules/scheduling/access.ts` e controles em
      `apps/web/modules/scheduling/ui/booking-form.tsx`; conferir todas as páginas/serviços/rotas do
      módulo, preservando beneficiary-service mínimo.
- [ ] T029 [US1] Adicionar diagnóstico read-only em
      `packages/db/scripts/check-scheduling-beneficiary-overlaps.sql` (novo) e testes de conflitos
      antigos em `apps/web/tests/integration/scheduling.test.ts`; se detectar pares sobrepostos,
      parar sem cancelar/alterar reserva e emitir relatório seguro para decisão explícita.
- [ ] T030 [US1] Criar exclusão GiST por member_id+intervalo [) scheduled em
      `packages/db/migrations/` (nova; registrar nome/numeração livres após inventário, sem usar 0028 já aplicado ao ciclo de vida), preservando
      constraint profissional; provar que falha integralmente com conflitos existentes e não usar
      NOT VALID.
- [ ] T031 [US1] Adequar `apps/web/modules/scheduling/booking-service.ts`,
      `apps/web/modules/scheduling/availability-service.ts` e `packages/contracts/src/scheduling.ts`
      para beneficiaryId na disponibilidade e tratamento recuperável de conflito por pessoa,
      mantendo rollback da remarcação e constraint como garantia final.
- [ ] T032 [US1] Testar corrida da mesma pessoa em profissionais/unidades diferentes,
      titular/dependentes distintos, parcial/adjacente/cancelada e rollback em
      `apps/web/tests/integration/scheduling.test.ts`; uma reserva vencedora por conflito, sem
      perder a reserva original.

## US2 — Consultar e gerenciar

**Objetivo/aceite independente:** Bloqueio próprio/titular vigente sinaliza lista/calendário/detalhe
e mantém reserva/vaga; desbloqueio remove aviso, cancelamento manual autorizado permanece.

- [ ] T033 [US2] Projetar eligibilityWarning blocked|null em lote, sem N+1, em
      `apps/web/modules/scheduling/booking-service.ts` e `packages/contracts/src/scheduling.ts`;
      reutilizar vínculos atuais de `packages/db/src/repositories/members.ts`, sem mutar
      status/versão/ocupação.
- [ ] T034 [US2] Mostrar aviso textual em lista/calendário/detalhe em
      `apps/web/modules/scheduling/ui/` e cobrir `apps/web/tests/e2e/scheduling.spec.ts`; manter
      reservas após bloqueio, negar nova/remarcação, permitir cancelamento manual e remover aviso
      após desbloqueio efetivo.

## US4 — Exportação autorizada

**Objetivo/aceite independente:** Reserva/oferta/horários exportam três formatos sem limites do
calendário; dados de beneficiário ficam na projeção autorizada.

- [ ] T035 [US4] Escrever testes do adaptador em
      `apps/web/modules/scheduling/export-adapter.test.ts` (novo): filtro+sort, columns em ordem
      pedida, campo proibido, dados completos e matriz de autorização conforme
      `specs/008-scheduling-management/contracts/exports.md`.
- [ ] T036 [US4] Implementar `apps/web/modules/scheduling/export-adapter.ts` (novo) reutilizando as
      consultas/projeções do domínio, IDs/dependências para reautorização por lote e cursor do
      núcleo 001; cobrir todos os datasets do contrato, sem ampliar acesso ou alterar dados.
- [ ] T037 [US4] Integrar ação/tela em `apps/web/app/(admin)/scheduling/exportar/page.tsx` (nova) e
      nas listas/abas existentes de `apps/web/modules/scheduling/ui/`; passar contexto/filtros,
      preservar rascunho e oferecer os três formatos com defaults e reordenação acessível.
- [ ] T038 [US4] Validar arquivos reais nos três formatos, ordem/contagem/IDs/filtros e negações em
      `apps/web/tests/integration/scheduling.test.ts` e `apps/web/tests/e2e/scheduling.spec.ts`;
      usar o parser independente do núcleo 001 e confirmar erro recuperável sem corte.

## Polish

- [ ] T039 Executar gates/testes da função no CI e registrar resultados/capturas/limites em
      `specs/008-scheduling-management/evidence/plan-2026-09-21-validation.md` (novo); marcar
      conclusão somente com evidência, preservando tarefas institucionais e históricas.

## Dependências e ordem de execução

Setup → Foundational → histórias → Polish. Dentro de cada história, contratos/testes antecedem
código e jornada; tarefas sem [P] seguem a ordem apresentada. Infraestrutura de 001 (concessões,
schemas, writers, rotas e UI) precede adaptadores/exportações dos demais specs. Migração 0025
precede0026;0027 antes de transferências; a migration de conflito do beneficiário depende do diagnóstico de conflitos e não altera dados
automaticamente. Regressões004/006 e regras008 podem avançar após catálogo/migrações mesmo antes do
núcleo de exportação. Aceite transversal002 depende das evidências das funções. Spec009 exige gate
M016. Não há dependência em retenção/P01/canais futuros para o recorte administrativo atual.

## Paralelismo por história

Após pré-requisitos, os adaptadores de domínios diferentes podem avançar em paralelo porque têm
arquivos próprios. Dentro desta função, manter testes→adaptador→UI→E2E sequencial; não dividir
edições no mesmo arquivo. [P] identifica arquivos independentes prontos após a base da fase: writers
separados em001 e relatórios de aceite em002. Para cada história sem par de arquivos independente,
não há paralelismo interno seguro; ela pode avançar junto da história equivalente de outro domínio
após as dependências. Migrações/catálogo/registro central têm um único responsável na spec001, sem
edições simultâneas.

## Estratégia incremental e MVP

Primeiro invariantes de acesso/migração e descoberta; depois fluxo completo de Relatórios usando
núcleo 001 como prova vertical (três formatos, todos os dados). Isso é marco de validação, não
redução do escopo: completar depois cada função do contrato, incluindo003/004/005/007/008 e
Colaboradores;009 permanece condicionada. Reservas Q1/Q2 seguem incremento independente008 após
permissões. Políticas adiadas, chat/suporte, CAASSH, portal e app/site não são parte do MVP.

## Histórico e backlog anterior — não executar automaticamente

<details>
<summary>Tarefas anteriores, evidências e pendências preservadas</summary>

# Tasks: Agendamentos — primeira entrega funcional

Data: 15/09/2026. Branch feature/scheduling-management-20260915. Entrada: spec.md, plan.md,
research.md, data-model.md e contracts/admin.md. **T001–T020 autorizadas em 15/09/2026.
Implementação e validação concluídas; evidências em evidence/release-review.md.** Testes
transacionais reunidos em apps/web/tests/integration/scheduling.test.ts para compartilhar o banco
descartável; jornadas US1/US2 em tests/e2e/scheduling.spec.ts. Testes exigidos pelos cenários da
spec e pelo fluxo de entrega, especialmente agenda, dados, autorização e acessibilidade. Etapas do
produto estão em roadmap.md.

## Phase 1 — Setup

## Clarificação — conflito do beneficiário, 20/09/2026

FR-016/SC-006 definidos pelo usuário no /clarify. Tarefas abaixo permanecem pendentes; esta sessão
registra a regra e não retoma implementação ou validação.

- [ ] BEN01 Diagnosticar conflitos preexistentes e preparar migration aditiva com restrição por
      beneficiário/intervalo, preservando dados e restrição profissional; resolução de dados
      existentes depende de decisão explícita.
- [ ] BEN02 Revalidar conflito do beneficiário na criação/remarcação transacional, com resposta
      recuperável na interface, distinguindo associado e cada dependente pelo identificador da
      pessoa atendida.
- [ ] BEN03 Validar concorrência, sobreposição parcial, unidades/profissionais diferentes,
      titular/dependentes independentes, canceladas, horários adjacentes e rollback da remarcação em
      banco descartável; cobrir jornada por interface e registrar evidências reais.

Ordem: BEN01 → BEN02 → BEN03. Não marcar concluído com base nos testes históricos.

- [ ] BLQ01 Aplicar FR-017 nas consultas e sinalização textual da agenda/detalhes, preservando
      reservas, ocupação e estados; coordenar regra de vínculos/bloqueio com spec 005.
- [ ] BLQ02 Validar SC-007 com titular, dependentes afetados e pessoas sem vínculo,
      criação/remarcação negadas e cancelamento manual auditado; registrar evidências de banco e
      interface.

BLQ01 → BLQ02; regra esclarecida em Q2, implementação e validação ainda pendentes.

## Calendário administrativo — autorizado em 18/09/2026

Decisão atual supera a prioridade anterior de T022. Código integrado pelo PR34. A branch original
não recebe trabalho novo; retomada na entrega vigente do mapa local, com checkpoint.md atualizado.

- [x] CAL01 Registrar escopo, pesquisa oficial, contratos, plano e estratégia de validação.
- [x] CAL02 Escrever testes de intervalo/limites/filtros/autorização e consulta de calendário.
- [x] CAL03 Implementar GET calendar limitado e autenticado, preservando listagem diária.
- [x] CAL04 Integrar FullCalendar mês/semana/dia, URL/filtros, tokens, fuso e estados acessíveis.
- [x] CAL05 Cobrir jornada real de reservas, recarga/navegação, mobile/temas e fuso no E2E.
- [ ] CAL06 Encerrar a revisão do conjunto e das evidências visuais, reconciliar documentação com o
      CI registrado e conferir a base integrada em dev. PR34 já integrado: não alterar seus
      metadados nem reutilizar sua branch. Leitura estática não conclui esta validação.

Não marcar CAL06 antes de verificações reais; atualizar checkpoint a cada fase.

- [x] T001 Conferir base/branch sem PR e validar o recorte/hipóteses com a revisão do planejamento
      em specs/008-scheduling-management/spec.md antes do código.
- [x] T002 Conciliar contratos com os padrões existentes em
      specs/008-scheduling-management/contracts/admin.md e definir próximo número de migration livre
      em packages/db/migrations/.

## Phase 2 — Foundational

- [x] T003 Criar migration aditiva de catálogo, horários, reservas, histórico e idempotência em
      packages/db/migrations/, conforme specs/008-scheduling-management/data-model.md; validar
      exclusão temporal e FKs.
- [x] T004 Definir contratos/validações de payload, paginação, versões, erros e estados em
      packages/contracts/src/scheduling.ts e exportar em packages/contracts/src/index.ts.
- [x] T005 Implementar guarda com acesso administrativo válido e proteção de mutações em
      apps/web/modules/scheduling/http/; sem concessões extras; testes em
      apps/web/tests/integration/scheduling-auth.test.ts.
- [x] T006 Implementar protocolo transacional de configurações/beneficiários, incluindo bloqueio e
      mudança de vínculos em apps/web/modules/members/ e packages/db/src/repositories/members.ts,
      com regressões concorrentes em apps/web/tests/integration/scheduling-eligibility.test.ts.

## Phase 3 — US1: configurar e reservar

Objetivo: cadastro mínimo e primeira reserva persistida. Teste independente: catálogo vazio →
configurar no painel → reservar → consultar após recarga.

- [x] T007 [P] [US1] Criar testes dos contratos e horários semanais/almoço em
      packages/contracts/src/scheduling.test.ts e apps/web/modules/scheduling/availability.test.ts
      antes dos serviços.
- [x] T008 [P] [US1] Criar testes de 20 reservas concorrentes, retry, limites adjacentes e corrida
      com alteração de expediente em apps/web/tests/integration/scheduling-create.test.ts.
- [x] T009 [US1] Implementar catálogo, habilitações, horários e proteção de alterações com reservas
      futuras em apps/web/modules/scheduling/catalog-service.ts e hours-service.ts.
- [x] T010 [US1] Implementar disponibilidade, busca mínima de beneficiários e criação
      transacional/idempotente em apps/web/modules/scheduling/availability-service.ts,
      beneficiary-service.ts e booking-service.ts.
- [x] T011 [US1] Expor catálogo, horários, vagas, beneficiários e criação autenticada em
      apps/web/app/api/v1/scheduling/ conforme contracts/admin.md.
- [x] T012 [US1] Criar formulários de oferta/horários e reserva com seleção de vaga em
      apps/web/modules/scheduling/ui/ e apps/web/app/(admin)/scheduling/; não exigir cadastro via
      banco.
- [x] T013 [US1] Validar jornada sintética de configuração/criação/recarga e erros em
      apps/web/tests/e2e/scheduling-create.spec.ts.

## Phase 4 — US2: consultar, remarcar e cancelar

Objetivo: operação da reserva existente. Teste independente com fixture sintética: localizar →
remarcar → conferir histórico → cancelar e liberar horário.

- [x] T014 [P] [US2] Criar testes de rollback da remarcação, versão desatualizada,
      idempotência/cancelamento e preservação histórica em
      apps/web/tests/integration/scheduling-manage.test.ts.
- [x] T015 [US2] Implementar listagem/detalhes, remarcação atômica e cancelamento em
      apps/web/modules/scheduling/booking-service.ts e apps/web/app/api/v1/scheduling/bookings/.
- [x] T016 [US2] Implementar lista diária paginada, filtros na URL, detalhes, ações e confirmação em
      apps/web/modules/scheduling/ui/ e apps/web/app/(admin)/scheduling/.
- [x] T017 [US2] Integrar navegação/busca e eventos humanos de auditoria em
      apps/web/modules/workspace/ e apps/web/modules/audit/, sem liberar dados de outros módulos.
- [x] T018 [US2] Validar gestão por teclado, mobile claro/escuro e estados vazios/erro em
      apps/web/tests/e2e/scheduling.spec.ts; capturas sintéticas em
      specs/008-scheduling-management/evidence/.

## Phase 5 — Polish e saída da etapa 1

- [x] T019 Executar roteiro e gates do CI (contratos, integração, E2E, a11y, lint, tipos, build e
      segurança), registrar resultados reais em specs/008-scheduling-management/evidence/ e
      atualizar quickstart.md.
- [x] T020 Conferir limites da etapa 1, ausência de chamadas a Cal.com/legado/canais e integridade
      do rollback; registrar revisão em specs/008-scheduling-management/evidence/release-review.md
      antes de preparar PR.

## Phase 6 — US3: planejamento dos incrementos da etapa 2

**Somente preparação posterior à validação da etapa 1, não execução automática de funcionalidades.**
Teste independente de cada incremento: critérios da linha correspondente em roadmap.md devem virar
cenários concretos e tarefas antes da implementação.

- [ ] T022 [US3] Primeiro após T019–T020: detalhar 2C app/site, identidade, contratos versionados e
      plano de transição/migração do legado em
      specs/008-scheduling-management/contracts/channels.md, coordenado com a spec própria da
      primeira interface do usuário no app/site (UI01/UI02 do programa 002).
      Revisão de 24/09/2026: refletir nos contratos/tarefas de 2C a liberação da origem no envio
      bem-sucedido da remarcação, retenção apenas do destino, falha transacional preservando
      origem e recusa/desistência sem restauração automática. Preservar histórico, prioridade
      pelo início original e contagem. Retomada após recusa/desistência usa o mesmo registro
      sem horário confirmado, mesmo após início original, sem reaplicar suas 24 horas; validar
      destino futuro/horizonte e demais guardas. Contar por ciclo de troca: primeiro pedido
      reserva uma utilização, alternativas/recusas/retomadas preservam o ciclo e aprovação
      consolida a mesma utilização uma vez; outra mudança após aprovação inicia novo ciclo.
      Validar confirmadas voluntárias + ciclo debitável ativo <= 2, retry, concorrência e
      cancelamento sem horário. Incluir 2C-FR-20/2C-SC-19: indisponibilidade registrada pela equipe,
      recuperação isenta no mesmo ID mesmo com duas trocas usadas, sem prazo de origem, bloqueio
      efetivo do recurso/período preservado, aviso devido e histórico. Alternativas/recusas da
      recuperação não debitam utilização; após confirmar, novas trocas voluntárias seguem limite.
      Validar causa autorizada, zero vagas sem escolha, um destino por vez e ambos os modos de agenda.
      Incluir Salvar/Publicar no cadastro: salvar sem exposição e publicar com persistência
      atômica numa ação, permissão, validação e retry. Incluir Salvar alterações como rascunho
      separado e Publicar alterações como gravação/publicação atômica da edição, sem salvar
      antes. Validar isolamento dos valores públicos, reabertura, concorrência, preservação da
      publicação anterior em falha e guardas de reservas existentes/disponibilidade operacional.
      Incluir descrições curtas e sempre visíveis abaixo de cada botão, no cadastro e na edição,
      com associação acessível e revisão responsiva conforme 2C-FR-19.
      Publicação conjunta em app/site, sem seleção/configuração por canal: contratos usam estado
      e revisão únicos; validar atualização das projeções/caches dos dois e isolamento do rascunho.
      Incorporar 2C-FR-21–25/2C-SC-20–24: equipe vinculada principal e colaboradores autorizados
      como backup; alerta após 24 horas corridas configurável/desativável sem expiração;
      urgência independente quando faltarem 24 horas para o atendimento, configurável por
      serviço, calculada pelo destino solicitado sem mudar a prioridade baseada na origem. Jornada começa no beneficiário e filtra público-alvo publicado,
      incluindo exclusividade de titular revalidada em todos os comandos. Avisos para dependente
      e titular vigente independentemente de autoria, com preferências pessoais por canal.
      Coordenar contratos de comunicação com T023, mantendo provedores/entrega como dependência.
      Verificar os acessos individuais existentes de titulares/dependentes informados pelo
      usuário e mapear à pessoa em Associados, sem criar login paralelo ou presumir migração de
      credenciais. Checkpoint de 24/09: contrato lógico v1 em contracts/channels.md, estruturas
      propostas em data-model.md e matriz V01–V12 em quickstart.md produzidos; fechar vínculo HTTP,
      schemas executáveis, integração de acesso e UI01/UI02 antes de concluir esta tarefa.
      Cancelamento de pedido novo em análise autorizado em 24/09 (2C-FR-09/2C-SC-08): antes do
      início solicitado, sem aprovação da equipe, com liberação imediata, saída da fila/alertas,
      histórico/contador preservados e aviso sem duplicação. Validar versão, corrida com aprovação/
      recusa, acesso familiar, ambos os modos de agenda e replay autorizado após início. Validar revogação e continuidade com identidades sintéticas.
- [ ] T021 [US3] Após a primeira interface app/site, detalhar 2A horários completos e 2B
      estados/operação a partir do inventário em specs/008-scheduling-management/spec.md e
      contracts/; reconciliar políticas antigas com decisões atuais.
- [ ] T023 [US3] Detalhar 2D avaliações e 2E comunicações/limites em
      specs/008-scheduling-management/spec.md e contracts/, após validar ações, provedores e
      políticas. Canais de agendamentos definidos em 24/09: app/site, e-mail e WhatsApp, todos
      ativos por padrão e selecionáveis individualmente no app. Aplicar 2C-FR-23/24: quatro eventos,
      destinatários pelo beneficiário/vínculo vigente, preferências por pessoa, deduplicação,
      resultado rastreável, falha sem desfazer reserva e revalidação antes de envio/reenvio.
      Detalhar provedores, textos e entrega sem tratar decisão funcional como integração pronta.
      Reutilizar jobs/worker da fundação; resolver entrega incerta e retry/reenvio auditado sem
      fila paralela, reativação de campanhas antigas ou conversão não verificada de supressões.
- [ ] T024 [US3] Criar matriz de equivalência validada com o legado em
      specs/008-scheduling-management/legacy-parity.md; manter sugestões novas separadas em
      roadmap.md. Conferir existência de reservas futuras em uso, ainda desconhecida conforme
      resposta C de 24/09; registrar fonte/data/versão, contagens, situações e correspondências.
      Não presumir agenda vazia nem liberar corte sem inventário e reconciliação verificáveis.

## Dependencies & Execution Order

T001–T002 → T003–T006 → US1 (T007–T013) → US2 (T014–T018) → T019–T020. US2 pode ser testada com
fixture de reserva, mas sua entrega depende dos serviços US1. Primeira entrega contratada contém
US1 + US2; não encerrar após mostrar apenas o catálogo. T019–T020 → UI01/T022 → UI02 (primeira
interface app/site) → demais incrementos. T021–T024 são detalhamento posterior; T022 tem prioridade
confirmada pelo usuário em 15/09/2026. Seus resultados gerarão tarefas próprias para 2A–2E, sem
duplicar a spec da interface do usuário. Manter os identificadores existentes para rastreabilidade.
Nenhuma tarefa da etapa 3 enquanto o usuário não selecionar sugestões.

## Parallel Opportunities

Depois da fundação, T007 e T008 trabalham em arquivos distintos. Em US2, T014 pode ser preparado
independentemente da UI, depois de definido o contrato. T021–T024 são sequenciais para evitar
concorrência nos mesmos documentos. Paralelismo é possibilidade técnica; não exige múltiplos agentes
nem muda a política de branch.

## Implementation Strategy

Uma entrega pequena e completa primeiro; testes de invariantes antes dos serviços; revisão do
resultado antes de ampliar. Preservar dados, histórico e disponibilidade ao adicionar
funcionalidades. Não usar demo, fixture ou página vazia como entrega.

## Correção UI/UX e inclusão — 16/09/2026

- [x] UI01 Comparar padrão local e registrar pesquisa, requisitos e plano da correção na nova
      branch.
- [x] UI02 Padronizar cabeçalho/abas e expor as inclusões específicas por cadastro.
- [x] UI03 Padronizar catálogo, agenda, formulários, horários, detalhes e estados vazios preservando
      operações reais.
- [x] UI04 Validar jornada de inclusão, edição, filtros/URL, teclado/390px/temas e contraste no CI;
      revisar capturas.
- [x] UI05 Concluir evidências e abrir novo PR para dev após checks aprovados; não aprovar/integrar.

Evidências desta correção: [validação e revisão visual](evidence/ui-2026-09-16.md).

## Navegação sem perda de edição — 16/09/2026

- [x] DP01 Integrar a preservação compartilhada às abas e formulários desta função.
- [x] DP02 Validar retorno, sucesso, cancelamento e isolamento; registrar
      [evidências](evidence/drafts-2026-09-16.md) no PR.

## Acesso concedido a Agendamentos — Q8 de 21/09/2026

T005 comprova a implementação histórica de sessão suficiente, substituída como requisito por Q8.
Nenhuma tarefa nova concluída apenas pela atualização documental.

- [ ] AC01 Incluir consultar/alterar Agendamentos no catálogo/gestão existentes, com alteração
      dependente de consulta; definir transição técnica preservando contas e dados; não inferir
      novas concessões a partir de Q4.
- [ ] AC02 Exigir consulta nas páginas, calendário, catálogo, disponibilidade e seleção de
      beneficiários, e consulta+alteração nos comandos de oferta/horários/reservas; ocultar barra
      lateral/busca/Início sem concessão e preservar leitura mínima de Associados.
- [ ] AC03 Validar sem acesso, somente consulta, consulta+alteração e alteração sem consulta
      recusada, revogação, URL/API direta e três superfícies de descoberta, mantendo conflitos de
      reserva e auditoria; registrar evidências reais.

## Exportação transversal — revisão de 21/09/2026

- [ ] DX01 Detalhar, implementar e validar a exportação de Agendamentos, oferta e horários conforme
      002 EXP06/EXP07 e docs/EXPORT-STANDARD.md: ação nomeada, filtros pertinentes, seleção/ordem de
      colunas, Excel/CSV/PDF integrais e download direto, consulta ao módulo mais permissão geral,
      recusa de campos restritos e revogação. Sem teto funcional, fila/histórico obrigatório ou
      prazo de download; sem alterar anexos/documentos. A07 (missing). Tarefa do módulo que executa
      a coordenação transversal, não um segundo projeto.

</details>

## Ciclo de vida de associados — 21/09/2026

- [x] LC01 Avisar exclusão efetiva de associado em reservas, preservando histórico e ocupação;
      permitir manter (com auditoria) ou cancelar por responsável com escrita; validar fronteira
      temporal, concorrência, UI e negações. Depende de 005 LC01.

Evidência do ciclo de vida: CI35641862727 (385f0d6) totalmente aprovado; integração e jornadas de
interface em `account-member-lifecycle`, `members` e `scheduling`, conforme a função. Exclusão,
recuperação e decisão da reserva mantêm histórico/ocupação. Detalhes no
[relatório da entrega](../001-project-foundation/evidence/plan-2026-09-21-validation.md). Somente os
itens LC acima foram concluídos; exportação própria e pendências anteriores permanecem.

</details>
