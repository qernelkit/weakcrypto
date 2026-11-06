#!/usr/bin/env bun
// Model correctness: how well a model finds the cryptography in code, with
// nothing between it and the files. Each model reads every file of the
// benchmark, one call per file, with the benchmark's prompt (benchmark/prompt.ts), and
// names the lines that are cryptography. Its lines are scored against the answer
// keys (benchmark/keys/) and written to benchmark/runs/. One benchmark is Cryben
// (arXiv:2608.04857): its corpus is in benchmark/cryben/, its key from benchmark/cryben.ts.
// The others are open-source repositories on GitHub, read at the commit their key names.
//
//   bun benchmark/run.ts --models claude-sonnet-5-5,gpt-5 [--repos owner/repo,...] [--concurrency 8] [--force] [--dry]
//
// The models run side by side, each with its own --concurrency calls in flight.
// A model's run on a repository that is already in benchmark/runs/ on this prompt is
// kept, not repeated (--force repeats it), so a stopped run picks up where it left off.
//
// Claude models (claude-*) use ANTHROPIC_API_KEY. Any other model goes to an
// OpenAI-compatible endpoint: OPENAI_BASE_URL (default https://api.openai.com/v1)
// with OPENAI_API_KEY, which also covers OpenRouter, Ollama and LiteLLM.
// Repositories default to every one with an answer key in benchmark/keys/.

import Anthropic from "@anthropic-ai/sdk";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { key, keyed } from "../lib/files.ts";
import { scoreModelRun, type ModelRun, type ModelSite } from "./score.ts";
import { runPath } from "../lib/types.ts";
import { promptFor, userPrompt, type Prompt } from "./prompt.ts";
import { corpusFiles, corpusPin, fetchAt, fromDir, type Source } from "../lib/source.ts";

/** Larger files are left out for every model alike (and out of the score). */
const MAX_BYTES = 256_000;
const MAX_OUTPUT = 16_000;
// USD per million tokens (input, output), where we know them; others are reported unpriced.
const PRICE: Record<string, [number, number]> = {
  "claude-fable-5-1": [10, 50], "claude-opus-5-5": [4, 20], "claude-sonnet-5-5": [2, 10], "claude-haiku-5-5": [0.1, 0.5],
};

const flag = (n: string) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : undefined; };
const models = (flag("models") ?? "").split(",").map((m) => m.trim()).filter(Boolean);
if (!models.length) { console.error("usage: bun benchmark/run.ts --models <model,...> [--repos owner/repo,...] [--concurrency 8] [--dry]"); process.exit(1); }
const concurrency = Number(flag("concurrency") ?? 8);
const dry = process.argv.includes("--dry");
const force = process.argv.includes("--force");
const root = resolve(flag("root") ?? join(import.meta.dir, ".."));
// The benchmark runs on the repositories it has an answer key for, at the commit the key was made at.
const repos = (flag("repos")?.split(",") ?? keyed(root)).filter((r) => key(root, r));

const anthropic = models.some((m) => m.startsWith("claude-")) ? new Anthropic() : null;
const OPENAI_URL = (process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, "");
const OPENAI_KEY = process.env.OPENAI_API_KEY ?? "";

async function ask(model: string, system: string, user: string): Promise<{ text: string; input: number; output: number }> {
  if (model.startsWith("claude-")) {
    const res = await anthropic!.messages.create({ model, max_tokens: MAX_OUTPUT, system, messages: [{ role: "user", content: user }] });
    const text = res.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("");
    return { text, input: res.usage.input_tokens, output: res.usage.output_tokens };
  }
  const r = await fetch(`${OPENAI_URL}/chat/completions`, {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({ model, messages: [{ role: "system", content: system }, { role: "user", content: user }], max_tokens: MAX_OUTPUT }),
  });
  if (!r.ok) throw Object.assign(new Error(`${r.status} ${(await r.text()).slice(0, 200)}`), { status: r.status });
  const j = await r.json() as { choices: Array<{ message: { content: string } }>; usage?: { prompt_tokens?: number; completion_tokens?: number } };
  return { text: j.choices[0]?.message.content ?? "", input: j.usage?.prompt_tokens ?? 0, output: j.usage?.completion_tokens ?? 0 };
}

/** The sites in a reply: its JSON, or, if that is broken (a long list cut off), every "line": N it names. Null if neither. */
function parse(text: string): ModelSite[] | null {
  const m = text.match(/\{[\s\S]*\}/);
  try {
    const j = JSON.parse(m?.[0] ?? "") as { sites?: Array<{ line?: unknown; primitive?: unknown; algorithm?: unknown }> };
    return (j.sites ?? []).filter((s) => Number.isInteger(s.line)).map((s) => ({ line: s.line as number, primitive: typeof s.primitive === "string" ? s.primitive : null, algorithm: typeof s.algorithm === "string" ? s.algorithm : null }));
  } catch {
    const lines = [...text.matchAll(/"line"\s*:\s*(\d+)/g)].map((x) => ({ line: Number(x[1]) }));
    return lines.length || /"sites"\s*:\s*\[\s*\]/.test(text) ? lines : null;
  }
}

