import "server-only";
import { metrics, trace, SpanStatusCode, type Attributes } from "@opentelemetry/api";

const meter = metrics.getMeter("caab-web");
const tracer = trace.getTracer("caab-web");
const requestDuration = meter.createHistogram("http.server.request.duration", { unit: "ms" });
const requestErrors = meter.createCounter("http.server.request.errors");
const storageErrors = meter.createCounter("storage.operation.errors");

export function recordHttpRequest(
  route: string,
  method: string,
  status: number,
  durationMs: number,
): void {
  const attributes = {
    "http.route": route,
    "http.request.method": method,
    "http.response.status_code": status,
  };
  requestDuration.record(durationMs, attributes);
  if (status >= 500) requestErrors.add(1, attributes);
}

export async function observeHttpRequest(
  request: Request,
  route: string,
  operation: () => Promise<Response>,
): Promise<Response> {
  const startedAt = performance.now();
  return withServerSpan(
    `${request.method} ${route}`,
    { "http.route": route, "http.request.method": request.method },
    async () => {
      const response = await operation();
      recordHttpRequest(route, request.method, response.status, performance.now() - startedAt);
      return response;
    },
  );
}

export function recordStorageError(operation: string): void {
  storageErrors.add(1, { "storage.operation": operation });
}

export async function withServerSpan<T>(
  name: string,
  attributes: Attributes,
  operation: () => Promise<T>,
): Promise<T> {
  return tracer.startActiveSpan(name, { attributes }, async (span) => {
    try {
      const result = await operation();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR });
      if (error instanceof Error) span.recordException(error);
      throw error;
    } finally {
      span.end();
    }
  });
}
