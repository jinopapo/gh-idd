// 全コマンドのcontext生成時に使う共通の外部コマンド。
export const RUNTIME_DEPENDENCIES = [
    { command: "git rev-parse", purpose: "repository rootを取得" },
    { command: "gh repo view", purpose: "対象のOWNER/REPOを解決" },
];
//# sourceMappingURL=runtime-dependencies.js.map