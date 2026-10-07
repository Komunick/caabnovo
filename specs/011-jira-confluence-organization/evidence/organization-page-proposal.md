# Atualização proposta da página 7143436

Versão publicada observada: 1. Corpo integral abaixo. Não publicado. Preserva exemplo TMS e
incorpora Clarify; não altera escopo do CAAB para incluir TMS.

# Organização do Jira e Confluence — proposta e modelos

Proposta reconciliada com as decisões do usuário de 01/10/2026. Reorganização ainda não aplicada.
Esta página define o padrão de trabalho para toda a equipe. Histórico de decisões permanece nas
versões quando visível, sem duplicar um diário no corpo.

## Tipos conforme a entrega

| Tipo      | Quando cabe                                                        |
| --------- | ------------------------------------------------------------------ |
| Épico     | Objetivo que agrega várias entregas independentes.                 |
| História  | Resultado útil observável para o usuário.                          |
| Tarefa    | Trabalho concreto que não precisa do formato de história.          |
| Subtarefa | Recorte dependente de um pai com acompanhamento próprio.           |
| Bug       | Comportamento observado difere do esperado; incluir reprodução.    |
| Spike     | Investigar uma incerteza definida, com limite e saída verificável. |

Nenhum tipo é obrigatório por convenção. Checklist basta quando não há status ou responsabilidade
independente. Não abrir ticket para cada endpoint, migration, teste ou revisão rotineira.

## Categorias

Usar Categorias (labels existentes): uma natureza principal entre nova-funcionalidade, melhoria,
integracao, manutencao-tecnica e documentacao; adicionar todos os módulos afetados com modulo-*.
Preservar etiquetas de origem. Sugestão é estado de avaliação no Confluence, não tipo imposto no
Jira.

Transferidos/consolidados/históricos mantêm status e vínculos, com transferido-confluence,
consolidado ou historico-planejamento. Uma visão ativa separada exclui essas etiquetas e mantém
itens sem labels. Não apagar registros nem trocar filtro compartilhado do quadro.

## Fluxo e responsabilidade

Backlog → Pronto para Desenvolver → Em Desenvolvimento → Code Review → Em Teste / QA → Pronto para
Deploy → Concluído.

Code Review registra revisão/testes por IA. QA identifica humano, versão, data e resultado antes da
integração; solicitante ou membro designado pode validar. Executor permanece no Assignee durante QA.
Não criar ticket separado para esses testes rotineiros. Homologação de dependência externa pode
constituir entrega própria.

Atribuir por PR correspondente e histórico de quem assumiu o item, sem herdar pessoa do épico. Conta
de automação não prova autor humano. Ausência de QA em merge histórico não reabre automaticamente
ticket: registrar lacuna e preservar status. Perguntas de escopo ficam no item e impedem prontidão;
critérios desconhecidos não são inventados.

## Modelo de ticket

**Título:** resultado específico em linguagem clara. **Solicitante:** pessoa comprovada; caso
contrário, não verificado. **O que se pede:** resultado, público e limites. **Por que é
importante:** problema e impacto. **Sugestão de apresentação:** opcional, distinta do aceite.
**Critérios de aceite:** resultados observáveis, permissões/integridade relevantes e revisão/QA
aplicáveis. **Observações e referências:** spec, dependências, PR, questões abertas e evidências da
versão.

### Exemplo — Download de dados nos módulos

Solicitante original não verificado. História CAAB-23, com checklist de Auditoria, Notícias,
Associados, Parceiros e Agendamentos. Baixar Excel/CSV/PDF completos, com filtros, colunas e
ordenação, autorização atual e exceção de dados da Consulta OAB. Motor CAAB-22 é dependência
compartilhada, não substitui a integração em cada módulo. Registrar implementação, IA, QA e
evidência por módulo; não criar N1–N5.

### Exemplo de linguagem fornecido pelo usuário — TMS

Este exemplo pertence ao TMS, não ao escopo de implementação do CAAB. solicitante do modelo externo
é o solicitante deste exemplo, não o solicitante presumido dos tickets CAAB.

**Título:** Relatórios — Acompanhar tempo de atribuição de LH por região e rota

**Solicitante:** solicitante do modelo externo

**Tipo sugerido:** História

