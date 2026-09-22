import type { GitHubAdapter } from "../adapters/github.js";
import type { Issue, ProjectSummary } from "../core/types.js";
export declare function parseProjectReference(reference: string | undefined, defaultOwner: string): {
    owner: string;
    number: number;
} | null;
export declare function chooseProject(github: GitHubAdapter): Promise<ProjectSummary>;
export declare function chooseIssue(issues: Issue[]): Promise<Issue>;
