# Tasks: Agendamentos — implementação administrativa local

## Correções da revisão — 05/10/2026-CODEX-mafaltti

- [x] T117 Implementar preservação das causas originais de falhas individuais de finalização,
      diagnóstico seguro no worker e regressões de serialização/isolamento. Dezesseis unitários e
      tipos/lint aprovados; regressão PostgreSQL segue no CI do PR43, destino confirmado pelo
      usuário. SHA e resultado dos gates na descrição do PR, conforme evidência complementar.

- [x] T112 Corrigir a asserção inicial de upload (status/mensagem), verificar ausência de arquivos
      após negações e completar a matriz de isolamento, provas legadas e autoridade durante locks.
- [x] T113 Aplicar contador legado zero e corrigir trigger sem reescrever migrations; validar
      preservação das demais reservas confirmadas, bloqueio de nova ocupação e indisponibilidade
      somente futura/sem falta.
- [x] T114 Auditar revisão/grants, restringir diretório, retirar lock global das leituras de revisão
      e adicionar índices das consultas reais.
- [x] T115 Isolar falhas por ocorrência na finalização com savepoints, consultar vencidas antes do
      lock e provar que um erro não impede as demais.
- [x] T116 Corrigir isolamento de rascunhos de exportação por filtros de origem; registrar política
      legada e limites INFO, executar gates da nova ponta e atualizar corpo do PR43 sem merge.

T111 e T112–T116 validadas pelos runs 37337887070/37337878171 de e923e9d: quality/browser/security
aprovados, incluindo 357 integrações, 31 testes de faltas, 101 E2Es e seis de acessibilidade.
Fixture corrigida para nova prova restrita, mantendo as asserções do revisor sem escrita. Evidência
em [revisão de 05/10](evidence/review-fixes-2026-10-05.md). A delimitação abaixo é anterior a esta
correção e permanece como histórico; T110 mantém seus gates humanos/operacionais.

## Fila de fechamento delimitada — 05/10/2026-CODEX-mafaltti

Decisão do usuário: fechar o escopo administrativo atual e parar após atualizar documentação/Jira. A
fila de execução desta entrega é somente T111 → T110; os critérios de homologação dos cinco recortes
administrativos continuam obrigatórios. Não marcar tarefas técnicas ou QA como concluídos por esta
organização. O [plano de 05/10](plan.md) contém o escopo e a sequência completa.

- **T111 estava aberta nesta delimitação; concluída na revisão acima:** corrigir a asserção em
  scheduling-absence.test.ts:880, concluir a matriz S01/S02 e os gates da nova versão, incluindo
  evidências do upload. Em 4e427ac, browser/security passaram, quality falhou com 351 integrações
  aprovadas, uma falha e uma opcional ignorada. A guarda retorna PermissionDeniedError/status 403,
  sem o campo code esperado pelo teste.
- **T110 continua aberta:** consolidar revisão externa do delta final e seus achados, composição
  após PR42 e condições de implantação/retorno; registrar versão e resultado. Concluir homologação
  humana em DEV como aceite dos tickets após integração autorizada, sem presumir aceite pelo CI.
- **Fora da fila atual:** T089, T097, T021–T024 e T041–T077 continuam registros de evolução futura/
  canais. Não reexecutar as contrapartes administrativas já atendidas por T078–T086 e T090–T105. A
  numeração e os estados históricos são preservados; backlog aberto não reabre esta entrega.
- **T107/T039:** resultados históricos preservados, sem reabertura automática; não substituem os
  gates das correções posteriores.

Não criar tickets separados para cada teste/reexecução. Defeitos do recorte permanecem em seu ticket
funcional; melhorias novas exigem nova priorização. Autor CODEX; solicitante
mafaltti/Danilo-Komunick. A coordenação encerra sua execução ao registrar este pedido.

## Consolidação final em andamento — 02/10/2026-CODEX-Gabriel-Komunick

- [ ] T110 Consolidar a revisão própria de b676974 e os três pareceres de rollout/documentação,
      acessos/segurança e compatibilidade de Relatórios; corrigir somente defeitos comprovados com
      regressões pertinentes. Após PR42 integrado e PR43 ainda aberto, conciliar dev na mesma
      branch, preservar HIN/contratos, registrar SHA/evidências e acompanhar checks do recorte
      publicado. [Revisão própria e pendências](evidence/closeout-review-2026-10-02.md). T107/T039
      não reabertos.

- [x] T111 Corrigir S01/S02 do parecer de segurança (CAAB-28/CAAB-41): isolar finalidade de
      comprovantes desde upload e proteger os caminhos genéricos/legados; revalidar autoridade e
      prazo após espera pelo arquivo. Correções locais e cinco regressões PostgreSQL reais
      preparadas, com jornada de upload atualizada; executar no CI próprio e registrar resultados.
      Não reescrever migrations aplicadas nem conceder cargos/permissões implicitamente.

Fechamento técnico de T111 em 05/10/2026 por CODEX-mafaltti: e923e9d validado conforme evidência da
revisão, preservando a autoria da tarefa original e os gates humanos/operacionais de T110.

## Estado técnico atual — 02/10/2026-CODEX-SOLICITANTE_NAO_VERIFICADO

T107/T039 concluídos: CI37034671649/cac5cbb aprovado e18capturas revisadas conforme guia.
[Evidências, critérios e limites](evidence/publication-2026-10-02.md). QA humano pendente. Registros
anteriores abaixo preservam a sequência e não reabrem os gates já comprovados.

## Retomada e adiamento de e-mail — 02/10/2026-CODEX-SOLICITANTE_NAO_VERIFICADO

O usuário autorizou conciliar a worktree preservada com dev e concluir/validar sobreposição,
bloqueios, permissões, aprovação/remarcação e faltas. Em resposta posterior, informou que o serviço
de e-mail ainda não foi criado e adiou a integração e homologação dos avisos. O código SMTP de
contas é referência técnica, não prova de serviço disponível.

Entregar os avisos operacionais de Agendamentos por e-mail (CAAB-42)/T089 permanece pendente,
dependente de Serviço de e-mail transacional e definição da caixa de entrada (CAAB-2). A pedido
explícito foi criada a subtarefa Homologar os avisos operacionais após disponibilizar o serviço de
e-mail (CAAB-45), bloqueada por CAAB-2. Confirmar ambiente, transporte/remetente, destinatários de
teste autorizados e humano responsável na retomada; registrar versão e evidência que diferencie
intenção, processamento, aceite e entrega. Não criar transporte ou enviar agora. App/site, WAHA e
T097 permanecem adiados. O recorte administrativo segue independentemente.

- [x] T106 Preservar alterações em backup verificado e commit local; conciliar dev na mesma
      worktree, mantendo exportações de Agendamentos e Relatórios e atualizações de dependências.
- [x] T107 Revalidar o conjunto conciliado: sobreposição, bloqueios, permissões, aprovação,
      remarcação, recuperação e faltas; incluir regressão de exportação compartilhada, tipos, lint,
      build, testes e evidências da versão atual. Testes usam dados descartáveis.
- [x] T108 Registrar o adiamento de T089 por ausência do serviço de e-mail, preservar critérios,
      criar e verificar o ticket solicitado no Jira e suas dependências, sem marcar entrega pronta.

- [x] T109 Revisar compatibilidade com a entrega atual de Relatórios somente por leitura; corrigir o
      aviso de cancelamentos sem horário no lado de Agendamentos, executar testes sem serviços e
      registrar hashes, limites e instruções de conciliação em
      [evidência](evidence/reports-compatibility-2026-10-02.md). Regressão de banco ampliada
      executada no CI37034671649/cac5cbb; ver evidência de publicação. Não recuperar WSL nem iniciar
      serviços.

## Falta e bloqueio — núcleo implementado, T087–T098

Fonte: BF-FR-01–06/BF-D01–05 de [spec.md](spec.md), resposta do usuário em 28/09/2026. Pedido
posterior de 28/09 autoriza implementação em paralelo com o clarify. Executar o núcleo confirmado
sem reabrir tarefas concluídas, presumir regras indefinidas ou operar dados reais.

- [x] T087 Registrar as regras confirmadas de falta/bloqueio e suas exceções em spec, plano,
      contratos e roadmap de 008, coordenando a distinção de P02 em 005; conferir links, formatação
      e coerência documental. Não marcar função implementada.
- [x] T088 Consolidar BF-D01–05 com o usuário: início no registro, sete/30 dias corridos,
      preservação durante resposta/análise, rejeição, prazo final mesmo com análise pendente,
      alcance individual, sobreposição, Falta abonada, texto/comprovante obrigatórios, permissão de
      análise, registro só após término e cancelamento futuro dentro do período respondidos. OK
      apenas fecha o aviso. Para dependentes, e-mails ao dependente e titular; os três avisos são
      operacionais e independem da preferência por comunicados. Projeto apenas intermediário; mérito
      cabe à equipe responsável e não exige definição de critérios institucionais pelo projeto.
      Cancelar todas as reservas futuras continua adiado em T097. Cobertura: BF-FR-01–06.