**O que se pede:** relatório diário por região, mostrando LH atribuídas, rotas e tempo entre a LH
aparecer e a atribuição do motorista.

**Por que é importante:** identificar regiões e rotas com atribuição lenta e apoiar a atuação diária
da operação.

**Sugestão de como mostrar:** gráfico diário por região e tabela com dia, região, rota, quantidade
de LH, tempo médio e maior tempo até atribuição. Pode ser somente tabela, se mais legível. Filtros
de período, região e rota.

**Critérios de aceite:**

- [ ] O período mostra as regiões com LH atribuída em cada dia.
- [ ] Cada região permite identificar rotas e tempo até atribuição.
- [ ] Os filtros por região e rota funcionam.
- [ ] Os números correspondem às LH atribuídas no período.
- [ ] A região utiliza a mesma definição do Spot e do Painel do Dia.

**Definições pendentes:** evento que significa “LH aparecer”, data de referência do agrupamento e
tratamento de reatribuições. Não assumir essas regras.

## Organização do Confluence

Visão do projeto; Funcionalidades previstas; Sugestões; Guias de uso; Decisões; Referência técnica;
Banco de Consulta da I.A. CAASSH e Portal de Parceiros têm página conjunta em previstas, aguardando
revisão. RH permanece sugestão separada. Caixa de entrada é próxima funcionalidade, com definição
pendente no CAAB-2. Sugestão aprovada move a mesma página para previstas e vincula execução.

Banco mantém regras e links necessários; stack é referência compartilhada para a equipe, sem cópia
normativa concorrente. Preservar IDs e conferir conteúdo/versão/rascunho antes de publicar.

### Modelo — Funcionalidade prevista

Título; estado atual; objetivo; escopo confirmado; questões abertas; dependências; critério para
execução; referências. Não declarar como implementada por estar planejada.

### Modelo — Sugestão

Título; origem/proponente comprovado; problema; hipótese; benefício; questões; decisão atual e
referências. Não criar execução antes de definir resultado/aceite.

## Prévia individual

| Ticket  | Destino proposto                                                                                |
| ------- | ----------------------------------------------------------------------------------------------- |
| CAAB-2  | Tarefa — Serviço de e-mail transacional e definição da caixa de entrada.                        |
| CAAB-3  | Tarefa — Ajustar informações recebidas pela consulta a OAB.                                     |
| CAAB-4  | Tarefa — Implementação. Histórico de planejamento; preservar status.                            |
| CAAB-5  | Tarefa — UI e UX. Histórico de planejamento; preservar status.                                  |
| CAAB-7  | Tarefa — Adição de fotos de perfil para associados.                                             |
| CAAB-8  | Tarefa — Implementação do modulo: Parceiros.                                                    |
| CAAB-9  | Tarefa — Brainstorme com chatgpt.                                                               |
| CAAB-10 | Tarefa — Geração do plano e PRD.                                                                |
| CAAB-11 | Tarefa — Spec kit.                                                                              |
| CAAB-12 | Tarefa — Analise do codex sobre os modulos.                                                     |
| CAAB-13 | Tarefa — Implementação do modulo: Noticias.                                                     |
| CAAB-14 | Tarefa — Implementação da aba: configurações.                                                   |
| CAAB-15 | Tarefa — Implementação do modulo: Associados.                                                   |
| CAAB-16 | Tarefa — Substituição do modulo usuários por Colaboradores.                                     |
| CAAB-17 | Tarefa — Implementação inicial da aba: Agendamentos.                                            |
| CAAB-18 | Tarefa — Restringir criação de contas ao fluxo administrativo.                                  |
| CAAB-19 | História — Gerenciar cargos e acessos de Administrador, Gestor e Colaborador.                   |
| CAAB-20 | Subtarefa de CAAB-19 — Mostrar apenas funções autorizadas na navegação.                         |
| CAAB-21 | Tarefa — Validação de e-mail incorporada ao CAAB-2. Consolidado no 2; preservar origem/status.  |
| CAAB-22 | Tarefa — Disponibilizar motor compartilhado de download direto.                                 |
| CAAB-23 | História — Baixar dados dos módulos em Excel, CSV e PDF.                                        |
| CAAB-24 | Tarefa — Exportar o conjunto completo de dados em Relatórios.                                   |
| CAAB-25 | Tarefa — Revalidar acesso ao baixar arquivos antigos.                                           |
| CAAB-26 | Tarefa de CAAB-37 — Impedir sobreposição de agendamentos da mesma pessoa.                       |
| CAAB-27 | Tarefa de CAAB-37 — Sinalizar reservas de pessoa bloqueada sem cancelá-las.                     |
| CAAB-28 | Tarefa de CAAB-37 — Separar consulta e alteração em Agendamentos.                               |
| CAAB-29 | História — Disponibilizar o tema Cores Legado.                                                  |
| CAAB-30 | História de CAAB-37 — Permitir agendamento pelo app e site.                                     |
| CAAB-31 | Tarefa — Homologar a consulta oficial à OAB-BA.                                                 |
| CAAB-32 | Tarefa — Definir a carteirinha digital do aplicativo.                                           |
| CAAB-33 | Tarefa — Definir canais institucionais de comunicação.                                          |
| CAAB-34 | Tarefa — Portal de Parceiros — funcionalidade prevista. Página vinculada; manter ticket/status. |
| CAAB-35 | Tarefa — CAASSH — funcionalidade prevista. Página vinculada; manter ticket/status.              |
| CAAB-36 | Tarefa — RH — sugestão em avaliação. Página vinculada; manter ticket/status.                    |
| CAAB-37 | Epic — Agendamentos.                                                                            |
| CAAB-38 | Tarefa — Conciliar a documentação do projeto.                                                   |
| CAAB-39 | Tarefa — Consolidar o guia de design do projeto.                                                |

