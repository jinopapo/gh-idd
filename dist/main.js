#!/usr/bin/env node
import { run } from "./cli.js";
run(process.argv.slice(2)).catch((error) => {
    const typed = error;
    console.error(typed.userMessage ?? typed.message ?? String(error));
    if (process.env.GH_IDD_DEBUG && typed.stack)
        console.error(typed.stack);
    process.exitCode = typed.exitCode ?? 1;
});
//# sourceMappingURL=main.js.map