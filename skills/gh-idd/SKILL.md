---
name: gh-idd
description: Use gh idd by default for implementation, bug fixes, refactors, and other code changes in GitHub repositories. Inspect the current branch's linked Issue and follow the Issue-driven workflow even when the user does not mention gh idd. Also handle explicit Issue, dependency, branch, Project, and pull request requests. Skip non-GitHub repositories or an explicit request for another workflow.
license: MIT
---

# gh idd

Operate `gh idd` from the target GitHub repository. GitHub is the source of truth; do not maintain a parallel issue state. Apply this workflow to ordinary coding requests, including a bare "implement this" or "fix this", without waiting for the user to name `gh idd`.

## Default for code changes

1. Check the checkout, current branch, and worktree status so the task uses the intended repository and preserves unrelated changes.
2. Run `gh idd issue` before editing to identify the Issue linked to the current branch. If one is linked and dependency, Project, or PR context matters, run `gh idd status` as well. Both commands only read GitHub state.
3. Read the linked Issue's body with `gh issue view <number>` when the request is terse or the requirements are in the Issue. Use the user's current instructions to resolve any difference in scope.
4. If the branch has no linked Issue, continue the requested implementation on that branch. Do not create an Issue or start another branch just because the link is missing. If lookup fails for another reason, report the failure and continue when the user's request provides enough context.
5. Use `gh idd` for requested Issue, branch, Project, and PR transitions throughout the work. A coding request alone does not call for pushing a branch, opening a PR, or closing an Issue.

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

1. Inspect with `gh idd issue` or `gh idd status` before choosing a mutating command, unless the user's request already identifies the Issue and action unambiguously.
2. Run only the command needed for the requested transition. Treat `create-task`, `start`, `next-issue`, `close`, `pr`, and `set-project` as state-changing operations.
3. Do not add `--force` merely to bypass a blocker. Use it only when the user has explicitly chosen to proceed despite open dependencies.
4. After a state change, report the Issue number, checked-out branch, Project transition, and PR URL when applicable. Re-run `gh idd status` when verification is useful and does not duplicate a successful command result.

Useful scoped overrides are `--no-assign`, `--no-project`, `--no-dependency-check`, and `--branch-format`. Preserve repository configuration unless the user asks to override it.

## Configuration

Repository settings live in `.github/idd.toml`; global defaults live at `$GH_CONFIG_DIR/idd/config.toml`. CLI options take precedence over repository settings, global settings, and built-in defaults.

When a branch format contains `{ai}`, or a pull request template contains `{ai_title}` or `{ai_body}`, gh-idd invokes `codex exec`. Codex CLI is otherwise optional. Do not assume AI generation is enabled without inspecting the active configuration.
