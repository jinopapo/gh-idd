import { DevelopmentWorkflow } from "../services/development-workflow.js";
import { CodexContentGenerator } from "../adapters/codex.js";
export const closeCommand = {
    name: "close",
    usage: "gh idd close [--force]",
    summary: "現在のbranchに紐づくIssueを閉じ、次のIssueを開始する",
    dependencies: [
        { command: "git branch --show-current", purpose: "現在のbranchを取得" },
        { command: "gh pr list", purpose: "branchからclose対象Issueを逆引き" },
        { command: "gh api graphql", purpose: "linked branchとdependency graphを評価" },
        { command: "gh issue close", purpose: "現在のIssueをclose" },
        { command: "gh issue develop", purpose: "選択した次のIssueのbranchを作成" },
        { command: "gh issue edit", purpose: "選択した次のIssueをassign" },
        { command: "gh project item-add", purpose: "未登録のIssueをProjectへ追加" },
        { command: "gh project item-edit", purpose: "Project statusを更新" },
        { command: "codex exec", purpose: "branch formatに{ai}がある場合に値を生成" },
    ],
    async execute(context) {
        const generator = new CodexContentGenerator(context.runner, context.repoRoot, context.config.codex.profile);
        const result = await new DevelopmentWorkflow(context.github, context.git, context.config, generator).closeIssue({ force: context.args.force });
        const lines = [`Closed Issue #${result.issue.number}: ${result.issue.title}`];
        if (result.next)
            lines.push(`Started Issue #${result.next.issue.number}: ${result.next.issue.title}`, `Branch: ${result.next.branch}`);
        else
            lines.push("No newly unblocked downstream Issue.");
        console.log(lines.join("\n"));
    },
};
//# sourceMappingURL=close.js.map