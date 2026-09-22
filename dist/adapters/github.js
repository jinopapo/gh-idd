import { UserError } from "../errors.js";
import { issueNumberFromBranch } from "../domain/naming.js";
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
export class GitHubAdapter {
    runner;
    repo;
    owner;
    name;
    constructor(runner, repo) {
        this.runner = runner;
        this.repo = repo;
        const [owner, name, ...rest] = repo.split("/");
        if (!owner || !name || rest.length)
            throw new UserError(`Invalid repository: ${repo}`);
        this.owner = owner;
        this.name = name;
    }
    static detect(runner, requestedRepo) {
        const repo = requestedRepo || runner.run("gh", ["repo", "view", "--json", "nameWithOwner", "--jq", ".nameWithOwner"]);
        return new GitHubAdapter(runner, repo);
    }
    graphql(query, variables = {}) {
        const args = ["api", "graphql", "-f", `query=${query}`];
        for (const [key, value] of Object.entries(variables))
            args.push(typeof value === "number" ? "-F" : "-f", `${key}=${value}`);
        return this.runner.json("gh", args);
    }
    issue(number) {
        const parsed = Number(number);
        if (!Number.isInteger(parsed) || parsed <= 0)
            throw new UserError(`Invalid issue number: ${number}`);
        const data = this.graphql(ISSUE_QUERY, { owner: this.owner, repo: this.name, number: parsed });
        const issue = data.data?.repository?.issue;
        if (!issue)
            throw new UserError(`Issue #${parsed} not found in ${this.repo}`);
        return normalizeIssue(issue);
    }
    currentLogin() { return this.runner.run("gh", ["api", "user", "--jq", ".login"]); }
    assign(issue) { this.runner.run("gh", ["issue", "edit", String(issue.number), "--repo", this.repo, "--add-assignee", "@me"]); }
    closeIssue(issue) { this.runner.run("gh", ["issue", "close", String(issue.number), "--repo", this.repo]); }
    createDevelopmentBranch(issue, name) {
        this.runner.run("gh", ["issue", "develop", String(issue.number), "--repo", this.repo, "--name", name, "--checkout"], { inherit: true });
    }
    updateProject(issue, project, status) {
        const base = [String(project.number), "--owner", project.owner, "--url", issue.url];
        try {
            this.runner.run("gh", ["project", "item-edit", ...base, "--field", project.status_field || "Status", "--value", status]);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            if (!/item|not found|could not resolve/i.test(message))
                throw error;
            this.runner.run("gh", ["project", "item-add", String(project.number), "--owner", project.owner, "--url", issue.url]);
            this.runner.run("gh", ["project", "item-edit", ...base, "--field", project.status_field || "Status", "--value", status]);
        }
    }
    projectItem(issue, project) {
        const data = this.runner.json("gh", ["project", "item-list", String(project.number), "--owner", project.owner, "--format", "json", "--limit", "500"]);
        return data.items?.find((item) => item.content?.url === issue.url) || null;
    }
    issueForBranch(branch) {
        const prs = this.runner.json("gh", ["pr", "list", "--repo", this.repo, "--head", branch, "--state", "all", "--limit", "1", "--json", "closingIssuesReferences"]);
        const closing = prs[0]?.closingIssuesReferences?.[0];
        if (closing)
            return this.issue(closing.number);
        const inferred = issueNumberFromBranch(branch);
        if (inferred) {
            const issue = this.issue(inferred);
            if (issue.branches.some((item) => item.name === branch))
                return issue;
        }
        const linked = this.findIssueByLinkedBranch(branch);
        if (linked)
            return linked;
        throw new UserError(`Could not find an Issue linked to branch '${branch}'.`);
    }
    findIssueByLinkedBranch(branch) {
        let after;
        do {
            const variables = { owner: this.owner, repo: this.name };
            if (after)
                variables.after = after;
            const connection = this.graphql(LINKED_ISSUES_QUERY, variables).data?.repository?.issues;
            for (const issue of connection?.nodes || []) {
                if (issue.linkedBranches.nodes.some((node) => node.ref?.name === branch))
                    return this.issue(issue.number);
            }
            if (!connection?.pageInfo.hasNextPage)
                return null;
            after = connection.pageInfo.endCursor;
        } while (after);
        return null;
    }
    findPullRequest(branch) {
        return this.runner.json("gh", ["pr", "list", "--repo", this.repo, "--head", branch, "--state", "all", "--limit", "1", "--json", "number,title,url,state"])[0] || null;
    }
    createPullRequest(issue, content) {
        const title = content?.title || issue.title;
        const generatedBody = content?.body.trim();
        const closing = `Closes #${issue.number}`;
        const body = generatedBody ? `${generatedBody}\n\n${closing}` : closing;
        const output = this.runner.run("gh", ["pr", "create", "--repo", this.repo, "--title", title, "--body", body]);
        const url = output.split(/\s/).find((part) => /^https?:\/\//.test(part));
        return { title, url: url || output };
    }
    listProjects(owner) {
        const data = this.runner.json("gh", ["project", "list", "--owner", owner, "--format", "json", "--limit", "100"]);
        return (data.projects || []).map((project) => ({ owner, ...project }));
    }
    assertProjectAccessible(owner, number) {
        this.runner.run("gh", ["project", "view", String(number), "--owner", owner, "--format", "json"]);
    }
}
function normalizeIssue(issue) {
    return { ...issue, assignees: issue.assignees.nodes, blockedBy: issue.blockedBy.nodes, blocking: issue.blocking.nodes, branches: issue.linkedBranches.nodes.map((node) => node.ref).filter((ref) => Boolean(ref)) };
}
//# sourceMappingURL=github.js.map