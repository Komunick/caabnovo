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


## Regra vigente: nenhuma justificativa obrigatória — 14/09/2026

Fonte de negócio: instrução expressa do usuário nesta data para remover motivos de todas as abas. A [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html), consultada em 14/09/2026, orienta registrar contexto da ação e identidade. Decisão do projeto: rastreabilidade é automática e não depende de justificativa escrita. O inventário encontrou validações em UI, contratos, serviços e CHECKs SQL; retirar todas as camadas da obrigatoriedade, preservando histórico e permissões. Não presumir que o usuário forneceu um motivo automático.

## Retirada do armazenamento legado — 15/09/2026

Decisão de 15/09/2026: backend único PostgreSQL, conforme pesquisa da [fundação](../001-project-foundation/research.md). Mantém a transação já existente dos bytes/metadados e reduz infraestrutura, sem mudar finalidade ou acesso à exportação.
