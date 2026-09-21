# Contrato do incremento — Notícias: concessão explícita e exportação

Estado: planejado em 21/09/2026, sem implementação.

Datasets news.published, news.drafts e archived/contexto de revisão. Filtros título/categoria/destino/destaque/capa/período/arquivamento e sort das listas. Padrão título/resumo/categoria/destino/situação/atualização, com corpo textual e outros campos permitidos opcionais. news:read + exports:generate, sem exigir publicação; endpoint privado mesmo para conteúdo que também possua versão pública.

Entidades news/revisões/publicações existentes permanecem. Catálogo de exportação seleciona aba/revisão sem misturar rascunho privado à versão publicada. Chaves read/write/publish conservam dependências. Nenhum grant novo implícito ou alteração de schedule.

Aplicar [contrato transversal](../../002-integrated-modules/contracts/direct-exports.md)
onde houver exportação: filtros, columns ordenadas, formato xlsx/csv/pdf, download nativo,
erros, estado operacional e reautorização. O contrato descreve novos caminhos planejados,
não garante que existam no checkout. Gate de Mensagens permanece quando aplicável.

Aceite independente: Conta sem user_access e sem papel não recebe Notícias; leitor/editor/publicador mantêm ações distintas; publicado público continua; três formatos não vazam revisão privada no contexto de publicada.
