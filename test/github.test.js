import test from "node:test";
import assert from "node:assert/strict";
import { GitHubAdapter } from "../dist/adapters/github.js";

test("generated PR content keeps Issue closing syntax", () => {
  const calls = [];
  const runner = {
    run(command, args) {
      calls.push([command, args]);
      return "https://github.com/acme/repo/pull/7";
    },
  };
  const github = new GitHubAdapter(runner, "acme/repo");
  const pr = github.createPullRequest(
    { number: 42, title: "Issue title" },
    { title: "Generated title", body: "## Summary\n\nGenerated body" },
  );
  assert.equal(pr.title, "Generated title");
  assert.equal(pr.url, "https://github.com/acme/repo/pull/7");
  assert.deepEqual(calls[0], ["gh", [
    "pr", "create", "--repo", "acme/repo", "--title", "Generated title",
    "--body", "## Summary\n\nGenerated body\n\nCloses #42",
  ]]);
});

test("closing an Issue uses the current repository", () => {
  const calls = [];
  const runner = { run: (command, args) => { calls.push([command, args]); return ""; } };
  const github = new GitHubAdapter(runner, "acme/repo");

  github.closeIssue({ number: 42 });

  assert.deepEqual(calls, [["gh", ["issue", "close", "42", "--repo", "acme/repo"]]]);
});
