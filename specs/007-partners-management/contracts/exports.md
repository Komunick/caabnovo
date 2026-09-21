# Contrato do incremento — Parceiros e benefícios: exportação autorizada

Estado: planejado em 21/09/2026, sem implementação.

Datasets partners.organizations/units/categories/contracts/benefits/reviews/settings e histórico contextual autorizado. Filtros nome/CNPJ/categoria/estado/canal/vigência conforme fonte. Defaults espelham cada tabela; campos longos como condições/descrição preservam texto integral. Prazos contratuais não são limitados pelo período do arquivo.

Parceiro, unidade, contrato, benefício, categoria e avaliação permanecem de seus repositórios. Iteradores por entidade preservam IDs/ordem e evitam repetir parceiros por quantidade de contratos. Nenhuma cópia de cadastro ou alteração de regras contratuais; somente export_operation comum.

Aplicar [contrato transversal](../../002-integrated-modules/contracts/direct-exports.md)
onde houver exportação: filtros, columns ordenadas, formato xlsx/csv/pdf, download nativo,
erros, estado operacional e reautorização. O contrato descreve novos caminhos planejados,
não garante que existam no checkout. Gate de Mensagens permanece quando aplicável.

Aceite independente: Três formatos por dataset, mesmo filtro/ordem/colunas; leitura sem exportação e exportação sem leitura negadas; documentos/contatos privados preservam seu controle; exportação não muda publicação ou contrato.
