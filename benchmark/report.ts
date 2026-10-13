#!/usr/bin/env bun
// Score the runs already in benchmark/runs/ against the answer keys: no model
// is called. One line per model and repository, then each model's total.
//
//   bun benchmark/report.ts [--model <name>] [--repo <owner/repo>]

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { key } from "../lib/files.ts";
import { RUNS } from "../lib/types.ts";
import { scoreModelRun, type ModelRun } from "./score.ts";

const root = join(import.meta.dir, "..");
const flag = (n: string) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : undefined; };
const only = { model: flag("model"), repo: flag("repo")?.toLowerCase() };
const walk = (d: string): string[] => (existsSync(d) ? readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p]; }) : []);
const pct = (right: number, wrong: number) => (right + wrong ? `${Math.round((right / (right + wrong)) * 100)}%` : "—");

const rows: Array<{ model: string; repo: string; files: number; unread: number; right: number; wrong: number; missed: number }> = [];
for (const f of walk(join(root, RUNS)).filter((p) => p.endsWith(".json"))) {
  const run = JSON.parse(readFileSync(f, "utf8")) as ModelRun;
  if ((only.model && run.model !== only.model) || (only.repo && run.repo !== only.repo)) continue;
  const labels = key(root, run.repo);
  // A run is only scored against the key it was made for.
  if (!labels || labels.commit !== run.commit) { console.log(`skipped ${run.model} on ${run.repo}: no answer key at ${run.commit.slice(0, 12)}`); continue; }
  const s = scoreModelRun(run, labels);
  rows.push({ model: run.model, repo: run.repo, files: s.files, unread: s.failedFiles, right: s.right, wrong: s.wrong, missed: s.missed });
}
if (!rows.length) { console.log("no runs to score"); process.exit(0); }

const line = (a: string, b: string, r: { files: number; unread: number; right: number; wrong: number; missed: number }) =>
  `${a.padEnd(30)} ${b.padEnd(30)} ${String(r.files).padStart(6)} ${String(r.unread).padStart(7)} ${String(r.right).padStart(6)} ${String(r.wrong).padStart(6)} ${String(r.missed).padStart(7)} ${pct(r.right, r.wrong).padStart(8)}`;
console.log(`${"model".padEnd(30)} ${"repository".padEnd(30)} ${"files".padStart(6)} ${"unread".padStart(7)} ${"right".padStart(6)} ${"wrong".padStart(6)} ${"missed".padStart(7)} ${"correct".padStart(8)}`);
const models = [...new Set(rows.map((r) => r.model))];
const total = (m: string) => rows.filter((r) => r.model === m).reduce((a, r) => ({ files: a.files + r.files, unread: a.unread + r.unread, right: a.right + r.right, wrong: a.wrong + r.wrong, missed: a.missed + r.missed }), { files: 0, unread: 0, right: 0, wrong: 0, missed: 0 });
const share = (m: string) => { const t = total(m); return t.right + t.wrong ? t.right / (t.right + t.wrong) : -1; };
for (const m of models.sort((a, b) => share(b) - share(a))) {
  for (const r of rows.filter((x) => x.model === m).sort((a, b) => a.repo.localeCompare(b.repo))) console.log(line(m, r.repo, r));
  if (rows.filter((x) => x.model === m).length > 1) console.log(line(m, "all", total(m)));
}
