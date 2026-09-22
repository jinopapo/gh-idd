import type { CommandRunner } from "./adapters/command-runner.js";
import type { ParsedArguments } from "./core/command.js";
export declare function run(argv: string[], dependencies?: {
    runner?: CommandRunner;
}): Promise<void>;
export declare function parseArguments(argv: string[]): ParsedArguments;
