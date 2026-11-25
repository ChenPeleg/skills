# Plan: branch naming skill

Status: **draft (2026-11-25)** — uses Conventional Commits types as the first segment; branches Claude creates
start with `claude/` so the [`claude-bot-prs`](../skills/claude-bot-prs/SKILL.md) workflow opens their PRs.
Target: new skill `skills/branch-naming/SKILL.md`, published with the `publish-plugin` skill.

## Goal

One naming rule for branches, so the branch list shows what kind of change a branch is, which feature it belongs
to, and in which order its parts go:

```
feat/adding-2fa/p1
feat/adding-2fa/p2-validating-plans
feat/adding-2fa/p3-sms-fallback
fix/login-timeout/p1
claude/feat/adding-2fa/p4-recovery-codes
```

## The rule

```
[claude/]<type>/<prefix>/p<n>[-<description>]
```

| Piece          | Rule                                                                 | Example             |
|----------------|----------------------------------------------------------------------|---------------------|
| `claude/`      | Only when Claude creates the branch (see below); a person omits it   | `claude/`           |
| `type`         | A Conventional Commits type (list below)                             | `feat`              |
| `prefix`       | Short name of the feature or task, kebab-case, 1–3 words, ≤ 20 chars | `adding-2fa`        |
| `p<n>`         | Part number, starting at `1`, no zero padding (`p2`, not `p02`)      | `p2`                |
| `-description` | Optional, kebab-case, 1–4 words, says what this part does            | `-validating-plans` |

Character set: lowercase `a–z`, digits, `-`, and exactly two `/` (three with `claude/`). No spaces, underscores
or capitals.

### Branches Claude creates: the `claude/` prefix

In repos set up with the [`claude-bot-prs`](../skills/claude-bot-prs/SKILL.md) skill, a workflow opens the PR for
every pushed `claude/**` branch, authored by a GitHub App bot, and Claude must not open PRs itself. So when Claude
creates a branch, it puts `claude/` in front of the normal name: `claude/feat/adding-2fa/p2-validating-plans`.

- **Prefix, not suffix.** The workflow triggers on `claude/**` only. `feat/adding-2fa/p2-claude` or
  `claude-feat/…` would be pushed but never get a PR.
- **Everything after `claude/` follows the normal rule**, so the rest of this plan (types, parts, regex, PR titles)
  applies unchanged once `claude/` is stripped.
- **A person's branches don't get the prefix**, and Claude never adds it to an existing branch it is asked to work
  on.
- **Cloud sessions that were assigned a branch name** (e.g. `claude/vibrant-mayer-3uorma`) push to that one unless
  the user asks for a rule-based name; it still starts with `claude/`, so the workflow still opens the PR.
- **Repos without the workflow**: still use `claude/` if the repo's `CLAUDE.md` asks for it; otherwise it is
  optional and only marks who made the branch.

### Types

