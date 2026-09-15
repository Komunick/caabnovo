# Retirada do MinIO — 15/09/2026

Branch ativa: feature/admin-cycle-20260915. Base 55c476f do PR #21.

## Decisão e implementação

O usuário informou que há somente dois arquivos de teste no site e dispensou sua migração.
Retirados serviços MinIO/init e declaração de volume do Compose, script de inicialização,
adaptadores web/worker, SDKs S3, configuração de buckets/endpoints e CLI de cópia legada.
Foram removidos 26 pacotes instalados; lockfile verificado pelas políticas de dependências.

Novos arquivos e exportações usam exclusivamente o PostgreSQL principal. Mantidos
ClamAV, quarentena, limites/MIME/SHA-256, capacidades HMAC de cinco minutos, permissões,
CSRF, idempotência e auditoria. Chaves legadas indisponíveis retornam NOT_FOUND/404;
nenhum registro é reescrito para fingir a existência de bytes. Migrations aplicadas intactas.

FILE_STORAGE_BACKEND ausente/database é aceito; s3 é recusado. S3_* não é lido.
As exportações persistem metadados, conteúdo e evento na mesma transação. A regressão
consulta bytes reais do banco, verifica redação e uma única cópia ao repetir o job.

## Validação

- Formatação, lint, tipos e integridade do diff aprovados localmente.
- 253 unitários e 89 contratos aprovados (342 testes).
- CI inicial de armazenamento aprovado: [34966205236](https://github.com/Komunick/caabnovo/actions/runs/34966205236). Verificação final conjunta com T014 ainda pendente.
- Sem servidores/Docker locais, sem migration ou mudança no banco remoto.

## Implantação e limites

PR #21 integrado pelo usuário em dev (1a23ad6); branch ativa conciliada sem alterar a árvore de código. Nenhum deploy, remoção de contêiner ou exclusão de volume realizada nesta sessão.
A VM/painel não está acessível nesta sessão. O endpoint público /readyz confirmou apenas
banco/worker disponíveis, sem confirmar versão/arquivo/backend. Os dois arquivos de teste
poderão precisar de novo envio após implantação; sua contagem foi informada pelo usuário.

Procedimento atual: [arquivos no PostgreSQL](../../../docs/DATABASE-FILE-STORAGE.md).
Atualizar web/worker com FILE_STORAGE_BACKEND=database (ou omitido), manter migration 0018
e ClamAV, retirar configuração S3 e validar novos envios. A remoção efetiva do serviço MinIO
na hospedagem deve conferir que ele atende somente este projeto. Não executar prune ou
exclusão genérica de dados. Rollback exige versão compatível com database/ e migration 0018.