### Novos registros propostos

- Tarefa de CAAB-37: Operar aprovação, remarcação e recuperação de atendimentos. Status proposto: Em
  Desenvolvimento.
- Tarefa de CAAB-37: Tratar faltas, justificativas e contestações. Status proposto: Em
  Desenvolvimento.
- Tarefa de CAAB-37: Entregar os avisos operacionais de Agendamentos por e-mail. Status proposto:
  Backlog.
- Subtarefa de CAAB-24: Exportar análise detalhada sem agrupamento. Status proposto: Em Teste / QA.
- Subtarefa de CAAB-24: Exportar detalhe agrupado, resumo e evolução sem os limites antigos. Status
  proposto: Backlog.

São até cinco novos registros, condicionados a busca de equivalentes. A caixa de entrada terá
definição antes de eventual novo ticket adicional, sem ampliar silenciosamente esse lote.

## Responsáveis e estado

Nove atribuições propostas a responsável técnico 01: 3, 7, 8, 13, 14, 15, 16, 17 e 28, com
PR/histórico do recorte. responsável técnico 02 permanece em 24; responsável técnico 01 permanece em
37/38. 26/27 não têm PR do recorte e ficam sem atribuição. 4/5 e 9–12 não recebem autoria do escopo
só pela transição de status.

CAAB-24 está em QA, mas o PR40 cobre somente detalhe sem agrupamento. Propõe-se pai Em
Desenvolvimento, subtarefa desse recorte em QA e restante em Backlog. Merge não comprova QA humano.
Concluídos preservam estado; CAAB-14 precisa retirar referência vigente a MFA removido pelo PR13.
CAAB-18/19/20/22 possuem implementação em PRs, sem conclusão/prontidão presumida. PR38 do guia foi
fechado sem merge. Incrementos locais de Agendamentos não equivalem a integração ou ativação.

## Aplicação

Preparar antes/depois e texto final, revisar a prévia, reler concorrência, executar somente
operações autorizadas e verificar cada resultado. Publicar página e conferir vínculo antes de
sinalizar transferência. Bloqueios de capacidade/autoria ficam explícitos; não recriar nem apagar
recursos para contorná-los.

[Quadro CAAB](https://komunick.atlassian.net/jira/software/c/projects/CAAB/boards/9) ·
[Repositório](https://github.com/Komunick/caabnovo) ·
[Regras](https://komunick.atlassian.net/wiki/spaces/CAABNOVO/pages/2621487) ·
[Stack](https://komunick.atlassian.net/wiki/spaces/CAABNOVO/pages/2588776).
