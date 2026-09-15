import { afterEach, describe, expect, it, vi } from "vitest";
import { createOabProvider, isOabConfigured } from "./oab-provider";

const env = { API_OAB_KEY: "test-key", API_OAB_PASSWORD: "test-password" };
const row = {
  Nome: "Pessoa sintética",
  OAB: "001234",
  SituacaoRegular: "SIM",
  CPF: "000.000.000-00",
  Inadimplente: "NÃO",
  Detalhe: "Detalhe sintético",
  SubSecao: "Subseção sintética",
  DataCompromisso: "01/02/2020",
  PagoTotalExercicioAtual: "private",
  DataInadimplencia: "private",
  ExtraField: "private",
};
describe("OAB provider boundary", () => {
  afterEach(() => vi.unstubAllEnvs());
  it.each([
    {},
    { ...env, API_OAB_KEY: " " },
    { ...env, API_OAB_PASSWORD: "" },
    { API_OAB_KEY: "test-key" },
    { API_OAB_PASSWORD: "test-password" },
  ])("fails closed without configuration %j", async (source) => {
    const fetcher = vi.fn();
    expect(isOabConfigured(source)).toBe(false);
    expect(() => createOabProvider(source, fetcher)).toThrow("OAB_NOT_CONFIGURED");
    expect(fetcher).not.toHaveBeenCalled();
  });
  it.each([undefined, "true", " TRUE ", "false", " FALSE ", "", "treu", "1"])(
    "queries with server credentials regardless of legacy activation flag %s",
    async (flag) => {
      const source = {
        API_OAB_KEY: " test-key ",
        API_OAB_PASSWORD: " test-password ",
        ...(flag === undefined ? {} : { OAB_API_ENABLED: flag }),
      };
      const fetcher = vi.fn(async () => Response.json([row]));
      expect(isOabConfigured(source)).toBe(true);
      await expect(createOabProvider(source, fetcher)("1234")).resolves.toMatchObject({
        status: "regular",
        name: row.Nome,
      });
      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(fetcher.mock.calls[0]).toEqual([
        expect.any(URL),
        expect.objectContaining({
          headers: { Chave: "test-key", Senha: "test-password" },
        }),
      ]);
    },
  );
  it("reads current server credentials and ignores the legacy disable switch", () => {
    vi.stubEnv("OAB_API_ENABLED", undefined);
    vi.stubEnv("API_OAB_KEY", "runtime-test-key");
    vi.stubEnv("API_OAB_PASSWORD", "runtime-test-password");
    expect(isOabConfigured()).toBe(true);
    vi.stubEnv("OAB_API_ENABLED", "false");
    expect(isOabConfigured()).toBe(true);
    vi.stubEnv("OAB_API_ENABLED", "true");
    vi.stubEnv("API_OAB_PASSWORD", "");
    expect(isOabConfigured()).toBe(false);
  });
  it("uses only the fixed institution endpoint, server headers, no cache and no redirect", async () => {
    const fetcher = vi.fn(async () => Response.json([row]));
    const result = await createOabProvider(env, fetcher)("1234");
    expect(result).toEqual({
      name: row.Nome,
      status: "regular",
      cpf: row.CPF,
      delinquent: false,
      detail: row.Detalhe,
      subsection: row.SubSecao,
      commitmentDate: row.DataCompromisso,
    });
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
  it.each([
    ["SIM", true],
    [" não ", false],
    ["NAO", false],
    ["PENDENTE", null],
    [null, null],
    [undefined, null],
  ])("maps delinquency %s independently from regularity", async (value, delinquent) => {
    const result = await createOabProvider(env, async () =>
      Response.json([{ ...row, Inadimplente: value }]),
    )("1234");
    expect(result).toMatchObject({ status: "regular", delinquent });
  });
  it("keeps missing and blank optional fields explicit without inventing provider data", async () => {
    const result = await createOabProvider(env, async () =>
      Response.json([
        {
          Nome: row.Nome,
          OAB: row.OAB,
          CPF: " ",
          Detalhe: null,
          SubSecao: "",
          DataCompromisso: null,
        },
      ]),
    )("1234");
    expect(result).toEqual({
      name: row.Nome,
      status: "unknown",
      cpf: null,
      delinquent: null,
      detail: null,
      subsection: null,
      commitmentDate: null,
    });
  });
  it("distinguishes no record from service failure", async () => {
    expect(await createOabProvider(env, async () => Response.json([]))("1234")).toEqual({
      name: null,
      status: "not_found",
      cpf: null,
      delinquent: null,
      detail: null,
      subsection: null,
      commitmentDate: null,
    });
  });
  it.each([
    {},
    [{ ...row, OAB: "9999" }],
    [row, row],
    [{ ...row, Nome: null }],
    [{ ...row, SituacaoRegular: {} }],
    [{ ...row, CPF: {} }],
    [{ ...row, Inadimplente: false }],
    [{ ...row, Detalhe: "x".repeat(1001) }],
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
