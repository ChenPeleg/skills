# Skills

A small, hand-picked collection of agent skills I use and find worth sharing.

Each skill lives in its own folder under [`skills/`](skills) as a `SKILL.md` file, following the [Agent Skills](https://agentskills.io) format.

## Skills

| Skill | What it does |
| --- | --- |
| [concatenated-component-tree](skills/concatenated-component-tree/SKILL.md) | Structures a complex feature's components as a flat folder where each file name is its parent's name plus one segment, so the file list reads as the component tree. |
| [where-to-put-skills](skills/where-to-put-skills/SKILL.md) | Sets up one shared place for a repo's agent skills (`.agents/skills/`), listed in `AGENTS.md`, with pointer files for Claude Code and a line for Copilot, so every agent reads the same files. |

## Install

With the [GitHub CLI](https://cli.github.com) (v2.90.0 or later):

```bash
gh skill install ChenPeleg/skills concatenated-component-tree
```

Or copy a skill's folder into your project's `.claude/skills/` directory (or `~/.claude/skills/` to use it everywhere):

```bash
cp -r skills/concatenated-component-tree ~/.claude/skills/
```

## License

[MIT](LICENSE)
