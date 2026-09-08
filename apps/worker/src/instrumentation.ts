import { NodeSDK } from "@opentelemetry/sdk-node";

let sdk: NodeSDK | undefined;

export function startInstrumentation(): void {
  if (sdk) return;
  sdk = new NodeSDK();
  sdk.start();
}
