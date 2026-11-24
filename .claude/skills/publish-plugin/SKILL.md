---
name: publish-plugin
description: Publish changes to the chen-skills plugin in this repo, so the installed copy picks them up. Bumps the version in .claude-plugin/plugin.json, validates, commits, pushes, then updates the marketplace and the installed plugin. Use after adding, editing, renaming or removing a skill under skills/, or when the user says publish, release, ship the plugin, or "update the plugin".
---

# Publish the chen-skills plugin

This repo is both a marketplace (`chenpeleg-skills`) and one plugin (`chen-skills`) whose skills live in `skills/<name>/SKILL.md`. Installed copies are cached by **version**, so a change that does not bump `version` in `.claude-plugin/plugin.json` never reaches anyone who already installed it.

This skill lives in `.claude/skills/`, outside `skills/`, so it is not shipped in the plugin.

## Steps

1. **See what changed** since the last version bump:
   ```bash
   git status --short
   git log --oneline -10 -- skills .claude-plugin
   ```
   If nothing under `skills/` or `.claude-plugin/` changed since the last bump, say so and stop.

2. **Keep the README in step.** If a skill was added, removed or renamed, or its purpose changed, update the table in `README.md`. Each skill's `name:` in its frontmatter must match its folder name.

3. **Bump the version** in `.claude-plugin/plugin.json` (semver):
   - patch (`1.0.0` → `1.0.1`): wording or fixes inside existing skills
   - minor (`1.0.1` → `1.1.0`): a skill added
   - major (`1.1.0` → `2.0.0`): a skill removed or renamed (people's references break)

4. **Validate**, and fix any error before going on:
   ```bash
   claude plugin validate .
   ```

5. **Commit and push.** Stage only the files you meant to change, never `git add -A`. Message: `Release chen-skills <version>: <one-line summary>`.
   ```bash
   git push
   ```
   If the push is rejected, stop and report; do not force-push.

6. **Update the installed copy on this machine:**
   ```bash
   claude plugin marketplace update chenpeleg-skills
   claude plugin update chen-skills@chenpeleg-skills
   ```
   Check `claude plugin list` shows the new version.

7. **Tell the user** the new version and to run `/reload-plugins` (or restart) in any open session. Other machines get it with `/plugin marketplace update chenpeleg-skills`, or automatically if auto-update is turned on for this marketplace in `/plugin` → Marketplaces.
