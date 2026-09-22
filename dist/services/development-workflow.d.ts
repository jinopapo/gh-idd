import type { GitHubAdapter } from "../adapters/github.js";
import type { GitAdapter } from "../adapters/git.js";
import type { AppConfig, Issue, ProjectConfig, ProjectItem, PullRequest } from "../core/types.js";
import type { DevelopmentContentGenerator } from "../adapters/codex.js";
export interface StartResult {
    issue: Issue;
    branch: string;
}
export interface PrResult extends StartResult {
    pr: PullRequest;
}
export interface CloseResult {
    issue: Issue;
    next: StartResult | null;
}
export type CurrentIssueResult = StartResult;
export interface StatusResult {
    issue: Issue;
    branch: string;
    project: ProjectConfig;
    item: ProjectItem | null;
    pr: PullRequest | null;
}
export declare class DevelopmentWorkflow {
    private readonly github;
    private readonly git;
    private readonly config;
    private readonly contentGenerator?;
    constructor(github: GitHubAdapter, git: GitAdapter, config: AppConfig, contentGenerator?: DevelopmentContentGenerator | undefined);
    start(issueNumber: string | number, options?: {
        force?: boolean;
    }): StartResult;
    nextIssue(options?: {
        force?: boolean;
    }): Promise<StartResult>;
    closeIssue(options?: {
        force?: boolean;
    }): Promise<CloseResult>;
    private startNextIssue;
    currentIssue(): CurrentIssueResult;
    createPr(): PrResult;
    status(): StatusResult;
    private generator;
}
export declare function formatStatus({ issue, branch, project, item, pr }: StatusResult): string;
export declare function formatCurrentIssue({ issue }: CurrentIssueResult): string;
