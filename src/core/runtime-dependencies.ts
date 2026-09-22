import type { ExternalCommandDependency } from "./command.js";

// 全コマンドのcontext生成時に使う共通の外部コマンド。
export const RUNTIME_DEPENDENCIES: readonly ExternalCommandDependency[] = [
  { command: "git rev-parse", purpose: "repository rootを取得" },
  { command: "gh repo view", purpose: "対象のOWNER/REPOを解決" },
];
