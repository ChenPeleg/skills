#!/usr/bin/env node
// Claude Code status line (lean, one line):
//   Opus 5.5 · <branch> main · ▤ 34% · <pie> 22% · <pie> 79% ↻19h  (icons from a Nerd Font)
// Circles show 5h then 7d usage; percentages colored green/yellow/red.
// Reset time (dim) appears only once a window is >= 50% used.
const { execFileSync } = require("child_process");

const ESC = "\x1b[";
const RESET = ESC + "0m";
const DIM = ESC + "2m";
const GREEN = ESC + "32m";
const YELLOW = ESC + "33m";
const RED = ESC + "31m";

let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (c) => (raw += c));
process.stdin.on("end", () => {
  try {
    process.stdout.write(build(raw));
  } catch (e) {
    // never crash the status line
  }
});

function num(v) {
  return typeof v === "number" && isFinite(v) ? v : null;
}

// Nerd Font pies: empty circle, then 8 slices (1/8 steps)
const PIES = ["󰝦", "󰪞", "󰪟", "󰪠", "󰪡", "󰪢", "󰪣", "󰪤", "󰪥"];
function pie(p) {
  const i = Math.round(Math.min(Math.max(p, 0), 100) / 12.5);
  return PIES[i];
}

function color(p) {
  if (p >= 80) return RED;
  if (p >= 50) return YELLOW;
  return GREEN;
}

// Short reset text: 45m, 2h50 (under 10h), 19h, 3d
function resetText(epochSec) {
  const t = num(epochSec);
  if (t === null) return "";
  const ms = t * 1000 - Date.now();
  if (ms <= 0) return "";
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  if (h < 10) return `${h}h${String(mins % 60).padStart(2, "0")}`;
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function limit(w) {
  if (!w) return null;
  const p = num(w.used_percentage);
  if (p === null) return null;
  const pct = Math.round(p);
  let s = `${pie(pct)} ${color(pct)}${pct}%${RESET}`;
  if (pct >= 50) {
    const r = resetText(w.resets_at);
    if (r) s += ` ${DIM}↻${r}${RESET}`;
  }
  return s;
}

function branch(dir) {
  try {
    const b = execFileSync(
      "git",
      ["--no-optional-locks", "rev-parse", "--abbrev-ref", "HEAD"],
      { cwd: dir || undefined, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 2000 }
    ).trim();
    return b.length > 16 ? b.slice(0, 16) + "…" : b;
  } catch (e) {
    return "";
  }
}

function build(text) {
  let d = {};
  try {
    d = JSON.parse(text) || {};
  } catch (e) {
    return "";
  }
  const parts = [];

  const model = d.model && d.model.display_name;
  if (model) parts.push(model);

  const dir = (d.workspace && d.workspace.current_dir) || d.cwd;
  const b = dir ? branch(dir) : "";
  if (b) parts.push(` ${b}`); // Nerd Font oct-git_branch

  const ctx = d.context_window && num(d.context_window.used_percentage);
  if (ctx !== null && ctx !== undefined) parts.push(`▤ ${Math.round(ctx)}%`);

  const rl = d.rate_limits || {};
  const five = limit(rl.five_hour);
  const week = limit(rl.seven_day);
  if (five) parts.push(five);
  if (week) parts.push(week);

  return parts.join(` ${DIM}·${RESET} `).replace(/[\r\n]+/g, " ");
}
