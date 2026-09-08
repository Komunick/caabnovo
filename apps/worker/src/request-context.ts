import { AsyncLocalStorage } from "node:async_hooks";

export interface WorkerRequestContext {
  requestId?: string;
  correlationId: string;
  jobId: string;
}

const workerStorage = new AsyncLocalStorage<WorkerRequestContext>();

export function runWithWorkerContext<T>(context: WorkerRequestContext, operation: () => T): T {
  return workerStorage.run(context, operation);
}

export function getWorkerContext(): WorkerRequestContext {
  const context = workerStorage.getStore();
  if (!context) throw new Error("Worker request context is not available");
  return context;
}
