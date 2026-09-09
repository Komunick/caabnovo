# Pesquisa da fusão

Decisão, racional, alternativas e revisão técnica em
[pesquisa do programa](../002-integrated-modules/research.md). Somente código do projeto novo.

Decisão: mostrar Auditoria com audit:read OU jobs:read; destino /audit para eventos, /audit/jobs
para operador só de jobs. Layout não bloqueia toda árvore com audit:read: exportação depende de
audit:export e jobs dependem de jobs:read. Guardas ficam nas páginas/serviços.

Alternativas rejeitadas: segunda tabela/central de jobs, acesso unificado concedido automaticamente,
duplicação de páginas ou perda dos favoritos. Catálogo único elimina três listas equivalentes.

Nenhuma decisão institucional bloqueia essa funcionalidade. Limite conhecido de 100 jobs e
pré-condição de reenvio ficam explicitamente fora desta fusão, rastreados como próximas funções do
programa.
