# Dados da fusão

## Consulta de Processamentos US3 — 15/09/2026

Reutilizar job_execution. Cursor composto por created_at UTC (microssegundos preservados)
e id UUID, com ordenação descendente em ambos. Filtros sobre status/job_type; nenhuma
alteração de schema. Retorno limitado a dados operacionais seguros já expostos no detalhe.
Paginação consulta estado atual, sem congelar alterações de estado entre requisições.

Nenhuma alteração persistida. Eventos, jobs, exportações, usuários e permissões mantêm tabelas e
IDs. Catálogo em memória contém id, rótulo, descrição, palavras de busca, ícone, destino e prefixos
de rota. Perfil determina quais áreas são exibidas; autorização de dados permanece no servidor.
