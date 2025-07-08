export class RssServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly response?: any,
  ) {
    super(message);
    this.name = "RssServiceError";
  }
}

export class RssFeedNotFoundError extends RssServiceError {
  constructor(feedId: string) {
    super(`Feed with ID '${feedId}' not found.`, 404);
  }
}

export class RssConfigurationError extends RssServiceError {
  constructor(message: string) {
    super(`Feed configuration error: ${message}`, 400);
  }
}

export class RssStorageError extends RssServiceError {
  constructor(message: string) {
    super(`Storage error: ${message}`, 500);
  }
}
