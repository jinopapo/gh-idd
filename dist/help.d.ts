import type { CommandDefinition } from "./core/command.js";
export declare function renderHelp(commands: readonly CommandDefinition[]): string;
export declare function renderCommandHelp(command: CommandDefinition): string;
