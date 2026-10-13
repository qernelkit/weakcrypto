# weakcrypto

A public record of the cryptography in open-source code. Each repository gets
one or more CBOMs ([CycloneDX](https://cyclonedx.org/capabilities/cbom/)
cryptography bills of materials) naming every cryptographic asset and the line
it is on. Results are shown at [weakcrypto.com](https://weakcrypto.com).

Anyone can add a repository, submit a CBOM for one, or challenge an existing
CBOM with a better one. Any tool or model may produce it.

## Layout

```
repos/<owner>/<repo>/repo.json          a queued repository, pinned to a commit
repos/<owner>/<repo>/<id>.cbom.json     a CBOM submitted for it
seed/                                   every public repository with 100+ stars, waiting to be scanned
benchmark/keys/                         answer keys: the lines that really are cryptography
benchmark/runs/                         each model's answers on those repositories
schema/                                 the formats, including the CBOM profile
```

## Setup

Needs [Bun](https://bun.sh) and git.

```sh
git clone https://github.com/qernelkit/weakcrypto && cd weakcrypto
bun install
```

## Submit a CBOM

1. **Queue the repository**, if `repos/<owner>/<repo>/` does not exist yet:

   ```sh
   bun add.ts owner/repo --by <your-github-login>
   ```

2. **Scan it** at the commit in its `repo.json`, with whatever you like. The
   output must be a CycloneDX CBOM whose components list where each asset
   occurs (`evidence.occurrences`: a path and a line).

3. **Stamp it.** This pins it to the commit, gives it an id, checks every line
   it cites against the code, and files it in the right place:

   ```sh
   bun stamp.ts my.cbom.json --repo owner/repo --by <your-github-login> --model <model-used>
   ```

   Lines that do not exist at that commit are dropped, and reported.

4. **Check it, commit, open a pull request:**

   ```sh
   bun check.ts repos/owner/repo/*.json
   git add repos/owner/repo && git commit -m "CBOM for owner/repo" && git push
   ```

A repository can hold many CBOMs. To improve on one, pass
`--builds-on <id>` to `stamp.ts`; lines first reported by the earlier CBOM stay
credited to its author.

## Check existing CBOMs

```sh
bun check.ts                              # everything
bun check.ts repos/owner/repo/*.json      # one repository
bun check.ts --offline                    # skip fetching code: format checks only
```

For each CBOM this confirms it is valid CycloneDX 1.6, follows
[the profile](schema/cbom-profile.md), and that every cited line exists at the
commit it names. To dispute a CBOM, open an issue naming the file and the lines,
or submit your own.

## Benchmark a model

The benchmark gives a model each file of the answer-key repositories, one call
per file, and asks for the lines that are cryptography. The prompt is in
[`benchmark/prompt.ts`](benchmark/prompt.ts).

```sh
export ANTHROPIC_API_KEY=...        # for claude-* models
export OPENAI_API_KEY=...           # for any other model
export OPENAI_BASE_URL=...          # optional: OpenRouter, Ollama, LiteLLM, ...

bun benchmark/run.ts --models <model>[,<model>] --dry     # what would run, no calls
bun benchmark/run.ts --models <model>[,<model>]           # run and score
bun benchmark/run.ts --models <model> --repos owner/repo  # one repository
```

Results are written to `benchmark/runs/<model>/`. A finished run is kept, not
repeated; `--force` repeats it. This costs API calls: one per file.

**Scoring.** A named line is *right* if it is within two lines of a line in the
answer key, otherwise *wrong*. A key line the model never named is *missed*.
*Correct* is right ÷ (right + wrong). Files the provider failed on are left out.

## Re-score existing runs

No model is called.

```sh
bun benchmark/report.ts                              # every model, every repository
bun benchmark/report.ts --model claude-sonnet-5-5
bun benchmark/report.ts --repo lawliet89/biscuit
```

## Add to the benchmark

- **A model:** run it as above and open a pull request with the new files
  under `benchmark/runs/`.
- **A repository:** add `benchmark/keys/<owner>/<repo>.json`
  ([format](schema/labels.schema.json)): the repository, the commit, and each
  site as a file, a line and a verdict. Then run the models on it.
- **A correction to a key:** change the site's verdict in the key file and say
  why in the pull request. Scores follow from the keys, so `report.ts` shows the
  effect immediately.

## What a pull request must pass

CI runs `check.ts` on the files you changed, and also requires that:

- the GitHub account named in a `repo.json` (`addedBy`) or a CBOM
  (`weakcrypto:submitter`) is the author of the commit that adds it;
- a queued repository is public and under 2 GB.

Run `bun check.ts <your files>` before pushing to see the same errors locally.
