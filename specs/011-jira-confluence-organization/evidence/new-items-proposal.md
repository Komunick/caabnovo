# Novos registros propostos

Busca integral dos 37 tickets não encontrou equivalentes com estes recortes independentes. CAAB-37 e
CAAB-24 agregam os escopos, não substituem acompanhamento dos recortes. Repetir busca imediatamente
antes de criar. IDs NEW-* são referências locais, nunca números Jira. Status propostos distinguem
implementação local, QA e ausência de início.

## NEW-ADMIN — Operar aprovação, remarcação e recuperação de atendimentos

Tipo: Tarefa. Pai: CAAB-37. Status proposto: Em Desenvolvimento. Responsável: sem atribuição.
Categorias: melhoria, modulo-agendamentos.

Solicitante: decisão da conversa registrada na spec008; não atribuir autoria humana da implementação
por inferência.

## O que se pede

Operar no painel pedidos, aprovação, remarcação e recuperação por indisponibilidade conforme
contrato administrativo vigente.

## Por que é importante

Permitir à equipe resolver mudanças de atendimento preservando vagas e histórico.

## Critérios de aceite

- Aprovação revalida elegibilidade e disponibilidade do intervalo.
- Trocas voluntárias respeitam prazo e limite confirmado; recuperação operacional é isenta.
- Pedidos, confirmações e pendências ocupam a capacidade correta.
- Histórico distingue decisão, publicação e intenção de aviso.
- Revisão/testes IA e QA humano identificam versão e resultado.

## Evidências e limites

T078–T086 e correções T103–T105 da spec008 têm evidência local, sem PR/integração. Não repetir
implementação nem retomar a frente pausada. Entrega real dos avisos fica em NEW-EMAIL; app/site em
CAAB-30.

## NEW-ABSENCE — Tratar faltas, justificativas e contestações

Tipo: Tarefa. Pai: CAAB-37. Status proposto: Em Desenvolvimento. Responsável: sem atribuição.
Categorias: nova-funcionalidade, modulo-agendamentos, modulo-associados.

Solicitante: decisão da conversa registrada na spec008; executor humano ainda não comprovado por PR.

## O que se pede

Registrar faltas após o término do compromisso e permitir pedido com texto/comprovante e decisão da
equipe responsável.

## Por que é importante

Aplicar as regras de falta com prazo, possibilidade de resposta e rastreabilidade.

## Critérios de aceite

- Prazo individual de sete dias para pedido e restrição de trinta dias desde registro, sem soma
  automática.
- Reservas preservadas durante oportunidade/análise seguem contrato; cancelamentos respeitam período
  e estado.
- Revisão de mérito exige permissão própria e comprovantes privados.
- Aceitação mostra Falta abonada sem apagar histórico.
- OK apenas fecha aviso; expiração não inventa decisão.
- Revisão IA e QA humano identificados cobrem o recorte.

## Evidências e limites

T090–T102 têm evidência local; sem PR/integração. Cancelar além dos trinta dias é possibilidade
futura T097. Sem envio real; depende de NEW-EMAIL.

## NEW-EMAIL — Entregar os avisos operacionais de Agendamentos por e-mail

Tipo: Tarefa. Pai: CAAB-37. Status proposto: Backlog. Responsável: sem atribuição. Categorias:
integracao, modulo-agendamentos, modulo-comunicacao.

Solicitante: decisão da conversa registrada em T088/T089 da spec008; executor não atribuído.

## O que se pede

Transformar intenções persistidas de avisos operacionais em entrega real pelo serviço de e-mail do
sistema.

## Por que é importante

Uma intenção gravada não garante que titular ou dependente recebeu a informação.

## Critérios de aceite

- Destinatários seguem regras operacionais confirmadas para titular e dependente, independentes de
  campanhas.
- Retry não duplica entrega; falhas e estados são rastreáveis sem expor dados desnecessários.
- Evidência distingue intenção, processamento e resultado do provedor.
- Integração é validada por IA e por humano identificado em ambiente autorizado.

## Observações

Depende de CAAB-2. T089 ainda pendente. Não presumir ativação de WAHA, campanhas ou caixa de
entrada. Confirmar transporte e ambiente antes de pronto.

## NEW-DETAIL — Exportar análise detalhada sem agrupamento

Tipo: Subtarefa. Pai: CAAB-24. Status proposto: Em Teste / QA. Responsável: Jailson Junior.
Categorias: melhoria, modulo-relatorios, modulo-exportacoes.

Solicitante original não verificado. Executor: Jailson Junior, PR40 e histórico de CAAB-24.

## O que se pede

Baixar dados completos da análise detalhada sem agrupamento em Excel, CSV e PDF.

## Por que é importante

Eliminar limites de linhas/período nesse recorte preservando a seleção da tela.

## Critérios de aceite

- Exportar dados recebe filtros, colunas/ordem e ordenação da análise.
- Mais de 50 mil linhas e período superior a 366 dias não são recusados por esses limites.
- Revalidação combina reports:read, exports:generate e acesso à fonte.
- QA humano identifica pessoa, versão e resultado.

## Evidência

PR40 integrado em 748539d. Preservar QA atual do recorte, sem declará-lo homologado só pelo merge.
Os demais modos pertencem à outra subtarefa.

## NEW-REPORTS — Exportar detalhe agrupado, resumo e evolução sem os limites antigos

Tipo: Subtarefa. Pai: CAAB-24. Status proposto: Backlog. Responsável: sem atribuição. Categorias:
melhoria, modulo-relatorios, modulo-exportacoes.

Solicitante original não verificado. Responsável não assumido para este recorte.

## O que se pede

Completar exportação dos modos agrupado, resumo gerencial e resultados/evolução preservando
agregações e seleção.

## Por que é importante

O PR40 resolveu somente o detalhe sem agrupamento; o restante ainda usa o caminho antigo.

## Critérios de aceite

- Os três modos exportam o conjunto completo selecionado.
- Filtros, grupos, agregações e ordenação correspondem à consulta.
- Permissões atuais e revogação são respeitadas.
- Validações incluem revisão/testes IA e QA humano identificado.

## Observações

Spec010 T029/T031/T036–T039 e parcelas T030/T035. Não retirar teto do worker antigo sem solução
compatível; não refazer o motor CAAB-22.
