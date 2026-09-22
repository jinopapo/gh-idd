import type { CommandRunner } from "../adapters/command-runner.js";
import type { GitHubAdapter } from "../adapters/github.js";
import type { GitAdapter } from "../adapters/git.js";
import type { AppConfig } from "./types.js";

export interface ExternalCommandDependency { command: string; purpose: string }

export interface ParsedArguments {
  command?: string;
  positionals: string[];
  help: boolean;
  version: boolean;
  force: boolean;
  noAssign: boolean;
  noProject: boolean;
  noDependencyCheck: boolean;
  repo?: string;
  branchFormat?: string;
}

export interface CommandContext {
  args: ParsedArguments;
  config: AppConfig;
  repoRoot: string;
  runner: CommandRunner;
  github: GitHubAdapter;
  git: GitAdapter;
}

export interface CommandDefinition {
  name: string;
  usage: string;
  summary: string;
  dependencies: ExternalCommandDependency[];
  execute(context: CommandContext): Promise<void>;
}
