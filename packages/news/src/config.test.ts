import { expect, it } from "vitest";
import { createNewsConfig } from "./config";

it("keeps the existing identity projection free of local Payload auth fields after its security upgrade", async () => {
  const config = await createNewsConfig(
    "postgresql://synthetic:synthetic@127.0.0.1/not-connected",
    "synthetic-config-secret-at-least-32-characters",
  );
  const users = config.collections!.find((collection) => collection.slug === "panel-users")!;
  const fields = users.fields.filter((field) => "name" in field).map((field) => field.name);
  expect(users.auth).toMatchObject({ disableLocalStrategy: true, useSessions: false });
  for (const field of ["resetPasswordRequestedAt", "salt", "hash", "sessions"])
    expect(fields).not.toContain(field);
  expect(config.admin).toMatchObject({ disable: true });
  expect(config.graphQL).toMatchObject({ disable: true });
});
