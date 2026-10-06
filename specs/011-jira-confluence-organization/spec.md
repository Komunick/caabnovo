# Organização do Jira e Confluence

Data: 01/10/2026. Estado: aplicação inicial parcial; ajustes de coerência autorizados em 02/10/2026.
Entrega: `docs/jira-confluence-organization-20261001`. Autoria deste registro: CODEX; solicitante da
sessão: mafaltti (Danilo-Komunick), verificado via GitHub em 30/09/2026.

## Objetivo e limites

Revisar individualmente os tickets abertos e concluídos do CAAB, corrigir redundância,
granularidade, tipo, vínculo e responsabilidade com evidência; organizar o Confluence para toda a
equipe. O conjunto inicial contém 37 tickets e consulta a 41 PRs. Atualizar o inventário antes da
execução. Esta especificação rege a organização do trabalho, sem substituir as specs funcionais
001–010. Não implementar funcionalidades, apagar tickets/páginas, iniciar serviços, abrir PR ou
integrar branches. A preparação inicial foi seguida de autorização de aplicação em 01/10. Em 02/10,
o usuário autorizou aplicar os achados da auditoria e atualizar documentação. Preservar prévia
concreta e releitura por operação; não reconfirmar esse escopo já autorizado.

## Complemento de 02/10/2026-CODEX-SOLICITANTE_NAO_VERIFICADO

Identidade não verificada nesta sessão: gh api user retornou HTTP 401. O pedido atual autoriza:

- Completar escopo e evidências dos 12 concluídos, preservando status e lacunas de QA humano.
- Encaminhar para QA Restringir criação de contas ao fluxo administrativo (CAAB-18), Mostrar apenas
  funções autorizadas na navegação (CAAB-20) e Disponibilizar motor compartilhado de download direto
  (CAAB-22), com critérios humanos pendentes explícitos.
- Conciliar Gerenciar cargos e acessos de Administrador, Gestor e Colaborador (CAAB-19) como
  implementação parcial em Desenvolvimento; regra de contas sem cargo permanece indecidida.
- Incluir M016/T003 em Definir canais institucionais de comunicação (CAAB-33).
- Preservar históricos fora da visão ativa; completar conversão/filtro conforme capacidade.
- Atualizar inventário local e páginas responsáveis, sem implementar produto ou retomar pausas.
- Citar tickets por título e código, sem links de tickets.

## Cenários e aceite

### US1 — Entender o trabalho real (P1)

Como integrante da equipe, quero tickets que representem entregas compreensíveis, com escopo e
aceite.

1. Dado o inventário completo, cada ticket tem uma decisão individual e sua justificativa.
2. Dadas tarefas semelhantes, comparar resultado, escopo e aceite antes de declarar redundância.
3. Dada uma atividade pequena, usar checklist, salvo necessidade de responsável ou status
   independente.
4. Dado um escopo grande, separar entregas demonstráveis sem impor histórias, épicos ou spikes.

### US2 — Confiar em responsáveis e andamento (P1)

1. Para itens além do Backlog, confrontar autor do PR correspondente e histórico de transição.
2. Em conflito ou ausência de evidência, registrar pendência; não atribuir por parentesco ou
   automação.
3. Code Review registra revisão/testes por IA; QA registra validação humana identificada antes de
   integração.
4. Executor permanece responsável durante QA. O solicitante ou membro designado pode validar.
5. Merge antigo sem prova de QA preserva status, com lacuna explícita; não reabrir automaticamente.

### US3 — Encontrar decisões e propostas (P2)

1. Confluence contém visão, funcionalidades previstas, sugestões, guias, decisões e referência
   técnica.
2. Banco de Consulta da I.A. continua existindo; regras e stack são conciliadas com fontes vigentes.
3. Sugestão aprovada mantém a mesma página, movida para Funcionalidades previstas e ligada à
   execução.
4. Havendo histórico visível de versões, o corpo apresenta apenas o conteúdo vigente.

### US4 — Revisar antes de aplicar (P1)

1. Prévia mostra antes/depois, evidências, vínculos, responsáveis e incertezas por item.
2. Aplicação futura verifica mudanças concorrentes e confirma o resultado de cada operação.
3. Registro separado resume decisões, ações efetivas, evidências e pendências sem transcrever a
   conversa.

## Requisitos

- FR01: cobrir todos os tickets abertos e fechados, preservando chaves, comentários e histórico.
- FR02: classificar pelo propósito: épico agrega entregas; história expressa resultado para usuário;
  tarefa entrega trabalho concreto; subtarefa tem pai e acompanhamento independente; bug corrige
  comportamento esperado; spike responde incerteza definida com limite e resultado. Não forçar
  tipos.
- FR03: manter tarefas rotineiras de testes/revisão no aceite e no fluxo; homologação externa pode
  constituir entrega própria. Similaridade de título não comprova duplicidade.
- FR04: usar Categorias (`labels`, após conferir metadados): uma natureza principal entre
  `nova-funcionalidade`, `melhoria`, `integracao`, `manutencao-tecnica`, `documentacao`, mais todos
  os módulos afetados (`modulo-*`). Preservar etiquetas de origem e reconciliar conflitos
  explicitamente.
