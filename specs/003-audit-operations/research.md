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
# Pesquisa T014 — 15/09/2026

Fontes oficiais consultadas: [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html) orienta registrar momento, autoria, ação e alvo, proteger acesso e excluir dados sensíveis. [GOV.UK, Style and formatting](https://www.gov.uk/government/uploads/system/uploads/attachment_data/file/466003/Research_Publication_-_Formatting_and_Style_guide.pdf) recomenda escrita clara e evitar jargão desnecessário.

Decisão: derivar frases em português de códigos conhecidos, conservar evidência original nos detalhes e no JSONL e limitar enriquecimento aos nomes autorizados. Nomes atuais não provam nomes históricos: esclarecer isso na tela. Não usar geração livre de texto, inferir identidades ou inserir valores privados na frase. Não expandir a pesquisa para retenção ou regras jurídicas, fora desta mudança de apresentação.
