import type { CommandDefinition } from "../core/command.js";
import { setProjectCommand } from "./set-project.js";
import { startCommand } from "./start.js";
import { nextIssueCommand } from "./next-issue.js";
import { prCommand } from "./pr.js";
import { statusCommand } from "./status.js";
import { closeCommand } from "./close.js";
import { issueCommand } from "./issue.js";

import { completionCommand } from "./completion.js";

// コマンド追加時の唯一の登録ポイント。helpと実行dispatchはこの一覧から生成される。
export const COMMANDS: readonly CommandDefinition[] = [
  setProjectCommand,
  startCommand,
  nextIssueCommand,
  closeCommand,
  prCommand,
  issueCommand,
  statusCommand,
  completionCommand,
];

export function findCommand(name: string | undefined): CommandDefinition | undefined {
  return COMMANDS.find((command) => command.name === name);
}
