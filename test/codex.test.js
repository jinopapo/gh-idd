import test from "node:test";
import assert from "node:assert/strict";
import { CodexContentGenerator } from "../dist/adapters/codex.js";

const issue = {
  id: "I_1",
  number: 42,
  title: "Improve branch naming",
  state: "OPEN",
  url: "https://github.com/acme/repo/issues/42",
  assignees: [], blockedBy: [], blocking: [], branches: [],
};

test("Codex generates a validated branch placeholder in read-only mode", () => {
  const calls = [];
  const runner = {
    run(command, args) {
      calls.push([command, args]);
      return '{"value":"better-branch-naming"}';
    },
  };
  const value = new CodexContentGenerator(runner, "/repo").branchValue(issue, "prefer domain terminology");
  assert.equal(value, "better-branch-naming");
  assert.equal(calls[0][0], "codex");
  assert.deepEqual(calls[0][1].slice(0, 8), ["exec", "--ephemeral", "--sandbox", "read-only", "--color", "never", "--cd", "/repo"]);
});

test("Codex PR content accepts JSON in a Markdown fence", () => {
  const runner = { run: () => '```json\n{"title":"Improve naming","body":"## Summary\\n\\n- Better names"}\n```' };
  assert.deepEqual(new CodexContentGenerator(runner, "/repo").pullRequest(issue, "feat/42-name"), {
    title: "Improve naming",
    body: "## Summary\n\n- Better names",
  });
});

test("Codex passes the configured profile to exec", () => {
  let args;
  const runner = { run: (_command, value) => { args = value; return '{"value":"profile-name"}'; } };
  new CodexContentGenerator(runner, "/repo", "deep-review").branchValue(issue);
  assert.deepEqual(args.slice(0, 4), ["exec", "--profile", "deep-review", "--ephemeral"]);
});

test("Codex rejects unsafe branch placeholder values and malformed output", () => {
  assert.throws(
    () => new CodexContentGenerator({ run: () => '{"value":"unsafe/value"}' }, "/repo").branchValue(issue),
    /invalid value/,
  );
  assert.throws(
    () => new CodexContentGenerator({ run: () => "not json" }, "/repo").pullRequest(issue, "feat/42-name"),
    /valid JSON/,
  );
  assert.throws(
    () => new CodexContentGenerator({ run: () => '{"value":"unused"}' }, "/repo", "invalid profile").branchValue(issue),
    /profile names/,
  );
});
