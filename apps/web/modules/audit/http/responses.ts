import { ZodError } from "zod";
import { apiError } from "@caab/contracts";

export function auditRequestId(request: Request): string {
  const supplied = request.headers.get("x-request-id");
  return supplied && /^[0-9a-f-]{36}$/i.test(supplied) ? supplied : crypto.randomUUID();
}

export function auditCorrelationId(request: Request): string {
  const supplied = request.headers.get("x-correlation-id");
  return supplied && /^[0-9a-f-]{36}$/i.test(supplied) ? supplied : crypto.randomUUID();
}

export function validateAuditMutation(request: Request): string {
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    throw Object.assign(new Error("Request origin denied"), { code: "ORIGIN_DENIED", status: 403 });
  }
  const csrf = request.headers.get("x-csrf-token");
  if (!csrf || csrf.length < 32) {
    throw Object.assign(new Error("CSRF token required"), {
      code: "CSRF_TOKEN_REQUIRED",
      status: 403,
    });
  }
  const key = request.headers.get("idempotency-key");
  if (!key || key.length < 16 || key.length > 128) {
    throw Object.assign(new Error("Valid idempotency key required"), {
      code: "IDEMPOTENCY_KEY_REQUIRED",
      status: 422,
    });
  }
  return key;
}

export function auditRouteError(error: unknown, requestId: string): Response {
  if (error instanceof ZodError) {
    return Response.json(
      {
        ...apiError("VALIDATION_FAILED", "Validation failed", requestId),
        fields: error.issues.map((issue) => ({ path: issue.path.join("."), code: issue.code })),
      },
      { status: 422 },
    );
  }
  const suppliedStatus =
    typeof error === "object" && error && "status" in error
      ? Number((error as { status: unknown }).status)
      : 500;
  const status = [401, 403, 409, 422].includes(suppliedStatus) ? suppliedStatus : 500;
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
        : status === 409
          ? "Request conflicts with current state"
          : status === 422
            ? "Validation failed"
            : "Unexpected server error";
  return Response.json(apiError(code, message, requestId), { status });
}
