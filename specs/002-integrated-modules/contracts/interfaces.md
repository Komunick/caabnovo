# Contratos e fronteiras

## US1 — implementação existente e adequações pendentes

| Interface                             | Autorização e comportamento                                                             |
| ------------------------------------- | --------------------------------------------------------------------------------------- |
| /audit                                | Eventos: audit:read; operador só de jobs vai para /audit/jobs; sem acesso mantém aviso. |
| /audit/jobs e /audit/jobs/[jobId]     | jobs:read; UUID inválido/registro inexistente dá 404 no detalhe.                        |
| /operations/jobs e detalhe            | Redirecionamento temporário para canônicas; guardas no destino.                         |
| /audit/exports/[jobId]                | Legado audit:export; alvo permissão geral + leitura de Eventos, sem jobs:read.                                                     |
| /api/v1/jobs/[jobId] e /redrive       | Preservar contrato; reenvio com autorização e auditoria, sem justificativa obrigatória.             |
| /api/v1/audit-events e /audit-exports | Preservar dados; adequar exportação ao padrão direto (003 EX/DX).                                                 |

Subnavegação não substitui guardas das páginas/serviços. Menu, busca e dashboard usam catálogo
único.

## Domínios — distinguir código atual de extensões futuras

Prefixo /api/v1; Zod/OpenAPI em packages/contracts; sessão/autorização para ações privadas;
paginação, idempotência crítica, versão em edição concorrente e erros seguros.

| História / raiz proposta | Consultas/comandos                                                                    |
| ------------------------ | ------------------------------------------------------------------------------------- |
| US2 /news                | Rascunho, versões/prévia, agendar/publicar/despublicar, distribuição por canal.       |
| US3 /members             | Pesquisa/cadastro, dependentes/vínculos, documentos/correções, verificações/decisões. |
| US4 /scheduling          | Oferta/recursos, disponibilidade, reserva/remarcação/cancelamento/desfecho/avaliação. |
| US5 /partners            | Parceiro/unidades, contratos, ofertas/condições/visibilidade/avaliações.              |
| US6 /users | Colaboradores é gestão de contas/permissões existente; /employees cancelado, RH apenas possibilidade futura. |
| US7 /messages            | Modelos/públicos/prévia/programação existentes; transporte e callbacks de provedor adiados.        |
| US8 /credits             | Política, conta/extrato, prévia/concessão de lote, utilização/correção.               |
| US9 /partner-requests    | Solicitação/QR/transições limitados à organização autenticada.                        |
| US10 /reports            | Definições permitidas, filtros, execução/download autorizado.                         |

Notícias, Associados, Agendamentos administrativo, Parceiros, Contas, Auditoria e Relatórios já têm código; Mensagens é protótipo. Créditos permanece suspenso e Portal não implementado. Não descobrir contratos do legado por
tentativas. Integração real exige contrato fornecido ou novo aceito; consumidor sintético não prova
homologação externa.
