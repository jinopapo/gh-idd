import { requireProject } from "../config/config.js";
import { branchName } from "../domain/naming.js";
import { UserError } from "../errors.js";
import { chooseIssue } from "../ui/selectors.js";
export class DevelopmentWorkflow {
    github;
    git;
    config;
    contentGenerator;
    constructor(github, git, config, contentGenerator) {
        this.github = github;
        this.git = git;
        this.config = config;
        this.contentGenerator = contentGenerator;
    }
    start(issueNumber, options = {}) {
        const issue = this.github.issue(issueNumber);
        if (issue.state !== "OPEN")
            throw new UserError(`Issue #${issue.number} is ${issue.state.toLowerCase()}.`);
        const openBlockers = issue.blockedBy.filter((blocker) => blocker.state !== "CLOSED");
        if (this.config.workflow.check_dependencies && openBlockers.length && !options.force) {
            throw new UserError(`Issue #${issue.number} is blocked by ${openBlockers.map((item) => `#${item.number}`).join(", ")}.\nUse --force to start it anyway.`);
        }
        const project = this.config.workflow.update_project ? requireProject(this.config) : null;
        const aiValue = this.config.branch.format.includes("{ai}")
            ? this.generator().branchValue(issue, this.config.branch.ai_prompt)
            : "";
        const branch = branchName(issue, this.config.branch.format, aiValue);
        this.github.createDevelopmentBranch(issue, branch);
        if (this.config.workflow.assign_on_start)
            this.github.assign(issue);
        if (project)
            this.github.updateProject(issue, project, project.status.progress);
        return { issue, branch };
    }
    async nextIssue(options = {}) {
        const current = this.github.issueForBranch(this.git.currentBranch());
        const next = await this.startNextIssue(current, options);
        if (!next)
            throw new UserError(`Issue #${current.number} did not unblock any issues.`);
        return next;
    }
    async closeIssue(options = {}) {
        const issue = this.github.issueForBranch(this.git.currentBranch());
        if (issue.state !== "OPEN")
            throw new UserError(`Issue #${issue.number} is already closed.`);
        this.github.closeIssue(issue);
        return { issue, next: await this.startNextIssue(issue, options) };
    }
    async startNextIssue(current, options) {
        const candidates = current.blocking.map((downstream) => this.github.issue(downstream.number))
            .filter((issue) => issue.state === "OPEN" && issue.blockedBy.every((blocker) => blocker.state === "CLOSED"));
        if (!candidates.length)
            return null;
        const selected = candidates.length === 1 ? candidates[0] : await chooseIssue(candidates);
        if (!selected)
            throw new UserError("No next Issue selected.");
        return this.start(selected.number, options);
    }
    currentIssue() {
        const branch = this.git.currentBranch();
        return { issue: this.github.issueForBranch(branch), branch };
    }
    createPr() {
        const branch = this.git.currentBranch();
        const issue = this.github.issueForBranch(branch);
        const project = this.config.workflow.update_project ? requireProject(this.config) : null;
        let pr = this.github.findPullRequest(branch);
        if (!pr) {
            this.git.push(branch);
            const templates = this.config.pull_request;
            const templateText = `${templates.title}\n${templates.body}`;
            const usesAi = templateText.includes("{ai_title}") || templateText.includes("{ai_body}");
            const generated = usesAi ? this.generator().pullRequest(issue, branch, templates.ai_prompt) : undefined;
            const values = {
                issue: String(issue.number), issue_title: issue.title, branch,
                ai_title: generated?.title || "", ai_body: generated?.body || "",
            };
            const content = {
                title: renderTemplate(templates.title, values),
                body: renderTemplate(templates.body, values),
            };
            pr = this.github.createPullRequest(issue, content);
        }
        if (project)
            this.github.updateProject(issue, project, project.status.review);
        return { issue, branch, pr };
    }
    status() {
        const project = requireProject(this.config);
        const branch = this.git.currentBranch();
        const issue = this.github.issueForBranch(branch);
        return { issue, branch, project, item: this.github.projectItem(issue, project), pr: this.github.findPullRequest(branch) };
    }
    generator() {
        if (!this.contentGenerator)
            throw new UserError("The configuration uses an AI placeholder, but no Codex generator is available.");
        return this.contentGenerator;
    }
}
function renderTemplate(template, values) {
    return template.replace(/\{(issue|issue_title|branch|ai_title|ai_body)\}/g, (_match, key) => values[key] || "");
}
export function formatStatus({ issue, branch, project, item, pr }) {
    const status = item?.status || item?.fieldValues?.find((field) => field.field?.name === (project.status_field || "Status"))?.name || "not in project";
    const issueLines = (issues) => issues.length ? issues.map((entry) => `  #${entry.number} ${entry.title}`) : ["  none"];
    return [
        "Issue", `  #${issue.number} ${issue.title}`, "", "Branch", `  ${branch}`,
        "", "Project", `  ${project.owner}/${project.number}`, "", "Status", `  ${status}`,
        "", "Blocked by", ...issueLines(issue.blockedBy), "", "Blocking", ...issueLines(issue.blocking),
        "", "Pull Request", pr ? `  #${pr.number} ${pr.title}` : "  none",
    ].join("\n");
}
export function formatCurrentIssue({ issue }) {
    return `#${issue.number} ${issue.title}\n${issue.url}`;
}
//# sourceMappingURL=development-workflow.js.map