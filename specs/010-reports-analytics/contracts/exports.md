# Contrato do incremento — Relatórios: exportação direta nas três abas

Estado: planejado em 21/09/2026, sem implementação.

Dataset reports com mode summary/details/presentation e domínios autorizados. Rotas existentes de relatório mantêm consulta/analytics; nova ação exporta pelo endpoint transversal module=reports. Exigir reports:read, exports:generate e permissões de cada fonte inclusive scheduling:read para bookings. Snapshot de arquivo legado não concede leitura quando a permissão foi revogada.

report_export/stored_file_content antigos preservados; nenhuma linha nova de report_export/job_execution necessária para o fluxo direto. Consulta salva mantém dono/configuração e reautoriza a cada uso. Novo estado operacional compartilhado não guarda arquivo. ReportDefinition inclui formato em todos os modos, columns ordenadas e filtros sem limites funcionais de exportação.

Aplicar [contrato transversal](../../002-integrated-modules/contracts/direct-exports.md)
onde houver exportação: filtros, columns ordenadas, formato xlsx/csv/pdf, download nativo,
erros, estado operacional e reautorização. O contrato descreve novos caminhos planejados,
não garante que existam no checkout. Gate de Mensagens permanece quando aplicável.

Aceite independente: Três abas baixam Excel/CSV/PDF com100 registros sintéticos, inclusive filtros distribuídos por mais de366 dias, colunas na ordem pedida e dados íntegros; downloads legados seguem U1. Medições e aceite no [perfil C1](../../002-integrated-modules/export-validation-100.md). Não afirmar validação de grande volume; coleta US4 permanece sem afetar reserva.

U1: aplicar [downloads legados](legacy-downloads.md) com permissões atuais complementares às salvas. C1: usar100 registros nesta rodada; manter ausência de limite funcional de quantidade/período.
