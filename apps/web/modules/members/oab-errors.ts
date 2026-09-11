export class OabError extends Error {
  constructor(
    readonly code: string,
    readonly status: 409 | 422 | 429 | 502 | 503 | 504,
  ) {
    super(code);
  }
}
