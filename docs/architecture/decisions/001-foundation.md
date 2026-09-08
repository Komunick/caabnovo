# ADR 001 — Fundação modular com PostgreSQL, pg-boss e storage em quarentena

- Status: Accepted
- Date: 2026-09-08

## Contexto

O CAAB precisa de uma base administrativa segura para identidade, usuários, auditoria, arquivos e
operações antes dos domínios de negócio. A equipe precisa reduzir serviços operacionais sem acoplar
requests HTTP a tarefas demoradas ou permitir acesso a arquivos não verificados.

## Decisão

Adotar um monólito modular TypeScript em monorepo, executado como web Next.js e worker Node separados.
Usar PostgreSQL como fonte de verdade e pg-boss no mesmo servidor, em schema próprio versionado por
migration. Usar S3-compatible com buckets/prefixos de quarentena e privado, URLs assinadas de cinco
minutos e ClamAV `INSTREAM` fail-closed. Expor contratos `/api/v1` com Zod/OpenAPI e instrumentar web e
worker com OpenTelemetry.

## Consequências positivas

- Mutação causal, idempotência e enqueue podem compartilhar transação PostgreSQL.
- Há menos infraestrutura que uma fila Redis dedicada e nenhuma fila artesanal.
- Web e worker escalam/reiniciam separadamente sem dividir regras de domínio em serviços remotos.
- Arquivos não confiáveis nunca atravessam o processo web nem ficam públicos antes da validação.
- Contratos, migrations, UI e evidências permanecem versionados juntos.

## Trade-offs

- PostgreSQL absorve também a carga da fila; profundidade, latência e manutenção precisam de alerta.
- Promoção S3 e commit DB não são uma transação distribuída; handlers idempotentes e reconciliador
  resolvem estados parciais.
- ClamAV e MinIO/S3 são dependências de readiness operacional.
- O monólito exige fronteiras de import verificadas para evitar acoplamento acidental.

## Alternativas rejeitadas

- Microserviços iniciais: custo operacional e consistência distribuída sem demanda comprovada.
- Redis/BullMQ: serviço adicional quando pg-boss atende os requisitos transacionais.
- Upload pelo servidor web ou bucket público: consumo de recursos e bypass de quarentena/autorização.
- Falha aberta do scanner: incompatível com o risco e com os requisitos de arquivo seguro.

## Reavaliação

Revisar esta decisão se métricas mostrarem que fila/storage dominam a capacidade do PostgreSQL, se o
ambiente final adotar proteção antimalware gerenciada ou se uma fronteira de domínio exigir ciclo de
deploy e escala comprovadamente independente.