- [ ] T089 Completar detalhamento da integração externa e entrega de e-mail, sem bloquear o painel
      implementado: adaptar identidade/acesso em UI01/UI02 quando retomados; resolver contatos e
      vínculo vigente dos destinatários já definidos, deduplicar, preparar textos dos três eventos,
      ligar intenções ao transporte existente e comprovar estados/recibos/reconciliação. Os três
      e-mails operacionais de faltas independem da preferência por comunicados; não estender essa
      exceção aos demais avisos. Domínio, autorização, concorrência, upload privado técnico e
      revisão humana já estão contratados. Critérios institucionais de mérito ficam fora do projeto;
      não reabrir essa definição. Coordenar T021/T023 sem duplicar nem declarar canais entregues.

- [x] T090 [P] Implementar contratos e política pura em packages/contracts/src/scheduling-absence.ts
      e apps/web/modules/scheduling/absence-policy.ts, com testes de sete/30 dias, pedidos com
      texto/comprovante, falta abonada, sobreposição e expiração independente. Usar apenas decisões
      confirmadas.
- [x] T091 [P] Criar migration 0033_scheduling_absence_penalties.sql e serviço de persistência
      absence-service.ts, com ocorrência individual, pedido/comprovantes, decisão, autoria,
      versão/idempotência e intenção de aviso. Preservar migrations anteriores e dados legados; sem
      importar faltas antigas automaticamente.
- [x] T092 Integrar impedimento por falta à criação de reservas, revalidando transacionalmente
      beneficiário e impedimentos concorrentes. Impedir também atribuir por transferência uma
      reserva a pessoa com falta restritiva. Preservar atendimento das reservas mantidas e bloqueio
      cadastral existente. Depende de T090/T091.
- [x] T093 Integrar registro/consulta de faltas e envio/análise de pedidos no HTTP administrativo
      com permissões confirmadas, CSRF, sessão e idempotência. Decisões exigem scheduling:read +
      scheduling:review_absences, sem concessão implícita por scheduling:write; upload usa
      armazenamento protegido existente e validação segura. Depende de T090/T091 e respostas
      aplicáveis de T088.
- [x] T094 Implementar aplicação transacional/idempotente de cancelamentos por ausência de pedido ou
      rejeição, liberação de vagas e auditoria, com testes de concorrência. Depende de T091 e
      seleção de reservas definida em T088.
- [x] T095 Preparar avisos do bloqueio, protocolo e decisão pelo mecanismo transacional existente;
      distinguir intenção de entrega, sem envio real. Destinatários e exceção operacional estão
      definidos em BF-FR-06; resolver contatos/transporte/recibos na continuação T089.
- [x] T096 Validar recorte implementado com testes focados, contratos HTTP, integração PostgreSQL
      descartável, tipos e lint; registrar evidência e limites. Interfaces novas dependem do guia e
      de seus critérios, sem presumir app/site entregue.

- [ ] T097 Possibilidade futura, sem autorização de implementação: discutir com o usuário se o
      bloqueio deve cancelar também todas as reservas posteriores ao período e, somente se aprovado,
      definir alcance/vigência/configuração. A regra atual permanece limitada aos 30 dias.

- [x] T098 Conectar efetivação sem pedido ao worker existente: varredura por minuto, revalidação
      após lock, cancelamento compartilhado com a decisão administrativa e autoria explícita de
      sistema. Migration 0034 permite ator de sistema nos eventos preservando autoria humana
      existente. Repetição e concorrência não duplicam efeitos; processamento tardio após 30 dias
      apenas encerra a pendência, sem cancelamento retroativo. Testar função em PostgreSQL
      descartável, sem ligar worker de uso. Depende de T091/T094.

Evidência do núcleo e limites: [validação de faltas](evidence/absence-policy-2026-09-28.md).

T088 foi concluída com as respostas do usuário; T089 prossegue na integração externa/entrega.
T090–T096/T098 concluem o núcleo local; T099–T101 implementam a interface e T102 valida o
incremento. T078–T086 não comprovam BF-FR-01–06. Autorização atual dispensa reconfirmar início por
checklists abertas, sem marcá-las satisfeitas.

Delimitação confirmada pelo usuário: o projeto atua como intermediário e não define nem executa a
análise de mérito dos comprovantes. Receber pedido e arquivos, disponibilizar à equipe responsável
com permissão específica e registrar/comunicar a decisão humana. Validação de campos e segurança dos
arquivos é técnica; não constitui aceitação da justificativa. Critérios institucionais de mérito
ficam fora do escopo de definição deste projeto.

## Continuação administrativa de faltas — T099–T102

Pedido do usuário: continuar a implementação. Seguir o guia canônico de UI/UX já consultado; manter
app/site adiados e serviços de uso pausados. Dados sintéticos e bancos descartáveis preservam o
recorte autorizado de validação.

- [x] T099 Adicionar consulta paginada de faltas por reserva/pessoa, busca e situação, projeção
      tipada e vínculo ao detalhe existente. Consulta geral expõe apenas metadados;
      explicação/comprovantes seguem a permissão de análise. Cobrir autorização e filtros em testes.
- [x] T100 Integrar registro de falta, prazos, justificativa/contestação com comprovante e decisão
      ao detalhe da reserva. Confirmar consequências, preservar rascunho/versão/erros, usar upload
      privado existente e distinguir arquivo enviado de liberado. Botão OK somente fecha aviso.
      Registrar feedback e histórico sem prometer e-mail entregue. Depende de T099.
- [x] T101 Adicionar aba/lista de faltas com busca, filtros, acesso ao detalhe e exportação de
      metadados em Excel/CSV/PDF pelo mecanismo existente, sem incluir explicação, comprovantes ou
      dados de e-mail. Respeitar consulta/exportação e decisão separadas. Depende de T099.
- [x] T102 Validar incremento administrativo com tipos/lint, contratos, testes PostgreSQL e jornadas
      de navegador em ambiente sintético autorizado. Revisar guia: claro/escuro, 1280/390/320px,
      teclado, foco, erros, preservação de edição e leitura. Registrar evidências e limites na spec
      sem homologar app/site ou entrega real de e-mail.

T099–T102 implementadas e validadas localmente;
[evidência da interface](evidence/absence-ui-2026-09-28.md). Decisões T088 fechadas: dependente e
titular recebem os e-mails operacionais independentemente de comunicados; mérito pertence à equipe
responsável. Entrega real e canais externos continuam pendentes em T089.

## Corpo ativo vigente — painel e banco primeiro, T078–T086

Pedido posterior de 28/09 adia app/site. Esta seção é a entrada atual do implement e substitui a
ordem que exigia UI01/identidade externa antes de qualquer evolução do domínio. T025–T038 preservam
sua conclusão local; T039 segue pendente de CI, sem bloquear trabalho local autorizado. As tarefas
2C originais abaixo conservam a cobertura externa e não serão marcadas completas por testes do
painel. A referência entre grupos evita contar a mesma implementação duas vezes.

- [x] T078 Reconciliar spec/plano/modelo/contratos/checkpoint/roadmap com a prioridade
      administrativa; localizar telas e separar os gates exclusivos do app/site. Fonte: pedido do
      usuário em 28/09; identidade administrativa e autoria permanecem existentes. Testes de
      domínio/API/painel dispensam, por ora, interface mínima adicional.
- [x] T079 Confirmar e registrar limites administrativos: usuário escolheu aplicar as mesmas regras
      de aprovação, prazo e duas trocas, preservando recuperação isenta do estabelecimento. Decisão
      registrada na spec/plano; sem override genérico.
- [x] T080 Derivar T045–T048 para o ator administrativo: contratos/testes primeiro; migration
      `0032_scheduling_administrative_workflow.sql` após 0031, substituindo ambas as exclusões
      nomeadas para scheduled/pending_approval. Definir capacidade, estados/NULLs,
      processo/proposta, política/revisão, equipe e intenção de aviso. Preservar FKs de autoria para
      user, idempotência existente, LC01 e compatibilidade de DTO/Relatórios; não criar identidade
      externa.
- [x] T081 Implementar e validar a parcela administrativa de T051/T052/T054/T055/T071: políticas,
      rascunho/publicação única, botões com descrição, agenda por profissional ou capacidade,
      elegibilidade do beneficiário e bloqueios. Sem frontend/API pública de app/site. Edição
      inválida preserva publicação e reservas; publicar não exige vaga livre.
- [x] T082 Implementar e testar pelo painel a parcela T056–T061: pedido imediato/manual, pendência
      ocupante, edição/transferência permitida antes do aceite, aprovação/recusa, cancelamento e
      ciclo de troca com origem liberada e contador confirmado/reservado. Depende de T079/T080/T081;
      operações usam colaborador autenticado como autor e preservam beneficiário individual.
- [x] T083 Implementar e testar T062–T066 administrativos: indisponibilidade com bloqueio real,
      recuperação isenta, equipe/backup, fila com remarcações primeiro pela origem, idade/urgência e
      histórico por pessoa. Nenhuma transição automática pela passagem do tempo.
- [x] T084 Preparar persistência transacional de intenção/estado dos avisos e testes sintéticos
      relativos a T050/T067–T069, sem instalar WAHA nem enviar mensagens. Exibir estado real;
      intenção registrada não é entrega. Preferências no app e prova dos provedores ficam adiadas.
- [x] T085 Integrar a jornada completa às telas/HTTP administrativos existentes; manter agenda,
      calendário, LC01, aviso de bloqueio, exportação e Relatórios compatíveis com todos os estados
      e reservas sem profissional. Validar permissões, read-only, revogação e mensagens de erro.
