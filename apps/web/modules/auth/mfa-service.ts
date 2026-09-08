import "server-only";

type AuthHandler = (request: Request) => Promise<Response>;

export class MfaService {
  constructor(
    private readonly handler: AuthHandler,
    private readonly baseURL: string,
  ) {}

  beginEnrollment(request: Request, password: string): Promise<Response> {
    return this.post(request, "/two-factor/enable", { password, method: "totp", issuer: "CAAB" });
  }

  confirmEnrollment(request: Request, code: string): Promise<Response> {
    return this.post(request, "/two-factor/verify-totp", { code, trustDevice: false });
  }

  verifyRecoveryCode(request: Request, code: string): Promise<Response> {
    return this.post(request, "/two-factor/verify-backup-code", {
      code,
      disableSession: false,
      trustDevice: false,
    });
  }

  private post(request: Request, path: string, body: unknown): Promise<Response> {
    const headers = new Headers({ "content-type": "application/json", origin: this.baseURL });
    for (const name of ["cookie", "user-agent", "x-forwarded-for", "x-real-ip"]) {
      const value = request.headers.get(name);
      if (value) headers.set(name, value);
    }
    return this.handler(
      new Request(new URL(`/api/auth${path}`, this.baseURL), {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      }),
    );
  }
}
