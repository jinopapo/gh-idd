import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { UserError } from "../errors.js";
export const DEFAULT_CONFIG = {
    branch: { format: "{type}/{issue}-{slug}" },
    pull_request: { title: "{issue_title}", body: "" },
    codex: {},
    project: { status: { todo: "Backlog", progress: "In Progress", review: "In Review" } },
    workflow: { assign_on_start: true, update_project: true, check_dependencies: true },
};
function stripComment(line) {
    let quoted = false;
    for (let i = 0; i < line.length; i += 1) {
        if (line[i] === '"' && line[i - 1] !== "\\")
            quoted = !quoted;
        if (line[i] === "#" && !quoted)
            return line.slice(0, i);
    }
    return line;
}
function parseValue(raw, lineNumber) {
    const value = raw.trim();
    if (/^"(?:[^"\\]|\\.)*"$/.test(value))
        return JSON.parse(value);
    if (/^(true|false)$/.test(value))
        return value === "true";
    if (/^-?\d+$/.test(value))
        return Number(value);
    throw new UserError(`Unsupported TOML value on line ${lineNumber}`);
}
export function parseToml(text) {
    const result = {};
    let section = result;
    text.split(/\r?\n/).forEach((original, index) => {
        const line = stripComment(original).trim();
        if (!line)
            return;
        const header = line.match(/^\[([A-Za-z0-9_.-]+)]$/);
        if (header?.[1]) {
            section = result;
            for (const key of header[1].split(".")) {
                const next = section[key];
                if (!next || typeof next !== "object" || Array.isArray(next))
                    section[key] = {};
                section = section[key];
            }
            return;
        }
        const assignment = line.match(/^([A-Za-z0-9_-]+)\s*=\s*(.+)$/);
        if (!assignment?.[1] || !assignment[2])
            throw new UserError(`Invalid TOML on line ${index + 1}`);
        section[assignment[1]] = parseValue(assignment[2], index + 1);
    });
    return result;
}
export function stringifyToml(config) {
    const lines = [];
    const emit = (object, prefix = []) => {
        const scalars = Object.entries(object).filter(([, value]) => value === null || typeof value !== "object");
        const groups = Object.entries(object).filter(([, value]) => value && typeof value === "object" && !Array.isArray(value));
        if (prefix.length && scalars.length)
            lines.push(`[${prefix.join(".")}]`);
        for (const [key, value] of scalars)
            lines.push(`${key} = ${JSON.stringify(value)}`);
        if (prefix.length && scalars.length && groups.length)
            lines.push("");
        groups.forEach(([key, value], index) => {
            emit(value, [...prefix, key]);
            if (index < groups.length - 1)
                lines.push("");
        });
    };
    emit(config);
    return `${lines.join("\n").replace(/\n{3,}/g, "\n\n")}\n`;
}
export function deepMerge(...objects) {
    const target = {};
    for (const object of objects) {
        for (const [key, value] of Object.entries(object)) {
            const previous = target[key];
            target[key] = value && typeof value === "object" && !Array.isArray(value)
                ? deepMerge(previous && typeof previous === "object" && !Array.isArray(previous) ? previous : {}, value)
                : value;
        }
    }
    return target;
}
function readConfig(file) {
    return fs.existsSync(file) ? parseToml(fs.readFileSync(file, "utf8")) : {};
}
export function configPaths(repoRoot, env = process.env) {
    const ghConfig = env.GH_CONFIG_DIR || path.join(os.homedir(), ".config", "gh");
    return { global: path.join(ghConfig, "idd", "config.toml"), local: path.join(repoRoot, ".github", "idd.toml") };
}
export function loadConfig(repoRoot, overrides = {}, env = process.env) {
    const paths = configPaths(repoRoot, env);
    return deepMerge(DEFAULT_CONFIG, readConfig(paths.global), readConfig(paths.local), overrides);
}
export function saveLocalProject(repoRoot, owner, number) {
    const file = configPaths(repoRoot).local;
    const next = deepMerge(readConfig(file), { project: { owner, number } });
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, stringifyToml(next));
    return file;
}
export function requireProject(config) {
    if (!config.project.owner || !config.project.number)
        throw new UserError("No project configured.\n\nRun:\n\n  gh idd set-project");
    return config.project;
}
//# sourceMappingURL=config.js.map