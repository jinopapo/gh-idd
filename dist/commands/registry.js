import { setProjectCommand } from "./set-project.js";
import { startCommand } from "./start.js";
import { nextIssueCommand } from "./next-issue.js";
import { prCommand } from "./pr.js";
import { statusCommand } from "./status.js";
import { closeCommand } from "./close.js";
import { issueCommand } from "./issue.js";
import { createTaskCommand } from "./create-task.js";
import { completionCommand } from "./completion.js";
// コマンド追加時の唯一の登録ポイント。helpと実行dispatchはこの一覧から生成される。
export const COMMANDS = [
    setProjectCommand,
    createTaskCommand,
    startCommand,
    nextIssueCommand,
    closeCommand,
    prCommand,
    issueCommand,
    statusCommand,
    completionCommand,
];
export function findCommand(name) {
    return COMMANDS.find((command) => command.name === name);
}
//# sourceMappingURL=registry.js.map