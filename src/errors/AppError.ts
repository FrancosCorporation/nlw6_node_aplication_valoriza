export class AppError extends Error {
  constructor(message: string, readonly statusCode = 400) {
    super(message);
    this.name = "AppError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
