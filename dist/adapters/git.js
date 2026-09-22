import { UserError } from "../errors.js";
export class GitAdapter {
    runner;
    constructor(runner) {
        this.runner = runner;
    }
    repositoryRoot() { return this.runner.run("git", ["rev-parse", "--show-toplevel"]); }
    currentBranch() {
        const branch = this.runner.run("git", ["branch", "--show-current"]);
        if (!branch)
            throw new UserError("Detached HEAD is not associated with an Issue development branch.");
        return branch;
    }
    push(branch) { this.runner.run("git", ["push", "--set-upstream", "origin", branch], { inherit: true }); }
}
//# sourceMappingURL=git.js.map