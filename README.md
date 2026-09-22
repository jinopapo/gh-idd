# gh-idd

`gh idd` connects GitHub Issues, issue dependencies, development branches,
pull requests, and one explicitly configured GitHub Project into a single
issue-driven workflow.

GitHub remains the source of truth. The extension does not maintain its own
issue database or duplicate GitHub's issue lifecycle.

## Commands

The command catalog is generated from a single registry:

```bash
gh idd help
gh idd help start
```

The detailed help for each command shows every external `gh` and `git`
command it invokes, together with its purpose.

| Command | Purpose |
| --- | --- |
| `set-project` | Select the only GitHub Project that `gh idd` may update |
| `start` | Check dependencies and start development for an Issue |
| `next-issue` | Find a newly unblocked downstream Issue and start it |
| `close` | Close the current branch's Issue and start a newly unblocked downstream Issue |
| `pr` | Push the current branch and create a closing pull request |
| `issue` | Show only the Issue linked to the current branch |
| `status` | Show Issue, dependency, branch, Project, and PR context |

## Requirements

- [GitHub CLI](https://cli.github.com/) authenticated with access to the repository and Project
- Node.js 24 or later
- Git
- Codex CLI（AI placeholderを設定する場合のみ。ログイン済みであること）

For Project operations, ensure the GitHub CLI token has the required project
scope (for example, run `gh auth refresh -s project`).

## Install

```bash
gh extension install jinopapo/gh-idd
```

For development from this checkout:

```bash
gh extension install .
```

### Codex Skill

This repository also includes a Codex Skill that teaches Codex when and how to
use the extension. Install it for Codex at user scope with GitHub CLI:

```bash
gh skill install jinopapo/gh-idd gh-idd --agent codex --scope user
```

For development, install the Skill directly from this checkout:

```bash
gh skill install . gh-idd --from-local --agent codex --scope user
```

The `gh skill` commands are currently a GitHub CLI preview feature. They track
the Skill's source so it can later be refreshed with `gh skill update`. Start a
new Codex session after installation, then invoke the Skill with `$gh-idd`.

## Quick start

Select the Project that this repository is allowed to update:

```bash
gh idd set-project
# or explicitly
gh idd set-project example-org/3
```

Start an unblocked Issue. This creates and checks out a linked development
branch, assigns the Issue to you, and changes the configured Project status to
`In Progress`:

```bash
gh idd start 123
```

Create the pull request for the current Issue. The branch is pushed, the PR
body receives `Closes #123`, and Project status becomes `In Review`:

```bash
gh idd pr
```

After merging the PR, find a downstream Issue that has no remaining open
blockers and start it using the same workflow:

```bash
gh idd next-issue
```

When working without a pull request, close the Issue linked to the current
branch and immediately run the same downstream Issue workflow:

```bash
gh idd close
```

Inspect the GitHub context associated with the current branch:

```bash
gh idd status
```

To retrieve only the Issue linked to the current branch, without requiring a
Project configuration or fetching Project and pull request status:

```bash
gh idd issue
```

## Configuration

Repository configuration lives in `.github/idd.toml`:

```toml
[branch]
format = "{type}/{issue}-{slug}"

[pull_request]
title = "{issue_title}"
body = ""

[project]
owner = "example-org"
number = 3
status_field = "Status"

[project.status]
todo = "Todo"
progress = "In Progress"
review = "In Review"

[workflow]
assign_on_start = true
update_project = true
check_dependencies = true
```

Global defaults can be stored at `$GH_CONFIG_DIR/idd/config.toml` (normally
`~/.config/gh/idd/config.toml`). The priority is CLI options, repository
configuration, global configuration, then built-in defaults.

The branch format supports `{type}`, `{issue}`, and `{slug}`. The inferred type
defaults to `feat` and recognizes common fix, documentation, maintenance,
refactor, and test titles.

### AI-generated template values

AI is enabled by configuration rather than a command-line flag. When the
branch format contains `{ai}`, `codex exec` generates only that placeholder's
value. `ai_prompt` is appended to the built-in safety and output-format
instructions:

```toml
[branch]
format = "{type}/{issue}-{ai}"
ai_prompt = "Use a short verb-first description of the change"
```

To use a named Codex configuration profile for all AI-generated values, set
`codex.profile`. The extension passes it to `codex exec --profile`:

```toml
[codex]
profile = "deep-review"
```

The corresponding Codex profile file is `$CODEX_HOME/deep-review.config.toml`
(normally `~/.codex/deep-review.config.toml`). If `codex.profile` is omitted,
Codex uses its normal configuration resolution.

Pull request templates support `{issue}`, `{issue_title}`, `{branch}`,
`{ai_title}`, and `{ai_body}`. Codex runs only when an AI placeholder is used:

```toml
[pull_request]
title = "{ai_title}"
body = "{ai_body}"
ai_prompt = "Explain the motivation, implementation, and tests in Japanese"
```

`{ai_title}` and `{ai_body}` are generated together after Codex inspects the
current branch. `Closes #<issue>` is always appended separately, regardless of
the body template. With no AI placeholders, Codex is not invoked.

Useful overrides:

```bash
gh idd start 123 --force                 # allow an open blocker
gh idd start 123 --no-assign             # skip assignment
gh idd start 123 --no-project            # skip Project update
gh idd start 123 --branch-format 'issue/{issue}-{slug}'
```

## Design

- Dependencies are read from GitHub's native `blockedBy` and `blocking` relationships.
- Development branches are created with `gh issue develop`.
- Pull requests are created with `gh pr create` and GitHub close syntax.
- Project and status names are configured by humans; GraphQL IDs are not stored.
- `close` supports workflows that finish an Issue without a pull request; PR-based workflows still close Issues through GitHub close syntax.

### Source architecture

```text
src/
├── commands/    one module per user-facing command + registry.ts
├── services/    reusable Issue-driven workflows
├── domain/      pure naming and domain rules
├── adapters/    the only modules allowed to invoke gh or git
├── config/      TOML loading and precedence
├── core/        shared types and external dependency metadata
└── ui/          interactive selectors
```

`src/commands/registry.ts` is the single place that lists all commands.
Every command definition declares its usage, summary, and external command
dependencies. Help output and command dispatch are both generated from that
registry, so adding a command without exposing it to users is difficult.

The source is TypeScript. `dist/` is committed so installing the GitHub CLI
extension does not require installing npm dependencies at runtime.

## Development

```bash
npm test
npm run lint
```
