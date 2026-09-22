export class UserError extends Error {
  readonly userMessage: string;
  readonly exitCode: number;
  constructor(message: string, exitCode = 1) {
    super(message);
    this.name = "UserError";
    this.userMessage = message;
    this.exitCode = exitCode;
  }
}
