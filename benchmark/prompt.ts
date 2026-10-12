// The model benchmark's prompt: the whole harness, shown on the site as it is
// sent. No tools, no agent loop: each model gets this system prompt and one
// whole file with line numbers, one call per file, and answers with the lines
// it judges to be cryptography. Every model gets these exact words; a change
// means a new PROMPT_VERSION, and runs are only compared within one.

import { createHash } from "node:crypto";

export const PROMPT_VERSION = "files-v2";

export const SYSTEM = `You find cryptography in source code, one file at a time, for a benchmark. Be exact: a wrong line costs as much as a missed one.

A cryptographic site is a line of code, configuration, or a dependency manifest or lockfile entry that uses, configures, declares or depends on cryptography:
- calls into a crypto API: signing, verifying, encrypting, decrypting, hashing for security, MAC, key derivation, key generation, secure random for keys or nonces
- constructing or parsing keys or certificates, and key or certificate material itself (where it starts)
- choosing an algorithm, curve or key size (including in data such as a JWT "alg" or JWK "crv")
- TLS or other crypto protocol configuration
- importing or linking a crypto library, or listing one as a dependency
Test code counts.

Not a site: comments, documentation, names that only sound cryptographic, hashing that isn't for security (hash maps, hashCode, checksums for caching or equality), Math.random-style randomness not used for security, plain token or password handling with no cryptography, version strings, blank lines.`;

/** The user message for one file; {numbered} is the file, each line prefixed with its number. */
export const USER_TEMPLATE = `Repository: {repo}
File: {file} ({total} lines)

Report every line in this file that is a cryptographic site. Reply with JSON only: {"sites":[{"line":<number>,"primitive":"<CycloneDX primitive or asset type>","algorithm":"<name or null>"}]}, an empty list if there are none.

{numbered}`;

export const userPrompt = (repo: string, file: string, total: number, numbered: string) =>
  USER_TEMPLATE.replace("{repo}", repo).replace("{file}", file).replace("{total}", String(total)).replace("{numbered}", numbered);

/** A fingerprint of the exact words, recorded with every run. */
export const PROMPT_HASH = createHash("sha256").update(SYSTEM + "\n---\n" + USER_TEMPLATE).digest("hex").slice(0, 12);
