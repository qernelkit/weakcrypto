# weakcrypto

weakcrypto is an open initiative managed by
[Qernel Technologies, Inc.](https://qernelzoo.com), using AI to build a global
[CBOM](https://cyclonedx.org/capabilities/cbom/) of all meaningful public code
repositories. The website can be found at [weakcrypto.com](https://weakcrypto.com).

This challenge is intended to be an open record. You can:

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

Found something wrong? [Open an issue](https://github.com/qernelkit/weakcrypto/issues/new).
