import type { CommandRunner } from "./command-runner.js";
import { UserError } from "../errors.js";

export class GitAdapter {
  constructor(private readonly runner: CommandRunner) {}
  repositoryRoot(): string { return this.runner.run("git", ["rev-parse", "--show-toplevel"]); }
  currentBranch(): string {
    const branch = this.runner.run("git", ["branch", "--show-current"]);
    if (!branch) throw new UserError("Detached HEAD is not associated with an Issue development branch.");
    return branch;
  }
  push(branch: string): void { this.runner.run("git", ["push", "--set-upstream", "origin", branch], { inherit: true }); }
}
