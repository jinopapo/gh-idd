import test from "node:test";
import assert from "node:assert/strict";
import { createTaskCommand } from "../dist/commands/create-task.js";
import { GitHubAdapter } from "../dist/adapters/github.js";
import { parseArguments } from "../dist/cli.js";
import { DEFAULT_CONFIG } from "../dist/config/config.js";

const config = {
  project: { owner: "acme", number: 3, status: { todo: "Backlog" } },
};

function context(args, github) {
  return { args: parseArguments(["create-task", ...args]), config, github };
}

test("create-task validates Project before creating an Issue in another repository", async () => {
  const calls = [];
  const github = {
    assertProjectAccessible: (...args) => calls.push(["view", ...args]),
    createIssue: (...args) => { calls.push(["create", ...args]); return "https://github.com/acme/web/issues/12"; },
    addProjectItem: (...args) => calls.push(["add", ...args]),
    setProjectStatus: (...args) => calls.push(["project", ...args]),
  };
  const original = console.log;
  let output;
  console.log = (value) => { output = value; };
  try {
    await createTaskCommand.execute(context(["Fix login", "--body", "Details", "--repo", "acme/web"], github));
  } finally {
    console.log = original;
  }
  assert.deepEqual(calls, [
    ["view", "acme", 3],
    ["create", "Fix login", "Details", undefined],
    ["add", "https://github.com/acme/web/issues/12", config.project],
    ["project", "https://github.com/acme/web/issues/12", config.project, "Backlog"],
  ]);
  assert.match(output, /https:\/\/github.com\/acme\/web\/issues\/12/);
});

test("create-task rejects missing Project before creating an Issue", async () => {
  let created = false;
  const github = { createIssue: () => { created = true; } };
  await assert.rejects(() => createTaskCommand.execute({
    ...context(["A task"], github), config: { project: { status: { todo: "Backlog" } } },
  }), /No project configured/);
  assert.equal(created, false);
});

test("create-task reports the Issue URL if Project update fails", async () => {
  const github = {
    assertProjectAccessible: () => {},
    createIssue: () => "https://github.com/acme/web/issues/12",
    addProjectItem: () => {},
    setProjectStatus: () => { throw new Error("missing status option"); },
  };
  await assert.rejects(() => createTaskCommand.execute(context(["A task"], github)),
    /Issue created: https:\/\/github.com\/acme\/web\/issues\/12[\s\S]*missing status option/);
});

test("createIssue passes repository and body file to gh", () => {
  const calls = [];
  const runner = { run: (command, args) => {
    calls.push([command, args]);
    return "https://github.com/acme/web/issues/12";
  } };
  const github = new GitHubAdapter(runner, "acme/web");
  assert.equal(github.createIssue("A task", undefined, "task.md"), "https://github.com/acme/web/issues/12");
  assert.deepEqual(calls, [["gh", ["issue", "create", "--repo", "acme/web", "--title", "A task", "--body-file", "task.md"]]]);
});

test("Project addition and initial status use the configured Project", () => {
  const calls = [];
  const runner = { run: (command, args) => { calls.push([command, args]); return ""; } };
  const github = new GitHubAdapter(runner, "acme/web");
  const url = "https://github.com/acme/web/issues/12";
  github.addProjectItem(url, config.project);
  github.setProjectStatus(url, config.project, "Backlog");
  assert.deepEqual(calls, [
    ["gh", ["project", "item-add", "3", "--owner", "acme", "--url", url]],
    ["gh", ["project", "item-edit", "3", "--owner", "acme", "--url", url, "--field", "Status", "--value", "Backlog"]],
  ]);
});

test("the default initial Project status is Backlog", () => {
  assert.equal(DEFAULT_CONFIG.project.status.todo, "Backlog");
});
