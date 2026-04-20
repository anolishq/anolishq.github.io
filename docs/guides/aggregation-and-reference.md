# Aggregation and Reference Pipeline

This site is assembled from generated content plus authored pages.

## Inputs

1. Repository metadata in `data/repos.json`
2. Authored site pages under `docs/`:
   `index.md`, `architecture/`, `guides/`, and `repos/index.md`
3. Generator scripts under `scripts/`

## Repo Docs Aggregation

`scripts/aggregate.mjs` does the following:

1. Clones each repo from `data/repos.json` into `.tmp/<repo>`
2. Copies docs from `<repo>/<docsPath>` into `docs/repos/<repo>`
3. Excludes known tooling artifacts such as `Doxyfile`
4. Generates a fallback `index.md` when no `index.md` or `README.md` exists

The static `docs/repos/index.md` is preserved between runs.

## Reference Generation

`scripts/generate-reference.mjs` generates `docs/reference/`.

Today the implementation is a minimal placeholder. The intended completed behavior is:

1. Generate protocol reference from `anolis-protocol`
2. Generate runtime API reference from `anolis`
3. Publish a browsable reference index in `docs/reference/index.md`

## Full Build Flow

`pnpm build` runs:

1. `node scripts/aggregate.mjs`
2. `node scripts/generate-reference.mjs`
3. `vitepress build docs`

## Output Directories

1. `docs/repos/`: generated from source repositories
2. `docs/reference/`: generated reference content
3. `docs/.vitepress/dist/`: static site output

Temporary clones are written to `.tmp/` and should not be committed.
