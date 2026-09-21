# Data Model: Fundação do Sistema CAAB

**Date**: 2026-09-04  
**Authority**: PostgreSQL é a fonte de verdade; datas são `timestamptz` em UTC e chaves primárias são
UUIDs.

## Conventions

- Tabelas de domínio usam nomes no singular em `snake_case`.
- Toda FK possui índice quando participa de autorização, busca ou limpeza.
- E-mail é comparado sem diferença de caixa e possui unicidade para registros não descartados.
- Segredos, tokens e códigos de recuperação nunca entram em auditoria ou logs.
- Registros auditáveis usam `deleted_at`/`deactivated_at`; remoção física depende de política LGPD
  aprovada.
- Estados são enums/check constraints explícitos. Alterações críticas e auditoria compartilham a
  mesma transação.
- O papel de aplicação possui INSERT/SELECT em auditoria, nunca UPDATE/DELETE.

## Identity and Access

### `user`

Identidade interna e registro-base usado pela biblioteca de autenticação.

| Field | Type | Rules |
|---|---|---|
| `id` | UUID | PK |
| `email` | case-insensitive text | required, unique |
| `name` | text | required, 1–160 chars |
| `email_verified` | boolean | required, default false |
| `status` | enum | `active`, `disabled`; required |
| `created_at` | timestamptz | required |
| `updated_at` | timestamptz | required |
| `deactivated_at` | timestamptz | required only when disabled |
| `version` | integer | optimistic concurrency, starts at 1 |

Validation:

- `status=disabled` requires `deactivated_at` and blocks every protected action.
- Administrative access requires an active session and effective permissions; MFA was removed.
- Disabling a user revokes all active sessions in the same transaction.

### Authentication-managed tables

Better Auth owns the physical contract for `account`, `session` and `verification`.
Migrations are committed and reviewed like all other schema changes.

- `account`: links a user to a credential/provider; secrets are hashed or encrypted per library
  contract.
- `session`: opaque token, `user_id`, expiry, IP/user-agent security metadata and revocation state.
  Cookie cache/stateless session is disabled.
- `verification`: short-lived verification challenges with explicit expiry.
- Legacy authenticator storage was removed by migration 0012; do not recreate it.

### `role`

| Field | Type | Rules |
|---|---|---|
| `id` | UUID | PK |
| `code` | text | required, unique, stable machine identifier |
| `name` | text | required, unique display name |
| `description` | text | required |
| `is_administrative` | boolean | required, default false |
| `status` | enum | `active`, `inactive` |
| `created_at`, `updated_at` | timestamptz | required |
| `deleted_at` | timestamptz | nullable soft delete |

### `permission`

| Field | Type | Rules |
|---|---|---|
| `id` | UUID | PK |
| `resource` | text | required; module/entity identifier |
| `action` | text | required; concrete operation |
| `description` | text | required |
| `sensitive` | boolean | required, default false |
| `created_at` | timestamptz | required |

Unique constraint: (`resource`, `action`). Permission definitions are versioned seed data; free-form
permissions supplied by clients are rejected.

### `role_permission`

Many-to-many assignment with PK (`role_id`, `permission_id`) and `created_at`. Only active roles
contribute permissions.

### `user_role`

| Field | Type | Rules |
|---|---|---|
| `id` | UUID | PK |
| `user_id` | UUID | FK user |
| `role_id` | UUID | FK role |
| `granted_by` | UUID | FK user; cannot equal an unauthorized actor |
| `justification` | text | legacy optional reason; omission/empty accepted, existing values preserved |
| `valid_from` | timestamptz | required |
| `valid_until` | timestamptz | nullable, must be later than `valid_from` |
| `revoked_at` | timestamptz | nullable |
| `revoked_by` | UUID | nullable FK user |
| `revocation_reason` | text | legacy optional reason, not required when revoked |