- [x] T086 Validar migrations e concorrência no PostgreSQL descartável; unitários/contratos,
      integrações, E2E, acessibilidade, lint/tipos/build e revisão pelo guia. Registrar evidências
      administrativas próprias, sem alegar app/site/WAHA/CI homologados. Atualizar Jira e
      checkpoint.

Conclusão local: T078–T086 validadas; evidências em
[fluxo administrativo](evidence/admin-workflow-2026-09-28.md). App/site, provedores e CI permanecem
separados e pendentes.

Ordem: T078/T079 → T080 → T081 → T082 → T083/T084 → T085 → T086. UI01/UI02 e T041 continuam adiados;
não são gates de T080–T086.

## Registro da entrega administrativa anterior — T025–T039

**Estado vigente — 28/09/2026:** implementação de T025–T039 e validação local autorizadas; manter a
entrega local, sem publicação/PR/merge. Docker e banco descartável autorizados. CAL06 concluída pela
revisão dos checks finais/capturas. T025–T038/AC03 validados localmente; T040 conferiu os gates de
2C, sem liberar schema/canais. T039 mantém somente o CI pendente de publicação autorizada. Evidência
em [validação](evidence/plan-2026-09-21-validation.md).

**Entrega:** codex/scheduling-market-research-20260923, worktree local da reconciliação.
**Entradas:** [spec](spec.md), [plan](plan.md), [modelo](data-model.md),
[admin](contracts/admin.md), [exportação](contracts/exports.md), [pesquisa](research.md). **Ordem
executável:** CAL06 → T025/T026 → T027/T029–T034 → T035–T039. T028/AC01/AC02 já integrados no PR
#36. O ajuste independente de acesso em T027 foi iniciado primeiro; concluir T025/T026 antes do
adaptador/exportação. Estados marcados só mudam com evidência real.

## Corpo anterior — T025–T039

Esta lista registra a entrega local anterior. Os requisitos 2C abaixo são a etapa posterior
condicionada; não executar T045–T077 enquanto os gates administrativos, de identidade e UI01 não
estiverem satisfeitos. T040 é conferência de gates, sem migrations ou alterações de schema. Nunca
habilitar pending_approval antes da substituição transacional das constraints descrita em T045/T048.
Regras e decisões 2C permanecem preservadas.

## Setup

- [x] T025 Conferir o catálogo real de telas/abas e filtros contra
      `specs/008-scheduling-management/contracts/exports.md`; mapear campos permitidos/defaults e
      projeções atuais, sem criar fonte ou ampliar permissão.

## Foundational

- [x] T026 Preparar fixtures sintéticas isoladas e contratos da função em
      `apps/web/modules/scheduling/export-fixtures.ts` (novo, exclusivo de testes), com datas
      empatadas, zero resultados, texto longo, campos restritos e filtros combinados; depende dos
      schemas de 001.

## US1 — Configurar e reservar

**Objetivo/aceite independente:** Sem read não acessa; só read não muda dados; mesma pessoa em
profissionais/unidades diferentes conflita no banco, familiares distintos podem coincidir,
remarcação falha preserva original.

- [x] T027 [US1] Atualizar fixtures e testes de acesso em
      `apps/web/tests/integration/scheduling.test.ts`, `packages/contracts/src/scheduling.test.ts` e
      `apps/web/modules/scheduling/http/routes.test.ts`; cobrir nenhum grant, read, read+write,
      write sem read e ator revogado após lock. Validar que negado não disputa 5010/1 e GET não
      adquire esse lock. Após os testes, ajustar somente a ordem em access.ts: grants antes do lock
      de escrita e sessão/grants novamente após espera. Preservar reports.bookings com
      scheduling:read, sem exigir scheduling:write; cobrir Gestor. AC03 validada também no
      navegador.
- [x] T028 [US1] Aplicar concessões atuais read/write no banco em
      `apps/web/modules/scheduling/access.ts` e controles em
      `apps/web/modules/scheduling/ui/booking-form.tsx`; conferir todas as páginas/serviços/rotas do
      módulo, preservando beneficiary-service mínimo. Implementação conferida em dev 89d2356, PR
      #36/af6f096: access.ts, layout, areas.ts, user-access e 0026. Não repetir implementação nem
      migrations 0025/0026. Matriz específica e ajuste pré-lock permanecem em T027.
- [x] T029 [US1] Adicionar diagnóstico read-only em
      `packages/db/scripts/check-scheduling-beneficiary-overlaps.sql` (novo) e testes de conflitos
      antigos em `apps/web/tests/integration/scheduling.test.ts`; se detectar pares sobrepostos,
      parar sem cancelar/alterar reserva e emitir relatório seguro para decisão explícita.
- [x] T030 [US1] Criar exclusão GiST por member_id+intervalo [) scheduled em
      `packages/db/migrations/0031_scheduling_beneficiary_overlap.sql` (nova; 0031 livre em dev
      89d2356, reconferir antes de criar). Nome próprio scheduling_beneficiary_no_overlap; T029
      obrigatório antes do EXCLUDE. Preservar scheduling_no_overlap profissional, 0020 e
      0028_account_member_lifecycle.sql, além de 0029/0030. Não criar outro 0028 nem editar
      checksums aplicados. Provar falha integral com conflitos existentes, sem NOT VALID. Esta
      proteção é transitória para os estados atuais; antes de habilitar pending_approval, T045/T048
      substituem ambas as constraints por nome, na mesma transação da futura migration 0032.
- [x] T031 [US1] Adequar `apps/web/modules/scheduling/booking-service.ts`,
      `apps/web/modules/scheduling/availability-service.ts` e `packages/contracts/src/scheduling.ts`
      para beneficiaryId opcional/validado na disponibilidade e tratamento recuperável de conflito
      por pessoa. Atualizar consumidores para enviá-lo quando selecionado, mantendo leitura sem ele
      compatível; criar/remarcar sempre valida o beneficiário real, inclusive reservas entre
      unidades, mantendo rollback da remarcação e constraint como garantia final.
- [x] T032 [US1] Testar corrida da mesma pessoa em profissionais/unidades diferentes,
      titular/dependentes distintos, parcial/adjacente/cancelada e rollback em
      `apps/web/tests/integration/scheduling.test.ts`; uma reserva vencedora por conflito, sem
      perder a reserva original.

T027/AC03 concluídos localmente: pré-grant, matriz persistida e navegador (Início/menu/busca,
URL/API, read/write/revogação). Suíte administrativa atual: 81 unitários e 37 integrações, além dos
contratos/exportação/E2E na [validação](evidence/plan-2026-09-21-validation.md).

## US2 — Consultar e gerenciar

**Objetivo/aceite independente:** Bloqueio próprio/titular vigente sinaliza lista/calendário/detalhe
e mantém reserva/vaga; desbloqueio remove aviso, cancelamento manual autorizado permanece.

- [x] T033 [US2] Projetar eligibilityWarning blocked|null em lote, sem N+1, em
      `apps/web/modules/scheduling/booking-service.ts` e `packages/contracts/src/scheduling.ts`;
      reutilizar vínculos atuais de `packages/db/src/repositories/members.ts`, sem mutar
      status/versão/ocupação. Adição ao DTO, preservando memberDeleted, memberDeletionEffectiveAt,
      keptAfterMemberDeletion, memberDeletionKeptAt/By e kept_after_member_deletion de LC01;
      bloqueio não substitui exclusão e os dois avisos podem coexistir.
- [x] T034 [US2] Mostrar aviso textual em lista/calendário/detalhe em
      `apps/web/modules/scheduling/ui/` e cobrir `apps/web/tests/e2e/scheduling.spec.ts`; manter
      reservas após bloqueio, negar nova/remarcação, permitir cancelamento manual e remover aviso
      após desbloqueio efetivo. Preservar Manter reserva (/keep) e Cancelar reserva do ciclo de vida
      quando autorizados; bloqueio não suprime keep. Cobrir aviso de bloqueio junto com exclusão e
      manter o E2E existente de LC01. Não negar toda escrita exceto cancelamento.

## US4 — Exportação autorizada

**Objetivo/aceite independente:** Reserva/oferta/horários exportam três formatos sem limites do
calendário; dados de beneficiário ficam na projeção autorizada.

- [x] T035 [US4] Escrever testes do adaptador em
      `apps/web/modules/scheduling/export-adapter.test.ts` (novo): filtro+sort, columns em ordem
      pedida, campo proibido, dados completos e matriz de autorização conforme
      `specs/008-scheduling-management/contracts/exports.md`.
- [x] T036 [US4] Implementar `apps/web/modules/scheduling/export-adapter.ts` (novo) reutilizando as
      consultas/projeções do domínio, IDs/dependências para reautorização por lote e cursor do
      núcleo 001; SQL com cursor, sem reaproveitar o teto da lista/calendário ou materializar todos
      os registros. Registrar os adapters em apps/web/modules/exports/runtime.ts ao lado de
      usersExport; preservar /users/exportar. Cobrir datasets sem ampliar acesso ou alterar dados.
- [x] T037 [US4] Integrar ação/tela em `apps/web/app/(admin)/scheduling/exportar/page.tsx` (nova) e
      nas listas/abas existentes de `apps/web/modules/scheduling/ui/`; passar contexto/filtros,
      preservar rascunho e oferecer os três formatos com defaults e reordenação acessível. Usar
      cabeçalho do quadro/acima dos filtros para Exportar Agendamentos; manter Nova reserva no
      cabeçalho da página, com identidade/seletores preservados.