The [Conventional Commits](https://www.conventionalcommits.org/) types (Angular list):

| Type       | Use for                                              | SemVer bump |
|------------|------------------------------------------------------|-------------|
| `feat`     | A new feature                                        | minor       |
| `fix`      | A bug fix                                            | patch       |
| `perf`     | A change that makes code faster                      | patch       |
| `refactor` | Code change that neither fixes a bug nor adds a feature | none     |
| `docs`     | Documentation only                                   | none        |
| `test`     | Adding or fixing tests                               | none        |
| `style`    | Formatting, whitespace, no code meaning change       | none        |
| `build`    | Build system or dependencies                         | none        |
| `ci`       | CI configuration and scripts                         | none        |
| `chore`    | Other changes that don't touch src or tests          | none        |
| `revert`   | Reverts an earlier commit                            | depends     |

`patch` is not a type: it is the SemVer bump that a `fix` causes. Breaking changes are marked in the commit
(`feat!:` or a `BREAKING CHANGE:` footer), not in the branch name.

**Same type for all parts:** the type describes the feature as a whole, so every part of `adding-2fa` is `feat/…`,
even a part that only adds tests. This keeps the parts together in the branch list.

### Check regex

```
^(claude/)?(feat|fix|perf|refactor|docs|test|style|build|ci|chore|revert)/[a-z0-9]+(-[a-z0-9]+)*/p[1-9][0-9]*(-[a-z0-9]+)*$
```

### Good / bad

| Branch                                  | OK? | Why                               |
|-----------------------------------------|-----|-----------------------------------|
| `feat/adding-2fa/p1`                    | yes |                                   |
| `feat/adding-2fa/p2-validating-plans`   | yes |                                   |
| `fix/login-timeout/p1-retry-on-401`     | yes |                                   |
| `claude/feat/adding-2fa/p3-sms-fallback`| yes | made by Claude; the bot opens the PR |
| `feat/adding-2fa/p3-claude`             | no, for Claude | valid name, but a `-claude` suffix gets no bot PR; use the `claude/` prefix |
| `claude-feat/adding-2fa/p3`             | no  | `claude-` doesn't match `claude/**` |
| `claude/adding-2fa/p3`                  | no  | missing type after `claude/`      |
| `adding-2fa/p1`                         | no  | missing type                      |
| `feature/adding-2fa/p1`                 | no  | type is `feat`, not `feature`     |
| `patch/login-timeout/p1`                | no  | `patch` is not a type; use `fix`  |
| `Feat/Adding_2FA/p2`                    | no  | capitals, underscore              |
| `feat/adding-2fa/part2`                 | no  | must be `p2`                      |
| `feat/adding-2fa/p02`                   | no  | no zero padding                   |
| `feat/adding-2fa-p2`                    | no  | part must follow `/`              |

### PR titles and commits match the branch

The prefix becomes the Conventional Commits scope, and the part goes first in the description:

| Branch                                | PR title / squash commit                    |
|---------------------------------------|---------------------------------------------|
| `feat/adding-2fa/p1`                  | `feat(adding-2fa): p1 <what it does>`       |
| `feat/adding-2fa/p2-validating-plans` | `feat(adding-2fa): p2 validating plans`     |
| `fix/login-timeout/p1-retry-on-401`   | `fix(login-timeout): p1 retry on 401`       |

Commits inside the branch use the same `type(scope): …` form; their type may differ (`test(adding-2fa): …`).

`claude/` never appears in the title. On a `claude/` branch the bot creates the PR from the branch's **first
commit** (`gh pr create --fill-first`), so Claude writes that commit as the PR: subject = the title above
(`feat(adding-2fa): p2 validating plans`), body = the PR description.

### Why `/` and not `_`

Conventional Commits only covers commit messages; it says nothing about branch names. The common branch
convention built on it ([Conventional Branch](https://conventional-branch.github.io/)) uses `type/description`
with `/` between parts and `-` inside words. `/` is also what Git tools understand: GUIs show it as folders and
`git branch --list 'feat/*'` filters by it. `_` gives neither, so it is not used.

## Benefits

1. **Matches the commits.** The branch type is the same word as the commit type (`feat: …`), and both say what
   SemVer bump to expect.
2. **Easy to find.** `git branch --list '*feat/*'` shows all features (with or without `claude/`); `git branch --list '*/adding-2fa/*'` shows one
   feature in order. Git GUIs show `/` as folders: `feat › adding-2fa › p1, p2, p3`.
3. **Order without looking it up.** `p3` comes after `p2`.
4. **Small PRs feel normal.** Numbered parts invite splitting a feature into small, reviewable PRs.
5. **Easy for Claude to follow.** "Start the next part" is a fixed step: highest `p<n>` + 1, same type and prefix.
6. **Links to plans.** Parts in a `_plans/` file map one-to-one to branches.
7. **Easy cleanup.** One pattern deletes all branches of a shipped feature.

Costs: no plain `feat/adding-2fa` branch can exist (see Git notes), stacked parts need rebasing when an earlier
part changes, and a one-line fix still needs `fix/<prefix>/p1`.

## Things the skill must explain

1. **Git cannot have both `feat/adding-2fa` and `feat/adding-2fa/p1`.** A branch name is a file path under
   `.git/refs/heads/`, so `feat/adding-2fa` can't be a file and a folder at once. Even a one-part task is
   `<type>/<prefix>/p1`.
2. **Same type and prefix for every part.** Pick both once, at `p1`, and reuse them exactly.
3. **Numbering follows order, not size.** If a part is dropped, don't renumber the others; just skip the number.
4. **Picking the next number.** Look at local and remote branches:
   `git branch -a --list '*adding-2fa/p*'`, take the highest `p<n>`, add 1. The pattern matches parts with and
   without `claude/`, so parts made by a person and by Claude share one numbering. Never reuse a number that
   exists in either form (`feat/adding-2fa/p2` and `claude/feat/adding-2fa/p2` can both exist in Git, which is
   exactly what to avoid).
5. **Stacked parts.** Base `p<n>` on `p<n-1>` when it depends on it; otherwise base it on the main branch.
   The PR for `p<n>` targets `p<n-1>` or main accordingly. **Exception for `claude/` branches:** the bot workflow
   always opens the PR against the default branch. For a stacked Claude part, say so in the first commit body
   ("Stacked on `p<n-1>`; retarget the PR to it") and tell the user; changing the base is theirs to do.
6. **Renaming an existing branch** to fit: `git branch -m <old> <new>`, then `git push -u origin <new>` and
   `git push origin --delete <old>` (ask before deleting the remote branch).
7. **Finding branches with `git branch --list`.** `'feat/*'` misses `claude/feat/…`; use `'*feat/*'` to see both,
   or `'claude/*'` for just Claude's.

## Skill layout

```
skills/branch-naming/
  SKILL.md        rule, types, regex, examples, steps for "create the next part", git notes
```

SKILL.md sections:
1. Frontmatter: `name: branch-naming`, a `description` that triggers on "create a branch", "new branch",
   "name this branch", "next part", "start p2".
2. The rule + table, the type list.
3. Steps: new feature (choose type and prefix → `<type>/<prefix>/p1-…`), next part (find highest `p<n>` →
   create `p<n+1>-…`).
4. Good / bad examples.
5. Git notes (points 1, 5, 6, 7 above).
6. Claude branches: the `claude/` prefix, first commit = PR, never open a PR; link to `claude-bot-prs`.

No scripts in the first version; the regex and the `git branch` command are enough.

## Implementation steps (when approved)

1. Write `skills/branch-naming/SKILL.md`.
2. Add it to `README.md`'s skill list (if there is one).
3. Try it: ask Claude in a fresh session to "start part 2 of adding-2fa" and check the branch name it picks.
4. Publish with the `publish-plugin` skill.

## Open questions

- Skill name: `branch-naming` or something more specific like `feature-part-branches`?
- Max lengths (prefix ≤ 20, description ≤ 4 words): are these right?
- Should the `claude-open-pr` workflow open a stacked `claude/<type>/<prefix>/p<n>` PR against
  `…/p<n-1>` when that branch exists, instead of always against the default branch?
