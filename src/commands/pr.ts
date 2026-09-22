import type { CommandDefinition } from "../core/command.js";
import { DevelopmentWorkflow } from "../services/development-workflow.js";
import { CodexContentGenerator } from "../adapters/codex.js";

export const prCommand: CommandDefinition = {
  name: "pr",
  usage: "gh idd pr",
  summary: "現在のIssue branchをpushし、close syntax付きPull Requestを作成する",
  dependencies: [
    { command: "git branch --show-current", purpose: "現在のbranchを取得" },
    { command: "git push", purpose: "branchをoriginへpush" },
    { command: "gh pr list", purpose: "既存PRを確認" },
    { command: "gh pr create", purpose: "close syntax付きPRを作成" },
    { command: "gh api graphql", purpose: "branchに紐づくIssueを解決" },
    { command: "gh project item-add", purpose: "未登録のIssueをProjectへ追加" },
    { command: "gh project item-edit", purpose: "Project statusをIn Reviewへ更新" },
    { command: "codex exec", purpose: "PR templateにAI変数がある場合にtitleとbodyを生成" },
  ],
  async execute(context) {
    const generator = new CodexContentGenerator(context.runner, context.repoRoot, context.config.codex.profile);
    const result = new DevelopmentWorkflow(context.github, context.git, context.config, generator).createPr();
    console.log(`Pull request for Issue #${result.issue.number}: ${result.pr.url}`);
  },
};
