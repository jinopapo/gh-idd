import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { COMMANDS } from "../dist/commands/registry.js";

const cli = fileURLToPath(new URL("../dist/main.js", import.meta.url));
const hasFish = spawnSync("fish", ["--version"]).status === 0;

test("completion generation needs neither a repository nor external commands", () => {
  const output = execFileSync(process.execPath, [cli, "completion", "fish"], {
    cwd: tmpdir(), env: { ...process.env, PATH: "" }, encoding: "utf8",
  });
  assert.match(output, /function __gh_idd_context/);
  const invalid = spawnSync(process.execPath, [cli, "completion", "zsh"], {
    cwd: tmpdir(), encoding: "utf8",
  });
  assert.equal(invalid.status, 1);
  assert.match(invalid.stderr, /Usage: gh idd completion fish/);
});

test("fish completes commands, options, and help without affecting other gh commands", { skip: !hasFish }, () => {
  const directory = mkdtempSync(path.join(tmpdir(), "gh-idd-fish-"));
  try {
    const script = path.join(directory, "completion.fish");
    writeFileSync(script, execFileSync(process.execPath, [cli, "completion", "fish"]));
    execFileSync("fish", ["--no-config", "--no-execute", script]);
    const complete = (line) => execFileSync("fish", ["--no-config", "-c", `
      # Avoid loading system gh completions or making API calls in tests.
      set fish_complete_path
      function gh
        if test "$argv[1]" = __complete
          printf ':4\\n'
        end
      end
      complete -c gh -f -n '__fish_seen_subcommand_from issue' -a list
      source "$argv[1]"
      complete -C "$argv[2]"
    `, "--", script, line], { cwd: directory, encoding: "utf8" })
      .trim().split("\n").filter(Boolean).map((line) => line.split("\t")[0]);
    for (const prefix of ["gh idd", "gh-idd"]) {
      for (const command of COMMANDS) assert.ok(complete(`${prefix} `).includes(command.name));
      assert.deepEqual(complete(`${prefix} st`), ["start", "status"]);
      assert.ok(complete(`${prefix} start --`).includes("--force"));
      assert.deepEqual(complete(`${prefix} help st`), ["start", "status"]);
      assert.deepEqual(complete(`${prefix} completion `), ["fish"]);
      assert.deepEqual(complete(`${prefix} start `), []);
      assert.deepEqual(complete(`${prefix} --repo owner/repo st`), ["start", "status"]);
      assert.deepEqual(complete(`${prefix} --repo `), []);
    }
    assert.ok(complete("gh issue ").includes("list"));
    assert.ok(!complete("gh issue ").includes("start"));
    assert.ok(!complete("gh issue view idd ").includes("start"));
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
