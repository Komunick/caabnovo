# Contrato do incremento — Mensagens: revisão de aderência e exportação condicionada

Estado: planejado em 21/09/2026, sem implementação.

Datasets messaging.campaigns/templates/audiences/schedules/executions/preferences. Campos padrão nome/tipo/estado/programação/contagens; corpo textual autorizado opcional, sem HTML executável. Público exporta regras/contagens e amostra mínima somente quando já consultável; não exporta diretório de contatos. Sessão+messages:access+exports:generate; operação não agenda/envia/reagenda e não consulta provedor.

Preservar messaging_resource/suppression/execution/request e snapshots imutáveis. Exporta projeções já consultáveis, sem expandir PII ou consentimento. Nenhuma tabela de conversa/ticket/destinatário entregue. export_operation comum somente quando gate de continuidade estiver satisfeito.

Aplicar [contrato transversal](../../002-integrated-modules/contracts/direct-exports.md)
onde houver exportação: filtros, columns ordenadas, formato xlsx/csv/pdf, download nativo,
erros, estado operacional e reautorização. O contrato descreve novos caminhos planejados,
não garante que existam no checkout. Gate de Mensagens permanece quando aplicável.

Aceite independente: Após M016, conferir preparo/segmentação/programação sem envio real; exports respeitam a projeção mínima e formatos/colunas; nenhum botão/tela de chat ou ticket; alterações no protótipo dependem do gate registrado.
