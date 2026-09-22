import { spawnSync } from "node:child_process";
import { UserError } from "../errors.js";
export class ProcessCommandRunner {
    run(command, args = [], options = {}) {
        const result = spawnSync(command, args, {
            ...(options.cwd ? { cwd: options.cwd } : {}),
            encoding: "utf8",
            stdio: options.inherit ? "inherit" : ["ignore", "pipe", "pipe"],
        });
        if (result.error) {
            if (result.error.code === "ENOENT")
                throw new UserError(`Required command not found: ${command}`);
            throw result.error;
        }
        if (result.status !== 0) {
            const detail = (result.stderr || result.stdout || "").trim();
            throw new UserError(detail || `${command} exited with status ${result.status}`, result.status || 1);
        }
        return (result.stdout || "").trim();
    }
    json(command, args = [], options = {}) {
        const output = this.run(command, args, options);
        try {
            return JSON.parse(output);
        }
        catch {
            throw new UserError(`${command} returned invalid JSON`);
        }
    }
}
//# sourceMappingURL=command-runner.js.map