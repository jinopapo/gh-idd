export interface RunOptions {
    cwd?: string;
    inherit?: boolean;
}
export interface CommandRunner {
    run(command: string, args?: string[], options?: RunOptions): string;
    json<T>(command: string, args?: string[], options?: RunOptions): T;
}
export declare class ProcessCommandRunner implements CommandRunner {
    run(command: string, args?: string[], options?: RunOptions): string;
    json<T>(command: string, args?: string[], options?: RunOptions): T;
}
