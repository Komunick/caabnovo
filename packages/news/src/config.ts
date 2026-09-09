import { postgresAdapter } from "@payloadcms/db-postgres";
import {
  lexicalEditor,
  BoldFeature,
  ItalicFeature,
  ParagraphFeature,
  HeadingFeature,
  UnorderedListFeature,
  OrderedListFeature,
} from "@payloadcms/richtext-lexical";
import { buildConfig, type Access } from "payload";
import { resolve } from "node:path";
import { newsPg } from "./connection";

// This context is supplied only by the authenticated domain service. No Payload HTTP routes exist.
const panelAccess: Access = ({ req }) => req.context.newsActorVerified === true;
const deny: Access = () => false;

export function createNewsConfig(connectionString: string, secret: string) {
  if (process.env.PAYLOAD_DROP_DATABASE === "true") {
    throw new Error("Automatic database deletion is disabled for the CAAB content adapter");
  }
  return buildConfig({
    secret,
    telemetry: false,
    admin: { disable: true, user: "panel-users" },
    graphQL: { disable: true },
    folders: false,
    jobs: { tasks: [], autoRun: [] },
    typescript: { autoGenerate: false },
    db: postgresAdapter({
      pg: newsPg,
      pool: { connectionString, max: 5 },
      idType: "uuid",
      push: false,
      disableCreateDatabase: true,
      // Generation is review-only; deployment uses the existing packages/db migration runner.
      migrationDir: resolve(process.cwd(), ".cache/news-schema"),
    }),
    editor: lexicalEditor({
      features: () => [
        ParagraphFeature(),
        BoldFeature(),
        ItalicFeature(),
        HeadingFeature({ enabledHeadingSizes: ["h2", "h3"] }),
        UnorderedListFeature(),
        OrderedListFeature(),
      ],
    }),
    collections: [
      {
        // Read-only projection onto the EXISTING identity table; no parallel account store.
        slug: "panel-users",
        dbName: "user",
        auth: { disableLocalStrategy: true, useSessions: false },
        timestamps: false,
        lockDocuments: false,
        access: { read: deny, create: deny, update: deny, delete: deny, admin: () => false },
        fields: [{ name: "name", type: "text" }],
      },
      {
        slug: "news",
        dbName: "news",
        lockDocuments: false,
        versions: { drafts: true, maxPerDoc: 0 },
        access: {
          read: panelAccess,
          readVersions: panelAccess,
          create: panelAccess,
          update: panelAccess,
          delete: deny,
        },
        fields: [
          {
            name: "metadata",
            type: "group",
            fields: [
              { name: "title", type: "text", maxLength: 200 },
              { name: "summary", type: "textarea", maxLength: 500 },
              { name: "slug", type: "text", maxLength: 180 },
              { name: "category", type: "text", maxLength: 80 },
              { name: "tags", type: "json" },
              { name: "channels", type: "json" },
              { name: "cover", type: "json" },
              { name: "highlight", type: "json" },
            ],
          },
          { name: "body", type: "richText" },
          { name: "revision", type: "number", required: true, min: 1 },
          { name: "archived", type: "checkbox", defaultValue: false },
          { name: "editorUserId", type: "text", required: true },
        ],
      },
    ],
  });
}
