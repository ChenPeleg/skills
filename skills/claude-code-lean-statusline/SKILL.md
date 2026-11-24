---
name: claude-code-lean-statusline
description: Set up a lean, one-line Claude Code status line on Windows (model · git branch · context · 5h/7d usage as pie icons, reset time only when it matters), including installing a Nerd Font for icons. Use when the user wants to create, shorten, restyle or add icons to the Claude Code status line (bottom line), install Nerd Fonts, or asks what the status line can and cannot show.
license: MIT
---

# Lean Claude Code status line

A one-line status line that shows only what matters, using icons in place of labels:

```
Opus 5.5 ·  main · ▤ 12% · 󰪡 55% 󰔟 1h37 · 󰪤 84% 󰃭 Wed 25/11
```

The branch and pie icons come from a Nerd Font; see `nerd-font-icons.png` for how they look.

Compared with a typical default (~75 columns):

```
Opus 5.5 | main | $0.00 | 5h 22% (resets 2h50m) | 7d 79% (resets 19h10m)
```

## What's in this skill

| Path | What it is |
| --- | --- |
| `scripts/statusline.js` | The status line script (Node, no dependencies). |
| `nerd-font-icons.png` | Picture of useful Nerd Font icons (pies, time, computer) with their codes, drawn with the bundled font. |
| `fonts/` | CaskaydiaCove Nerd Font **Mono**: Regular, Bold, Italic, BoldItalic (Nerd Fonts v3.5.1), plus its `LICENSE` (SIL OFL) and `README.md`. |

## Install

1. **Copy the script** to `~/.claude/statusline.js` (on Windows: `C:\Users\<you>\.claude\statusline.js`). Back up the old one first if there is one.
2. **Point Claude Code at it** in `~/.claude/settings.json`:
   ```json
   "statusLine": {
     "type": "command",
     "command": "node \"C:/Users/<you>/.claude/statusline.js\"",
     "refreshInterval": 60
   }
   ```
