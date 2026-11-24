# Skills

A small, hand-picked collection of agent skills I use and find worth sharing.

Each skill lives in its own folder under [`skills/`](skills) as a `SKILL.md` file, following the [Agent Skills](https://agentskills.io) format.

## Skills

| Skill | What it does |
| --- | --- |
| [concatenated-component-tree](skills/concatenated-component-tree/SKILL.md) | Structures a complex feature's components as a flat folder where each file name is its parent's name plus one segment, so the file list reads as the component tree. |
| [claude-code-lean-statusline](skills/claude-code-lean-statusline/SKILL.md) | A lean, one-line Claude Code status line with pie icons for usage, plus a bundled Nerd Font and Windows setup steps. |
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

### Optional: install all skills as a Claude Code plugin

This repo is also a Claude Code plugin marketplace (`chenpeleg-skills`) with one plugin (`chen-skills`) that holds every skill. Installing it gives you all the skills on any machine, and updates come with one command.

In Claude Code (2.1.275 or later):

```
/plugin install chen-skills --marketplace ChenPeleg/skills
```

On older versions, use two steps:

```
/plugin marketplace add ChenPeleg/skills
/plugin install chen-skills@chenpeleg-skills
```

Inside the plugin, skills are prefixed with the plugin name, for example `chen-skills:where-to-put-skills`. If you also copied a skill into `~/.claude/skills/`, remove that copy so you don't load it twice.

**Getting updates.** New versions are picked up when the version in [`.claude-plugin/plugin.json`](.claude-plugin/plugin.json) changes. To update:

```
/plugin marketplace update chenpeleg-skills
/reload-plugins
```

Or turn on auto-update for this marketplace in `/plugin` → Marketplaces, and Claude Code will check for a new version when it starts.

### Publishing changes (for maintainers and forks)

The repo has a project skill, [`publish-plugin`](.claude/skills/publish-plugin/SKILL.md), that releases a change to the plugin. It lives in `.claude/skills/`, outside `skills/`, so it isn't shipped in the plugin. After editing a skill, open Claude Code in this repo and run `/publish-plugin` (or say "publish the plugin"). It:

1. Checks what changed under `skills/` and `.claude-plugin/`.
2. Updates the skills table in this README if a skill was added, removed or renamed.
3. Bumps `version` in `.claude-plugin/plugin.json`: patch for fixes, minor for a new skill, major for a removed or renamed skill. Installed copies are cached by version, so without a bump nobody gets the change.
4. Runs `claude plugin validate .`.
5. Commits only the intended files and pushes. It never force-pushes.
6. Runs `claude plugin marketplace update chenpeleg-skills` and `claude plugin update chen-skills@chenpeleg-skills` to update the copy on this machine.
7. Reminds you to run `/reload-plugins` in any open session.

If you fork the repo, change the marketplace and plugin names in [`.claude-plugin/`](.claude-plugin) and in the commands above to your own.

## License

[MIT](LICENSE)
