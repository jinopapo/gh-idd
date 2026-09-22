import { DevelopmentWorkflow, formatStatus } from "../services/development-workflow.js";
export const statusCommand = {
    name: "status",
    usage: "gh idd status",
    summary: "現在のbranchを起点にIssue・dependency・Project・PRを表示する",
    dependencies: [
        { command: "git branch --show-current", purpose: "現在のbranchを取得" },
        { command: "gh api graphql", purpose: "Issue、dependencies、linked branchesを取得" },
        { command: "gh pr list", purpose: "関連Pull Requestを取得" },
        { command: "gh project item-list", purpose: "明示設定されたProjectのstatusを取得" },
    ],
    async execute(context) { console.log(formatStatus(new DevelopmentWorkflow(context.github, context.git, context.config).status())); },
};
//# sourceMappingURL=status.js.map