# Arquitetura da Fundação CAAB

## Visão geral

A Fundação é um monorepo TypeScript com duas unidades de execução: Next.js para HTTP/UI e um worker
Node para tarefas assíncronas. PostgreSQL é a fonte de verdade transacional; pg-boss usa um schema
isolado no mesmo banco. Binários ficam em storage S3-compatible e passam por ClamAV antes da promoção.

```text
Browser -> Next.js (UI + /api/v1)
               |-> PostgreSQL (identidade, autorização, auditoria, estados)
               |-> pg-boss (enqueue na mesma transação causal)
               |-> S3 quarantine/private (URLs assinadas curtas)

pg-boss -> Worker -> ClamAV
                  -> S3 quarantine/private
                  -> PostgreSQL (progresso, resultado, heartbeat, auditoria)

Web + Worker -> OpenTelemetry Collector -> métricas/traces/alertas
```

## Fronteiras

- `apps/web/app`: composição Next.js, páginas e adaptadores HTTP; não contém regra de negócio.
- `apps/web/modules/auth`: sessão, MFA, ator da requisição e autorização deny-by-default.
- `apps/web/modules/users`, `audit`, `files`, `jobs`: serviços transacionais e UI por capacidade.
- `apps/worker/src/jobs`: handlers idempotentes que recarregam dados protegidos por identificador.
- `packages/contracts`: schemas Zod e validação/geração determinística do OpenAPI 3.1.1.
- `packages/db`: client, migrations e repositórios PostgreSQL; nenhuma migration ocorre no startup.
- `packages/config`: ambiente tipado e redação central de segredos/PII.
- `infra`: composição local, inicialização, observabilidade, proteção de branches e recuperação.

Imports respeitam a direção `app -> modules -> packages`. O worker depende de contracts/config/db, não
de módulos web. Domínios comunicam por contratos pequenos, IDs e transações, não por estado global.

## Invariantes de segurança

- Sessões são confirmadas no servidor e permissões são recalculadas do banco em cada ação protegida.
- Administradores passam por MFA; autorização de UI nunca substitui autorização no handler/serviço.
- Eventos críticos são append-only e compartilham transação com a mutação causal.
- Logs e erros usam campos allowlisted; mensagens externas nunca incluem stacks ou payloads brutos.
- Upload começa em quarentena privada. Apenas `available` recebe URL privada de download.
- Jobs usam chave idempotente, tentativas finitas, progresso monotônico e redrive auditado.
- `/livez` mede processo; `/readyz` exige banco e heartbeat recente do worker.

## Operação e evolução

Migrations são aditivas/forward-only. Backups são restaurados em banco novo, nunca sobre a origem.
Novos módulos devem começar por contrato e testes, manter queries parametrizadas e adicionar labels de
métrica limitadas. Integrações externas ou novas categorias de dados exigem especificação própria e
revisão de segurança/privacidade.
