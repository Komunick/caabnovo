import { describe, expect, it, vi } from "vitest";
import { createOabProvider, isOabConfigured } from "./oab-provider";

const env = { OAB_API_ENABLED: "true", API_OAB_KEY: "test-key", API_OAB_PASSWORD: "test-password" };
const row = {
  Nome: "Pessoa sintética",
  OAB: "001234",
  SituacaoRegular: "SIM",
  CPF: "private",
  Inadimplente: "private",
};
describe("OAB provider boundary", () => {
  it.each([{}, { ...env, OAB_API_ENABLED: "false" }, { ...env, API_OAB_PASSWORD: "" }])(
    "fails closed without configuration %j",
    async (source) => {
      const fetcher = vi.fn();
      expect(isOabConfigured(source)).toBe(false);
      expect(() => createOabProvider(source, fetcher)).toThrow("OAB_NOT_CONFIGURED");
      expect(fetcher).not.toHaveBeenCalled();
    },
  );
  it("uses only the fixed institution endpoint, server headers, no cache and no redirect", async () => {
    const fetcher = vi.fn(async () => Response.json([row]));
    const result = await createOabProvider(env, fetcher)("1234");
    expect(result).toEqual({ name: row.Nome, status: "regular" });
    expect(JSON.stringify(result)).not.toContain("private");
    const [url, init] = fetcher.mock.calls[0]! as unknown as [URL, RequestInit];
    expect(url.origin).toBe("https://oab-ba.implanta.net.br");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      sistema: "siscaf",
      modulo: "WEBSERVICE CAAB",
      nomeRelatorio: "STATUS CAAB",
      OAB: "1234",
    });
    expect(init).toMatchObject({
      headers: { Chave: env.API_OAB_KEY, Senha: env.API_OAB_PASSWORD },
      redirect: "error",
      cache: "no-store",
    });
    expect(url.toString()).not.toContain(env.API_OAB_PASSWORD);
  });
  it.each([
    ["NÃO", "irregular"],
    ["NAO", "irregular"],
    [" sim ", "regular"],
    ["SUSPENSO", "unknown"],
    [null, "unknown"],
  ])("maps %s without guessing unknown values", async (value, status) => {
    expect(
      await createOabProvider(env, async () => Response.json([{ ...row, SituacaoRegular: value }]))(
        "1234",
      ),
    ).toMatchObject({ status });
  });
  it("distinguishes no record from service failure", async () => {
    expect(await createOabProvider(env, async () => Response.json([]))("1234")).toEqual({
      name: null,
      status: "not_found",
    });
  });
  it.each([
    {},
    [{ ...row, OAB: "9999" }],
    [row, row],
    [{ ...row, Nome: null }],
    [{ ...row, SituacaoRegular: {} }],
  ])("rejects malformed, mismatched and ambiguous responses %j", async (data) => {
    await expect(
      createOabProvider(env, async () => Response.json(data))("1234"),
    ).rejects.toMatchObject({ code: "OAB_INVALID_RESPONSE", status: 502 });
  });
  it.each([
    [401, "OAB_CREDENTIALS_REJECTED"],
    [403, "OAB_CREDENTIALS_REJECTED"],
    [429, "OAB_UNAVAILABLE"],
    [500, "OAB_UNAVAILABLE"],
  ])("sanitizes provider HTTP %s", async (status, code) => {
    await expect(
      createOabProvider(
        env,
        async () => new Response("secret body", { status: status as number }),
      )("1234"),
    ).rejects.toMatchObject({ code });
  });
  it("bounds body size and rejects invalid JSON", async () => {
    for (const body of ["x".repeat(65537), "<html>provider error</html>"]) {
      await expect(
        createOabProvider(env, async () => new Response(body))("1234"),
      ).rejects.toMatchObject({ code: "OAB_INVALID_RESPONSE" });
    }
  });
  it("rejects malformed UTF-8 as an invalid response", async () => {
    await expect(
      createOabProvider(env, async () => new Response(new Uint8Array([0xff])))("1234"),
    ).rejects.toMatchObject({ code: "OAB_INVALID_RESPONSE" });
  });
  it("times out stalled bodies and does not expose network errors", async () => {
    const body = new ReadableStream({ start() {} });
    await expect(
      createOabProvider(env, async () => new Response(body), 10)("1234"),
    ).rejects.toMatchObject({ code: "OAB_TIMEOUT", status: 504 });
    await expect(
      createOabProvider(env, async () => {
        throw new Error("URL with secret");
      })("1234"),
    ).rejects.toMatchObject({ message: "OAB_UNAVAILABLE" });
  });
  it.each(["", "0", "-1", "12A", "1234567", "1&CPF=private"])(
    "never sends invalid number %s",
    async (number) => {
      const fetcher = vi.fn();
      await expect(createOabProvider(env, fetcher)(number)).rejects.toBeDefined();
      expect(fetcher).not.toHaveBeenCalled();
    },
  );
});
