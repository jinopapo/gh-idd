export declare class UserError extends Error {
    readonly userMessage: string;
    readonly exitCode: number;
    constructor(message: string, exitCode?: number);
}