Unique partial constraint prevents more than one active assignment for the same user/role. Grant or
revocation and audit event are atomic. Administrative grants require current authority without MFA. A serialized
transaction prevents removal/disablement of the last active administrator.

## Audit and Security

### `audit_event`

Append-only business trail.

| Field | Type | Rules |
|---|---|---|
| `id` | UUID | PK |
| `occurred_at` | timestamptz | required, immutable |
| `actor_user_id` | UUID | nullable FK for system actions |
| `effective_identity` | text | required; redacted snapshot |
| `action` | text | required |
| `entity_type` | text | required |
| `entity_id` | UUID/text | required |
| `before` | JSONB | nullable, allowlisted/redacted |
| `after` | JSONB | nullable, allowlisted/redacted |
| `reason` | text | optional historical content; no reason required or fabricated |
| `origin` | enum | `web`, `worker`, `system` |
| `request_id` | UUID | required |
| `correlation_id` | UUID | required |
| `ip_hash` | text | nullable, only if approved by privacy policy |

Indexes: time descending, actor+time, entity+ID+time, action+time. No generic full-text index over
snapshots. Database privileges and a migration-time trigger reject UPDATE/DELETE by application roles.

### `security_event`

High-volume, append-only security record separate from business audit retention.

Fields: `id`, `occurred_at`, optional `user_id`, `event_type`, `outcome`, `reason_code`, `request_id`,
`correlation_id`, redacted network/client context. Raw credentials and response details are forbidden.

Current event types include login success/failure, logout, session revocation,
account disablement and authorization denial. Enumeration-safe `reason_code` values are internal.

## Files

### `stored_file`

| Field | Type | Rules |
|---|---|---|
| `id` | UUID | PK and basis for random object key |
| `owner_type`, `owner_id` | text, UUID/text | logical owner; validated by module policy |
| `original_name` | text | display-only, sanitized, never used as object key |
| `object_key` | text | required, unique, server-generated |
| `quarantine_key` | text | required until promoted |
| `detected_mime` | text | nullable until scan |
| `declared_mime` | text | untrusted client value |
| `size_bytes` | bigint | required after finalize, within configured limit |
| `checksum_sha256` | text | required after finalize |
| `visibility` | enum | `private`, `public` |
| `status` | enum | see transitions below |
| `scan_result` | enum | `pending`, `clean`, `infected`, `error` |
| `uploaded_by` | UUID | FK user |
| `created_at`, `updated_at` | timestamptz | required |
| `available_at`, `deleted_at` | timestamptz | nullable |

Unique constraint on object keys; checksum is indexed for reconciliation, not global deduplication.
Authorization is evaluated before issuing upload/download URLs.

State transitions:

```text
initiated -> uploaded -> scanning -> available
                    \-> rejected
                    \-> scan_error -> scanning
available -> deleted
rejected  -> deleted
```

Only `available` objects may be downloaded. `scan_error` and scanner timeout fail closed. Promotion
from quarantine requires matching checksum, allowlisted type, size limits and clean antivirus result.

## Asynchronous Work

### `job_execution`

Stable domain-facing status; pg-boss internal tables are not an application contract.

| Field | Type | Rules |
|---|---|---|
| `id` | UUID | PK |
| `job_type` | text | required, allowlisted handler name |
| `queue_name` | text | required |
| `idempotency_key` | text | required |
| `correlation_id` | UUID | required |
| `request_id` | UUID | nullable |
| `aggregate_type`, `aggregate_id` | text, UUID/text | nullable causal entity |
| `status` | enum | `queued`, `running`, `succeeded`, `failed` |
| `progress` | integer | 0–100, monotonic |
| `attempt_count`, `attempt_limit` | integer | non-negative; limit required |
| `safe_error_code`, `safe_error_message` | text | nullable, no stack/payload/PII |
| `created_at`, `started_at`, `finished_at` | timestamptz | lifecycle timestamps |
| `heartbeat_at` | timestamptz | nullable, refreshed while running |

