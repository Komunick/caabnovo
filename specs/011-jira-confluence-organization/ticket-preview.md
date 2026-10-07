# Prévia de classificação

Base: leitura dos 37 tickets e 41 PRs nesta sessão; decisões de Clarify em 01/10/2026. Esta tabela é
proposta de destino, não comprova atualização remota. Antes de aplicar, completar o manifesto com
valores atuais, evidências por campo e responsáveis, conforme o contrato.

| Ticket  | Destino proposto                      | Motivo / limite                                                                                            |
| ------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| CAAB-2  | Tarefa: e-mail transacional           | Incorporar aceite do 21; preservar compromisso da futura caixa de entrada com definição própria vinculada. |
| CAAB-3  | Tarefa concluída                      | Preservar conclusão; apenas correções comprovadas.                                                         |
| CAAB-4  | Histórico de planejamento             | Implementação genérica; preservar status e referências.                                                    |
| CAAB-5  | Histórico de planejamento             | UI/UX genérica; preservar status e referências.                                                            |
| CAAB-7  | Tarefa concluída                      | Preservar conclusão e evidências.                                                                          |
| CAAB-8  | Tarefa concluída                      | Preservar conclusão e evidências.                                                                          |
| CAAB-9  | Tarefa concluída                      | Preservar conclusão e evidências.                                                                          |
| CAAB-10 | Tarefa concluída                      | Preservar conclusão e evidências.                                                                          |
| CAAB-11 | Tarefa concluída                      | Preservar conclusão e evidências.                                                                          |
| CAAB-12 | Tarefa concluída                      | Preservar conclusão e evidências.                                                                          |
| CAAB-13 | Tarefa concluída                      | Preservar conclusão e evidências.                                                                          |
| CAAB-14 | Tarefa concluída                      | Corrigir referência obsoleta a MFA com evidência do PR13; não reativar requisito.                          |
| CAAB-15 | Tarefa concluída                      | Preservar conclusão e evidências.                                                                          |
| CAAB-16 | Tarefa concluída                      | Preservar conclusão e evidências.                                                                          |
| CAAB-17 | Tarefa concluída                      | Preservar conclusão e evidências.                                                                          |
| CAAB-18 | Tarefa independente                   | Restrição de cadastro público tem resultado próprio.                                                       |
| CAAB-19 | História                              | Gestão de cargos e acessos.                                                                                |
| CAAB-20 | Subtarefa de 19                       | Recorte dependente com acompanhamento próprio.                                                             |
| CAAB-21 | Consolidado em 2                      | Teste rotineiro vira aceite; manter original, vínculo e status.                                            |
| CAAB-22 | Tarefa independente ligada a 23 e 24  | Motor compartilhado; não confundir com integração nos módulos.                                             |
| CAAB-23 | História: opção de download           | Checklist dos módulos; não criar N1–N5.                                                                    |
| CAAB-24 | Tarefa com duas subtarefas            | Separar análise detalhada sem agrupamento do restante; escopo total preservado.                            |
| CAAB-25 | Tarefa independente                   | Autorização de download legado; não é duplicata do motor novo.                                             |
| CAAB-26 | Tarefa filha de 37                    | Atribuir somente com PR correspondente e histórico.                                                        |
| CAAB-27 | Tarefa filha de 37                    | Trabalho local não integrado não comprova PR nem homologação.                                              |
| CAAB-28 | Tarefa filha de 37                    | PR36 sustenta autoria da base por Gabriel-Komunick; confirmar recorte atual.                               |
| CAAB-29 | História                              | Tema Cores Legado.                                                                                         |
| CAAB-30 | História filha de 37                  | App/site adiados, sem confundir com painel implementado.                                                   |
| CAAB-31 | Tarefa                                | Homologação externa OAB é entrega específica, não QA rotineiro.                                            |
| CAAB-32 | Tarefa de definição                   | Carteira digital; não impor spike.                                                                         |
| CAAB-33 | Tarefa de definição                   | Canal institucional; não impor spike.                                                                      |
| CAAB-34 | Confluence: Funcionalidades previstas | Portal de Parceiros junto a CAASSH; manter ticket e vínculo.                                               |
| CAAB-35 | Confluence: Funcionalidades previstas | CAASSH aguarda revisão, não é funcionalidade descartada.                                                   |
| CAAB-36 | Confluence: Sugestões                 | RH separado; não duplicar gestão atual de Colaboradores.                                                   |
| CAAB-37 | Épico                                 | Agendamentos agrega entregas independentes.                                                                |
| CAAB-38 | Tarefa                                | Conciliação documental concreta.                                                                           |
| CAAB-39 | Tarefa                                | Guia de design concreto.                                                                                   |

## Novos registros condicionados à busca de equivalentes

1. Tarefa filha de 37: aprovações, remarcação e recuperação administrativas.
2. Tarefa filha de 37: faltas e justificativas.
3. Tarefa filha de 37: envio operacional real de e-mails, dependente de 2.
4. Subtarefa de 24: exportação da análise detalhada sem agrupamento. PR40 já integrado em `748539d`;
   autor consultado: jailson-komunick. Status deve refletir evidências existentes de QA.
5. Subtarefa de 24: exportação agrupada, resumo e evolução ainda pendentes.

O pai 24 continua com escopo completo e em desenvolvimento enquanto houver implementação restante;
reler status remoto antes de propor qualquer transição. A caixa de entrada terá escopo definido
antes de propor eventual ticket adicional; não aumentar silenciosamente o lote de cinco.

## Fontes

[Jira CAAB](https://komunick.atlassian.net/jira/software/projects/CAAB/boards),
[PR40](https://github.com/Komunick/caabnovo/pull/40),
[PR36](https://github.com/Komunick/caabnovo/pull/36),
[PR13](https://github.com/Komunick/caabnovo/pull/13),
[evidência do recorte de relatórios](../010-reports-analytics/evidence/caab-24-2026-09-30.md). Esta
prévia não registra valores antigos nem accountIds: esses campos serão capturados na preparação do
manifesto para evitar usar dados envelhecidos como comandos de alteração.

## Reconciliação de execução — 01/10/2026

Inventário atualizado: 37 tickets, sete páginas e 41 PRs. Antes/depois e corpos finais em
[manifesto](evidence/change-manifest.md). CAAB-24 está atualmente em QA; propõe-se explicitamente
mudar o pai para Em Desenvolvimento pelo restante não implementado, preservando QA no recorte do
PR40. Nove atribuições propostas têm PR/histórico; 26/27 seguem sem executor comprovado. Checkpoint
local de Agendamentos inclui correções T103–T105 em 30/09, sem integração; não retomar essa frente.
