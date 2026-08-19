/**
 * 统一的业务错误：带可读的 message，由 Server Action 捕获并展示给用户。
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string = "APP_ERROR",
  ) {
    super(message);
    this.name = "AppError";
  }
}