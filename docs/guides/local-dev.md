# Local Development

This guide covers the standard local workflow for working on `anolishq.github.io`.

## Prerequisites

1. Node.js `>=20`
2. `pnpm` installed
3. Git access to the repositories listed in `data/repos.json`

## Install

```bash
pnpm install --frozen-lockfile
```

## Run Docs Locally

```bash
pnpm dev
```

This starts the VitePress development server for the `docs/` directory.

## Build the Site

```bash
pnpm build
```

Build performs four steps:

1. Injects pinned schema artifacts into `docs/public/schemas/anolis/`
2. Aggregates repo docs into `docs/repos/`
3. Generates reference docs into `docs/reference/`
4. Runs `vitepress build docs`

## Preview Production Output

```bash
pnpm preview
```

## Common Issues

1. Build fails while aggregating:
   Check `data/repos.json` and confirm each repo has the configured docs path.
2. Missing pages in sidebar:
   Confirm each section has markdown files with valid `index.md` or `README.md` entry points where expected.
3. Build fails while injecting schemas:
   Confirm the pinned `anolis_version` in `schemas/anolis-version.json` exists as a GitHub release with the expected schema tarball assets.
4. Broken links after docs changes:
   Run a full `pnpm build` before opening a PR.
