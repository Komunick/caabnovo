# Contrato do incremento — Relatórios: exportação direta nas três abas

Estado: detalhe sem agrupamento integrado em30/09; extensão local de02/10/2026 em validação.

## Contrato da entrega de 02/10/2026

Exportar detalhe agrupado, resumo e evolução sem os limites antigos (CAAB-44) usa o endpoint
transversal `/api/v1/exports/download`, `module=reports`, com o motor existente. Não cria
report_export/job nem altera arquivos antigos. Rota de tela: `/reports/exportar`.

| Dataset                                                                   | Filtros e colunas                                                                                                                                                                                                                                                             |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| members/dependents/bookings/partners/benefits/contracts/news/users/access | Detalhe integrado: catálogo e seleção ordenada preservados.                                                                                                                                                                                                                   |
| Fonte acima com sufixo Grouped, exceto access                             | Mesmos filtros da fonte; groupBy obrigatório e validado no catálogo. Colunas group/count selecionáveis/reordenáveis; ordenação textual de group ou numérica de count, com desempate por id, igual à tabela.                                                                   |
| summary/executive                                                         | Período de comparação explícito, sem teto de duração; canal/ambiente/fonte aplicados aos acessos. include_FONTE=yes/no seleciona fontes de domínio. Ausência exclui a fonte, sem concessão implícita. notes opcional até2000 caracteres, identificado como análise da gestão. |

O catálogo de resumo/evolução oculta cada filtro include_FONTE sem a permissão de leitura da fonte;
o servidor recusa sua utilização na solicitação e na revalidação de cada lote/heartbeat/final.
Relatórios e exports:generate são sempre obrigatórios. A página seleciona inicialmente apenas fontes
autorizadas. Acessos usa reports:read, como a consulta existente. A escolha de fontes nunca
substitui a autorização. Booking continua exigindo scheduling:read, inclusive indicadores, séries e
cancelamentos; analytics de jornadas conserva sua semântica existente.

Resumo/evolução são tabelas com seções: indicadores/comparação, base atual, séries, acessos,
cobertura, jornada, avisos e contexto. Colunas: section, label, date (mês), value, previous, change,
definition, from, to, channel, environment, source, updatedAt e notes. Todos os formatos usam
exatamente a seleção e ordem solicitadas, inclusive definições/contexto quando selecionados. Estado
atual e período são distintos; comentários não se tornam evidência; nenhuma reconstrução histórica
ou total de pessoas entre canais é inferido. Comparação usa período anterior de mesma duração;
anterior zero resulta em variação nula, ou zero quando ambos são zero.

Consultas parametrizadas usam reportSources e inventário/definições/funil compartilhados com a tela;
cursor read-only repeatable-read do núcleo entrega o conjunto integral, sem LIMIT/OFFSET. O núcleo
continua responsável por writers, cancelamento, reautorização, progresso e falhas. O limite da
consulta visual e a proteção de memória do worker histórico permanecem isolados; nenhuma nova ação
da interface ou retentativa do histórico depende desse worker.

Compatibilidade com Agendamentos: não mudar seu modelo/migrations0031–0034 nem runtime.ts. Ao
conciliar, preservar sua projeção bookings com procedure_id, original_start e profissional opcional,
além dos três grupos de adaptadores. ExportScreen reutiliza exatamente a extensão
initialFilters/renderFilter da entrega4e9abac. Testes técnicos não concluem QA humano.

## Cancelamentos sem horário — compatibilidade de 02/10/2026

O aviso de cancelamentos em tela e arquivo usa `coalesce(starts_at,original_start,created_at)` nos
limites inclusivo inicial e exclusivo final, preservando `include_bookings` e `scheduling:read`.
Essa data de referência não preenche nem representa um horário confirmado. A regressão exige as
migrations reais de Agendamentos; não altera o schema de teste para simular compatibilidade. A
base748539d ainda não contém original_start; a correção depende da conciliação com Agendamentos
antes de concluir os gates e abrir PR para dev.

_Atualização de 06/10/2026: o PR #43 de Agendamentos foi integrado na `dev` (squash `ea0bc3b`) e esta
entrega foi atualizada com ela; a dependência de `original_start` está cumprida na `dev`. A
migration 0035 do PR #45 ainda não está na `dev`._

## Planejamento anterior preservado

Dataset reports com mode summary/details/presentation e domínios autorizados. Rotas existentes de
relatório mantêm consulta/analytics; nova ação exporta pelo endpoint transversal module=reports.
Exigir reports:read, exports:generate e permissões de cada fonte inclusive scheduling:read para
bookings. Snapshot de arquivo legado não concede leitura quando a permissão foi revogada.

report_export/stored_file_content antigos preservados; nenhuma linha nova de
report_export/job_execution necessária para o fluxo direto. Consulta salva mantém dono/configuração
e reautoriza a cada uso. Novo estado operacional compartilhado não guarda arquivo. ReportDefinition
inclui formato em todos os modos, columns ordenadas e filtros sem limites funcionais de exportação.

Aplicar [contrato transversal](../../002-integrated-modules/contracts/direct-exports.md) onde houver
exportação: filtros, columns ordenadas, formato xlsx/csv/pdf, download nativo, erros, estado
operacional e reautorização. O contrato descreve novos caminhos planejados, não garante que existam
no checkout. Gate de Mensagens permanece quando aplicável.

Aceite independente: Três abas baixam Excel/CSV/PDF com100 registros sintéticos, inclusive filtros
distribuídos por mais de366 dias, colunas na ordem pedida e dados íntegros; downloads legados seguem
U1. Medições e aceite no [perfil C1](../../002-integrated-modules/export-validation-100.md). Não
afirmar validação de grande volume; coleta US4 permanece sem afetar reserva.

U1: aplicar [downloads legados](legacy-downloads.md) com permissões atuais complementares às salvas.
C1: usar100 registros nesta rodada; manter ausência de limite funcional de quantidade/período.
