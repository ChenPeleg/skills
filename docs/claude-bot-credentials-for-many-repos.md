# Give many repos the Claude bot credentials at once

The [claude-bot-prs](../skills/claude-bot-prs/SKILL.md) workflow needs two settings in **each** repo that uses it:

| Name | Kind | Value |
| --- | --- | --- |
| `CLAUDE_BOT_CLIENT_ID` | Actions variable | The GitHub App's Client ID (`Iv23…`), from the App's settings page |
| `CLAUDE_BOT_PRIVATE_KEY` | Actions secret | The contents of a private key (`.pem`) generated for the App |

Personal accounts have no account-wide Actions secrets, so the settings have to be set repo by repo. The script below loops over a list of repos and sets both with the GitHub CLI.

My own copy, with the real repo list, is in `local/script` (gitignored).

## The script

```bash
PEM=~/Downloads/<app-name>.private-key.pem
CID=<client-id>
OWNER=<github-user>

for r in repo-one repo-two repo-three; do
  gh secret set CLAUDE_BOT_PRIVATE_KEY -R "$OWNER/$r" < "$PEM" \
    && gh variable set CLAUDE_BOT_CLIENT_ID -R "$OWNER/$r" --body "$CID" \
    && echo "ok $r" || echo "FAIL $r"
done
```

To cover every repo you own instead of a hand-picked list:

```bash
for r in $(gh repo list "$OWNER" --limit 200 --no-archived --json name -q '.[].name'); do
```

Running it again is safe: it overwrites the same values.

## Before running

- **Shell:** Bash. On Windows, use Git Bash, not PowerShell or cmd: `bash path/to/script`.
- **Login:** `gh auth status` must show an account that can manage secrets on those repos (admin or write with secrets access).
- **Key file:** the `.pem` must be at the path in `PEM`. If it was deleted, generate a new private key in the App's settings (this does not invalidate the existing ones).
- **Line endings:** if you save the script as a file on Windows, save it with LF endings. CRLF makes Bash fail with `$'\r': command not found`.

## What it does not do

- **Install the App.** Each repo must also have the GitHub App installed (App settings → Install App → choose the repos). Without it, the workflow fails to mint a token.
- **Add the workflow file.** Each repo still needs its own `.github/workflows/claude-open-pr.yml` that calls the reusable one; see [claude-bot-prs](../skills/claude-bot-prs/SKILL.md).
- **Set reviewers.** `CLAUDE_BOT_REVIEWERS` is optional; without it, the PR requests a review from the person who pushed. To set it, add another `gh variable set CLAUDE_BOT_REVIEWERS -R "$OWNER/$r" --body "<user>"` step.

## Start the setup PRs

Runs that happened before the settings existed were skipped, so nothing opens the setup PRs yet. Something has to start a new run. Re-running the last run on each repo's setup branch picks up the new variable:

```bash
BRANCH=claude/claude-bot-prs

for r in repo-one repo-two repo-three; do
  id=$(gh run list -R "$OWNER/$r" --branch "$BRANCH" -L1 --json databaseId -q '.[0].databaseId')
  if [ -z "$id" ]; then echo "NO RUN  $r"; continue; fi
  gh run rerun -R "$OWNER/$r" "$id" && echo "rerun   $r ($id)" || echo "FAILED  $r ($id)"
done
```

When the runs finish, check which repos got a PR:

```bash
for r in repo-one repo-two repo-three; do
  pr=$(gh pr list -R "$OWNER/$r" --head "$BRANCH" --state all -L1 --json url -q '.[0].url')
  [ -n "$pr" ] && echo "PR      $r  $pr" || echo "NO PR   $r"
done
```

For any repo marked `NO RUN`, `FAILED` or `NO PR`, push a small commit to its setup branch. The push starts a fresh run.

My own copies are in `local/rerun` and `local/check-prs` (gitignored).

After you merge a repo's setup PR, Claude sessions in that repo follow its new `CLAUDE.md`: they push a `claude/…` branch and leave the PR to the bot.

## After running

Once every repo has the key, move the `.pem` out of `~/Downloads` or delete it. You can always generate a new one from the App's settings.
