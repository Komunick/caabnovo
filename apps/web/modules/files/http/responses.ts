import { ZodError } from "zod";
import { apiError } from "@caab/contracts";

export function requestId(request: Request): string {
  const supplied = request.headers.get("x-request-id");
  return supplied && /^[0-9a-f-]{36}$/i.test(supplied) ? supplied : crypto.randomUUID();
}

export function correlationId(request: Request): string {
  const supplied = request.headers.get("x-correlation-id");
  return supplied && /^[0-9a-f-]{36}$/i.test(supplied) ? supplied : crypto.randomUUID();
}

export function validateMutation(
  request: Request,
  needsIdempotencyKey: boolean,
): string | undefined {
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
  if (!needsIdempotencyKey) return undefined;
  const key = request.headers.get("idempotency-key");
  if (!key || key.length < 16 || key.length > 128) {
    throw Object.assign(new Error("Valid idempotency key required"), {
      code: "IDEMPOTENCY_KEY_REQUIRED",
      status: 422,
    });
  }
  return key;
}

export function routeError(error: unknown, currentRequestId: string): Response {
  if (error instanceof ZodError) {
    return Response.json(
      {
        ...apiError("VALIDATION_FAILED", "Validation failed", currentRequestId),
        fields: error.issues.map((issue) => ({ path: issue.path.join("."), code: issue.code })),
      },
      { status: 422 },
    );
  }
  const suppliedStatus =
    typeof error === "object" && error && "status" in error
      ? Number((error as { status: unknown }).status)
      : 500;
  const status = [401, 403, 404, 409, 413, 422].includes(suppliedStatus) ? suppliedStatus : 500;
  const suppliedCode =
    typeof error === "object" && error && "code" in error
      ? String((error as { code: unknown }).code)
      : undefined;
  const defaults: Record<number, [string, string]> = {
    401: ["AUTHENTICATION_REQUIRED", "Authentication required"],
    403: ["PERMISSION_DENIED", "Permission denied"],
    404: ["NOT_FOUND", "Resource not found"],
    409: ["STATE_CONFLICT", "Request conflicts with current state"],
    413: ["PAYLOAD_TOO_LARGE", "Payload exceeds configured limit"],
    422: ["VALIDATION_FAILED", "Validation failed"],
    500: ["INTERNAL_ERROR", "Unexpected server error"],
  };
  const [defaultCode, message] = defaults[status] ?? defaults[500]!;
  return Response.json(apiError(suppliedCode ?? defaultCode, message, currentRequestId), {
    status,
  });
}