- [x] T038 [US4] Validar arquivos reais nos três formatos, ordem/contagem/IDs/filtros e negações em
      `apps/web/tests/integration/scheduling-export.test.ts` e
      `apps/web/tests/e2e/scheduling-export.spec.ts` (novos); preservar scheduling.spec.ts e validar
      /users/exportar como regressão do registry. Usar parsers independentes do núcleo 001;
      leitura+exports:generate basta, sem write. Confirmar erro recuperável sem corte.

## Polish

- [x] T039 Executar gates/testes da função no CI e registrar resultados/capturas/limites em
      `specs/008-scheduling-management/evidence/plan-2026-09-21-validation.md` (novo); marcar
      conclusão somente com evidência, preservando tarefas institucionais e históricas. Gates
      locais/capturas concluídos em 28/09; CI da entrega não executado porque manter local continua
      vigente. Não marcar CI aprovado nem publicar automaticamente para encerrar esta tarefa.

## Dependências e ordem de execução

Setup → Foundational → histórias → Polish. Dentro de cada história, contratos/testes antecedem
código e jornada; tarefas sem [P] seguem a ordem apresentada. Infraestrutura de 001 (concessões,
schemas, writers, rotas e UI) precede adaptadores/exportações dos demais specs. Migração 0025
precede0026;0027 antes de transferências; a migration de conflito do beneficiário depende do
diagnóstico de conflitos e não altera dados automaticamente. Regressões004/006 e regras008 podem
avançar após catálogo/migrações mesmo antes do núcleo de exportação. 0025–0030 já integram dev; não
executar novamente sua implementação. T029 precede T030 e a aplicação do EXCLUDE; CAL06 → pendências
T025–T039 → T022/2C é a ordem atual, sem refazer T028. Aceite transversal002 depende das evidências
das funções. Spec009 exige gate M016. Não há dependência em retenção/P01/canais futuros para o
recorte administrativo atual.

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

## Etapa posterior — 2C, condicionada a pré-requisitos

T040 conferiu os gates locais; T041–T077 permanecem 37 tarefas abertas. Não são a entrada da
implementação atual. T040/T041/T043 podem produzir apenas evidências/contratos para fechar gates;
T040 não cria schema. Escrita de canais exige identidade geral verificável, UI01 definida e
persistência compatível após T030.

## Decisões vigentes — 28/09/2026

- **Login geral:** Agendamentos utiliza a conta/sessão geral do app/site. Não cria login,
  credencial, recuperação ou escolha de fornecedor de identidade próprios do módulo. Usuário já
  conectado entra na agenda sem nova autenticação específica; permissões familiares são revalidadas
  no servidor. Evolução do login pertence à experiência transversal do app/site.
- **Histórico antigo:** importar registros antigos de recusa/cancelamento/edição é opcional e de
  baixa prioridade, conforme esclarecimento do usuário. Sua classificação detalhada ou reconstrução
  do número de trocas não bloqueia esta especificação. Se importados, preservar a informação
  disponível sem inventar distinções/contadores. Isso não autoriza apagar a origem e não altera o
  histórico individual exigido para os novos registros.
- **Edição antes do aceite:** edição comum altera data, horário e profissional quando a escolha
  estiver habilitada, mantendo pessoa e serviço. Como ação adicional, permitir transferir o
  atendimento a dependente quando o serviço for compatível e disponível para ele. Titular só
  representa dependentes com vínculo vigente; dependente continua operando somente para si.
  Revalidar autorização, elegibilidade e disponibilidade antes de persistir; falha mantém o pedido
  anterior. Pedido já confirmado segue as regras existentes de remarcação, sem autorização implícita
  para transferência após aprovação.
- **Comunicação:** e-mail do sistema já definido; WAHA escolhido, ainda não instalado. Planejar
  preparação e comprovação de entrega; nenhuma seleção de novo fornecedor ou instalação está
  autorizada nesta etapa documental.

## Escopo, rastreabilidade e condição de execução

As 38 tarefas detalham **US3 (P2), somente recorte 2C**. Não criam histórias novas nem incluem
avaliações, turmas, pagamentos, lista de espera, portal de parceiros ou outras expansões de US3.
Planejamento autorizado não constitui autorização de implementação, envio, migração real ou corte.
Testes são exigidos pelos critérios 2C-SC e pela constituição para agenda, autorização e UI.

T022 continua como coordenação do contrato/acesso/interface: T041/T043/T046/T047/T049/T070/T073
produzem suas evidências, sem marcá-la concluída antecipadamente. A parcela transacional de T023 é
detalhada por T044/T050/T067–T069; avaliações e demais expansões continuam fora deste recorte. T024
depende de T042/T077; massa sintética não comprova inventário real. Não executar novamente tarefas
históricas concluídas nem contar coordenação e execução duas vezes.

**Gates factuais:** transição das contas existentes, reservas legadas, guia visual e homologação dos
provedores selecionados ainda precisam de evidência. Cada gate tem tarefa e saída abaixo. Seleção
atual de tecnologia pode avançar; preservar identidade/histórico não exige o login antigo. Sem
evidência, registrar impedimento de ativação/corte; não apresentar simulação como homologação.
Tarefas de consumidores externos dependem da spec própria prevista em 002 UI01/UI02.

Caminhos marcados **novo** são destinos propostos, não arquivos existentes. Migrações são a exceção:
T045 deve conferir o próximo número livre e registrar o caminho SQL exato antes de T048; não fixar
0028, já citado na entrega do ciclo de vida. Confirmar a base integrada e dependências
administrativas em T040, sem copiar alterações antigas automaticamente.

## Checkpoint de pesquisa — 25/09/2026

