import "server-only";
import { NodeSDK } from "@opentelemetry/sdk-node";

let sdk: NodeSDK | undefined;

export async function startInstrumentation(): Promise<void> {
  if (sdk) return;
  sdk = new NodeSDK();
  sdk.start();
}
