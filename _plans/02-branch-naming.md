# Plan: branch naming skill

Status: **draft (2026-11-24)** — uses Conventional Commits types as the first segment.
Target: new skill `skills/branch-naming/SKILL.md`, published with the `publish-plugin` skill.

## Goal

One naming rule for branches, so the branch list shows what kind of change a branch is, which feature it belongs
to, and in which order its parts go:

```
feat/adding-2fa/p1
feat/adding-2fa/p2-validating-plans
feat/adding-2fa/p3-sms-fallback
fix/login-timeout/p1
```

## The rule

```
<type>/<prefix>/p<n>[-<description>]
```

| Piece          | Rule                                                                 | Example             |
|----------------|----------------------------------------------------------------------|---------------------|
| `type`         | A Conventional Commits type (list below)                             | `feat`              |
| `prefix`       | Short name of the feature or task, kebab-case, 1–3 words, ≤ 20 chars | `adding-2fa`        |
| `p<n>`         | Part number, starting at `1`, no zero padding (`p2`, not `p02`)      | `p2`                |
| `-description` | Optional, kebab-case, 1–4 words, says what this part does            | `-validating-plans` |

Character set: lowercase `a–z`, digits, `-`, and exactly two `/`. No spaces, underscores or capitals.

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
^(feat|fix|perf|refactor|docs|test|style|build|ci|chore|revert)/[a-z0-9]+(-[a-z0-9]+)*/p[1-9][0-9]*(-[a-z0-9]+)*$
```

### Good / bad

| Branch                                  | OK? | Why                               |
|-----------------------------------------|-----|-----------------------------------|
| `feat/adding-2fa/p1`                    | yes |                                   |
| `feat/adding-2fa/p2-validating-plans`   | yes |                                   |
| `fix/login-timeout/p1-retry-on-401`     | yes |                                   |
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

### Why `/` and not `_`

Conventional Commits only covers commit messages; it says nothing about branch names. The common branch
convention built on it ([Conventional Branch](https://conventional-branch.github.io/)) uses `type/description`
with `/` between parts and `-` inside words. `/` is also what Git tools understand: GUIs show it as folders and
`git branch --list 'feat/*'` filters by it. `_` gives neither, so it is not used.

## Benefits

1. **Matches the commits.** The branch type is the same word as the commit type (`feat: …`), and both say what
   SemVer bump to expect.
2. **Easy to find.** `git branch --list 'feat/*'` shows all features; `git branch --list '*/adding-2fa/*'` shows one
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
   `git branch -a --list '*adding-2fa/p*'`, take the highest `p<n>`, add 1.
5. **Stacked parts.** Base `p<n>` on `p<n-1>` when it depends on it; otherwise base it on the main branch.
   The PR for `p<n>` targets `p<n-1>` or main accordingly.
6. **Renaming an existing branch** to fit: `git branch -m <old> <new>`, then `git push -u origin <new>` and
   `git push origin --delete <old>` (ask before deleting the remote branch).

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
5. Git notes (points 1, 5, 6 above).

No scripts in the first version; the regex and the `git branch` command are enough.

## Implementation steps (when approved)

1. Write `skills/branch-naming/SKILL.md`.
2. Add it to `README.md`'s skill list (if there is one).
3. Try it: ask Claude in a fresh session to "start part 2 of adding-2fa" and check the branch name it picks.
4. Publish with the `publish-plugin` skill.

## Open questions

- Skill name: `branch-naming` or something more specific like `feature-part-branches`?
- Max lengths (prefix ≤ 20, description ≤ 4 words): are these right?
