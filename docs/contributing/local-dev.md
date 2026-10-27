# Local development

This guide covers the standard local workflow for working on `anolishq.github.io`.

## Prerequisites

1. Node.js `>=20`
2. `pnpm` installed
3. Git access to the repositories listed in `data/repos.json`

## Install

```bash
pnpm install --frozen-lockfile
```

## Run docs locally

```bash
pnpm dev
```

This starts the VitePress development server for the `docs/` directory.

## Build the site

```bash
pnpm build
```

The steps it runs are listed in
[Full build flow](./aggregation-and-reference.md#full-build-flow).

## Preview production output

```bash
pnpm preview
```

## Common issues

1. Build fails while aggregating:
   Check `data/repos.json` and confirm each repo has the configured docs path.
2. Missing pages in sidebar:
   Confirm each section has markdown files with valid `index.md` or `README.md` entry points where expected.
3. Build fails while injecting schemas:
   Confirm the `anolis` `ref` in `data/repos.json` exists as a GitHub release with the expected schema tarball assets.
4. Broken links after docs changes:
   Run a full `pnpm build` before opening a PR.
