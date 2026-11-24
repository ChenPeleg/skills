# Plan: lean, one-line Claude Code status line

Status: **plan only — not implemented**
Target file: `~/.claude/statusline.js` (wired via `statusLine.command` in `~/.claude/settings.json`)

## Current state

```
Opus 5.5 | main | $0.00 | 5h 22% (resets 2h50m) | 7d 79% (resets 19h10m)
  ⏵⏵ auto mode on (shift+tab to cycle) · sh
```

~75 characters for our part. Waste comes from:
- ` | ` separators (3 chars × 4)
- the word `resets` and parentheses, twice
- `$0.00` shown even when it carries no information
- the 5h and 7d blocks each spelling out label, percentage and reset time

## Constraints to know up front

1. **The second line is not ours.** `⏵⏵ auto mode on (shift+tab to cycle) · …` is Claude Code's built-in
   permission-mode indicator, drawn below the status line. `statusline.js` cannot remove it. "One line" here means:
   our script outputs exactly one line (no `\n`), and we keep it short enough not to wrap next to the mode hint.
   (Check `/config` for a setting that hides the mode hint; if there is none, accept it.)
2. **Font size cannot be changed from the script.** The status line is plain text in the terminal, and the terminal
   decides font size. Ways to get the *look* of smaller text:
   - **ANSI dim** (`\x1b[2m … \x1b[0m`) for secondary info (reset times): reads as "small print", costs 0 columns.
   - **Unicode superscript/subscript digits** (`²²%`, `₂ₕ₅₀`): really smaller glyphs, but uneven across fonts
     (Windows Terminal + Cascadia handles them; some fonts fall back and look messy). Use for reset times at most.
   - Changing the terminal's own font size (Windows Terminal profile) affects everything, so it is out of scope.
3. **Icons need font support.** Plain Unicode (`▁▂▃▄▅▆▇█`, `◔◑◕●`, `⏳`, `⎇`) works in Windows Terminal by default.
   Nerd Font glyphs (``, `󰔟`) only work if a Nerd Font is installed. Prefer plain Unicode, with Nerd Fonts as an option.
4. **Width:** keep the output under ~45 columns so it never wraps, even in split panes.

## Building blocks

| Item       | Today                    | Lean options                                         |
|------------|--------------------------|------------------------------------------------------|
| Model      | `Opus 5.5`               | `Opus 5.5` · `O5.5` · `opus`                         |
| Branch     | `main`                   | `⎇ main` · `main` · cut long names to 16 chars + `…` |
| Cost       | `$0.00`                  | hide when 0 · `$1.2`                                 |
| 5h usage   | `5h 22% (resets 2h50m)`  | `▂ 22%` · `◔22` · `5h▂` · `22%·2h50`                 |
| 7d usage   | `7d 79% (resets 19h10m)` | `▆ 79%` · `◕79` · `7d▆` · `79%·19h`                  |
| Separator  | ` \| `                   | one space · two spaces · ` · `                       |
| Color      | none                     | green < 50% · yellow 50–80% · red ≥ 80%, dim for resets |

Usage glyph mapping (eighths block, one column):

```
0–12% ▁  13–25% ▂  26–37% ▃  38–50% ▄  51–62% ▅  63–75% ▆  76–87% ▇  88–100% █
```
Pie alternative (4 steps): `○ <13%`, `◔ <38%`, `◑ <63%`, `◕ <88%`, `● ≥88%`.

## Alternatives

### A — Compact text (smallest change, safest)
Same information, less noise. No icons.
```
Opus 5.5 main 5h22%·2h50 7d79%·19h
```
- ~35 columns (from ~75).
- Reset time is coarse for long spans (`19h`, `3d`), exact under 10h (`2h50`).
- Cost hidden while `$0.00`.
- Works in every terminal and font.

### B — Bars + color (recommended)
The bar shows how full a window is at a glance; color gives the warning; reset times in dim text.
```
Opus 5.5 ⎇main ▂22% ▆79%  ⏳2h50/19h
```
With color: `▂22%` green, `▆79%` yellow (red at ≥ 80%), `⏳2h50/19h` dim.
- ~37 columns.
- The order (5h first, then 7d) stays fixed, so the `5h`/`7d` labels can go.
- Optional: show reset times only when a window is ≥ 50%, which is the only time they matter → `Opus 5.5 ⎇main ▂22% ▆79%·19h`.

### C — Ultra-minimal (icons only, numbers on demand)
Show numbers only when they matter.
```
O5.5 main ▂▆
```
- ~12 columns normally.
- When a window reaches ≥ 70%, add its number and reset time: `O5.5 main ▂ ▇82%·19h` (red).
- Easiest to ignore, but you have to know what the two bars mean.

### D — Pie glyphs + superscript resets (tries "smaller font")
```
Opus 5.5 main ◔²²%₂ₕ₅₀ ◕⁷⁹%₁₉ₕ
```
- Pie shows the fill, superscript digits look like smaller text, subscript is the reset.
- ~30 columns, but **font-dependent**: test in Windows Terminal before choosing it. Most "cute", least robust.

### E — Nerd Font variant (only if a Nerd Font is installed)
```
󰚩 O5.5  main 󰪟 22% 󰪤 79%  19h
```
- Nerd Fonts include pie-progress icons in 8 steps (`󰪞`…`󰪥`), which look better than `◔◑◕`.
- Needs a Nerd Font in the Windows Terminal profile; without one you get boxes (tofu).

## Comparison

| Option | Width | Readability | Glanceability | Font risk |
|--------|------:|-------------|---------------|-----------|
| A      | ~35   | high        | medium        | none      |
| B      | ~37   | high        | high          | low       |
| C      | ~12   | low–medium  | high          | low       |
| D      | ~30   | medium      | medium        | medium    |
| E      | ~32   | high        | high          | high      |

**Recommendation:** B, with the "show reset times only at ≥ 50%" rule. Fall back to A if colors or `⏳` look bad.

## Implementation steps (when approved)

1. Add `bar(p)` (eighths glyph) and `color(p, s)` (ANSI green/yellow/red) helpers to `statusline.js`.
2. Rework `resetText` to make a short form: `2h50` under 10h, `19h` under 24h, `3d` after that.
3. Replace `limit()` with the chosen format. Join parts with a single space; drop ` | `.
4. Hide cost when it is `null` or `< 0.005`; shorten long branch names to 16 chars + `…`.
5. Make sure the output contains no `\n` and resets color at the end (`\x1b[0m`).
6. Add a `STATUSLINE_STYLE` env var (`compact|bars|minimal|pie|nerd`) so options A–E can be switched without editing code (optional).
7. Test by piping sample JSON:
   ```sh
   echo '{"model":{"display_name":"Opus 5.5"},"cwd":".","rate_limits":{"five_hour":{"used_percentage":22,"resets_at":<epoch>},"seven_day":{"used_percentage":79,"resets_at":<epoch>}}}' | node ~/.claude/statusline.js
   ```
   Check 0%, 50%, 85%, 100%, missing `rate_limits`, and a long branch name.
8. Check it in a live Claude Code session in Windows Terminal (glyph width, colors, no wrapping).

## Open questions

- Keep cost at all? (Under a subscription plan it is always `$0.00`.)
- Is the model name needed, or is it already shown elsewhere in the UI?
- Is a Nerd Font installed / wanted (option E)?
