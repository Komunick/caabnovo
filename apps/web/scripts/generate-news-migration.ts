import { BasePayload } from "payload";
import { createNewsConfig } from "../modules/news/payload/config";

// Schema generation does not connect to a database or load local credentials.
const payload = new BasePayload();
await payload.init({
  config: createNewsConfig(
    "postgresql://schema:unused@127.0.0.1:1/schema_only",
    "schema-generation-only-not-a-runtime-secret",
  ),
  disableDBConnect: true,
  disableOnInit: true,
});
await payload.db.createMigration({
  payload,
  migrationName: "news_initial",
  forceAcceptWarning: true,
});
console.log("News schema generated for review; no database was changed.");
