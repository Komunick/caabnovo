# Contrato da área

| Rota                       | Comportamento                                                                               |
| -------------------------- | ------------------------------------------------------------------------------------------- |
| /audit                     | audit:read consulta eventos; só jobs:read redireciona à lista de jobs; nenhum recebe aviso. |
| /audit/jobs                | jobs:read; lista existente.                                                                 |
| /audit/jobs/[jobId]        | jobs:read, UUID válido e registro existente; reenvio mantém jobs:redrive.                   |
| /operations/jobs e detalhe | Redirecionamentos temporários às canônicas; dados autorizados no destino.                   |
| /audit/exports/[jobId]     | Contrato existente com audit:export, independente de jobs:read.                             |

APIs existentes inalteradas. Menu/dashboard/busca mostram uma área e sinônimos encontram Auditoria.
Subnavegação “Áreas de auditoria” contém Eventos e/ou Processamentos conforme permissões.
