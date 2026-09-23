import type { CommandDefinition } from "./core/command.js";
import { RUNTIME_DEPENDENCIES } from "./core/runtime-dependencies.js";

const OPTIONS = `Options:
  -R, --repo OWNER/REPO       Select another repository
  -t, --title TEXT            Title for create-task
  -b, --body TEXT             Body for create-task
  -F, --body-file FILE        Read create-task body from a file
      --branch-format FORMAT  Override the branch naming format
      --no-assign             Do not assign the Issue on start
      --no-project            Do not update the configured Project
      --no-dependency-check   Do not reject blocked Issues
      --force                 Start an Issue even when blockers remain
  -h, --help                  Show help
  -v, --version               Show version`;

export function renderHelp(commands: readonly CommandDefinition[]): string {
  const width = Math.max(...commands.map((command) => command.name.length));
  const list = commands.map((command) => `  ${command.name.padEnd(width)}  ${command.summary}`).join("\n");
  return `gh idd - Issue-driven development for GitHub

Commands:
${list}

Run 'gh idd help <command>' to see usage and external command dependencies.

${OPTIONS}`;
}

export function renderCommandHelp(command: CommandDefinition): string {
  const dependencies = [...("executeStandalone" in command ? [] : RUNTIME_DEPENDENCIES), ...command.dependencies]
    .map((dependency) => `  ${dependency.command}\n      ${dependency.purpose}`)
    .join("\n");
  return `${command.summary}

Usage:
  ${command.usage}

External command dependencies:
${dependencies || "  None"}

${OPTIONS}`;
}
