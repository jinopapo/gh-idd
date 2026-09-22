import test from "node:test";
import assert from "node:assert/strict";
import { DevelopmentWorkflow, formatCurrentIssue } from "../dist/services/development-workflow.js";

const config = {
  branch: { format: "{type}/{issue}-{slug}" },
  pull_request: { title: "{issue_title}", body: "" },
  project: { owner: "acme", number: 3, status: { progress: "Doing", review: "Review" } },
  workflow: { check_dependencies: true, assign_on_start: true, update_project: true },
};

test("start rejects an issue with an open blocker before side effects", () => {
  const calls = [];
  const github = {
    issue: () => ({ number: 2, title: "Add thing", state: "OPEN", blockedBy: [{ number: 1, state: "OPEN" }] }),
    createDevelopmentBranch: () => calls.push("branch"),
  };
  assert.throws(() => new DevelopmentWorkflow(github, {}, config).start(2), /blocked by #1/);
  assert.deepEqual(calls, []);
});

test("start shares branch, assignment and project operations", () => {
  const calls = [];
  const issue = { number: 2, title: "Add thing", state: "OPEN", url: "https://github.com/acme/r/issues/2", blockedBy: [] };
  const github = {
    issue: () => issue,
    createDevelopmentBranch: (_issue, name) => calls.push(["branch", name]),
    assign: () => calls.push(["assign"]),
    updateProject: (_issue, _project, status) => calls.push(["project", status]),
  };
  const result = new DevelopmentWorkflow(github, {}, config).start(2);
  assert.equal(result.branch, "feat/2-add-thing");
  assert.deepEqual(calls, [["branch", "feat/2-add-thing"], ["assign"], ["project", "Doing"]]);
});

test("next issue only starts a downstream issue whose blockers are closed", async () => {
  const issues = new Map([
    [1, { number: 1, title: "Current", state: "CLOSED", blocking: [{ number: 2 }, { number: 3 }] }],
    [2, { number: 2, title: "Ready", state: "OPEN", blockedBy: [{ number: 1, state: "CLOSED" }] }],
    [3, { number: 3, title: "Not ready", state: "OPEN", blockedBy: [{ number: 1, state: "CLOSED" }, { number: 9, state: "OPEN" }] }],
  ]);
  const started = [];
  const github = {
    issueForBranch: () => issues.get(1),
    issue: (number) => issues.get(number),
    createDevelopmentBranch: (issue) => started.push(issue.number),
    assign: () => {}, updateProject: () => {},
  };
  const git = { currentBranch: () => "feat/1-current" };
  const result = await new DevelopmentWorkflow(github, git, config).nextIssue();
  assert.equal(result.issue.number, 2);
  assert.deepEqual(started, [2]);
});

test("close closes the current Issue before starting the next Issue", async () => {
  const current = { number: 1, title: "Current", state: "OPEN", blocking: [{ number: 2 }] };
  const next = { number: 2, title: "Ready", state: "OPEN", blockedBy: [{ number: 1, state: "CLOSED" }] };
  const calls = [];
  const github = {
    issueForBranch: () => current,
    closeIssue: (issue) => calls.push(["close", issue.number]),
    issue: (number) => number === 1 ? current : next,
    createDevelopmentBranch: (issue, branch) => calls.push(["branch", issue.number, branch]),
    assign: () => calls.push(["assign"]),
    updateProject: (_issue, _project, status) => calls.push(["project", status]),
  };
  const git = { currentBranch: () => "feat/1-current" };

  const result = await new DevelopmentWorkflow(github, git, config).closeIssue();

  assert.equal(result.issue.number, 1);
  assert.equal(result.next.issue.number, 2);
  assert.equal(result.next.branch, "feat/2-ready");
  assert.deepEqual(calls, [
    ["close", 1],
    ["branch", 2, "feat/2-ready"],
    ["assign"],
    ["project", "Doing"],
  ]);
});

test("close rejects an already closed current Issue before side effects", async () => {
  const calls = [];
  const github = {
    issueForBranch: () => ({ number: 1, title: "Current", state: "CLOSED", blocking: [] }),
    closeIssue: () => calls.push("close"),
  };
  const git = { currentBranch: () => "feat/1-current" };

  await assert.rejects(() => new DevelopmentWorkflow(github, git, config).closeIssue(), /already closed/);
  assert.deepEqual(calls, []);
});

test("close succeeds when there is no downstream Issue to start", async () => {
  const current = { number: 1, title: "Current", state: "OPEN", blocking: [] };
  const calls = [];
  const github = {
    issueForBranch: () => current,
    closeIssue: (issue) => calls.push(["close", issue.number]),
  };
  const git = { currentBranch: () => "feat/1-current" };

  const result = await new DevelopmentWorkflow(github, git, config).closeIssue();

  assert.equal(result.next, null);
  assert.deepEqual(calls, [["close", 1]]);
});

test("current issue resolves only the Issue linked to the current branch", () => {
  const issue = { number: 42, title: "Linked issue", url: "https://github.com/acme/r/issues/42" };
  const github = { issueForBranch: (branch) => {
    assert.equal(branch, "feat/42-linked-issue");
    return issue;
  } };
  const git = { currentBranch: () => "feat/42-linked-issue" };

  const result = new DevelopmentWorkflow(github, git, config).currentIssue();

  assert.deepEqual(result, { issue, branch: "feat/42-linked-issue" });
  assert.equal(formatCurrentIssue(result), "#42 Linked issue\nhttps://github.com/acme/r/issues/42");
});

test("AI content is used for branch and pull request creation", () => {
  const issue = { number: 2, title: "Add thing", state: "OPEN", url: "https://github.com/acme/r/issues/2", blockedBy: [] };
  const calls = [];
  const github = {
    issue: () => issue,
    createDevelopmentBranch: (_issue, name) => calls.push(["branch", name]),
    assign: () => {}, updateProject: () => {},
    issueForBranch: () => issue,
    findPullRequest: () => null,
    createPullRequest: (_issue, content) => {
      calls.push(["pr", content]);
      return { title: content.title, url: "https://github.com/acme/r/pull/1" };
    },
  };
  const git = { currentBranch: () => "feat/2-ai-name", push: (branch) => calls.push(["push", branch]) };
  const generatorCalls = [];
  const generator = {
    branchValue: (_issue, prompt) => { generatorCalls.push(["branch", prompt]); return "ai-name"; },
    pullRequest: (_issue, _branch, prompt) => {
      generatorCalls.push(["pr", prompt]);
      return { title: "AI title", body: "AI body" };
    },
  };
  const aiConfig = {
    ...config,
    branch: { format: "feat/{issue}-{ai}", ai_prompt: "Use the domain language" },
    pull_request: { title: "{ai_title}", body: "{ai_body}", ai_prompt: "Use bullets" },
  };
  const workflow = new DevelopmentWorkflow(github, git, aiConfig, generator);
  assert.equal(workflow.start(2).branch, "feat/2-ai-name");
  assert.equal(workflow.createPr().pr.title, "AI title");
  assert.deepEqual(generatorCalls, [["branch", "Use the domain language"], ["pr", "Use bullets"]]);
  assert.deepEqual(calls, [
    ["branch", "feat/2-ai-name"],
    ["push", "feat/2-ai-name"],
    ["pr", { title: "AI title", body: "AI body" }],
  ]);
});

test("PR templates without AI placeholders do not require a generator", () => {
  const issue = { number: 2, title: "Add thing", state: "OPEN", url: "https://github.com/acme/r/issues/2", blockedBy: [] };
  let content;
  const github = {
    issueForBranch: () => issue,
    findPullRequest: () => null,
    createPullRequest: (_issue, value) => { content = value; return { title: value.title, url: "pr-url" }; },
    updateProject: () => {},
  };
  const git = { currentBranch: () => "feat/2-add-thing", push: () => {} };
  const localConfig = {
    ...config,
    pull_request: { title: "Issue #{issue}: {issue_title}", body: "Branch: {branch}" },
  };
  new DevelopmentWorkflow(github, git, localConfig).createPr();
  assert.deepEqual(content, { title: "Issue #2: Add thing", body: "Branch: feat/2-add-thing" });
});
