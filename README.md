# weakcrypto

A public record of the cryptography in open-source code, and of how weak it is.

Each repository gets one or more CBOMs
([CycloneDX](https://cyclonedx.org/capabilities/cbom/) cryptography bills of
materials): every cryptographic asset in it, and the line it is on. The results
are at [weakcrypto.com](https://weakcrypto.com).

It is an open record. You can:

- **add a repository** to be scanned;
- **submit a CBOM** for one, made with any tool or model;
- **challenge a CBOM** that is already here with a better one;
- **benchmark a model** on how well it finds cryptography, or correct the
  benchmark's answer keys.

## Contributing

The steps are written for a coding agent. Clone the repository, open it in
yours (Claude Code, Cursor, Codex, or any other), and point it at
[`AGENTS.md`](AGENTS.md):

> Read AGENTS.md, then scan `owner/repo` for cryptography and submit a CBOM for it.

> Read AGENTS.md, then run the benchmark on `<model>` and open a pull request with the results.

`AGENTS.md` is also readable by people: it is a page of commands, each one
line. You need [Bun](https://bun.sh), git and a GitHub account.

## What is checked

Every pull request is validated automatically: a CBOM must be well-formed, and
every line it cites must exist at the commit it names. Each submission is tied
to the GitHub account that commits it.

Found something wrong? [Open an issue](https://github.com/qernelkit/weakcrypto/issues/new).
