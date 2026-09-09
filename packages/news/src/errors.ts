export class NewsPolicyError extends Error {
  constructor(
    readonly code:
      | "NEWS_VERSION_CONFLICT"
      | "NEWS_ARCHIVED"
      | "NEWS_NOT_READY"
      | "NEWS_NOT_FOUND"
      | "NEWS_MEDIA_UNAVAILABLE"
      | "NEWS_SLUG_CONFLICT"
      | "NEWS_ACTION_CONFLICT",
    readonly status: 404 | 409 | 422,
    message: string,
    readonly issues: readonly { field: string; code: string }[] = [],
  ) {
    super(message);
    this.name = "NewsPolicyError";
  }
}
