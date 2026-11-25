---
name: claude-bot-prs
description: Make pull requests from Claude Code sessions appear under a GitHub App bot (`<app-name>[bot]`) instead of the user's own account. The session only pushes a `claude/<topic>` branch; a GitHub Actions workflow mints an App token and opens the PR. Use when the user wants Claude's PRs opened "in Claude's name" or by a bot, when setting this up in a repo, or when working in a repo whose CLAUDE.md says the bot opens PRs.
license: MIT
---

# Claude PRs opened by a bot

Claude Code cloud sessions act on GitHub with the user's own credentials, so a PR the session opens is authored by the user. To have a bot author it instead:

1. The session commits and pushes to `claude/<short-topic>`. It never opens the PR.
2. A workflow on `push` to `claude/**` mints a token for a custom GitHub App and runs `gh pr create` with it. The PR author is `<app-name>[bot]`.
3. PRs opened with an App token (unlike `GITHUB_TOKEN`) trigger other workflows, so CI runs normally.

A custom App is needed because the official Claude App's token can only be obtained inside `anthropics/claude-code-action`.

## If the repo is already set up

When `CLAUDE.md` has a "Git workflow" section like the one below, or `.github/workflows/claude-open-pr.yml` exists:

- Work on a branch named `claude/<short-topic>`.
- Write the branch's first commit message as the PR: subject = PR title, body = PR description.
- Push the branch. Do not open a PR (no `gh pr create`, no GitHub MCP `create_pull_request`). Tell the user the workflow will open it.

## Setting it up in a repo

### 1. Add the workflow

Create `.github/workflows/claude-open-pr.yml`:

```yaml
name: Open Claude PR

# When a Claude Code session pushes a `claude/**` branch, open a pull request
# for it, authored by a GitHub App bot instead of the person who owns the
# session. Later pushes to the same branch only update the open PR.
#
# Setup (once per repo):
#   - repo variable CLAUDE_BOT_CLIENT_ID   = the GitHub App's Client ID
#   - repo secret   CLAUDE_BOT_PRIVATE_KEY = a private key (.pem) of that App
# The App needs repository permissions Contents and Pull requests (read &
# write; the token below asks only for what it uses) and must be installed on
# this repo. Until the variable is set, the job is skipped.
#
# PRs opened with an App token (unlike GITHUB_TOKEN) trigger other workflows,
# so CI runs on them as usual.

on:
  push:
    branches: ["claude/**"]

concurrency:
  group: claude-open-pr-${{ github.ref }}
  cancel-in-progress: false

jobs:
  open-pr:
    if: ${{ !github.event.deleted && vars.CLAUDE_BOT_CLIENT_ID != '' }}
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - name: Mint App token
        id: app-token
        uses: actions/create-github-app-token@v3
        with:
          client-id: ${{ vars.CLAUDE_BOT_CLIENT_ID }}
          private-key: ${{ secrets.CLAUDE_BOT_PRIVATE_KEY }}
          permission-contents: read
          permission-pull-requests: write

      - uses: actions/checkout@v6
        with:
          fetch-depth: 0
          persist-credentials: false

      - name: Open PR if none is open
        env:
          GH_TOKEN: ${{ steps.app-token.outputs.token }}
          GH_REPO: ${{ github.repository }}
          BRANCH: ${{ github.ref_name }}
          BASE: ${{ github.event.repository.default_branch }}
        run: |
          set -euo pipefail

          open=$(gh pr list --head "$BRANCH" --state open --json number --jq 'length')
          if [ "$open" -gt 0 ]; then
            echo "An open PR already exists for $BRANCH; the push updated it."
            exit 0
          fi

          ahead=$(git rev-list --count "origin/$BASE..HEAD")
          if [ "$ahead" -eq 0 ]; then
            echo "$BRANCH has no commits ahead of $BASE; nothing to open."
            exit 0
          fi

          # --fill-first: title and body come from the branch's first commit.
          gh pr create --head "$BRANCH" --base "$BASE" --fill-first
```

Before committing, check that these are still the latest major versions and input names: `actions/create-github-app-token` (v3 uses `client-id`; `app-id` is deprecated) and `actions/checkout`.

Notes on the design:

- `if: !github.event.deleted` keeps a branch deletion from failing the run; the `vars.CLAUDE_BOT_CLIENT_ID != ''` check skips the job until the App is configured, so pushing the workflow itself does not fail.
- The job's own `GITHUB_TOKEN` has only `contents: read` (for checkout); the App token carries the PR rights and is narrowed to `contents: read` + `pull-requests: write`.
- `--fill-first` takes the title and body from the branch's first commit. Plain `--fill` would use the branch name as the title once the branch has more than one commit.
- `concurrency` per branch stops two quick pushes from opening duplicate PRs.

### 2. Add a "Git workflow" section to `CLAUDE.md`

Create the file if needed and keep existing content:

```markdown
## Git workflow

Pull requests in this repo are opened by a bot, not by you (see [`.github/workflows/claude-open-pr.yml`](.github/workflows/claude-open-pr.yml)).

- Always work on a branch named `claude/<short-topic>`.
- Make the first commit on the branch a clear one: its subject becomes the PR title and its body the PR description (the PR is created from the first commit).
- Push the branch. Do **not** open a PR: no `gh pr create`, no GitHub MCP `create_pull_request`, no "Create PR" button. The workflow opens it, and later pushes update it.
- To change the PR title or description after it is open, ask the user, or edit it only if they ask you to.
```

### 3. Give the user the manual steps

Claude cannot do these; put them in the PR description of the setup change:

1. **Create a GitHub App**: GitHub → Settings → Developer settings → GitHub Apps → New GitHub App.
   - Name: e.g. `<user>-claude-bot` (the PR author shows as `<name>[bot]`).
   - Homepage URL: any URL, e.g. the repo's.
   - Webhook: uncheck **Active**.
   - Repository permissions: **Contents: Read and write**, **Pull requests: Read and write** (Metadata: Read is added automatically).
   - Where can it be installed: **Only on this account**.
2. **Install the App** (the App's page → Install App) on the repo, or on all repos.
3. **Generate a private key** (the App's page → Private keys) and save the whole `.pem` content as the repo secret `CLAUDE_BOT_PRIVATE_KEY` (repo → Settings → Secrets and variables → Actions → Secrets).
4. **Save the App's Client ID** (shown on the App's General page, starts with `Iv`) as the repo variable `CLAUDE_BOT_CLIENT_ID` (same page → Variables).

The setup change itself is opened as a normal PR by the user: the bot flow starts once the workflow is on the default branch and the App is configured. (A push to a `claude/**` branch runs the workflow file from that branch, so it may start working earlier, once the variable and secret exist.)

## Checking it works

- Push a test branch `claude/test-bot-pr` with one commit: a PR authored by `<app-name>[bot]` opens.
- Push again to the same branch: the PR updates and no second PR opens.
- CI checks run on that PR.
- Delete the branch: the workflow does not run (or is skipped), and nothing fails.

If the run fails at "Mint App token", the Client ID, key, or installation is wrong. If `gh pr create` fails with "Resource not accessible by integration", the App lacks Pull requests: write or is not installed on the repo.


