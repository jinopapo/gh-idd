import test from "node:test";
import assert from "node:assert/strict";
import { COMMANDS } from "../dist/commands/registry.js";
import { renderCommandHelp, renderHelp } from "../dist/help.js";

test("the command registry is the complete discoverable command catalog", () => {
  assert.deepEqual(COMMANDS.map((command) => command.name), ["set-project", "start", "next-issue", "close", "pr", "issue", "status", "completion"]);
  for (const command of COMMANDS) {
    assert.ok(command.usage.startsWith(`gh idd ${command.name}`));
    assert.ok(command.summary.length > 0);
    assert.ok(command.dependencies.length > 0 || "executeStandalone" in command);
  }
});

test("general help is generated from the command registry", () => {
  const help = renderHelp(COMMANDS);
  for (const command of COMMANDS) assert.match(help, new RegExp(command.name));
});

test("command help exposes external command dependencies", () => {
  const start = COMMANDS.find((command) => command.name === "start");
  const help = renderCommandHelp(start);
  assert.match(help, /External command dependencies:/);
  assert.match(help, /gh issue develop/);
  assert.match(help, /git rev-parse/);
});
