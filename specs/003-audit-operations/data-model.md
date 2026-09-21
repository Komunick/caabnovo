# Dados da fusão

## Consulta de Processamentos US3 — 15/09/2026

Reutilizar job_execution. Cursor composto por created_at UTC (microssegundos preservados)
e id UUID, com ordenação descendente em ambos. Filtros sobre status/job_type; nenhuma
alteração de schema. Retorno limitado a dados operacionais seguros já expostos no detalhe.
Paginação consulta estado atual, sem congelar alterações de estado entre requisições.

Nenhuma alteração persistida. Eventos, jobs, exportações, usuários e permissões mantêm tabelas e
IDs. Catálogo em memória contém id, rótulo, descrição, palavras de busca, ícone, destino e prefixos
de rota. Perfil determina quais áreas são exibidas; autorização de dados permanece no servidor.


## Modelo vigente do incremento — 21/09/2026

Nenhuma tabela de eventos/processamentos muda. Adaptador projeta dados já redigidos e usa export_operation comum. Valores históricos antes/depois continuam sujeitos à allowlist. A operação não modifica audit_event ou job_execution. Legacy export files mantêm identidade e dono.

Entidades técnicas/ciclo de vida em [contrato comum](../002-integrated-modules/contracts/direct-exports.md); sem cópia de domínio.
Regras anteriores de MFA ou motivo obrigatório não são vigentes; a constituição 2.0.0
e contratos de 21/09 prevalecem. Mudanças descritas são planejamento, sem migration executada.