3. **Install the Nerd Font** (needed only for the branch icon; see [Fonts](#fonts)).
4. **Test** without opening Claude Code by piping sample JSON into it:
   ```sh
   now=$(date +%s)
   echo "{\"model\":{\"display_name\":\"Opus 5.5\"},\"cwd\":\".\",\"context_window\":{\"used_percentage\":34},\"rate_limits\":{\"five_hour\":{\"used_percentage\":22,\"resets_at\":$((now+10200))},\"seven_day\":{\"used_percentage\":79,\"resets_at\":$((now+69000))}}}" \
     | node ~/.claude/statusline.js
   ```
   Also try `{}` and invalid input: the script must print nothing and not crash.
5. The new line shows up in Claude Code within `refreshInterval` seconds or on the next message.

## How the line is built

Sections are joined by a dim ` · `. Each section appears only when Claude Code sends its data.

| Section | Example | Source in stdin JSON | Notes |
| --- | --- | --- | --- |
| Model | `Opus 5.5` | `model.display_name` | |
| Branch | ` main` | `git rev-parse` in `workspace.current_dir` / `cwd` | Nerd Font `oct-git_branch` (U+F418). Names over 16 chars are cut with `…`. |
| Context | `▤ 34%` | `context_window.used_percentage` | Not always sent; hidden when missing. |
| 5h usage | `󰪡 55% 󰔟 1h37` | `rate_limits.five_hour` | First circle is always 5h. |
| 7d usage | `󰪤 84% 󰃭 Wed 25/11` | `rate_limits.seven_day` | Second circle is always 7d. |

Rules:

- **Pie icon** for usage: Nerd Font `circle_outline` (U+F0766) at 0%, then `circle_slice_1`…`circle_slice_8` (U+F0A9E–U+F0AA5), one slice per 12.5% (rounded). Icons use the normal text color, followed by a space. Without a Nerd Font, use the plain Unicode set `○◔◑◕●` instead.
- **Percentage color**: green < 50%, yellow ≥ 50%, red ≥ 80%.
- **5h reset**: time left, dim, after the Nerd Font timer `󰔟` (md-timer_sand, U+F051F) and a space, only once the window is ≥ 50% used: `45m`, `2h50` (under 10h), `19h`, `3d`.
- **7d reset**: the reset date, always shown, dim, after the Nerd Font calendar `󰃭` (md-calendar, U+F00ED) and a space: `Wed 25/11` (weekday, day/month).
- **No cost**: it was removed on purpose (always `$0.00` on subscription plans).
- **Exactly one line**: newlines are stripped; every color is closed with `\x1b[0m`.
- **Never crash**: bad input prints nothing.

## What the status line can and can't do

- **The second line is not yours.** The row below, e.g. `⏵⏵ auto mode on (shift+tab to cycle)`, is Claude Code's built-in permission-mode indicator. The docs say the status line "renders in its own row above the built-in footer badges and doesn't replace them". There's no documented setting to hide it or write into it. (`hideVimModeIndicator` only hides vim's `-- INSERT --`.) A custom status line does remove `? for shortcuts` and the voice hint.
- **More rows are possible**: each line the script prints becomes its own row above the mode line. This skill keeps it to one.
- **Font size can't be changed** from the script; the terminal sets it. To make secondary info look smaller, use ANSI dim (`\x1b[2m`). Superscript/subscript digits (`²²`, `₁₉ₕ`) also work but look different from font to font.
- **No SVG or images.** The status line is text and ANSI color only. Drawing is done with Unicode:
  - bars `▁▂▃▄▅▆▇█`, pies `○◔◑◕●`, shades `░▒▓█`, braille `⣀⣤⣶⣿` (tiny sparklines), box lines `─│╭╮`
  - truecolor (`\x1b[38;2;R;G;Bm`) progress bars like `▕████░░░░▏`
  - emoji (`⏳ 🟢`) are two columns wide and render differently across fonts; avoid them for alignment.
  - Terminal image protocols (Sixel etc.) aren't usable: Claude Code draws its own screen, and the line is one row tall.

## Fonts

### Why a Nerd Font

Nerd Fonts is not a single font but a set of icons (git, folders, pie-progress, logos) merged into many coding fonts (Cascadia, JetBrains Mono, Fira Code…). The icons sit in Unicode's **Private Use Area**, so:

- a normal font has nothing there → empty boxes, and the terminal can't borrow them from another font;
- icon fonts like Font Awesome have the shapes but aren't fixed-width, so they get cut off or overlap in a terminal.

Standard Unicode symbols (`▤ ⎇ ○◔◑◕●`) don't need a Nerd Font: Windows falls back to Segoe UI Symbol. The branch, pie, timer and calendar icons in this line do need it. Without the font, switch them back to `⎇`, `○◔◑◕●` and `↻` in the script.

### Which files

A Nerd Font zip has three families × many weights:

- `…NerdFont-…`: icons a bit wider than one cell
- **`…NerdFontMono-…`: icons exactly one cell — use this in terminals**
- `…NerdFontPropo-…`: proportional, for normal apps

Only **Mono Regular, Bold, Italic, BoldItalic** are needed (that's what's in `fonts/`). Light/Thin/SemiBold aren't used by terminals.

### Install on Windows

1. Select the four `.ttf` files in `fonts/` → right-click → **Install** (or **Install for all users**).
   Other sources: [nerdfonts.com/font-downloads](https://www.nerdfonts.com/font-downloads); Microsoft's own `CascadiaCodeNF`/`CascadiaMonoNF` in [cascadia-code releases](https://github.com/microsoft/cascadia-code/releases); `scoop bucket add nerd-fonts` + `scoop install CascadiaCode-NF`; `oh-my-posh font install`.
2. Set the font where Claude Code runs, then restart the terminal:
   - **Windows Terminal**: Settings → profile → Appearance → Font face → *CaskaydiaCove Nerd Font Mono*. Alternatively keep your font and add a fallback: `"Cascadia Mono, Symbols Nerd Font Mono"` (needs the icons-only "Symbols Nerd Font Mono").
   - **VS Code** (Claude Code in the VS Code terminal): in user `settings.json` set `"terminal.integrated.fontFamily": "'CaskaydiaCove Nerd Font Mono', monospace"`. This is separate from Windows Terminal: check which app the terminal is actually in. Fully restart VS Code afterwards; opening a new terminal panel isn't enough.
   - **JetBrains IDEs (WebStorm etc.)**: Settings → Editor → Color Scheme → Console Font → enable "Use console font instead of the default" → pick the font.
   - Or edit Windows Terminal's `settings.json` (`%LOCALAPPDATA%\Packages\Microsoft.WindowsTerminal_8wekyb3d8bbwe\LocalState\settings.json`) to set it for every profile: `"profiles": { "defaults": { "font": { "face": "CaskaydiaCove Nerd Font Mono" } } }`. Windows Terminal applies it right away.
3. Check: `Write-Output "`u{e0a0}"` in PowerShell should print a branch icon, not a box.
4. Remove unused weights under Settings → Personalization → Fonts.

## Alternative styles

All of these use the same data; only the formatting changes in `limit()` and `build()`.

| Style | Example | Width | Font risk |
| --- | --- | ---: | --- |
| Compact text | `Opus 5.5 main 5h22%·2h50 7d79%·19h` | ~35 | none |
| Bars + color | `Opus 5.5 ⎇main ▂22% ▆79%·19h` | ~30 | low |
| Ultra-minimal | `O5.5 main ▂▆` (numbers only at ≥ 70%) | ~12 | low |
| Unicode pies | `Opus 5.5 · ⎇ main · ▤ 12% · ◑ 55% ↻ 1h37 · ◕ 84% ↻ 17h` | ~45 | low |
| **Nerd Font pies (this skill)** | `Opus 5.5 ·  main · ▤ 12% · 󰪡 55% 󰔟 1h37 · 󰪤 84% 󰃭 Wed 25/11` | ~55 | needs the Nerd Font |
| Pies + superscript | `Opus 5.5 main ◔²²%₂ₕ₅₀ ◕⁷⁹%₁₉ₕ` | ~30 | medium |
| Full Nerd Font | `󰚩 O5.5  main 󰪟 22% 󰪤 79%` (8-step pies `󰪞`…`󰪥`) | ~30 | high without the font |

Bar mapping (eighths): `▁` 0–12%, `▂` –25, `▃` –37, `▄` –50, `▅` –62, `▆` –75, `▇` –87, `█` above that.

## Troubleshooting

- **Boxes or `?` instead of the branch/pie icons**: the terminal isn't using the Nerd Font. Don't test with U+E0A0 (powerline branch): plain Cascadia has it too, so it shows even without the Nerd Font. Test with U+F418 or a pie (U+F0A9F). Also check that the Mono Regular style is installed.
- **Line wraps**: shorten the branch limit or drop the context section; keep the line under ~45 columns.
- **Nothing shows**: run the test command from step 4; check the path in `settings.json` (use forward slashes on Windows).
- **Context section never appears**: Claude Code isn't sending `context_window`; that's expected for some versions.
