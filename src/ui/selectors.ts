import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import type { GitHubAdapter } from "../adapters/github.js";
import type { Issue, ProjectSummary } from "../core/types.js";
import { UserError } from "../errors.js";

export function parseProjectReference(reference: string | undefined, defaultOwner: string): { owner: string; number: number } | null {
  if (!reference) return null;
  const url = reference.match(/^https?:\/\/github\.com\/(?:users|orgs)\/([^/]+)\/projects\/(\d+)\/?$/);
  if (url?.[1] && url[2]) return { owner: url[1], number: Number(url[2]) };
  const pair = reference.match(/^([^/]+)\/(\d+)$/);
  if (pair?.[1] && pair[2]) return { owner: pair[1], number: Number(pair[2]) };
  if (/^\d+$/.test(reference)) return { owner: defaultOwner, number: Number(reference) };
  throw new UserError("Project must be OWNER/NUMBER, a GitHub Project URL, or a project number.");
}

export async function chooseProject(github: GitHubAdapter): Promise<ProjectSummary> {
  if (!stdin.isTTY) throw new UserError("Project is required in non-interactive mode. Use: gh idd set-project OWNER/NUMBER");
  const owners = [...new Set([github.owner, github.currentLogin()])];
  const choices: ProjectSummary[] = [];
  for (const owner of owners) {
    try { choices.push(...github.listProjects(owner)); }
    catch { /* The caller may not be allowed to enumerate this owner. */ }
  }
  if (!choices.length) throw new UserError("No accessible projects found. Specify one with: gh idd set-project OWNER/NUMBER");
  stdout.write("Select a GitHub Project:\n");
  choices.forEach((project, index) => stdout.write(`  ${index + 1}. ${project.owner}/${project.number} ${project.title}\n`));
  return choose(choices, "Invalid project selection.");
}

export async function chooseIssue(issues: Issue[]): Promise<Issue> {
  if (!stdin.isTTY) {
    const list = issues.map((issue) => `#${issue.number}`).join(", ");
    throw new UserError(`Multiple issues are ready: ${list}. Run 'gh idd start <issue>' to choose one.`);
  }
  stdout.write("Select the next Issue:\n");
  issues.forEach((issue, index) => stdout.write(`  ${index + 1}. #${issue.number} ${issue.title}\n`));
  return choose(issues, "Invalid Issue selection.");
}

async function choose<T>(choices: T[], errorMessage: string): Promise<T> {
  const rl = readline.createInterface({ input: stdin, output: stdout });
  const answer = await rl.question("> ");
  rl.close();
  const selected = choices[Number(answer) - 1];
  if (!selected) throw new UserError(errorMessage);
  return selected;
}
