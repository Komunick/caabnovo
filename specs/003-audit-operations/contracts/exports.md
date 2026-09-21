# Contrato do incremento — Auditoria e Processamentos: exportação direta

Estado: planejado em 21/09/2026, sem implementação.

Datasets audit.events e audit.jobs. Colunas padrão: eventos data/ator/ação/área/registro; jobs criação/tipo/estado/tentativas/resultado seguro. Catálogo só oferece detalhes autorizados; nomes resolvidos seguem audit-names existente. Filtros usam IDs internos quando aplicável, datas UTC e mesma tradução de estados da UI. Não exportar por exigir jobs:redrive ou report:read.

Nenhuma tabela de eventos/processamentos muda. Adaptador projeta dados já redigidos e usa export_operation comum. Valores históricos antes/depois continuam sujeitos à allowlist. A operação não modifica audit_event ou job_execution. Legacy export files mantêm identidade e dono.

Aplicar [contrato transversal](../../002-integrated-modules/contracts/direct-exports.md)
onde houver exportação: filtros, columns ordenadas, formato xlsx/csv/pdf, download nativo,
erros, estado operacional e reautorização. O contrato descreve novos caminhos planejados,
não garante que existam no checkout. Gate de Mensagens permanece quando aplicável.

Aceite independente: Perfis só eventos e só jobs exportam apenas sua subárea; matriz geral+leitura; campos redigidos e colunas reordenadas nos três formatos; downloads legados continuam protegidos.