Unique constraint: (`job_type`, `idempotency_key`). Handlers receive IDs, not full sensitive records,
and load current data when processing. Retry may transition `running -> queued`; exhausted work
transitions to `failed`. Redrive is a new audit event and reuses the same idempotent business effect.

### `idempotency_record`

Used for HTTP or external effects not fully protected by `job_execution`.

Fields: `scope`, `key`, request fingerprint, status (`processing`, `completed`, `failed`), response
reference, expiry and timestamps. Unique (`scope`, `key`). Reuse with a different fingerprint returns
conflict; concurrent same-key requests observe the existing result.

### `worker_heartbeat`

Fields: worker instance ID, started time, last heartbeat, supported queue set and status. Records are
operational and expire under the approved retention policy.

## Relationships

```text
user 1--* session
user *--* role (through user_role)
role *--* permission (through role_permission)
user 1--* audit_event (actor)
user 1--* security_event
user 1--* stored_file (uploader)
job_execution *--0..1 domain aggregate
job_execution 1--0..* audit_event (through correlation_id)
```

## Transaction Boundaries

1. User create/update/disable + session revocation when applicable + audit event.
2. Role/permission assignment or revocation + invariant check + audit event.
3. Job-causing domain mutation + `job_execution` insert + pg-boss enqueue.
4. File scan result + promotion/rejection status + audit event.

Any audit insertion failure rolls back the associated critical mutation. Telemetry export failure does
not roll back business work; it is buffered and surfaced operationally.

## Migration and Test Requirements

- Every migration applies cleanly from an empty PostgreSQL instance and from the prior release.
- Runtime roles are created/tested so audit UPDATE/DELETE fails at database level.
- Integration tests cover FK, unique/check constraints, soft delete and transaction rollback.
- Concurrency tests cover duplicate idempotency keys, role revocation and last-admin protection.
- Better Auth-generated schema changes are reviewed and committed; runtime DDL is disabled in PROD.


## Modelo vigente do incremento — 21/09/2026

`exports:generate` é concessão independente; `scheduling:write` exige `scheduling:read` no contrato de acessos. user_access substitui herança e mantém version; role_permission mantém ligação com papéis, sem criar user_role. Invariantes de migração Q4 e remoção Q8 testadas separadamente. export_operation e transições seguem contrato transversal; nunca armazenar senha inicial, hashes, tokens ou segredos na exportação de contas. Fonte Colaboradores usa users existentes; campos iniciais nome/e-mail/situação e campos já consultáveis, com seleção autorizada de acessos apenas onde a leitura existente permitir.

Entidades técnicas/ciclo de vida em [contrato comum](../002-integrated-modules/contracts/direct-exports.md); sem cópia de domínio.
Regras anteriores de MFA ou motivo obrigatório não são vigentes; a constituição 2.0.0
e contratos de 21/09 prevalecem. Mudanças descritas são planejamento, sem migration executada.

## Cargos vigentes — decisão I1, 21/09/2026

Administrador tem todas as permissões concretas dos módulos disponíveis, atuais e futuros, incluindo exportação e gestão de cargos/acessos. Gestor possui consulta a todos os módulos, exportação geral e acesso completo a Relatórios; pode conceder acessos de qualquer módulo a outros colaboradores, inclusive alterações que não possui para uso próprio, mas não altera os próprios acessos nem atribui cargos. Colaborador somente usa os acessos recebidos e não concede cargos ou permissões. Atribuição de cargos permanece com Administrador.

Reutilizar role/user_role/permission/effective_user_permission, conforme [contrato](contracts/roles.md). As bases de Administrador e Gestor ativos têm precedência sobre override individual; Gestor não deve contar como Administrador no bloqueio do último. Autoridade de concessão separada de uso; não criar cópia permanente das permissões do cargo em user_access. Novos cargos não criam/alteram contas automaticamente.
