// The model track: a model reads each file of a benchmark repository, one call
// per whole file, and names every line that is cryptography.
// No tool in between, so this measures the model. Scored file by file against
// the repository's reviewed answer key.
//
// benchmark/runs/<model>/<owner>/<repo>.json

import type { Labels } from "../lib/types.ts";

export interface ModelSite { line: number; primitive?: string | null; algorithm?: string | null }
export interface ModelRun {
  schema: "weakcrypto.model-run/v1";
  model: string; repo: string; commit: string; createdAt: string;
  /** The prompt's version and a hash of its exact words: runs are only compared on the same one. */
  prompt: string; promptHash?: string;
  /** error: the API failed after retries (the platform's; left out of the score).
   *  unreadable: a reply the model sent that could not be read (its own; scored as finding nothing). */
  files: Array<{ file: string; lines: number; sites: ModelSite[]; error?: string; unreadable?: number }>;
  usage: { calls: number; input: number; output: number; costUsd: number | null };
  ms: number;
}

/** A reported line is right within this many lines of a real site (a statement over several lines). */
export const TOLERANCE = 2;

export interface Tally { right: number; wrong: number; missed: number }
/** The same score cut three ways: by the file's language, by the kind of cryptography, by file. */
export interface Breakdown { language: Record<string, Tally>; type: Record<string, Tally>; file: Record<string, Tally> }
/** failedFiles: files the provider failed or timed out on (left out of the score). unreadable: files whose reply could not be read (scored as nothing found). */
export interface ModelScore { files: number; failedFiles: number; unreadable: number; found: number; right: number; wrong: number; missed: number; correct: number | null; breakdown: Breakdown }

const LANGUAGES: Record<string, string> = {
  rs: "Rust", go: "Go", py: "Python", js: "JavaScript", mjs: "JavaScript", cjs: "JavaScript", jsx: "JavaScript", ts: "TypeScript", tsx: "TypeScript",
  java: "Java", kt: "Kotlin", kts: "Kotlin", scala: "Scala", c: "C", h: "C/C++ header", cc: "C++", cpp: "C++", cxx: "C++", hpp: "C/C++ header",
  cs: "C#", rb: "Ruby", php: "PHP", swift: "Swift", m: "Objective-C", sh: "Shell", bash: "Shell", ps1: "PowerShell", sol: "Solidity",
  json: "JSON", yml: "YAML", yaml: "YAML", toml: "TOML", xml: "XML", gradle: "Gradle", lock: "Lockfile", md: "Markdown", txt: "Text",
  pem: "Key or certificate file", der: "Key or certificate file", crt: "Key or certificate file", cer: "Key or certificate file", key: "Key or certificate file", p8: "Key or certificate file", p12: "Key or certificate file", pub: "Key or certificate file",
};
/** The language of a file, by its name: what a reader would call it. */
export function languageOf(file: string): string {
  const name = file.split("/").pop()!.toLowerCase();
  if (/^(cargo\.lock|package-lock\.json|yarn\.lock|go\.sum|pnpm-lock\.yaml|gemfile\.lock|poetry\.lock)$/.test(name)) return "Lockfile";
  if (name === "dockerfile" || name === "makefile" || name === "cmakelists.txt") return "Build file";
  const ext = name.includes(".") ? name.split(".").pop()! : "";
  return LANGUAGES[ext] ?? "Other";
}
// CycloneDX's primitives and asset types, as the answer keys use them.
const TYPES = new Set(["ae", "signature", "related-crypto-material", "mac", "library", "block-cipher", "stream-cipher", "drbg", "pke", "hash", "kdf", "key-agree", "kem", "xof", "certificate", "protocol", "other"]);
const typeOf = (p: string | null | undefined) => { const k = (p ?? "").toLowerCase().trim(); return TYPES.has(k) ? k : "other"; };

/** One line of the comparison: what the model named or the key holds, and how it was scored.
 *  line is the model's line for right and wrong, the key's for missed; keyLine is the site a right one matched. */
export interface Mark { file: string; kind: keyof Tally; line: number; type: string; keyLine?: number; algorithm?: string | null }

/** Right, wrong and missed for one run against the repository's key. Each real site is matched at most once.
 *  In the breakdown a right or missed site counts under the key's type for it; a wrong one under the type the model gave. */
export function scoreModelRun(run: ModelRun, labels: Labels, each?: (m: Mark) => void): ModelScore {
  const real = new Map<string, Array<{ line: number; type: string; algorithm: string | null }>>();
  for (const s of labels.sites) if (s.verdict === "confirmed") real.set(s.file, [...(real.get(s.file) ?? []), { line: s.line, type: typeOf(s.primitive), algorithm: s.algorithm ?? null }]);
  const breakdown: Breakdown = { language: {}, type: {}, file: {} };
  const tally = (file: string, type: string, k: keyof Tally) => {
    for (const [cut, key] of [["language", languageOf(file)], ["type", type], ["file", `${run.repo}:${file}`]] as const) (breakdown[cut][key] ??= { right: 0, wrong: 0, missed: 0 })[k]++;
  };
  let found = 0, right = 0, wrong = 0, missed = 0, failedFiles = 0;
  const read = new Set<string>();
  for (const f of run.files) {
    if (f.error) { failedFiles++; continue; }
    read.add(f.file);
    const truth = real.get(f.file) ?? [];
    const used = new Set<number>();
    const claimed = new Map<number, string>();
    for (const x of f.sites) if (!claimed.has(x.line)) claimed.set(x.line, typeOf(x.primitive));
    for (const s of [...claimed.keys()].sort((a, b) => a - b)) {
      found++;
      // The nearest unmatched real site within tolerance.
      let best = -1, dist = Infinity;
      truth.forEach((t, i) => { const d = Math.abs(t.line - s); if (!used.has(i) && d <= TOLERANCE && d < dist) { best = i; dist = d; } });
      if (best >= 0) {
        used.add(best); right++; tally(f.file, truth[best]!.type, "right");
        each?.({ file: f.file, kind: "right", line: s, type: truth[best]!.type, keyLine: truth[best]!.line, algorithm: truth[best]!.algorithm });
      } else { wrong++; tally(f.file, claimed.get(s)!, "wrong"); each?.({ file: f.file, kind: "wrong", line: s, type: claimed.get(s)! }); }
    }
    // Real sites in a file the run read but did not match; files it failed on don't count against it.
    truth.forEach((t, i) => { if (!used.has(i)) { missed++; tally(f.file, t.type, "missed"); each?.({ file: f.file, kind: "missed", line: t.line, type: t.type, algorithm: t.algorithm }); } });
  }
  const unreadable = run.files.filter((f) => !f.error && f.unreadable).length;
  return { files: run.files.length, failedFiles, unreadable, found, right, wrong, missed, correct: right + wrong ? right / (right + wrong) : null, breakdown };
}
