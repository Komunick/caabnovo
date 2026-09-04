# Asynchronous Job Contract

## Envelope

Every queued payload conforms to this logical envelope:

```json
{
  "schemaVersion": 1,
  "jobId": "uuid",
  "jobType": "allowlisted-handler",
  "idempotencyKey": "stable-key",
  "correlationId": "uuid",
  "requestId": "uuid-or-null",
  "actorId": "uuid-or-null",
  "aggregate": { "type": "name", "id": "identifier" },
  "payload": { "idsOnly": "no secrets or unnecessary personal data" }
}
```

The Zod schema in `packages/contracts` is authoritative. Unknown versions or job types fail safely
without invoking a handler.

## Delivery and idempotency

- Delivery is at-least-once; no handler may assume exactly-once execution.
- (`jobType`, `idempotencyKey`) is unique in the domain status table.
- The handler checks/claims the idempotency record before external or irreversible effects.
- Enqueue and causal database mutation share a transaction when they must succeed together.
- Retried checkpoints are monotonic and replay-safe.
- A duplicate with the same fingerprint returns the existing job. A duplicate key with a different
  fingerprint fails with conflict.

## Lifecycle

```text
queued -> running -> succeeded
   ^         |  \-> failed
   |         \---- retryable failure
   \-------------- controlled retry
failed -> redrive creates an audited retry attempt without duplicating the business effect
```

Each queue defines finite retry count, delay, exponential backoff, execution timeout, heartbeat,
retention and dead-letter behavior. Defaults are not accepted without explicit review.

## Observability and safety

- Logs include `job_id`, `job_type`, `correlation_id`, `attempt` and safe outcome.
- Metrics use bounded labels; IDs never become metric labels.
- Persist only safe error code and redacted message. Raw payload, stack with secrets, tokens and
  unnecessary personal data are forbidden.
- Payloads contain identifiers and immutable parameters only; handlers reload current protected data.
- Scanner/storage/network unavailability never marks a file safe; retry or terminal failure applies.
- Manual redrive requires permission, reason and audit event.
