import type { CommandRunner } from "./command-runner.js";
import type { Issue, IssueReference, ProjectConfig, ProjectItem, ProjectSummary, PullRequest } from "../core/types.js";
import { UserError } from "../errors.js";
import { issueNumberFromBranch } from "../domain/naming.js";
import type { PullRequestContent } from "./codex.js";

const ISSUE_QUERY = `query($owner:String!, $repo:String!, $number:Int!) {
  repository(owner:$owner, name:$repo) {
    issue(number:$number) {
      id number title state url
      assignees(first:100) { nodes { login } }
      blockedBy(first:100) { nodes { number title state url } }
      blocking(first:100) { nodes { number title state url } }
      linkedBranches(first:100) { nodes { ref { name } } }
    }
  }
}`;

const LINKED_ISSUES_QUERY = `query($owner:String!, $repo:String!, $after:String) {
  repository(owner:$owner, name:$repo) {
    issues(first:100, after:$after, states:[OPEN, CLOSED], orderBy:{field:UPDATED_AT, direction:DESC}) {
      nodes { number linkedBranches(first:100) { nodes { ref { name } } } }
      pageInfo { hasNextPage endCursor }
    }
  }
}`;

interface RawIssue extends Omit<Issue, "assignees" | "blockedBy" | "blocking" | "branches"> {
  assignees: { nodes: Issue["assignees"] };
  blockedBy: { nodes: IssueReference[] };
  blocking: { nodes: IssueReference[] };
  linkedBranches: { nodes: Array<{ ref: { name: string } | null }> };
}

interface IssueQueryResult { data?: { repository?: { issue?: RawIssue | null } } }
interface LinkedQueryResult {
  data?: { repository?: { issues?: {
    nodes: Array<{ number: number; linkedBranches: { nodes: Array<{ ref: { name: string } | null }> } }>;
    pageInfo: { hasNextPage: boolean; endCursor?: string };
  } } };
}

export class GitHubAdapter {
  readonly owner: string;
  readonly name: string;

  constructor(private readonly runner: CommandRunner, readonly repo: string) {
    const [owner, name, ...rest] = repo.split("/");
    if (!owner || !name || rest.length) throw new UserError(`Invalid repository: ${repo}`);
    this.owner = owner;
    this.name = name;
  }

  static detect(runner: CommandRunner, requestedRepo?: string): GitHubAdapter {
    const repo = requestedRepo || runner.run("gh", ["repo", "view", "--json", "nameWithOwner", "--jq", ".nameWithOwner"]);
    return new GitHubAdapter(runner, repo);
  }

  private graphql<T>(query: string, variables: Record<string, string | number> = {}): T {
    const args = ["api", "graphql", "-f", `query=${query}`];
    for (const [key, value] of Object.entries(variables)) args.push(typeof value === "number" ? "-F" : "-f", `${key}=${value}`);
    return this.runner.json<T>("gh", args);
  }

  issue(number: string | number): Issue {
    const parsed = Number(number);
    if (!Number.isInteger(parsed) || parsed <= 0) throw new UserError(`Invalid issue number: ${number}`);
    const data = this.graphql<IssueQueryResult>(ISSUE_QUERY, { owner: this.owner, repo: this.name, number: parsed });
    const issue = data.data?.repository?.issue;
    if (!issue) throw new UserError(`Issue #${parsed} not found in ${this.repo}`);
    return normalizeIssue(issue);
  }

  currentLogin(): string { return this.runner.run("gh", ["api", "user", "--jq", ".login"]); }
  assign(issue: Issue): void { this.runner.run("gh", ["issue", "edit", String(issue.number), "--repo", this.repo, "--add-assignee", "@me"]); }
  createIssue(title: string, body?: string, bodyFile?: string): string {
    const args = ["issue", "create", "--repo", this.repo, "--title", title];
    if (bodyFile) args.push("--body-file", bodyFile);
    else args.push("--body", body || "");
    const output = this.runner.run("gh", args);
    const url = output.split(/\s/).find((part) => /^https?:\/\/[^\s]+\/issues\/\d+$/.test(part));
    if (!url) throw new UserError(`gh issue create did not return an Issue URL: ${output}`);
    return url;
  }
  closeIssue(issue: Issue): void { this.runner.run("gh", ["issue", "close", String(issue.number), "--repo", this.repo]); }
  createDevelopmentBranch(issue: Issue, name: string): void {
    this.runner.run("gh", ["issue", "develop", String(issue.number), "--repo", this.repo, "--name", name, "--checkout"], { inherit: true });
  }