- FR05: itens transferidos/consolidados/históricos mantêm status e recebem vínculo e etiqueta
  `transferido-confluence`, `consolidado` ou `historico-planejamento`. Preparar visão ativa
  separada; não alterar filtro compartilhado nem apagar registros.
- FR06: manter fluxo existente: Backlog → Pronto para Desenvolver → Em Desenvolvimento → Code Review
  → Em Teste / QA → Pronto para Deploy → Concluído. Não avançar status por inferência.
- FR07: escopo/aceite ausentes ficam como perguntas no próprio item e impedem Pronto para
  Desenvolver.
- FR08: CAASSH e Portal de Parceiros ficam juntos em página própria de Funcionalidades previstas,
  aguardando revisão. RH é sugestão separada. Caixa de entrada é próxima funcionalidade confirmada,
  com definição pendente antes de prontidão, sem inventar canais ou comportamentos.
- FR09: preservar páginas existentes e seus IDs; reconciliar regras e stack sem promover
  planejamento ou documentação antiga a prova de implementação/homologação.
- FR10: modelo textual deve conter solicitante comprovado, o que se pede, por que importa, critérios
  verificáveis e observações; sugestão de apresentação é opcional. Não exigir fórmula de história.
- FR11: só criar itens ausentes após busca de equivalentes. Proposta inicial: até cinco registros,
  sendo três tarefas de Agendamentos e duas subtarefas do CAAB-24, sujeitos à atualização do
  inventário.
- FR12: toda alteração futura exige prévia concreta, controle de concorrência e releitura de
  confirmação.

## Clarificações — sessão de 01/10/2026

| Questão                      | Decisão do usuário                                                             |
| ---------------------------- | ------------------------------------------------------------------------------ |
| Escopo parcialmente entregue | Usar subtarefas quando houver acompanhamento independente; aplicar ao CAAB-24. |
| 1 — Quem faz QA              | Solicitante ou integrante designado, identificado.                             |
| 2 — Assignee no QA           | Manter executor; registrar validador na evidência.                             |
| 3 — Responsáveis 26–28       | Buscar autor do PR correspondente; não herdar responsável do pai.              |
| 4 — Merge histórico sem QA   | Preservar status e registrar ausência de evidência.                            |
| 5 — Módulos                  | Todos os módulos afetados e uma natureza principal.                            |
| 6 — Sugestão aprovada        | Mover a mesma página para Funcionalidades previstas e vincular execução.       |
| 7 — Caixa de entrada         | Uma das próximas funcionalidades; não classificar como sugestão descartável.   |
| 8 — Registro Markdown        | Resumo de evolução, decisões, ações, evidências e pendências.                  |
| 9 — Histórico no corpo       | Desnecessário quando o sistema oferece histórico visível.                      |
| 10 — Falta de definição      | Perguntas no próprio item; não avançar para pronto.                            |

## Casos de borda

PR cobre apenas parte do ticket; autor do PR difere de quem mudou status; alterações concorrentes;
ticket com filhos não pode virar subtarefa diretamente; tipos indisponíveis no projeto; página com
rascunho desconhecido; item novo equivalente; documentação de worktree ainda não integrada. Nesses
casos, preservar dados, registrar o bloqueio específico e continuar operações independentes.

## Entidades

Ticket, evidência, proposta de alteração, página de conhecimento e decisão. Estrutura operacional em
[data-model.md](data-model.md); proposta inicial em [ticket-preview.md](ticket-preview.md).

## Sucesso verificável

- SC01: 100% dos 37 itens iniciais com proposta individual; novos itens encontrados também
  inventariados.
- SC02: zero exclusões e zero atribuições humanas sem evidência verificável.
- SC03: toda transferência ou consolidação com origem/destino rastreáveis e status preservado.
- SC04: todas as páginas alteradas com versão/ID e confirmação; nenhuma duplicação involuntária.
- SC05: zero itens declarados prontos com perguntas de escopo/aceite ainda abertas.
- SC06: prévia e registro distinguem proposta, execução, implementação e homologação.

## Premissas

Complemento autorizado pelo usuário em02/10/2026: auditar os repasses de quatro instâncias,
recomendar integração e assegurar cobertura Jira do que entregaram, executam ou vão executar.
Corrigir ausências por critério explícito no ticket responsável ou decisão independente, sem
duplicar tarefas de teste rotineiro. Recomendação de merge não autoriza sua execução; limitações de
operação nativa permanecem registradas até confirmação.

Complemento autorizado em 02/10/2026: publicar no Jira, Confluence e documentação os achados da
inspeção integral e três frentes simultâneas, com Agendamentos prioritário. Preservar critérios,
responsáveis e QA. Execução pelas instâncias do usuário; publicação não comprova implementação.

Usar projeto CAAB, espaço CAABNOVO e repositório Komunick/caabnovo. O exemplo de relatório TMS/LH,
solicitado por João Paulo, orienta apenas a escrita; não pertence ao escopo funcional do CAAB. Dados
de autoria da sessão não substituem solicitantes históricos sem comprovação.
