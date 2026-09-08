export class UserAccessError extends Error {
  constructor(
    readonly code: string,
    readonly status: 403 | 404 | 409 | 422,
    message: string,
  ) {
    super(message);
    this.name = "UserAccessError";
  }
}
