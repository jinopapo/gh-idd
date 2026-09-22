import type { CommandDefinition } from "../core/command.js";
export declare const COMMANDS: readonly CommandDefinition[];
export declare function findCommand(name: string | undefined): CommandDefinition | undefined;
