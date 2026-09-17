import { describe, expect, it } from "vitest";
import { loadServerEnv } from "./env";

const environment = {
  NODE_ENV: "test",
  DATABASE_URL: "postgresql://fixture:fixture@database:5432/test",
  BETTER_AUTH_SECRET: "unit-fixture-for-authentication-49153",
  BETTER_AUTH_URL: "https://panel.example.test",
  CLAMAV_HOST: "antivirus",
  OTEL_EXPORTER_OTLP_ENDPOINT: "http://collector:4318",
};

describe("deployed environment", () => {
  it("rejects example authentication and database secrets outside loopback", () => {
    const publicEnv = {
      ...environment,
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://runtime:random-database-value@database/caab",
      BETTER_AUTH_SECRET: "public-deployment-random-fixture-8bf719",
    };
    expect(loadServerEnv(publicEnv)).toBeDefined();
    for (const secret of [
      "replace-with-at-least-32-random-characters",
      "e2e-only-secret-with-at-least-32-characters",
      "synthetic-test-secret-at-least-32-characters",
    ])
      expect(() => loadServerEnv({ ...publicEnv, BETTER_AUTH_SECRET: secret })).toThrow();
    expect(() =>
      loadServerEnv({
        ...publicEnv,
        DATABASE_URL: "postgresql://runtime:change-me-runtime@database/caab",
      }),
    ).toThrow();
    expect(
      loadServerEnv({
        ...publicEnv,
        BETTER_AUTH_URL: "http://localhost:3000",
        BETTER_AUTH_SECRET: "replace-with-at-least-32-random-characters",
      }),
    ).toBeDefined();
  });
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
