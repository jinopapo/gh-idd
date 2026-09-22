import { DevelopmentWorkflow } from "../services/development-workflow.js";
import { CodexContentGenerator } from "../adapters/codex.js";
export const nextIssueCommand = {
    name: "next-issue",
    usage: "gh idd next-issue [--force]",
    summary: "現在のIssueが解放したdownstream Issueを選び、start workflowを実行する",
    dependencies: [
        { command: "git branch --show-current", purpose: "現在のbranchを取得" },
        { command: "gh pr list", purpose: "branchからclose対象Issueを逆引き" },
        { command: "gh api graphql", purpose: "linked branchとdependency graphを評価" },
        { command: "gh issue develop", purpose: "選択したIssueのbranchを作成" },
        { command: "gh issue edit", purpose: "選択したIssueをassign" },
        { command: "gh project item-add", purpose: "未登録のIssueをProjectへ追加" },
        { command: "gh project item-edit", purpose: "Project statusを更新" },
        { command: "codex exec", purpose: "branch formatに{ai}がある場合に値を生成" },
    ],
    async execute(context) {
        const generator = new CodexContentGenerator(context.runner, context.repoRoot, context.config.codex.profile);
        const result = await new DevelopmentWorkflow(context.github, context.git, context.config, generator).nextIssue({ force: context.args.force });
        console.log(`Started Issue #${result.issue.number}: ${result.issue.title}\nBranch: ${result.branch}`);
    },
};
//# sourceMappingURL=next-issue.js.map