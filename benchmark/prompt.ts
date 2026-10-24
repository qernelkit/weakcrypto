// The model benchmark's prompts: the whole harness, shown on the site as it is
// sent. No tools, no agent loop: each model gets the benchmark's system prompt
// and one whole file with line numbers, one call per file, and answers with the
// lines it judges to be cryptography. Each benchmark has its own prompt, worded
// to that benchmark's definition of a site; every model gets those exact words.
// A change means a new version, and runs are only compared within one.

import { createHash } from "node:crypto";

export interface Prompt {
  version: string;
  system: string;
  /** The user message for one file; {numbered} is the file, each line prefixed with its number. */
  user: string;
  /** A fingerprint of the exact words, recorded with every run. */
  hash: string;
}
const prompt = (version: string, system: string, user: string): Prompt => ({ version, system, user, hash: createHash("sha256").update(system + "\n---\n" + user).digest("hex").slice(0, 12) });

const USER = `Repository: {repo}
File: {file} ({total} lines)

Report every line in this file that is a cryptographic site. Reply with JSON only: {"sites":[{"line":<number>,"primitive":"<CycloneDX primitive or asset type>","algorithm":"<name or null>"}]}, an empty list if there are none.

{numbered}`;

// Cryben counts an asset where it occurs (the call, the configured choice, the material in a file), not where its package is imported.
const CRYBEN = prompt("files-v3", `You find cryptographic assets in a codebase, one file at a time, for a benchmark. Be exact: a wrong line costs as much as a missed one.

A cryptographic site is the line where a cryptographic asset occurs:
- a call into a crypto API: signing, verifying, encrypting, decrypting, hashing for security, MAC, key derivation, key generation, secure random for keys or nonces, parsing or creating keys and certificates, setting up TLS
- the line that chooses an algorithm, mode, curve, key size, protocol version or cipher suite, in code or in configuration
- crypto material kept in a file: a key, certificate, keystore, signature, digest, ciphertext, IV, nonce, salt, seed, shared secret, password, credential or token (the line where it starts)
- a crypto library listed in a dependency manifest
Test code counts.

Not a site: an import, require or include of a crypto package (report the call that uses it, not the import), comments, documentation, names that only sound cryptographic, hashing that isn't for security (hash maps, hashCode, checksums for caching or equality), Math.random-style randomness not used for security, version strings, blank lines.`, USER);

// The open-source repositories' keys count every line that touches cryptography, imports and dependencies included.
const REPOSITORIES = prompt("files-v2", `You find cryptography in source code, one file at a time, for a benchmark. Be exact: a wrong line costs as much as a missed one.

A cryptographic site is a line of code, configuration, or a dependency manifest or lockfile entry that uses, configures, declares or depends on cryptography:
- calls into a crypto API: signing, verifying, encrypting, decrypting, hashing for security, MAC, key derivation, key generation, secure random for keys or nonces
- constructing or parsing keys or certificates, and key or certificate material itself (where it starts)
- choosing an algorithm, curve or key size (including in data such as a JWT "alg" or JWK "crv")
- TLS or other crypto protocol configuration
- importing or linking a crypto library, or listing one as a dependency
Test code counts.

Not a site: comments, documentation, names that only sound cryptographic, hashing that isn't for security (hash maps, hashCode, checksums for caching or equality), Math.random-style randomness not used for security, plain token or password handling with no cryptography, version strings, blank lines.`, USER);

/** Each benchmark's prompt, by the name its answer key is filed under: Cryben's own, and one for the repositories. */
export const PROMPTS: Record<string, Prompt> = { "cryben/cryben": CRYBEN };
export const promptFor = (benchmark: string): Prompt => PROMPTS[benchmark] ?? REPOSITORIES;

export const userPrompt = (p: Prompt, repo: string, file: string, total: number, numbered: string) =>
  p.user.replace("{repo}", repo).replace("{file}", file).replace("{total}", String(total)).replace("{numbered}", numbered);
