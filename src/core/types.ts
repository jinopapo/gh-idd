export type IssueState = "OPEN" | "CLOSED";

export interface IssueReference {
  number: number;
  title: string;
  state: IssueState;
  url: string;
}

export interface Issue extends IssueReference {
  id: string;
  assignees: Array<{ login: string }>;
  blockedBy: IssueReference[];
  blocking: IssueReference[];
  branches: Array<{ name: string }>;
}

export interface PullRequest {
  number?: number;
  title: string;
  url: string;
  state?: string;
}

export interface ProjectConfig {
  owner: string;
  number: number;
  status_field?: string;
  status: { todo: string; progress: string; review: string };
}

export interface AppConfig {
  branch: { format: string; ai_prompt?: string };
  pull_request: { title: string; body: string; ai_prompt?: string };
  codex: { profile?: string };
  project: Partial<ProjectConfig> & { status: ProjectConfig["status"] };
  workflow: { assign_on_start: boolean; update_project: boolean; check_dependencies: boolean };
}

export interface ProjectItem {
  status?: string;
  content?: { url?: string };
  fieldValues?: Array<{ field?: { name?: string }; name?: string }>;
}

export interface ProjectSummary { owner: string; number: number; title: string }