async function withRetry<T>(f: () => Promise<T>): Promise<T> {
  for (let i = 0; ; i++) {
    try { return await f(); } catch (e) {
      const status = (e as { status?: number }).status ?? 0;
      if (i >= 4 || !(status === 429 || status >= 500 || status === 0)) throw e;
      await Bun.sleep(1000 * 2 ** i + Math.random() * 500);
    }
  }
}

async function pool<T, R>(items: T[], n: number, f: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => { while (next < items.length) { const i = next++; out[i] = await f(items[i]!); } }));
  return out;
}

for (const repo of repos) {
  const labels = key(root, repo)!;
  const prompt: Prompt = promptFor(repo);
  const t = { commit: labels.commit };
  // The files: a corpus kept in this repository, or a GitHub repository at the key's commit.
  let dir: string, tracked: string[], src: Source;
  if (labels.corpus) {
    dir = join(root, labels.corpus);
    if (corpusPin(dir) !== labels.commit) { console.error(`${repo}: ${labels.corpus} is not the corpus the key was made from`); process.exit(1); }
    tracked = corpusFiles(dir); src = fromDir(dir, labels.commit);
  } else {
    src = fetchAt(repo, labels.commit, join(root, ".cache"));
    dir = join(root, ".cache", repo.replace("/", "__"), labels.commit);
    tracked = Bun.spawnSync(["git", "ls-files", "-z"], { cwd: dir }).stdout.toString().split("\0").filter(Boolean);
  }
  const files: Array<{ file: string; lines: string[] }> = [], skipped: string[] = [];
  for (const file of tracked) {
    const f = Bun.file(join(dir, file));
    if (!(await f.exists()) || f.size === 0) continue;
    const buf = new Uint8Array(await f.arrayBuffer());
    if (buf.subarray(0, 8000).includes(0)) continue; // binary
    if (f.size > MAX_BYTES) { skipped.push(file); continue; }
    files.push({ file, lines: src.lines(file) ?? [] });
  }
  console.log(`${repo}@${t.commit!.slice(0, 12)}: ${files.length} files, one call each${skipped.length ? ` (${skipped.length} over ${MAX_BYTES / 1000} KB left out)` : ""}`);
  if (dry) continue;

  await Promise.all(models.map(async (model) => {
    const out = join(root, runPath(model, repo));
    if (!force && existsSync(out)) {
      try { if ((JSON.parse(readFileSync(out, "utf8")) as ModelRun).promptHash === prompt.hash) { console.log(`  ${model}: ${repo} already run on this prompt; kept`); return; } } catch { /* unreadable: run it again */ }
    }
    const t0 = Date.now();
    let input = 0, output = 0;
    const results = await pool(files, concurrency, async (f) => {
      const numbered = f.lines.map((x, i) => `${String(i + 1).padStart(5)}  ${x}`).join("\n");
      let r: { text: string; input: number; output: number };
      // An API failure after retries is the provider's: that file is left out of the score.
      try { r = await withRetry(() => ask(model, prompt.system, userPrompt(prompt, repo, f.file, f.lines.length, numbered))); }
      catch (e) { return { file: f.file, lines: f.lines.length, sites: [] as ModelSite[], error: (e as Error).message.slice(0, 200) }; }
      input += r.input; output += r.output;
      // A reply that can't be read is the model's: it found nothing there.
      const sites = parse(r.text);
      return { file: f.file, lines: f.lines.length, sites: (sites ?? []).filter((s) => s.line >= 1 && s.line <= f.lines.length), ...(sites ? {} : { unreadable: 1 }) };
    });
    const price = PRICE[model];
    const run: ModelRun = {
      schema: "weakcrypto.model-run/v1", model, repo, commit: t.commit!, createdAt: new Date().toISOString(), prompt: prompt.version, promptHash: prompt.hash,
      files: results, usage: { calls: files.length, input, output, costUsd: price ? Math.round(((input * price[0] + output * price[1]) / 1e6) * 10000) / 10000 : null },
      ms: Date.now() - t0,
    };
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, JSON.stringify(run, null, 1) + "\n");
    const sc = scoreModelRun(run, key(root, repo)!);
    const unreadable = run.files.filter((f) => f.unreadable).length;
    console.log(`  ${model} · ${repo}: ${sc.right} right · ${sc.wrong} wrong · ${sc.missed} missed · ${sc.correct == null ? "—" : Math.round(sc.correct * 100) + "%"} correct · ${sc.failedFiles} files failed · ${unreadable} unreadable · ${run.usage.costUsd == null ? "unpriced" : "$" + run.usage.costUsd} · ${Math.round(run.ms / 1000)}s`);
  }));
}
