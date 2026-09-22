import type { CommandDefinition } from "../core/command.js";
import { UserError } from "../errors.js";
import { DevelopmentWorkflow } from "../services/development-workflow.js";
import { CodexContentGenerator } from "../adapters/codex.js";

export const startCommand: CommandDefinition = {
  name: "start",
  usage: "gh idd start <issue> [--force]",
  summary: "Issueの開発を開始し、branch・assignee・Project statusを同期する",
  dependencies: [
    { command: "gh api graphql", purpose: "Issueとdependencyを取得" },
    { command: "gh issue develop", purpose: "development branchを作成してcheckout" },
    { command: "gh issue edit", purpose: "Issueを自分にassign" },
    { command: "gh project item-add", purpose: "未登録のIssueをProjectへ追加" },
    { command: "gh project item-edit", purpose: "Project statusを更新" },
    { command: "codex exec", purpose: "branch formatに{ai}がある場合に値を生成" },
  ],
  async execute(context) {
    const issueNumber = context.args.positionals[0];
    if (!issueNumber) throw new UserError("Usage: gh idd start <issue>");
    const generator = new CodexContentGenerator(context.runner, context.repoRoot, context.config.codex.profile);
    const result = new DevelopmentWorkflow(context.github, context.git, context.config, generator).start(issueNumber, { force: context.args.force });
    console.log(`Started Issue #${result.issue.number}: ${result.issue.title}\nBranch: ${result.branch}`);
  },
};
