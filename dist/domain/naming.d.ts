import type { Issue } from "../core/types.js";
export declare function issueType(title: string): string;
export declare function slugify(title: string): string;
export declare function branchName(issue: Pick<Issue, "number" | "title">, format: string, ai?: string): string;
export declare function issueNumberFromBranch(branch: string): number | null;
