import { describe, expect, it } from "vitest";
import { loadServerEnv } from "./env";

const environment = {
  DATABASE_URL: "postgresql://synthetic:synthetic@database:5432/test",
  BETTER_AUTH_SECRET: "synthetic-test-secret-at-least-32-characters",
  BETTER_AUTH_URL: "https://panel.example.test",
  S3_ENDPOINT: "http://storage:9000",
  S3_PUBLIC_ENDPOINT: "https://files.example.test",
  S3_ACCESS_KEY: "synthetic",
  S3_SECRET_KEY: "synthetic",
  S3_QUARANTINE_BUCKET: "quarantine",
  S3_PRIVATE_BUCKET: "private",
  S3_PUBLIC_BUCKET: "public",
  CLAMAV_HOST: "antivirus",
  OTEL_EXPORTER_OTLP_ENDPOINT: "http://collector:4318",
};

describe("deployed environment", () => {
  it("allows private service addresses and a separate browser storage endpoint", () => {
    expect(loadServerEnv(environment)).toMatchObject({
      S3_ENDPOINT: "http://storage:9000",
      S3_PUBLIC_ENDPOINT: "https://files.example.test",
    });
  });
  it("keeps a single public storage endpoint compatible", () => {
    expect(
      loadServerEnv({
        ...environment,
        S3_ENDPOINT: "https://files.example.test",
        S3_PUBLIC_ENDPOINT: undefined,
      }).S3_ENDPOINT,
    ).toBe("https://files.example.test");
  });
  it.each([
    "http://localhost:9000",
    "http://storage:9000",
    "https://127.0.0.1:9000",
    "ftp://files.example.test",
    "https://user:secret@files.example.test",
    "https://files.example.test?x=1",
  ])("rejects unusable browser storage URL %s on the public panel", (endpoint) => {
    expect(() => loadServerEnv({ ...environment, S3_PUBLIC_ENDPOINT: endpoint })).toThrow();
  });
  it("retains local development endpoints", () => {
    expect(
      loadServerEnv({
        ...environment,
        BETTER_AUTH_URL: "http://localhost:3000",
        S3_ENDPOINT: "http://127.0.0.1:9000",
        S3_PUBLIC_ENDPOINT: undefined,
      }),
    ).toBeDefined();
  });
});
