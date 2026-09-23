import type { CommandRunner } from "./command-runner.js";
import type { Issue, ProjectConfig, ProjectItem, ProjectSummary, PullRequest } from "../core/types.js";
import type { PullRequestContent } from "./codex.js";
export declare class GitHubAdapter {
    private readonly runner;
    readonly repo: string;
    readonly owner: string;
    readonly name: string;
    constructor(runner: CommandRunner, repo: string);
    static detect(runner: CommandRunner, requestedRepo?: string): GitHubAdapter;
    private graphql;
    issue(number: string | number): Issue;
    currentLogin(): string;
    assign(issue: Issue): void;
    createIssue(title: string, body?: string, bodyFile?: string): string;
    closeIssue(issue: Issue): void;
    createDevelopmentBranch(issue: Issue, name: string): void;
    updateProject(issue: Pick<Issue, "url">, project: ProjectConfig, status: string): void;
    addProjectItem(url: string, project: ProjectConfig): void;
    setProjectStatus(url: string, project: ProjectConfig, status: string): void;
    projectItem(issue: Issue, project: ProjectConfig): ProjectItem | null;
    issueForBranch(branch: string): Issue;
    private findIssueByLinkedBranch;
    findPullRequest(branch: string): PullRequest | null;
    createPullRequest(issue: Issue, content?: PullRequestContent): PullRequest;
    listProjects(owner: string): ProjectSummary[];
    assertProjectAccessible(owner: string, number: number): void;
}
