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
#   - optional repo variable CLAUDE_BOT_REVIEWERS = comma-separated logins to
#     request review from (default: whoever pushed the branch)
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
          # Comma-separated logins; defaults to whoever pushed the branch.
          REVIEWERS: ${{ vars.CLAUDE_BOT_REVIEWERS || github.actor }}
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
          url=$(gh pr create --head "$BRANCH" --base "$BASE" --fill-first)
          echo "Opened $url"

          # Request review. A failure here only warns: the PR is already open.
          IFS=',' read -ra reviewers <<< "$REVIEWERS"
          for r in "${reviewers[@]}"; do
            r=$(echo "$r" | xargs)
            case "$r" in ""|*"[bot]") continue ;; esac
            gh api --silent "repos/$GH_REPO/pulls/${url##*/}/requested_reviewers" \
              -f "reviewers[]=$r" \
              && echo "Requested review from $r" \
              || echo "::warning::Could not request review from $r"
          done
```

Before committing, check that these are still the latest major versions and input names: `actions/create-github-app-token` (v3 uses `client-id`; `app-id` is deprecated) and `actions/checkout`.

Notes on the design:

- `if: !github.event.deleted` keeps a branch deletion from failing the run; the `vars.CLAUDE_BOT_CLIENT_ID != ''` check skips the job until the App is configured, so pushing the workflow itself does not fail.
- The job's own `GITHUB_TOKEN` has only `contents: read` (for checkout); the App token carries the PR rights and is narrowed to `contents: read` + `pull-requests: write`.
- `--fill-first` takes the title and body from the branch's first commit. Plain `--fill` would use the branch name as the title once the branch has more than one commit.
- `concurrency` per branch stops two quick pushes from opening duplicate PRs.
- After opening the PR, the workflow requests review from `CLAUDE_BOT_REVIEWERS` (an optional repo variable, comma-separated logins), or else from whoever pushed the branch: for a cloud session, that is the user. This works because the PR's author is the bot; GitHub never lets a PR's author be its reviewer. Bot logins are skipped, and a failed request only warns. Review is requested once, when the PR opens; later pushes don't re-request it.

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

Claude cannot do these; put them in the PR description of the setup change. They are in this order on purpose: **set the permissions before installing**, or the install has nothing to grant.

1. **Create a GitHub App** at <https://github.com/settings/apps/new> (profile picture → Settings → Developer settings, at the bottom of the left sidebar → GitHub Apps → New GitHub App; this is the *account's* settings, not the repo's).
   - Name: e.g. `<user>-claude-bot` (the PR author shows as `<name>[bot]`).
   - Homepage URL: any URL, e.g. the repo's.
   - Webhook: uncheck **Active**.
   - Repository permissions: **Contents: Read and write**, **Pull requests: Read and write** (Metadata: Read-only is added automatically).
   - Where can it be installed: **Only on this account**.
2. **Generate a private key**: on the App's settings page (`https://github.com/settings/apps/<app-name>`), open the **Credentials** tab in the left menu → **Key pairs** → generate. A `.pem` file downloads. Ignore **Client secrets** on the same page: they are for OAuth sign-in and this setup does not use them. A key can be generated any time, also after installing.
3. **Note the Client ID**: shown under **About** on the App's **General** tab, starts with `Iv`. Use it, not the numeric **App ID**.
4. **Install the App** (**Install App** in the left menu) on the repo, or on all repos, and pick the repo under **Repository access**.
5. **Save both in the repo**: repo → Settings → Secrets and variables → Actions (`https://github.com/<owner>/<repo>/settings/secrets/actions`):
   - **Secrets** tab → New repository secret `CLAUDE_BOT_PRIVATE_KEY` = the whole `.pem` text, including the `-----BEGIN…` and `-----END…` lines.
   - **Variables** tab → New repository variable `CLAUDE_BOT_CLIENT_ID` = the Client ID.

   Use **Repository** secrets and variables, not Environment ones.

The setup change itself is opened as a normal PR by the user: the bot flow starts once the workflow is on the default branch and the App is configured. (A push to a `claude/**` branch runs the workflow file from that branch, so it may start working earlier, once the variable and secret exist.)

## Checking it works

- Push a test branch `claude/test-bot-pr` with one commit: a PR authored by `<app-name>[bot]` opens.
- Push again to the same branch: the PR updates and no second PR opens.
- CI checks run on that PR, triggered by `<app-name>[bot]`.
- Close the PR and delete the branch: the workflow is skipped, and nothing fails. A cloud session's git proxy may refuse to delete remote branches (HTTP 403); then the user deletes it with **Delete branch** on the PR.

After fixing a setup problem, re-run the failed job from the Actions tab (or push again); no new branch is needed.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| Job skipped on every push | `CLAUDE_BOT_CLIENT_ID` is not set, or was set as an Environment variable | Add it as a **Repository** variable |
| "Mint App token" fails with `Not Found` on `/repos/<owner>/<repo>/installation` (404) | The key and Client ID are fine, but the App is not installed on this repo | Install the App, or add the repo under its Repository access |
| The installation page says **No permissions** and **No repositories**, with no way to pick a repo | The App was installed before it had any repository permissions | App settings → **Permissions & events** → set Contents and Pull requests to Read and write → Save; then on the installation page (`https://github.com/settings/installations` → Configure) **accept** the new permissions and pick the repo |
| "Mint App token" fails with a key or JWT error | Wrong or partly pasted key, or the App ID was used instead of the Client ID | Paste the whole `.pem` again; check the variable holds the `Iv…` Client ID |
| Warning "Could not request review from …" | The login is wrong, or that person has no access to the repo | Fix `CLAUDE_BOT_REVIEWERS`; reviewers must be collaborators |
| `gh pr create` fails with "Resource not accessible by integration" | The App lacks Pull requests: write, or the new permission was not accepted | Set it and accept it on the installation page, as above |

## What changes, and what does not

- **The PR author is the bot**, so the user is requested as a reviewer and can approve and merge Claude's PRs themselves (GitHub does not let anyone approve their own PR).
- **The push is still the user's.** A cloud session pushes with the user's GitHub credentials, so the workflow runs and the branch push show the user as the actor. Commit authorship is separate: it comes from the session's git config (in Claude Code cloud sessions, `Claude <noreply@anthropic.com>`), not from the App.
