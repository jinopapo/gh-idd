import type { AppConfig, ProjectConfig } from "../core/types.js";
type ConfigObject = Record<string, unknown>;
export declare const DEFAULT_CONFIG: AppConfig;
export declare function parseToml(text: string): ConfigObject;
export declare function stringifyToml(config: ConfigObject): string;
export declare function deepMerge(...objects: ConfigObject[]): ConfigObject;
export declare function configPaths(repoRoot: string, env?: NodeJS.ProcessEnv): {
    global: string;
    local: string;
};
export declare function loadConfig(repoRoot: string, overrides?: ConfigObject, env?: NodeJS.ProcessEnv): AppConfig;
export declare function saveLocalProject(repoRoot: string, owner: string, number: number): string;
export declare function requireProject(config: AppConfig): ProjectConfig;
export {};
