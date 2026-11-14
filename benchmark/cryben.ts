#!/usr/bin/env bun
// The benchmark's answer key, written from Cryben's ground truth.
//
// Cryben is the benchmark of "Hidden Ciphers and Where to Find Them: Static
// Discovery and Assessment of Cryptographic Assets in Software" (Näther and
// Hirsch, arXiv:2608.04857): a synthetic corpus (Go, Ruby, nginx configuration,
// key and certificate files) with a CycloneDX 1.7 CBOM that lists every
// cryptographic asset in it and the line it is on. The corpus and its ground
// truth are in benchmark/cryben/, as published.
//
//   bun benchmark/cryben.ts          writes benchmark/keys/cryben/cryben.json
//
// Every occurrence in the ground truth becomes one site of the key. A file the
// ground truth does not mention has no cryptography in it: a line a model names
// there is wrong.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { corpusPin } from "../lib/source.ts";
import { keyPath, type LabelledSite, type Labels } from "../lib/types.ts";

const root = join(import.meta.dir, "..");
export const CRYBEN = "cryben/cryben", CRYBEN_CORPUS = "benchmark/cryben/corpus";
const SOURCE = { name: "Cryben", paper: "arXiv:2608.04857", url: "https://arxiv.org/abs/2608.04857" };

interface Component {
  name?: string;
  cryptoProperties?: { assetType?: string; algorithmProperties?: { primitive?: string }; relatedCryptoMaterialProperties?: { type?: string } };
  evidence?: { occurrences?: Array<{ location: string; line: number }> };
  properties?: Array<{ name: string; value: string }>;
}
// CycloneDX 1.7 spells primitives in camel case; the keys use 1.6's names.
const PRIMITIVE: Record<string, string> = { blockCipher: "block-cipher", streamCipher: "stream-cipher", keyDerivation: "kdf", keyAgreement: "key-agree", signature: "signature", hash: "hash", mac: "mac" };
// An API call the ground truth gives no primitive for is typed by the area of cryptography it names.
const AREA: Array<[RegExp, string]> = [
  [/CSPRNG/i, "drbg"], [/TLS/i, "protocol"], [/certificate|trust store|keystore/i, "certificate"], [/sign|verif/i, "signature"],
  [/key derivation/i, "kdf"], [/public-key encryption/i, "pke"], [/AEAD/i, "ae"], [/cipher|symmetric|IV/i, "block-cipher"], [/private-key/i, "related-crypto-material"],
];
function typeOf(c: Component): string {
  const p = c.cryptoProperties ?? {}, t = p.assetType ?? "other";
  if (t === "algorithm") {
    const prim = p.algorithmProperties?.primitive;
    if (prim) return PRIMITIVE[prim] ?? "other";
    const area = c.properties?.find((x) => x.name === "cryptoArea")?.value ?? "";
    return AREA.find(([re]) => re.test(area))?.[1] ?? "other";
  }
  // Keys, nonces, salts, tokens and the rest of the material are one kind here.
  return ["certificate", "protocol", "library"].includes(t) ? t : t === "other" || t === "unknown" ? "other" : "related-crypto-material";
}

const truth = JSON.parse(readFileSync(join(root, "benchmark/cryben/ground-truth/cbom-ground-truth.json"), "utf8")) as { components: Component[] };
const sites: LabelledSite[] = truth.components.flatMap((c) => (c.evidence?.occurrences ?? []).map((o) => ({
  file: o.location.replace(/^corpus\//, ""), line: o.line, verdict: "confirmed" as const, by: "cryben",
  primitive: typeOf(c), algorithm: c.name ?? null, claimedBy: [],
}))).sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);

const key: Labels = { schema: "weakcrypto.labels/v1", repo: CRYBEN, commit: corpusPin(join(root, CRYBEN_CORPUS)), corpus: CRYBEN_CORPUS, source: SOURCE, sites };
const out = join(root, keyPath(CRYBEN));
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(key, null, 2) + "\n");
const by = new Map<string, number>();
for (const s of sites) by.set(s.primitive!, (by.get(s.primitive!) ?? 0) + 1);
console.log(`${keyPath(CRYBEN)}: ${sites.length} sites in ${new Set(sites.map((s) => s.file)).size} files, corpus ${key.commit.slice(0, 12)}`);
console.log([...by].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(" · "));
