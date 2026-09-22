export class UserError extends Error {
    userMessage;
    exitCode;
    constructor(message, exitCode = 1) {
        super(message);
        this.name = "UserError";
        this.userMessage = message;
        this.exitCode = exitCode;
    }
}
//# sourceMappingURL=errors.js.map