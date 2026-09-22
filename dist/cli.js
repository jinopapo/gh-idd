import { ProcessCommandRunner } from "./adapters/command-runner.js";
import { GitAdapter } from "./adapters/git.js";
import { GitHubAdapter } from "./adapters/github.js";
import { COMMANDS, findCommand } from "./commands/registry.js";
import { deepMerge, loadConfig } from "./config/config.js";
import { UserError } from "./errors.js";
import { renderCommandHelp, renderHelp } from "./help.js";
export async function run(argv, dependencies = {}) {
    const args = parseArguments(argv);
    if (args.version) {
        console.log("gh-idd 0.1.0");
        return;
    }
    const helpTarget = args.command === "help" ? args.positionals[0] : args.help ? args.command : undefined;
    if (helpTarget) {
        const command = findCommand(helpTarget);
        if (!command)
            throw new UserError(`Unknown command: ${helpTarget}\n\n${renderHelp(COMMANDS)}`);
        console.log(renderCommandHelp(command));
        return;
    }
    if (args.help || !args.command || args.command === "help") {
        console.log(renderHelp(COMMANDS));
        return;
    }
    const command = findCommand(args.command);
    if (!command)
        throw new UserError(`Unknown command: ${args.command}\n\n${renderHelp(COMMANDS)}`);
    if ("executeStandalone" in command) {
        await command.executeStandalone(args);
        return;
    }
    const runner = dependencies.runner || new ProcessCommandRunner();
    const git = new GitAdapter(runner);
    const repoRoot = git.repositoryRoot();
    const github = GitHubAdapter.detect(runner, args.repo);
    const config = loadConfig(repoRoot, configOverrides(args));
    await command.execute({ args, config, repoRoot, runner, github, git });
}
export function parseArguments(argv) {
    const result = {
        positionals: [], help: false, version: false, force: false,
        noAssign: false, noProject: false, noDependencyCheck: false,
    };
    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];
        if (!arg)
            continue;
        if (arg === "-h" || arg === "--help")
            result.help = true;
        else if (arg === "-v" || arg === "--version")
            result.version = true;
        else if (arg === "--force")
            result.force = true;
        else if (arg === "--no-assign")
            result.noAssign = true;
        else if (arg === "--no-project")
            result.noProject = true;
        else if (arg === "--no-dependency-check")
            result.noDependencyCheck = true;
        else if (arg === "-R" || arg === "--repo")
            result.repo = requiredValue(argv, ++i, arg);
        else if (arg === "--branch-format")
            result.branchFormat = requiredValue(argv, ++i, arg);
        else if (arg.startsWith("-"))
            throw new UserError(`Unknown option: ${arg}`);
        else if (!result.command)
            result.command = arg;
        else
            result.positionals.push(arg);
    }
    return result;
}
function requiredValue(argv, index, flag) {
    const value = argv[index];
    if (!value || value.startsWith("-"))
        throw new UserError(`${flag} requires a value.`);
    return value;
}
function configOverrides(args) {
    return deepMerge(args.branchFormat ? { branch: { format: args.branchFormat } } : {}, args.noAssign ? { workflow: { assign_on_start: false } } : {}, args.noProject ? { workflow: { update_project: false } } : {}, args.noDependencyCheck ? { workflow: { check_dependencies: false } } : {});
}
//# sourceMappingURL=cli.js.map