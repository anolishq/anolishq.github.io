# Aggregation and Reference Pipeline

This site is assembled from generated content plus authored pages.

## Inputs

1. Repository metadata in `data/repos.json`
2. Authored site pages under `docs/`:
   `index.md`, `architecture/`, `guides/`, and `repos/index.md`
3. Pinned schema versions in `schemas/anolis-version.json`
4. Generator scripts under `scripts/`

## Schema Injection

`scripts/inject-schemas.mjs` fetches pinned release artifacts from `anolishq/anolis`
and writes them to `docs/public/schemas/anolis/` so VitePress serves them directly.

These injected files are used both as published static assets and as inputs to
reference generation.

## Repo Docs Aggregation

`scripts/aggregate.mjs` does the following:

1. Clones each repo from `data/repos.json` into `.tmp/<repo>`
2. Copies docs from `<repo>/<docsPath>` into `docs/repos/<repo>`
3. Excludes known tooling artifacts such as `Doxyfile`
4. Generates a fallback `index.md` when no `index.md` or `README.md` exists

The static `docs/repos/index.md` is preserved between runs.

Only `<docsPath>` is copied, and VitePress runs with `ignoreDeadLinks: false`.
A relative link in a repo's docs that leaves `<docsPath>`, such as
`../schemas/README.md`, resolves in that repo but points nowhere once
aggregated, and the site build fails. A doc that references a file outside its
`docs/` must link to it as an absolute GitHub URL:
`https://github.com/anolishq/<repo>/blob/main/<path>`.

The source repo's own docs check builds its docs in isolation, where the
relative link resolves, so green CI there does not mean this site builds. To
confirm a fix, re-run a PR build here, which clones every repo fresh.

## Reference Generation

`scripts/generate-reference.mjs` clears `docs/reference/` and writes every
page into it. Its inputs are pinned in `schemas/anolis-version.json`:
`anolis_version` for the runtime release and `anolis_protocol_version` for the
protocol tag.

It writes four pages:

1. `runtime-http-api.md`: the runtime HTTP API, built from the OpenAPI file
   that `inject-schemas.mjs` downloaded from the `anolis_version` release. It
   does not clone `anolis`.
2. `adpp-protocol.md`: the ADPP protocol reference, built from the `.proto`
   files under `proto/anolis/deviceprovider/v1` in `anolis-protocol`, cloned at
   the `anolis_protocol_version` tag.
3. `schemas.md`: the injected JSON Schemas and the URL of the published
   OpenAPI file.
4. `index.md`: a table linking the other pages, and the two pins.

A repo in `data/repos.json` gets a reference page only if it has a non-empty
`specPath`, and its name picks which page. Today those are `anolis` and
`anolis-protocol`. For `anolis` the `specPath` only turns the page on: nothing
is read from it, because the page is built from the injected OpenAPI file. For
`anolis-protocol` the `.proto` files are read from under its `specPath`. Any
other repo given a `specPath` gets a generic page listing the files under that
path, cloned from its default branch rather than a pinned tag.

The generator reads the injected files and exits with an error when the
OpenAPI file is missing, so `inject-schemas.mjs` must run first. `pnpm build`
runs them in that order.

## Full Build Flow

`pnpm build` runs:

1. `node scripts/inject-schemas.mjs`
2. `node scripts/aggregate.mjs`
3. `node scripts/generate-reference.mjs`
4. `node scripts/fetch-metrics.mjs`: fetches `metrics.json` from each repo's
   latest release into `docs/public/metrics/`
5. `node scripts/generate-metrics.mjs`: generates `docs/metrics.md` from the
   fetched metrics
6. `vitepress build docs`

CI runs `pnpm build` on every pull request to `main`. The deploy workflow runs
it on every push to `main` and publishes `docs/.vitepress/dist/` to GitHub
Pages. On a pull-request build, a release or `metrics.json` that
`fetch-metrics.mjs` cannot fetch is skipped with a warning; on `main` it fails
the build.

## Output Directories

1. `docs/public/schemas/anolis/`: injected pinned schema artifacts
2. `docs/repos/`: generated from source repositories
3. `docs/reference/`: generated reference content
4. `docs/public/metrics/` and `docs/metrics.md`: fetched metrics and the
   generated metrics page
5. `docs/.vitepress/dist/`: static site output

Temporary clones are written to `.tmp/` and should not be committed.