  updateProject(issue: Pick<Issue, "url">, project: ProjectConfig, status: string): void {
    try {
      this.setProjectStatus(issue.url, project, status);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!/item|not found|could not resolve/i.test(message)) throw error;
      this.addProjectItem(issue.url, project);
      this.setProjectStatus(issue.url, project, status);
    }
  }

  addProjectItem(url: string, project: ProjectConfig): void {
    this.runner.run("gh", ["project", "item-add", String(project.number), "--owner", project.owner, "--url", url]);
  }

  setProjectStatus(url: string, project: ProjectConfig, status: string): void {
    this.runner.run("gh", ["project", "item-edit", String(project.number), "--owner", project.owner, "--url", url, "--field", project.status_field || "Status", "--value", status]);
  }

  projectItem(issue: Issue, project: ProjectConfig): ProjectItem | null {
    const data = this.runner.json<{ items?: ProjectItem[] }>("gh", ["project", "item-list", String(project.number), "--owner", project.owner, "--format", "json", "--limit", "500"]);
    return data.items?.find((item) => item.content?.url === issue.url) || null;
  }

  issueForBranch(branch: string): Issue {
    const prs = this.runner.json<Array<{ closingIssuesReferences?: Array<{ number: number }> }>>("gh", ["pr", "list", "--repo", this.repo, "--head", branch, "--state", "all", "--limit", "1", "--json", "closingIssuesReferences"]);
    const closing = prs[0]?.closingIssuesReferences?.[0];
    if (closing) return this.issue(closing.number);
    const inferred = issueNumberFromBranch(branch);
    if (inferred) {
      const issue = this.issue(inferred);
      if (issue.branches.some((item) => item.name === branch)) return issue;
    }
    const linked = this.findIssueByLinkedBranch(branch);
    if (linked) return linked;
    throw new UserError(`Could not find an Issue linked to branch '${branch}'.`);
  }

  private findIssueByLinkedBranch(branch: string): Issue | null {
    let after: string | undefined;
    do {
      const variables: Record<string, string | number> = { owner: this.owner, repo: this.name };
      if (after) variables.after = after;
      const connection = this.graphql<LinkedQueryResult>(LINKED_ISSUES_QUERY, variables).data?.repository?.issues;
      for (const issue of connection?.nodes || []) {
        if (issue.linkedBranches.nodes.some((node) => node.ref?.name === branch)) return this.issue(issue.number);
      }
      if (!connection?.pageInfo.hasNextPage) return null;
      after = connection.pageInfo.endCursor;
    } while (after);
    return null;
  }

  findPullRequest(branch: string): PullRequest | null {
    return this.runner.json<PullRequest[]>("gh", ["pr", "list", "--repo", this.repo, "--head", branch, "--state", "all", "--limit", "1", "--json", "number,title,url,state"])[0] || null;
  }

  createPullRequest(issue: Issue, content?: PullRequestContent): PullRequest {
    const title = content?.title || issue.title;
    const generatedBody = content?.body.trim();
    const closing = `Closes #${issue.number}`;
    const body = generatedBody ? `${generatedBody}\n\n${closing}` : closing;
    const output = this.runner.run("gh", ["pr", "create", "--repo", this.repo, "--title", title, "--body", body]);
    const url = output.split(/\s/).find((part) => /^https?:\/\//.test(part));
    return { title, url: url || output };
  }

  listProjects(owner: string): ProjectSummary[] {
    const data = this.runner.json<{ projects?: Array<Omit<ProjectSummary, "owner">> }>("gh", ["project", "list", "--owner", owner, "--format", "json", "--limit", "100"]);
    return (data.projects || []).map((project) => ({ owner, ...project }));
  }

  assertProjectAccessible(owner: string, number: number): void {
    this.runner.run("gh", ["project", "view", String(number), "--owner", owner, "--format", "json"]);
  }
}

function normalizeIssue(issue: RawIssue): Issue {
  return { ...issue, assignees: issue.assignees.nodes, blockedBy: issue.blockedBy.nodes, blocking: issue.blocking.nodes, branches: issue.linkedBranches.nodes.map((node) => node.ref).filter((ref): ref is { name: string } => Boolean(ref)) };
}
