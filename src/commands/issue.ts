import type { CommandDefinition } from "../core/command.js";
import { DevelopmentWorkflow, formatCurrentIssue } from "../services/development-workflow.js";

export const issueCommand: CommandDefinition = {
  name: "issue",
  usage: "gh idd issue",
  summary: "現在のbranchに紐づくIssueを表示する",
  dependencies: [
    { command: "git branch --show-current", purpose: "現在のbranchを取得" },
    { command: "gh pr list / gh api graphql", purpose: "branchに紐づくIssueを取得" },
  ],
  async execute(context) {
    console.log(formatCurrentIssue(new DevelopmentWorkflow(context.github, context.git, context.config).currentIssue()));
  },
};
