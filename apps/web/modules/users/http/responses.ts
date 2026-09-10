import { ZodError } from "zod";
import { apiError } from "@caab/contracts";
import { AuthenticationRequiredError, PermissionDeniedError } from "../../auth/authorize";
import { UserAccessError } from "../errors";
import { hasTrustedMutationOrigin } from "../../shared/mutation-origin";

export function requestId(request: Request): string {
  const supplied = request.headers.get("x-request-id");
  return supplied && /^[0-9a-f-]{36}$/i.test(supplied) ? supplied : crypto.randomUUID();
}

export function correlationId(request: Request): string {
  const supplied = request.headers.get("x-correlation-id");
  return supplied && /^[0-9a-f-]{36}$/i.test(supplied) ? supplied : crypto.randomUUID();
}

export class RequestValidationError extends Error {
  constructor(
    readonly code: string,
    readonly status: 403 | 422,
    message: string,
  ) {
    super(message);
  }
}

export function validateMutationRequest(request: Request, options: { idempotency?: boolean } = {}) {
  if (!hasTrustedMutationOrigin(request)) {
    throw new RequestValidationError("ORIGIN_DENIED", 403, "Request origin denied");
  }
  const csrfToken = request.headers.get("x-csrf-token");
  if (!csrfToken || csrfToken.length < 32) {
    throw new RequestValidationError("CSRF_TOKEN_REQUIRED", 403, "CSRF token required");
  }
  const idempotencyKey = request.headers.get("idempotency-key");
  if (
    options.idempotency &&
    (!idempotencyKey || idempotencyKey.length < 16 || idempotencyKey.length > 128)
  ) {
    throw new RequestValidationError(
      "IDEMPOTENCY_KEY_REQUIRED",
      422,
      "Valid idempotency key required",
    );
  }
  return { idempotencyKey };
}

export function routeErrorResponse(error: unknown, id: string): Response {
  if (error instanceof ZodError) {
    return Response.json(
      {
        ...apiError("VALIDATION_FAILED", "Validation failed", id),
        fields: error.issues.map((issue) => ({ path: issue.path.join("."), code: issue.code })),
      },
      { status: 422 },
    );
  }
  const suppliedStatus =
    typeof error === "object" && error && "status" in error
      ? Number((error as { status: unknown }).status)
      : 500;
  const status =
    error instanceof UserAccessError ||
    error instanceof RequestValidationError ||
    error instanceof AuthenticationRequiredError ||
    error instanceof PermissionDeniedError ||
    [401, 403, 404, 409, 422].includes(suppliedStatus)
      ? suppliedStatus
      : 500;
  const code =
    typeof error === "object" && error && "code" in error
      ? String((error as { code: unknown }).code)
      : status === 401
        ? "AUTHENTICATION_REQUIRED"
        : status === 403
          ? "PERMISSION_DENIED"
          : "INTERNAL_ERROR";
  const message =
    status === 401
      ? "Authentication required"
      : status === 403
        ? "Permission denied"
        : status === 404
          ? "Resource not found"
          : status === 409
            ? "Request conflicts with current state"
            : status === 422
              ? "Validation failed"
              : "Unexpected server error";
  return Response.json(apiError(code, message, id), { status });
}
