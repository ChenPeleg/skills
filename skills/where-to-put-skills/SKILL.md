---
name: where-to-put-skills
description: Set up one shared place for a repo's agent skills, so Claude Code, GitHub Copilot and other agents all read the same files. The full skills live in `.agents/skills/<name>/SKILL.md`, `AGENTS.md` lists them, `.claude/skills/` holds only pointer files, and `.github/copilot-instructions.md` and `CLAUDE.md` point to them. Use when adding the first skill to a repo, adding another skill, or moving existing `.claude/skills/` skills to a shared location.
license: MIT
---

# Where to put skills

Keep each skill's steps in exactly one file that every agent can find. Other agents' folders only point to it, so there is never a second copy to drift out of date.

## Layout

```
AGENTS.md                              lists every skill, says how to add one
CLAUDE.md                              short "Skills" section
.agents/skills/<name>/SKILL.md         the real skill: frontmatter + full steps
.claude/skills/<name>/SKILL.md         pointer only, for Claude Code
.github/copilot-instructions.md        one line pointing Copilot to AGENTS.md
```

`.agents/skills/` is the only place a skill's steps are written.

## Steps

### 1. Write the real skill in `.agents/skills/`

Create `.agents/skills/<name>/SKILL.md` with frontmatter and the full steps:

```markdown
---
name: <name>
description: <What the skill does, and when to use it.>
---

# <Title>

<The full steps.>
```

- `name` is lowercase with hyphens and matches the folder name.
- `description` says what the skill does and when to use it; agents decide whether to load the skill from this line alone.
- Supporting files (scripts, templates, references) go in the same folder, next to `SKILL.md`.

### 2. List it in `AGENTS.md`

`AGENTS.md` in the repo root has a table of all skills, with a link to each one and a single line on when to use it, plus a short note on how to add a skill. Create the file if needed; if it already exists, add a `Skills` section and keep the rest.

```markdown
## Skills

Shared agent skills live in `.agents/skills/<name>/SKILL.md`. Read the skill's file and follow it when its "When to use" applies.

| Skill | When to use |
| --- | --- |
| [<name>](.agents/skills/<name>/SKILL.md) | <One line on when to use it.> |

### Adding a skill

1. Write the full skill in `.agents/skills/<name>/SKILL.md`, with `name` and `description` frontmatter.
2. Add a row for it to the table above.
3. Add a pointer file at `.claude/skills/<name>/SKILL.md` (same frontmatter, body only points to the real file). Do not copy the steps there.
```

### 3. Add a Claude Code pointer in `.claude/skills/`

Claude Code discovers skills only in `.claude/skills/`, so each skill gets a pointer file there: `.claude/skills/<name>/SKILL.md`, with the **same frontmatter** as the real skill (so Claude Code can decide when to load it) and a body that only points to the real file:

```markdown
---
name: <name>
description: <Same description as in .agents/skills/<name>/SKILL.md.>
---

This is only a pointer. The skill is in [.agents/skills/<name>/SKILL.md](../../../.agents/skills/<name>/SKILL.md). Read that file and follow it. Do not look for the steps here, and edit that file, not this one.
```

- Do not copy the steps into the pointer.
- Do not use symlinks or junctions instead of pointer files: on Windows they need admin rights or developer mode, and git does not carry them through reliably.
- When a skill's `description` changes, update it in both files.

### 4. Point Copilot to `AGENTS.md`

Add this line to `.github/copilot-instructions.md`, creating the file if it does not exist (keep any existing content):

```markdown
Look at [AGENTS.md](../AGENTS.md) for the project rules and the skills in `.agents/skills/`.
```

### 5. Add a "Skills" section to `CLAUDE.md`

Add a short section to `CLAUDE.md` in the repo root (create the file if needed):

```markdown
## Skills

The shared skills are in `.agents/skills/`, listed in [AGENTS.md](AGENTS.md). The files in `.claude/skills/` are only pointers: read and edit the ones in `.agents/skills/`.
```

If `CLAUDE.md` only exists to say "see AGENTS.md" (or imports it with `@AGENTS.md`), still add the section; it is what tells Claude Code that `.claude/skills/` holds pointers.

### 6. Move existing `.claude/skills/` skills

If the repo already has skills in `.claude/skills/`, for each one:

1. Move the folder with `git mv .claude/skills/<name> .agents/skills/<name>`, so history follows the full text and any supporting files.
2. Create a new `.claude/skills/<name>/SKILL.md` pointer with the same frontmatter (step 3).
3. Fix relative links inside the moved skill if they pointed outside its own folder (the depth from the repo root is the same, so most links still work, but check).
4. Add the skill to the `AGENTS.md` table (step 2).

Also check other agent folders (for example `.github/skills/`, `.cursor/rules/`, `.codex/`) for skills or rules that duplicate one in `.agents/skills/`; move the steps into `.agents/skills/` and leave a pointer or a line that refers to it.

### 7. Check that every relative link resolves

Check every relative Markdown link in the files you created or changed: `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`, and every `SKILL.md` under `.agents/skills/` and `.claude/skills/`. A link resolves relative to the file it is in, not to the repo root, so the same target needs a different path from each file (`.agents/skills/x/SKILL.md` from `AGENTS.md`, `../../../.agents/skills/x/SKILL.md` from a pointer, `../AGENTS.md` from `.github/`).

A quick check from the repo root (needs Python 3):

```bash
python3 - <<'PY'
import pathlib, re, sys
files = [pathlib.Path(p) for p in ("AGENTS.md", "CLAUDE.md", ".github/copilot-instructions.md")]
files += sorted(pathlib.Path(".agents/skills").glob("*/SKILL.md"))
files += sorted(pathlib.Path(".claude/skills").glob("*/SKILL.md"))
bad = 0
for f in files:
    if not f.exists():
        continue
    text = re.sub(r"```.*?```", "", f.read_text(encoding="utf-8"), flags=re.S)
    for target in re.findall(r"\]\(([^)\s]+)\)", text):
        if re.match(r"[a-z]+:|#", target):
            continue
        if not (f.parent / target.split("#")[0]).exists():
            print(f"{f}: broken link -> {target}")
            bad += 1
print("all links resolve" if not bad else f"{bad} broken link(s)")
sys.exit(1 if bad else 0)
PY
```

Also confirm that each `.agents/skills/<name>/` has a matching `.claude/skills/<name>/` pointer and an `AGENTS.md` row, and that no pointer contains steps.

## Done when

- Every skill's full text is in `.agents/skills/<name>/SKILL.md` and nowhere else.
- `AGENTS.md` lists every skill with a working link and explains how to add one.
- Every skill has a pointer in `.claude/skills/<name>/SKILL.md` with matching frontmatter and no steps, and there are no symlinks.
- `.github/copilot-instructions.md` and `CLAUDE.md` point to `AGENTS.md` and `.agents/skills/`.
- All relative links resolve.
