import "server-only";
import { AsyncLocalStorage } from "node:async_hooks";

export interface RequestActor {
  userId: string;
  sessionId: string;
  permissions: ReadonlySet<string>;
  mfaVerified: boolean;
}

export interface RequestContext {
  requestId: string;
  correlationId: string;
  actor?: RequestActor;
}

const requestStorage = new AsyncLocalStorage<RequestContext>();

export function runWithRequestContext<T>(context: RequestContext, operation: () => T): T {
  return requestStorage.run(context, operation);
}

export function getRequestContext(): RequestContext {
  const context = requestStorage.getStore();
  if (!context) throw new Error("Request context is not available");
  return context;
}

export function requestContextFromHeaders(headers: Headers): RequestContext {
  return {
    requestId: crypto.randomUUID(),
    correlationId: headers.get("x-correlation-id") ?? crypto.randomUUID(),
  };
}
