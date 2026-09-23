---
name: gh-idd
description: Use the gh idd GitHub CLI extension to inspect and run an Issue-driven development workflow that connects GitHub Issues, dependencies, branches, pull requests, and one configured GitHub Project. Apply when the user asks to start, inspect, advance, close, or create a PR for work managed by gh idd; do not use for repositories that do not use this extension.
license: MIT
---

# gh idd

Operate `gh idd` from the target Git repository. GitHub is the source of truth; do not maintain a parallel issue state.

## Choose the narrowest command

- `gh idd issue`: show only the Issue associated with the current branch. Prefer this when Project or PR context is unnecessary.
- `gh idd status`: inspect the current Issue, dependencies, branch, configured Project status, and PR context without changing them.
- `gh idd set-project [OWNER/NUMBER|URL]`: select the only Project this repository may update. With no argument, it prompts interactively.
- `gh idd create-task <title> [--body TEXT | --body-file FILE] [-R OWNER/REPO]`: create an Issue in the selected repository and add it to the configured Project with its configured initial status (Backlog by default).
- `gh idd start <issue>`: create and check out the linked development branch, assign the Issue, and set Project status to `In Progress`.
- `gh idd pr`: push the current branch, create a PR containing `Closes #<issue>`, and set Project status to `In Review`.
- `gh idd next-issue`: find a newly unblocked downstream Issue and run the start workflow for it.
- `gh idd close`: close the current branch's Issue, then start a newly unblocked downstream Issue when one exists. Use this only when the user intends to finish without a pull request.

Use `gh idd help <command>` when exact behavior or external commands need confirmation.

## Run the workflow

1. Confirm the working directory, current branch, and worktree status. Preserve unrelated local changes.
2. Inspect with `gh idd issue` or `gh idd status` before choosing a mutating command, unless the user's request already identifies the Issue and action unambiguously.
3. Run only the command needed for the requested transition. Treat `create-task`, `start`, `next-issue`, `close`, `pr`, and `set-project` as state-changing operations.
4. Do not add `--force` merely to bypass a blocker. Use it only when the user has explicitly chosen to proceed despite open dependencies.
5. After a state change, report the Issue number, checked-out branch, Project transition, and PR URL when applicable. Re-run `gh idd status` when verification is useful and does not duplicate a successful command result.

Useful scoped overrides are `--no-assign`, `--no-project`, `--no-dependency-check`, and `--branch-format`. Preserve repository configuration unless the user asks to override it.

## Configuration

Repository settings live in `.github/idd.toml`; global defaults live at `$GH_CONFIG_DIR/idd/config.toml`. CLI options take precedence over repository settings, global settings, and built-in defaults.

When a branch format contains `{ai}`, or a pull request template contains `{ai_title}` or `{ai_body}`, gh-idd invokes `codex exec`. Codex CLI is otherwise optional. Do not assume AI generation is enabled without inspecting the active configuration.
