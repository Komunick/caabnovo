# Contrato da área

**Alvo de 21/09/2026, ainda não implementado:** exportações de Eventos e
Processamentos exigem consulta à subárea mais permissão geral, com filtros,
seleção/ordem de colunas e download direto Excel/CSV/PDF. A rota de histórico
listada abaixo descreve compatibilidade legada, não etapa obrigatória do novo fluxo.
EX01/EX02 também cobrem o worker e o bypass por files:read identificado em A05.

## Consulta e reenvio US3 — 15/09/2026

`/audit/jobs`: jobs:read obrigatório. Query `status` (queued/running/succeeded/failed),
`jobType` (texto exato, 1–100 caracteres), `limit` (1–100, padrão 25), `cursor`
(timestamp UTC com seis casas + separador `|` + UUID). Campos vazios do formulário
equivalem a filtro ausente; parâmetros repetidos/inválidos recebem aviso recuperável.
Serviço devolve `{ items, nextCursor }`, sem contagem global. Ordenação created_at DESC,
id DESC. Navegação preserva filtros; aplicar/limpar filtros reinicia a consulta.
Cursor não é autorização, segredo ou snapshot; dados continuam sujeitos a jobs:read.
POST `/api/v1/jobs/{jobId}/redrive` exige jobs:read E jobs:redrive antes da fila,
transação ou efeito persistido. Contrato 202/401/403/404/409 e motivo opcional preservados.

| Rota                       | Comportamento                                                                               |
| -------------------------- | ------------------------------------------------------------------------------------------- |
| /audit                     | audit:read consulta eventos; só jobs:read redireciona à lista de jobs; nenhum recebe aviso. |
| /audit/jobs                | jobs:read; lista existente.                                                                 |
| /audit/jobs/[jobId]        | jobs:read, UUID válido e registro existente; reenvio mantém jobs:redrive.                   |
| /operations/jobs e detalhe | Redirecionamentos temporários às canônicas; dados autorizados no destino.                   |
| /audit/exports/[jobId]     | Contrato existente com audit:export, independente de jobs:read.                             |

APIs existentes inalteradas. Menu/dashboard/busca mostram uma área e sinônimos encontram Auditoria.
Subnavegação “Áreas de auditoria” contém Eventos e/ou Processamentos conforme permissões.
