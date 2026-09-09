import { createHmac } from "node:crypto";
import { BasePayload } from "payload";
import { loadServerEnv } from "@caab/config";
import { createNewsConfig } from "@caab/news/config";
import { closeNewsPayload } from "@caab/news/connection";
import { runNewsAction } from "@caab/news/action-runner";

let instance: Promise<BasePayload> | undefined;
export async function runScheduledNews(input: unknown) {
  if (!instance) {
    const env = loadServerEnv();
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
  return runNewsAction(await instance, input);
}
export async function closeScheduledNews() {
  if (instance) await closeNewsPayload(await instance);
  instance = undefined;
}