Diretriz posterior do usuário incorporada: reformular com práticas e opções atuais, mantendo dados
individuais e histórico. Comparativo e recomendações em
[research.md](research.md#reformulação-orientada-pelo-mercado--25092026). Registro histórico
superado pelas decisões de 28/09: T041 integra login geral; T044 integra WAHA escolhido e e-mail do
sistema. Não há seleção de fornecedor própria do módulo. Pesquisa não conclui homologação,
contratação ou tarefas de implementação.

Avanço parcial de T041/T042/T044, sem marcar tarefas concluídas: código do legado e fluxo individual
de login localizados; diferenças de status/autoria/vínculo em [legacy-parity.md](legacy-parity.md).
Testes de T046/T049 devem negar token intermediário e IDs de ator impostados; T042/T045/T077 devem
preservar estados legados ambíguos, contagem desconhecida e fuso verificado. Não mapear reject ou
EDITED automaticamente. SMTP/worker são referências reutilizáveis; cliente Evolution conversacional
não prova transporte transacional pronto. T044/T069 devem integrar os serviços definidos e fechar
correlação/recibos, timeout incerto e reenvio seguro conforme [pesquisa](research.md). Guia visual
localizado na pasta principal; compatibilidade da UI, versão publicada, inventário real e
homologação ainda pendentes.

## Phase 1 — Setup e fechamento das dependências

**Saída:** fontes e contratos verificáveis, sem decisão de negócio reaberta por falta de acesso.

- [x] T040 Conferir branch/worktree, versões integradas e estado de AC/BEN/BLQ/LC/CAL em
      `specs/008-scheduling-management/evidence/tasks-2026-09-24.md`; resolver a correspondência de
      T027–T034 com os pré-requisitos reais e registrar dependências ainda abertas. Aplicar a ordem
      de retomada acima; T028/AC01/AC02 já integrados; T027–T038/AC03 validados localmente, CI de
      T039 pendente. Exportação T035–T038 é independente tecnicamente; não repetir código integrado
      nem usar CI antigo como prova de autorização, capacidade ou pendências novas.
- [ ] T041 Integrar a sessão geral do app/site ao módulo em
      `specs/008-scheduling-management/contracts/channels.md`, coordenando
      `specs/005-members-management/contracts/members.md` e UI01/UI02. Validar transporte e caminhos
      HTTP de channels §1.3, colisões com APIs existentes, revogação, origem/CSRF e limites; provar
      identidade→pessoa e acesso sem segundo login em web/app. Não criar autenticação, recuperação,
      credenciais ou seleção de fornecedor próprias de Agendamentos.

- [ ] T042 Delimitar dados necessários à continuidade e conferir reservas futuras em
      `specs/008-scheduling-management/legacy-parity.md`; documentar correspondências, único
      escritor, corte/retorno em `specs/008-scheduling-management/plan.md`. Logs/estados antigos de
      recusa/cancelamento/edição são importação opcional e de baixa prioridade. Se incluídos,
      preservar informação disponível sem reconstrução obrigatória de causas/contador; não fabricar
      dados. Desconhecido não significa zero reservas futuras. Não importar, apagar fontes ou
      alterar dados reais nesta tarefa.

- [ ] T043 Localizar e ler `docs/caab-design.md`; vincular a spec própria de 002 UI01/UI02 aos
      critérios de agenda em `specs/008-scheduling-management/plan.md`. Registrar caminhos reais dos
      consumidores e responsabilidades antes de planejar layout ou editar UI; não criar uma segunda
      interface de associado dentro do painel para contornar essa dependência.

## Phase 2 — Foundational

**Dependências:** Setup concluído, pré-requisitos administrativos de T040 comprovados. **Saída:**
contratos e persistência que protegem ambos os modos, autoria e eventos.

- [ ] T044 Detalhar WhatsApp via WAHA, escolhido e ainda não instalado: plano de preparação,
      responsável/ambiente, versão/motor, sessão, sendText, messageId, message.ack, conexão e
      reconciliação de timeout. Integrar o serviço de e-mail já definido no sistema, verificando seu
      contrato/remetente; não escolher fornecedor novo para agenda nem exigir Evolution. Fechar
      textos/templates dos quatro eventos e validar a política explícita da seção 10.2 (orçamento
      persistido, backoff, timeout, reconciliação, heartbeat, dead-letter e retenção) em
      `specs/008-scheduling-management/contracts/channels.md`, conforme
      `specs/001-project-foundation/contracts/jobs.md`. Inventariar preferências/supressões antigas,
      contatos válidos e permissão/opt-out do WhatsApp, separados da preferência inicial ativa.
      Definir autenticação/deduplicação dos callbacks e eventos fora de ordem; considerar
      configuração aplicável ao WAHA; não impor tarifas/templates de Cloud API por analogia. Não
      contratar, enviar ou ativar campanhas nesta tarefa. Documentar dependência externa quando não
      houver evidência; não aceitar defaults implícitos.
- [ ] T045 Detalhar modelo físico e protocolo único de locks em
      `specs/008-scheduling-management/data-model.md`: revisão publicada/rascunho, políticas,
      ocupação, processo/proposta, autoria externa, equipe, bloqueio e intenção de aviso. Definir
      constraints por modo, exclusão global por beneficiário incluindo pendências, unicidade de
      processo/proposta e contagem <= 2; confirmar sequência em `packages/db/migrations/` e
      registrar 0032_scheduling_channels.sql (reconferir número após 0031). Seguir a invariante de
      ocupação do modelo: DROP CONSTRAINT nomeado e recriação transacional de
      scheduling_beneficiary_no_overlap e scheduling_no_overlap incluindo
      scheduled/pending_approval. Definir NULLs por modo/estado, ator externo e idempotência
      separados, joins/estados de Relatórios compatíveis. Estratégia posterior sem reescrever
      0020/0028 ou zerar contadores desconhecidos.
- [ ] T046 [P] Escrever testes de contratos em `packages/contracts/src/scheduling-channels.test.ts`
      (novo): projeções mínimas, enums, datas/fuso, paginação, corpo limitado, versões, erros,
      idempotência e negação de papel/causa/contador impostos pelo cliente. Cobrir nulidade de
      profissional/horário conforme modo/estado e compatibilidade dos consumidores administrativos.
      Executar antes da implementação.
- [ ] T047 Implementar schemas v1 em `packages/contracts/src/scheduling-channels.ts` (novo),
      exportar em `packages/contracts/src/index.ts` e conciliar
      `packages/contracts/src/scheduling.ts` com T041/T045/T046. Distinguir reserva, processo,
      proposta e entrega; histórico/autor não se confundem com beneficiário.
- [ ] T048 Após T030–T032 validados e T041/UI01/T043/T045/T047 definidos, criar a migration 2C
      posterior (0032 proposta), incluindo substituição nomeada das constraints, dentro de
      `packages/db/migrations/`, e alinhar `packages/db/src/schema.ts` quando aplicável. Validar
      upgrade, constraints, autoria e compatibilidade em banco descartável; diagnosticar conflitos
      existentes e parar sem alterar reservas para fazer a migration passar. Não aplicar ao banco de
      uso nem registrar aprovação por simples geração de SQL.
- [ ] T049 Somente após T041 e UI01/T043 com contrato verificável de conta/sessão→member.id,
      implementar fronteira externa em `apps/web/modules/scheduling/channel-access.ts` (novo), com
      resolução do adaptador verificado em T041 e vínculos de
      `packages/db/src/repositories/members.ts`. Criar
      `apps/web/tests/integration/scheduling-channel-access.test.ts` (novo) antes das guardas:
      titular por si/dependente vigente, dependente por si, sessão/vínculo revogado durante
      lock/replay, terceiro e acesso administrativo separado; negar por padrão.
- [ ] T050 Implementar persistência transacional de eventos/intenção em
      `apps/web/modules/scheduling/notification-service.ts` (novo), usando jobs da fundação;
      preparar `apps/web/tests/integration/scheduling-notifications.test.ts` (novo). Evento e
      intenção sobrevivem juntos; falha/retry não duplica, payload contém IDs mínimos, chamada
      externa fica fora da transação. Não criar infraestrutura paralela de filas.

## Phase 3 — US3 (P2): reserva e gestão externas, recorte 2C

**Objetivo:** associado encontra a oferta, reserva para beneficiário autorizado, acompanha,
remarca/cancela e recebe os avisos devidos; a equipe opera a mesma agenda no painel. **Aceite
independente:** fixtures sintéticas de titular/dependente, equipe/backup, ambos os modos de agenda e
aceitação; executar V01–V12, com PostgreSQL real descartável para concorrência. Simulação valida o
domínio, mas não conclui identidade/provedor/cliente real.

### Oferta publicada e disponibilidade

- [ ] T051 [P] [US3] Escrever `apps/web/tests/integration/scheduling-publication.test.ts` (novo)
      para Salvar/Publicar e suas variantes de edição: mesmo ID, rascunho isolado, publicação
      conjunta, conflito/retry, configuração inválida e agenda válida esgotada; reservas existentes
      e bloqueios continuam protegidos. Referências: 2C-FR-01/19/25; 2C-SC-03/18/24.
- [ ] T052 [US3] Implementar salvar/publicar revisão em
      `apps/web/modules/scheduling/catalog-service.ts`, com versões e transação; usar a mesma
      revisão externa em app/site e invalidar projeções após commit. Ativo não implica publicado,
      rascunho não afeta vagas/comandos e erro conserva a publicação anterior. Atender T051.
- [ ] T053 [US3] Implementar catálogo público mínimo, beneficiários autorizados e ofertas elegíveis
      em `apps/web/modules/scheduling/channel-query-service.ts` (novo), usando
      `apps/web/modules/scheduling/beneficiary-service.ts`. Sem vagas anônimas ou cache privado
      compartilhado; público exclusivo é avaliado pela pessoa atendida. Referências: 2C-FR-01/02/25;
      2C-SC-03/24.
- [ ] T054 [P] [US3] Escrever `apps/web/modules/scheduling/channel-policy.test.ts` (novo) para
      profissional específico/qualquer/controle desativado, modo capacidade, inexistência de
      expediente, prazos independentes e horizonte; 0/2h/24h/90dias, fronteiras exatas e fuso.
      Testar políticas alteradas entre prévia e envio sem invalidar pendências anteriores.
      Referências: 2C-FR-08/13–16; 2C-SC-07/12–15.
- [ ] T055 [US3] Adequar `apps/web/modules/scheduling/availability-service.ts`,
      `apps/web/modules/scheduling/availability.ts` e `apps/web/modules/scheduling/hours-service.ts`
      aos dois modos e à revisão publicada. Revalidar após lock com relógio do servidor; contar toda
      duração [início,fim), pendências e beneficiário global; não usar fallback de profissional
      indisponível para capacidade. Profissional atribuído é apresentado antes do envio e nunca
      substituído silenciosamente.

### Reserva, remarcação e recuperação

- [ ] T056 [P] [US3] Escrever `apps/web/tests/integration/scheduling-channel-booking.test.ts`
      (novo): criação imediata/manual, autorização/público-alvo, 20 disputas por profissional,
      capacidade 1 e 3, beneficiário global, adjacência, falha e 20 retries; uma única ocupação por
      vencedor. Cobrir edição pendente/transferência a dependente compatível, vínculo revogado,
      serviço exclusivo, conflito de destino, falha e aprovação concorrente, sem nova contagem ou
      vazamento de histórico. Pedido inicial antes/exatamente/depois do horário anterior pode editar
      para futuro válido; negar destino passado e preservar idade da análise. Edição de troca
      voluntária continua sob FR-08/10; retomada/recuperação sob FR-18/20. Referências:
      2C-FR-02/03/14/25; 2C-SC-01/02/03/13/24.
- [ ] T057 [US3] Adequar `apps/web/modules/scheduling/booking-service.ts` para criação pelos canais
      e painel sobre a mesma ocupação, com estados explícitos, política por serviço, autoria
      externa, idempotência/auditoria e intenção de aviso. Pendência ocupa vaga sem confirmar nem
      expirar; passagem do tempo não gera presença/falta. Permitir editar data, horário e
      profissional habilitado antes do aceite mantendo pessoa/serviço; permitir transferência a
      dependente autorizado/elegível, sem mudar serviço por inferência; revalidar disponibilidade e
      trocar versão/ocupação atomicamente. Manter ID, política, pendência e contador; falha conserva
      anterior. Pedido inicial pode editar destino mesmo após horário anterior, validando
      futuro/políticas. Centralizar guardas por tipo de processo com T059, sem rota genérica
      dispensar prazo de remarcação. Não reiniciar idade de análise. Proteger histórico/avisos na
      mudança de pessoa. Atender T056; pedido confirmado não usa esse fluxo.
- [ ] T058 [P] [US3] Escrever `apps/web/tests/integration/scheduling-channel-reschedule.test.ts`
      (novo): liberar origem/reter só destino, terceiro ocupando origem, rollback inicial,
      substituir/retirar/recusar/retomar, 0+1 → 1+0 → 1+1 → 2+0 e terceira troca negada. Cobrir
      aprovação após início original com destino futuro, destino passado negado e ambas as
      modalidades. Referências: 2C-FR-04/08/10/11/17/18; 2C-SC-05/07/09/10/16/17.
- [ ] T059 [US3] Implementar ciclo/propostas em `apps/web/modules/scheduling/reschedule-service.ts`
      (novo), usando a transação/locks comuns de T045. Envio válido libera origem e retém só
      destino; substituir conserva destino anterior em falha; retirar/recusar não restaura origem.
      Retomada mantém ID/ciclo mesmo após origem, sem prazo de nova reserva/24h da origem. Contar
      apenas ciclo confirmado, mantendo utilização reservada e confirmadas + reservada <= 2. Atender
      T058.
- [ ] T060 [US3] Implementar aprovação/recusa versionadas em
      `apps/web/modules/scheduling/approval-service.ts` (novo), com equipe/backup autorizados,
      destino futuro, elegibilidade e proposta vigente. Aprovar mantém ocupação e consolida uso
      voluntário uma vez; recusa inicial termina pedido, recusa de troca mantém mesmo registro
      aguardando escolha. Não reaplicar horizonte reduzido a proposta recebida antes. Cobrir
      concorrência em T056/T058, inclusive cancelamento e revogação.
- [ ] T061 [US3] Implementar cancelamento em `apps/web/modules/scheduling/booking-service.ts` e
      ampliar `apps/web/tests/integration/scheduling-channel-booking.test.ts`: confirmado/pedido
      novo pendente antes do início, sem prazo mínimo/equipe; exatamente no início é negado. Pedido
      cancelado sai da fila/alertas, libera só sua vaga, preserva ID/histórico/contador e avisa.
      Troca pendente e registro sem horário seguem suas guardas específicas; replay autorizado após
      início retorna resultado original e disputa com decisão não reativa. Referências:
      2C-FR-09/10/18/20; 2C-SC-08/09/17/19.
- [ ] T062 [P] [US3] Escrever `apps/web/tests/integration/scheduling-provider-recovery.test.ts`
      (novo) com 0/1/2 trocas usadas, ambos os modos, origem passada, causa forjada, falta de
      permissão, falha/concorrência e alternativas recusadas; comprovar bloqueio efetivo,
      preservação de terceiros e zero cobrança. Referências: 2C-FR-20; 2C-SC-19.
- [ ] T063 [US3] Implementar ocorrência e recuperação em
      `apps/web/modules/scheduling/provider-recovery-service.ts` (novo), coordenada com
      `apps/web/modules/scheduling/hours-service.ts` e `reschedule-service.ts`. Registrar
      indisponibilidade efetiva e retirar confirmação/ocupação atomicamente; recuperação isenta no
      mesmo ID, sem impor hora/alterar terceiros, aviso devido e contador preservado. Nova troca
      voluntária após confirmar volta às regras usuais. Atender T062.

### Operação, histórico e comunicação

- [ ] T064 [P] [US3] Escrever `apps/web/modules/scheduling/approval-queue.test.ts` (novo):
      remarcações antes de pedidos novos, origem mais próxima, desempate envio/ID; urgência pelo
      destino e atraso pela entrada em análise, 24h e limites adjacentes, configuração, desativação
      de atraso, fim dos alertas após decisão e nenhuma transição automática. Referências:
      2C-FR-07/21/22; 2C-SC-06/20/21.
- [ ] T065 [US3] Implementar fila paginada em
      `apps/web/modules/scheduling/approval-queue-service.ts` (novo) e estender
      `apps/web/modules/scheduling/access.ts` para vínculo operacional de equipe sob permissões
      existentes, sem concessão implícita. Aplicar a mesma ordenação no servidor/paginação;
      registrar atuação principal/backup, idade e alertas independentes. Ampliar
      `apps/web/tests/integration/scheduling-channel-access.test.ts` para disputas/revogação.
- [ ] T066 [US3] Implementar listagem/detalhe/histórico autorizados em
      `apps/web/modules/scheduling/channel-query-service.ts` e projeção para histórico individual em
      `apps/web/modules/scheduling/booking-service.ts`. Não ocultar registros aguardando nova data
      quando origem passou; conservar autor e beneficiário distintos, LC/bloqueios atuais e
      histórico append-only. Testar em
      `apps/web/tests/integration/scheduling-channel-access.test.ts`; integrar à fronteira existente
      de 002 sem criar histórico/contas de compras. Referências: FR-04/12; SC-01/03/11.
- [ ] T067 [P] [US3] Ampliar `apps/web/tests/integration/scheduling-notifications.test.ts`: quatro
      eventos/três meios, titular/dependente independentemente do autor, preferências distintas,
      vínculo revogado antes de envio/retry, ausência de contato, falha/resultado incerto e
      deduplicação. Sem confirmação falsa de pendência ou reversão da reserva. Referências:
      2C-FR-23/24; 2C-SC-22/23.
- [ ] T068 [US3] Implementar preferências pessoais e avisos internos em
      `apps/web/modules/scheduling/notification-service.ts` e schemas de T047; aplicar padrão dos
      três meios somente conforme conciliação de T044, sem apagar supressões antigas. Resolver
      destinatários pelo beneficiário/vínculo atual, permitir edição pessoal versionada no app e
      preservar consulta de estado/histórico com avisos desligados.
- [ ] T069 [US3] Implementar handler em `apps/worker/src/jobs/scheduling-notifications.ts` (novo),
      integrado ao bootstrap `apps/worker/src/main.ts`, registro permitido em
      `apps/worker/src/queues.ts` e jobs existentes. Validar envelope versionado/IDs e revalidar
      pessoa/vínculo/preferências/contato imediatamente antes de cada envio/reenvio; usar correlação
      e reconciliação para resultado incerto, tentativas finitas e redrive auditado de T044. Validar
      falhas sintéticas em `apps/worker/src/jobs/scheduling-notifications.test.ts` (novo); prova
      real de entrega só em ambiente/contatos autorizados. Para WAHA, persistir
      instância/sessão/messageId, processar message.ack autenticado e duplicado/fora de ordem, e
      testar desconexão/timeout sem reenvio cego. Vincular callback POST
      /api/v1/integrations/waha/events à validação HMAC de channels §10.2, com segredo fora de logs,
      corpo bruto e deduplicação; confirmar destino físico em T040. Testar orçamento persistido de 5
      envios seguros, reentrega sem zerar contador e consultas de reconciliação sem envio. Não
      ativar campanhas bloqueadas ou prometer exactly-once.

### Contratos HTTP e integração das experiências

- [ ] T070 Após identidade T041 e UI01/T043 verificáveis (sem login/cadastro paralelo), [US3]
      Vincular todas as operações de `contracts/channels.md` em
      `apps/web/modules/scheduling/http/channel-routes.ts` (novo) e rotas versionadas de channels
      §1.3, com sessão e ausência de colisões verificadas por T041. Criar
      `apps/web/modules/scheduling/http/channel-routes.test.ts` (novo) antes da vinculação:
      autorização, entrada inválida, versão/replay, limite de corpo/página, não cachear privado,
      isolamento entre público/associado/equipe e compatibilidade administrativa.
- [ ] T071 [US3] Integrar gestão de políticas/equipe, fila/decisão/recuperação e publicação em
      `apps/web/modules/scheduling/ui/`, preservando componentes e navegação existentes. Rótulos
      Salvar/Publicar e Salvar alterações/Publicar alterações, cada descrição sempre visível abaixo
      do botão e acessível; erro preserva edição e estado real. Caminhos de componentes concretos
      devem constar do mapeamento de T043 antes de editar. Cobrir
      `apps/web/tests/e2e/scheduling.spec.ts` com teclado/390px/temas e guia CAAB.
- [ ] T072 Após UI01/UI02 especificadas e consumidor real localizado, [US3] Especificar o encaixe
      verificável dos consumidores de 002 UI01/UI02 em
      `specs/008-scheduling-management/contracts/channels.md`: beneficiário primeiro, profissionais
      condicionais, revisão, aviso da liberação da origem, situação manual, contagem confirmada/em
      andamento, recuperar/cancelar, preferências e histórico. Incluir editar
      data/horário/profissional e transferir para dependente antes do aceite, serviço preservado,
      conflito recuperável, versão obsoleta e pedido inicial cujo horário passou escolhendo nova
      data. Mostrar apenas ações autorizadas; manter login geral. Conservar caminhos/IDs da spec
      própria definida em T043 e seus testes; não duplicar tarefas de construção da interface
      externa dentro de 008.
- [ ] T073 [US3] Validar consumo por app/site/painel e revisão única em
      `apps/web/tests/integration/scheduling-channel-contract.test.ts` (novo), com clientes
      sintéticos identificados; registrar compatibilidade da interface real de UI02 em
      `specs/008-scheduling-management/evidence/channels-validation.md` (novo). Exigir mesma
      reserva/estado/histórico e revisão publicada após recarga em ambos os canais;
      edição/transferência e acesso após a mudança de beneficiário devem coincidir entre app/site;
      cliente sintético sozinho não conclui a integração real. Referências: SC-01/03/04/18/24.

## Phase 4 — Polish e saída

- [ ] T074 Executar matriz concorrente completa V01–V12 de
      `specs/008-scheduling-management/quickstart.md` no PostgreSQL descartável, incluindo 20
      envios/retries, capacidade 1/3, recurso/beneficiário global, clocks após lock, vínculos/
      políticas concorrentes, rollback e versões. Registrar commit, casos e resultados em
      `specs/008-scheduling-management/evidence/channels-validation.md`; zero testes encontrados ou
      suite histórica não é aprovação.
- [ ] T075 [P] Validar jornada real de UI01/UI02 e painel por teclado, 390px, temas, foco, mensagens
      e contraste conforme WCAG 2.2 AA e `docs/caab-design.md`; registrar capturas, negações, perda
      de sessão, conflitos e decisões por ambos os canais em
      `specs/008-scheduling-management/evidence/channels-ui-validation.md` (novo). Exige clientes
      implementados na spec responsável, não só contratos/simulações.
- [ ] T076 Executar gates da stack e revisão específica de autorização, privacidade, agenda, jobs,
      migrations e auditoria; verificar p95 <= 2s das telas comuns com massa/ambiente/ amostra
      documentados, sem aplicar alvo a entrega de provedor. Registrar resultados e limitações em
      `specs/008-scheduling-management/evidence/channels-validation.md`. Rodar formatação documental
      explícita dos arquivos alterados, lint/types/testes/build/ segurança aplicáveis; não repetir
      CI só por documentação ou reativar localhost.
- [ ] T077 Ensaiar upgrade/retorno compatíveis com dados sintéticos e concluir reconciliação de
      integração/inventário em `specs/008-scheduling-management/legacy-parity.md`,
      `specs/008-scheduling-management/plan.md` e
      `specs/008-scheduling-management/evidence/channels-validation.md`. Registrar pré-condições,
      único escritor, IDs/contadores preservados, sinais de falha e rollback sem perda; prova real
      de acesso/entrega e revisão humana específica são gates. Preparar resultado revisável;
      ativação/corte, PR e merge dependem de autorização própria.

## Dependências e ordem

T040–T043 → T044–T050 → US3/T051–T073 → T074–T077. Na fundação: T041 → T046 → T047; T045 → T048;
T047/T048 → T049/T050. Testes de cada grupo antecedem seu código. Dentro de US3, oferta → vagas →
criação → troca/decisão/cancelamento → recuperação → fila/histórico/avisos → HTTP/integração. T068 →
T069; T044 bloqueia adaptador/entrega; T041 bloqueia acesso real; T043/UI01 bloqueiam UI e UI02
bloqueia homologação dos consumidores. T042 bloqueia conclusão da transição/corte; não autoriza
banco real. AC/BEN/BLQ são dependências técnicas a conciliar em T040, não novas entregas duplicadas.

T048 só inicia após T030–T032 validados, T041/UI01/T043 definidos e T045 registrar a migration
posterior com substituições explícitas. T070 exige T041/UI01/T043, validação de sessão e
compatibilidade dos caminhos propostos em T041; rotas administrativas não se tornam acesso de
associado. Essa condição é explícita: a lista está gerada, mas ainda não está toda liberada para
execução.

## Paralelismo seguro

[P] indica trabalho em arquivo próprio após os pré-requisitos comuns, não autorização para iniciar
agentes. T046 pode ser preparado junto de T044/T045, após Setup, pois muda arquivo distinto. Em US3,
os testes T051/T054/T056/T058/T062/T064 podem ser preparados em paralelo com contratos/ modelo
estáveis; implementações que compartilham booking-service, access, contratos ou migrations seguem em
sequência. T067 depende da base de testes criada em T050, mas não dos demais testes de US3. T075
pode executar junto de T074 com ambientes e relatórios separados; T076 reúne as evidências. Não
editar o mesmo arquivo simultaneamente.

## Estratégia incremental

Primeiro marco: publicação e primeira reserva imediata/manual com identidade, autoria, ocupação e
avisos devidos comprovados em ambiente sintético. É validação interna, não lançamento parcial.
Segundo: ciclo completo de troca/cancelamento/recuperação e operação da equipe. Terceiro:
consumidores reais, comunicação e transição homologados. MVP externo conserva todo o recorte 2C
aceito; não omitir remarcação, cancelamento, histórico ou canais acordados para antecipar
publicação. Não executar implementação sem sua autorização.

## Cobertura dos requisitos de 2C

Todas as referências FR/SC desta tabela usam o prefixo 2C. T074–T077 consolidam as evidências;
cobertura documental não significa teste aprovado.

| Requisitos        | Tarefas principais            | Critérios                                                       |
| ----------------- | ----------------------------- | --------------------------------------------------------------- |
| FR-01/02          | T041/T047/T049/T053/T070/T073 | SC-01/03                                                        |
| FR-03             | T045/T048/T056/T057/T060      | SC-01/02                                                        |
| FR-04             | T058/T059/T061/T066           | SC-05/08/11                                                     |
| FR-05             | T046/T057/T060/T074           | SC-16                                                           |
| FR-06             | T042/T077                     | Inventário/compatibilidade e retorno; sem SC numérico exclusivo |
| FR-07             | T064/T065                     | SC-06                                                           |
| FR-08             | T054/T055/T058/T059           | SC-07                                                           |
| FR-09             | T061                          | SC-08                                                           |
| FR-10             | T058/T059                     | SC-09                                                           |
| FR-11             | T045/T048/T058/T059/T060      | SC-10                                                           |
| FR-12             | T066/T073                     | SC-11                                                           |
| FR-13             | T054/T055/T071/T072           | SC-12                                                           |
| FR-14             | T045/T048/T054–T057/T074      | SC-13                                                           |
| FR-15/16          | T054/T055/T060                | SC-14/15                                                        |
| FR-17             | T058/T060                     | SC-16                                                           |
| FR-18             | T058/T059/T061                | SC-17                                                           |
| FR-19             | T051/T052/T071/T073           | SC-18                                                           |
| FR-20             | T061/T062/T063/T067           | SC-19                                                           |
| FR-21             | T049/T060/T064/T065           | SC-20                                                           |
| FR-22             | T064/T065/T071                | SC-21                                                           |
| FR-23/24          | T044/T050/T067–T069/T072      | SC-22/23                                                        |
| FR-25             | T047/T049/T053/T055/T060/T072 | SC-24                                                           |
| Acessibilidade/UX | T043/T071–T073/T075           | SC-04                                                           |

## Histórico e backlog anterior — não executar automaticamente

<details>
<summary>Arquivo histórico: não executar comandos ou tarefas desta seção</summary>

Texto preservado por rastreabilidade; imperativos e autorizações abaixo pertencem às datas
originais. Somente o corpo ativo acima orienta execução; pendências coordenadoras AC/BEN/BLQ/DX são
rastreabilidade, sem segunda fila.

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

- [x] BEN01 Diagnosticar conflitos preexistentes e preparar migration aditiva com restrição por
      beneficiário/intervalo, preservando dados e restrição profissional; resolução de dados
      existentes depende de decisão explícita.
- [x] BEN02 Revalidar conflito do beneficiário na criação/remarcação transacional, com resposta
      recuperável na interface, distinguindo associado e cada dependente pelo identificador da
      pessoa atendida.
- [x] BEN03 Validar concorrência, sobreposição parcial, unidades/profissionais diferentes,
      titular/dependentes independentes, canceladas, horários adjacentes e rollback da remarcação em
      banco descartável; cobrir jornada por interface e registrar evidências reais.

BEN01 → BEN02 → BEN03 concluídos localmente em 28/09 por T029–T032, com testes novos.

- [x] BLQ01 Aplicar FR-017 nas consultas e sinalização textual da agenda/detalhes, preservando
      reservas, ocupação e estados; coordenar regra de vínculos/bloqueio com spec 005.
- [x] BLQ02 Validar SC-007 com titular, dependentes afetados e pessoas sem vínculo,
      criação/remarcação negadas e cancelamento manual auditado; registrar evidências de banco e
      interface.

BLQ01 → BLQ02 concluídos localmente em 28/09 por T033/T034; PostgreSQL e E2E aprovados.

## Calendário administrativo — autorizado em 18/09/2026

Decisão atual supera a prioridade anterior de T022. Código integrado pelo PR34. A branch original
não recebe trabalho novo; retomada na entrega vigente do mapa local, com checkpoint.md atualizado.

- [x] CAL01 Registrar escopo, pesquisa oficial, contratos, plano e estratégia de validação.
- [x] CAL02 Escrever testes de intervalo/limites/filtros/autorização e consulta de calendário.
- [x] CAL03 Implementar GET calendar limitado e autenticado, preservando listagem diária.
- [x] CAL04 Integrar FullCalendar mês/semana/dia, URL/filtros, tokens, fuso e estados acessíveis.
- [x] CAL05 Cobrir jornada real de reservas, recarga/navegação, mobile/temas e fuso no E2E.
- [x] CAL06 Encerrar a revisão do conjunto e das evidências visuais, reconciliar documentação com o
      CI registrado e conferir a base integrada em dev. PR34 já integrado: não alterar seus
      metadados nem reutilizar sua branch. Leitura estática não conclui esta validação.

CAL06 encerrada em 28/09: checks finais do PR34 e quatro capturas revisados; ver
evidence/implement-2026-09-28.md. Não homologa alterações novas.

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
      primeira interface do usuário no app/site (UI01/UI02 do programa 002). Revisão de 24/09/2026:
      refletir nos contratos/tarefas de 2C a liberação da origem no envio bem-sucedido da
      remarcação, retenção apenas do destino, falha transacional preservando origem e
      recusa/desistência sem restauração automática. Preservar histórico, prioridade pelo início
      original e contagem. Retomada após recusa/desistência usa o mesmo registro sem horário
      confirmado, mesmo após início original, sem reaplicar suas 24 horas; validar destino
      futuro/horizonte e demais guardas. Contar por ciclo de troca: primeiro pedido reserva uma
      utilização, alternativas/recusas/retomadas preservam o ciclo e aprovação consolida a mesma
      utilização uma vez; outra mudança após aprovação inicia novo ciclo. Validar confirmadas
      voluntárias + ciclo debitável ativo <= 2, retry, concorrência e cancelamento sem horário.
      Incluir 2C-FR-20/2C-SC-19: indisponibilidade registrada pela equipe, recuperação isenta no
      mesmo ID mesmo com duas trocas usadas, sem prazo de origem, bloqueio efetivo do
      recurso/período preservado, aviso devido e histórico. Alternativas/recusas da recuperação não
      debitam utilização; após confirmar, novas trocas voluntárias seguem limite. Validar causa
      autorizada, zero vagas sem escolha, um destino por vez e ambos os modos de agenda. Incluir
      Salvar/Publicar no cadastro: salvar sem exposição e publicar com persistência atômica numa
      ação, permissão, validação e retry. Incluir Salvar alterações como rascunho separado e
      Publicar alterações como gravação/publicação atômica da edição, sem salvar antes. Validar
      isolamento dos valores públicos, reabertura, concorrência, preservação da publicação anterior
      em falha e guardas de reservas existentes/disponibilidade operacional. Incluir descrições
      curtas e sempre visíveis abaixo de cada botão, no cadastro e na edição, com associação
      acessível e revisão responsiva conforme 2C-FR-19. Publicação conjunta em app/site, sem
      seleção/configuração por canal: contratos usam estado e revisão únicos; validar atualização
      das projeções/caches dos dois e isolamento do rascunho. Incorporar 2C-FR-21–25/2C-SC-20–24:
      equipe vinculada principal e colaboradores autorizados como backup; alerta após 24 horas
      corridas configurável/desativável sem expiração; urgência independente quando faltarem 24
      horas para o atendimento, configurável por serviço, calculada pelo destino solicitado sem
      mudar a prioridade baseada na origem. Jornada começa no beneficiário e filtra público-alvo
      publicado, incluindo exclusividade de titular revalidada em todos os comandos. Avisos para
      dependente e titular vigente independentemente de autoria, com preferências pessoais por
      canal. Coordenar contratos de comunicação com T023, mantendo provedores/entrega como
      dependência. Verificar os acessos individuais existentes de titulares/dependentes informados
      pelo usuário e mapear à pessoa em Associados, sem criar login paralelo ou presumir migração de
      credenciais. Checkpoint de 24/09: contrato lógico v1 em contracts/channels.md, estruturas
      propostas em data-model.md e matriz V01–V12 em quickstart.md produzidos; fechar vínculo HTTP,
      schemas executáveis, integração de acesso e UI01/UI02 antes de concluir esta tarefa.
      Cancelamento de pedido novo em análise autorizado em 24/09 (2C-FR-09/2C-SC-08): antes do
      início solicitado, sem aprovação da equipe, com liberação imediata, saída da fila/alertas,
      histórico/contador preservados e aviso sem duplicação. Validar versão, corrida com aprovação/
      recusa, acesso familiar, ambos os modos de agenda e replay autorizado após início. Validar
      revogação e continuidade com identidades sintéticas.
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
      Reutilizar jobs/worker da fundação; resolver entrega incerta e retry/reenvio auditado sem fila
      paralela, reativação de campanhas antigas ou conversão não verificada de supressões.
- [ ] T024 [US3] Criar matriz de equivalência validada com o legado em
      specs/008-scheduling-management/legacy-parity.md; manter sugestões novas separadas em
      roadmap.md. Conferir existência de reservas futuras em uso, ainda desconhecida conforme
      resposta C de 24/09; registrar fonte/data/versão, contagens, situações e correspondências. Não
      presumir agenda vazia nem liberar corte sem inventário e reconciliação verificáveis.

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

- [x] AC01 Incluir consultar/alterar Agendamentos no catálogo/gestão existentes, com alteração
      dependente de consulta; definir transição técnica preservando contas e dados; não inferir
      novas concessões a partir de Q4.
- [x] AC02 Exigir consulta nas páginas, calendário, catálogo, disponibilidade e seleção de
      beneficiários, e consulta+alteração nos comandos de oferta/horários/reservas; ocultar barra
      lateral/busca/Início sem concessão e preservar leitura mínima de Associados.
- [x] AC03 Validar sem acesso, somente consulta, consulta+alteração e alteração sem consulta
      recusada, revogação, URL/API direta e três superfícies de descoberta, mantendo conflitos de
      reserva e auditoria; registrar evidências reais.

AC01/AC02 concluídos pelo PR #36 (af6f096), conferidos por leitura em dev 89d2356 em 28/09. T027
concluído localmente em 28/09. AC03 também concluída: matriz PostgreSQL e E2E de todas as
superfícies; ver evidence/plan-2026-09-21-validation.md.

## Exportação transversal — revisão de 21/09/2026

- [x] DX01 Detalhar, implementar e validar a exportação de Agendamentos, oferta e horários conforme
      002 EXP06/EXP07 e docs/EXPORT-STANDARD.md: ação nomeada, filtros pertinentes, seleção/ordem de
      colunas, Excel/CSV/PDF integrais e download direto, consulta ao módulo mais permissão geral,
      recusa de campos restritos e revogação. Sem teto funcional, fila/histórico obrigatório ou
      prazo de download; sem alterar anexos/documentos. A07 resolvido localmente em 28/09 por
      T025/T026/T035–T038. Tarefa do módulo que executa a coordenação transversal, não um segundo
      projeto.

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

## Phase 7: Convergence

Revisão estática de 30/09/2026, após analyze, no recorte administrativo vigente. Esta fase registra
lacunas de implementação; não reabre app/site, entrega de mensagens ou CI já pendentes. Atualização
de 30/09/2026: as três correções foram implementadas localmente e receberam quatro regressões de
integração. 162 unitários e 19 integrações PostgreSQL aprovados, além de tipos, lint e formato.
T103–T105 concluídas; ver [checkpoint](checkpoint.md). Banco sintético descartável autorizado nesta
conversa, criado e removido pela suíte; painel e banco CAAB de uso não iniciados.

- [x] T103 CRITICAL — Revalidar a disponibilidade do intervalo efetivamente retido na aprovação em
      `apps/web/modules/scheduling/booking-workflow.ts`, conforme Constituição III, 2C-FR-03/20 e
      T082/T083 (partial). O ramo `approve` consulta oferta/beneficiário e horário futuro, mas não
      verifica `scheduling_resource_block`. Cobrir pedido pendente por capacidade cujo intervalo se
      tornou indisponível após recuperação de outro atendimento do serviço: negar confirmação,
      preservando versão, ocupação e histórico do pedido. Validar dentro da transação, excluindo a
      própria ocupação e preservando início/fim/duração contratados; não recalcular a reserva pela
      grade ou duração atual. Adicionar regressão em
      `apps/web/tests/integration/scheduling-workflow.test.ts` para bloqueio superveniente,
      fronteiras sem sobreposição, aprovação válida e concorrência, sem alterar terceiros.
- [x] T104 CRITICAL — Completar a auditoria de salvar/publicar serviço no caminho
      `saveSchedulingCatalog` de `apps/web/modules/scheduling/catalog-service.ts`, conforme
      Constituição V, FR-011/SC-004, 2C-FR-19 e T081 (partial). Atualmente o formulário altera
      políticas/publicação, mas grava somente evento genérico created/updated com nome, ativo,
      duração e versão; não distingue publicação nem preserva as mudanças de política. Registrar
      ação de publicação e mudanças permitidas da política/revisão com autoria, versão e correlação
      na mesma transação, incluindo os valores necessários para rastrear a alteração, sem dados
      sensíveis. Harmonizar com `service-policy.ts`; testar salvar rascunho, publicar, republicar,
      falha/rollback e retry idempotente sem duplicar eventos em
      `apps/web/tests/integration/scheduling-workflow.test.ts`.
- [x] T105 HIGH — Gerar intenção durável de confirmação quando editar o destino de uma troca
      pendente a confirma imediatamente pela política vigente, conforme 2C-FR-10/23, plan: intenção
      junto ao evento de domínio e T084 (partial). Em
      `apps/web/modules/scheduling/booking-workflow.ts` a ação resulta em `pending_edited`, mas
      `apps/web/modules/scheduling/booking-service.ts` exclui esse evento da geração de `confirmed`.
      Cobrir a transição pending_approval → scheduled sem notificar mera edição ainda pendente;
      manter intenção e evento no mesmo commit e deduplicar retries. Adicionar regressão em
      `apps/web/tests/integration/scheduling-workflow.test.ts` com troca pendente, alteração da
      política para confirmação imediata, edição do destino, contador consolidado uma vez e
      exatamente uma intenção de confirmação. Não implementar transporte externo.
