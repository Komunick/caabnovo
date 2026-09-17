import { describe, expect, it } from "vitest";
import { loadServerEnv } from "./env";

const environment = {
  DATABASE_URL: "postgresql://synthetic:synthetic@database:5432/test",
  BETTER_AUTH_SECRET: "synthetic-test-secret-at-least-32-characters",
  BETTER_AUTH_URL: "https://panel.example.test",
  CLAMAV_HOST: "antivirus",
  OTEL_EXPORTER_OTLP_ENDPOINT: "http://collector:4318",
};

describe("deployed environment", () => {
  it("uses only the application database without external storage configuration", () => {
    expect(loadServerEnv(environment).FILE_STORAGE_BACKEND).toBe("database");
    expect(loadServerEnv({ ...environment, FILE_STORAGE_BACKEND: "database" })).toBeDefined();
  });
  it("rejects the retired backend even if obsolete credentials remain configured", () => {
    expect(() =>
      loadServerEnv({
        ...environment,
        FILE_STORAGE_BACKEND: "s3",
        S3_ENDPOINT: "https://files.example.test",
        S3_ACCESS_KEY: "synthetic",
        S3_SECRET_KEY: "synthetic",
      }),
    ).toThrow();
    const parsed = loadServerEnv({
      ...environment,
      S3_ENDPOINT: "obsolete",
      S3_SECRET_KEY: "synthetic",
    });
    expect(Object.keys(parsed).some((key) => key.startsWith("S3_"))).toBe(false);
  });
  it("retains local development without an object storage endpoint", () => {
    expect(
      loadServerEnv({ ...environment, BETTER_AUTH_URL: "http://localhost:3000" }),
    ).toBeDefined();
  });
});
