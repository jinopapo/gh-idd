import { spawnSync } from "node:child_process";
import { UserError } from "../errors.js";

export interface RunOptions { cwd?: string; inherit?: boolean }
export interface CommandRunner {
  run(command: string, args?: string[], options?: RunOptions): string;
  json<T>(command: string, args?: string[], options?: RunOptions): T;
}

export class ProcessCommandRunner implements CommandRunner {
  run(command: string, args: string[] = [], options: RunOptions = {}): string {
    const result = spawnSync(command, args, {
      ...(options.cwd ? { cwd: options.cwd } : {}),
      encoding: "utf8",
      stdio: options.inherit ? "inherit" : ["ignore", "pipe", "pipe"],
    });
    if (result.error) {
      if ((result.error as NodeJS.ErrnoException).code === "ENOENT") throw new UserError(`Required command not found: ${command}`);
      throw result.error;
    }
    if (result.status !== 0) {
      const detail = (result.stderr || result.stdout || "").trim();
      throw new UserError(detail || `${command} exited with status ${result.status}`, result.status || 1);
    }
    return (result.stdout || "").trim();
  }

  json<T>(command: string, args: string[] = [], options: RunOptions = {}): T {
    const output = this.run(command, args, options);
    try { return JSON.parse(output) as T; }
    catch { throw new UserError(`${command} returned invalid JSON`); }
  }
}
