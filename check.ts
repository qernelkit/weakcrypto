#!/usr/bin/env bun
// The one validator, run by CI on every pull request and by anyone before
// opening one.
//
//   bun check.ts [files...] [--offline]     the files given, or everything
//
// repos/<owner>/<repo>/repo.json   names that repository, with a GitHub link
// repos/<owner>/<repo>/<id>.cbom.json
//     a valid CycloneDX 1.6 CBOM in the profile (schema/cbom-profile.md), about
//     that repository, filed under its own id, an id nobody else has used, and
//     every line it cites exists at the commit it names (skipped with --offline)
// benchmark/keys/…, benchmark/runs/…   well-formed JSON

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { checkCbom, toSubmission, type Cbom } from "./lib/cbom.ts";
import { fetchAt } from "./lib/source.ts";
import { REPOS, cbomPath, checkTarget, targetPath } from "./lib/types.ts";
import { verify } from "./lib/verify.ts";

const root = import.meta.dir;
const offline = process.argv.includes("--offline");
const given = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const walk = (d: string): string[] => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p]; });
const all = walk(join(root, REPOS)).concat(walk(join(root, "benchmark")).filter((f) => f.endsWith(".json")));
const files = (given.length ? given.map((f) => resolve(f)) : all).filter((f) => f.endsWith(".json"));

// Every CBOM id in the repository, to see that none is used twice.
const ids = new Map<string, string[]>();
for (const f of all.filter((x) => x.endsWith(".cbom.json"))) {
  try { const id = toSubmission(JSON.parse(readFileSync(f, "utf8")) as Cbom).id; ids.set(id, [...(ids.get(id) ?? []), relative(root, f)]); } catch { /* reported below if it is one of the files checked */ }
}

let bad = 0;
for (const f of files) {
  const rel = relative(root, f).replace(/\\/g, "/");
  const errs: string[] = [];
  let x: unknown;
  try { x = JSON.parse(readFileSync(f, "utf8")); } catch (e) { errs.push(`not JSON: ${(e as Error).message}`); }
  if (x && rel.startsWith(`${REPOS}/`) && rel.endsWith("/repo.json")) {
    errs.push(...checkTarget(x));
    const repo = (x as { repo?: string }).repo;
    if (repo && targetPath(repo) !== rel) errs.push(`it names ${repo}: it belongs at ${targetPath(repo)}`);
  } else if (x && rel.endsWith(".cbom.json")) {
    errs.push(...await checkCbom(x as Cbom));
    if (!errs.length) {
      const s = toSubmission(x as Cbom);
      if (cbomPath(s.repo, s.id) !== rel) errs.push(`it is CBOM ${s.id} for ${s.repo}: it belongs at ${cbomPath(s.repo, s.id)}`);
      if ((ids.get(s.id)?.length ?? 0) > 1) errs.push(`the id ${s.id} is used more than once: ${ids.get(s.id)!.join(", ")}`);
      if (!offline && !errs.length) {
        const v = verify(s, fetchAt(s.repo, s.commit, join(root, ".cache")));
        if (!v.valid) errs.push(...v.problems);
      }
    }
  } else if (x && rel.startsWith(`${REPOS}/`)) errs.push("only repo.json and <id>.cbom.json belong in a repository's folder");
  if (errs.length) { bad++; console.log(`✕ ${rel}\n${errs.map((e) => `    ${e}`).join("\n")}`); } else console.log(`✓ ${rel}`);
}
process.exit(bad ? 1 : 0);
