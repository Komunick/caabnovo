import "server-only";
import { createHmac } from "node:crypto";
import { BasePayload } from "payload";
import { loadServerEnv } from "@caab/config";
import { createNewsConfig } from "./config";

let instance: Promise<BasePayload> | undefined;
export function getNewsPayload(): Promise<BasePayload> {
  if (!instance) {
    const env = loadServerEnv();
    // Separate purpose-derived secret; Payload does not issue login tokens or cookies here.
    const secret = createHmac("sha256", env.BETTER_AUTH_SECRET)
      .update("caab:news:payload:v1")
      .digest("hex");
    instance = new BasePayload()
      .init({ config: createNewsConfig(env.DATABASE_URL, secret) })
      .catch((error) => {
        instance = undefined;
        throw error;
      });
  }
  return instance;
}
