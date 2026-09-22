import type { CommandRunner } from "./command-runner.js";
export declare class GitAdapter {
    private readonly runner;
    constructor(runner: CommandRunner);
    repositoryRoot(): string;
    currentBranch(): string;
    push(branch: string): void;
}
