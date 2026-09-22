import test from "node:test";
import assert from "node:assert/strict";
import { branchName, issueNumberFromBranch, slugify } from "../dist/domain/naming.js";

test("builds a feature branch name", () => {
  assert.equal(branchName({ number: 123, title: "Add User Search" }, "{type}/{issue}-{slug}"), "feat/123-add-user-search");
});

test("inserts an AI-generated branch placeholder value", () => {
  assert.equal(branchName({ number: 123, title: "Add User Search" }, "{type}/{issue}-{ai}", "search-api"), "feat/123-search-api");
});

test("detects fix titles", () => {
  assert.equal(branchName({ number: 4, title: "Fix login error" }, "{type}/{issue}-{slug}"), "fix/4-fix-login-error");
});

test("uses a stable fallback for non-latin titles", () => {
  assert.equal(slugify("ユーザー検索を追加"), "issue");
});

test("extracts issue number from a branch", () => {
  assert.equal(issueNumberFromBranch("feat/123-add-search"), 123);
  assert.equal(issueNumberFromBranch("main"), null);
});
