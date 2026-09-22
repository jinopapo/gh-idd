import type { CommandRunner } from "./command-runner.js";
import type { Issue } from "../core/types.js";
export interface PullRequestContent {
    title: string;
    body: string;
}
export interface DevelopmentContentGenerator {
    branchValue(issue: Issue, prompt?: string): string;
    pullRequest(issue: Issue, branch: string, prompt?: string): PullRequestContent;
}
export declare class CodexContentGenerator implements DevelopmentContentGenerator {
    private readonly runner;
    private readonly repoRoot;
    private readonly profile?;
    constructor(runner: CommandRunner, repoRoot: string, profile?: string | undefined);
    branchValue(issue: Issue, prompt?: string): string;
    pullRequest(issue: Issue, branch: string, prompt?: string): PullRequestContent;
    private execute;
}
