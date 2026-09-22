import test from "node:test";
import assert from "node:assert/strict";
import { parseProjectReference } from "../dist/ui/selectors.js";

test("parses project references", () => {
  assert.deepEqual(parseProjectReference("acme/3", "other"), { owner: "acme", number: 3 });
  assert.deepEqual(parseProjectReference("https://github.com/orgs/acme/projects/7", "other"), { owner: "acme", number: 7 });
  assert.deepEqual(parseProjectReference("9", "acme"), { owner: "acme", number: 9 });
});
