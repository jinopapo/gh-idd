import test from "node:test";
import assert from "node:assert/strict";
import { parseToml, stringifyToml, deepMerge, DEFAULT_CONFIG } from "../dist/config/config.js";

test("parses the documented configuration", () => {
  const config = parseToml(`
[branch]
format = "{type}/{issue}-{ai}"
ai_prompt = "Use domain language"

[pull_request]
title = "{ai_title}"
body = "{ai_body}"
ai_prompt = "Write in Japanese"

[codex]
profile = "deep-review"

[project]
owner = "example-org"
number = 3

[project.status]
progress = "In Progress"

[workflow]
assign_on_start = true
`);
  assert.equal(config.branch.ai_prompt, "Use domain language");
  assert.equal(config.pull_request.title, "{ai_title}");
  assert.equal(config.pull_request.ai_prompt, "Write in Japanese");
  assert.equal(config.codex.profile, "deep-review");
  assert.equal(config.project.owner, "example-org");
  assert.equal(config.project.number, 3);
  assert.equal(config.project.status.progress, "In Progress");
  assert.equal(config.workflow.assign_on_start, true);
});

test("stringify round-trips nested values", () => {
  const config = { branch: { format: "x-{issue}" }, project: { owner: "acme", number: 2, status: { review: "Review" } } };
  assert.deepEqual(parseToml(stringifyToml(config)), config);
});

test("deep merge preserves defaults", () => {
  const config = deepMerge(DEFAULT_CONFIG, { project: { owner: "acme", number: 1 } });
  assert.equal(config.project.status.progress, "In Progress");
  assert.equal(config.project.owner, "acme");
  assert.equal(config.pull_request.title, "{issue_title}");
  assert.deepEqual(config.codex, {});
});
