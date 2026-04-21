# anolishq.github.io

Unified documentation site for the `anolishq` organization.

This repository builds a VitePress site that combines:

1. Hand-authored org-level docs (`docs/index.md`, `docs/architecture`, `docs/guides`, `docs/repos/index.md`)
2. Aggregated repository docs pulled from each repo's `/docs` directory
3. Generated reference docs for API and protocol surfaces

## Prerequisites

1. Node.js `>=20`
2. `pnpm` (workspace uses `pnpm-lock.yaml`)
3. Git access to repositories listed in `data/repos.json`

## Quickstart

Install dependencies:

```bash
pnpm install --frozen-lockfile
```

Run local docs dev server:

```bash
pnpm dev
```

Build full site (aggregate + reference + VitePress):

```bash
pnpm build
```

`pnpm build` also injects the pinned published schema artifacts into `docs/public/schemas/anolis/`
before reference generation, so local builds match the Pages build path.

Preview built output:

```bash
pnpm preview
```

## Repository Structure

- `docs/`: site source pages and VitePress config
- `data/repos.json`: source-of-truth list of repos to aggregate
- `scripts/aggregate.mjs`: clones repos and copies docs into `docs/repos/`
- `scripts/generate-reference.mjs`: generates `docs/reference/` from configured spec inputs
- `.github/workflows/`: PR checks and Pages deploy workflows

## Generated Directories

These paths are generated at build time and are intentionally gitignored:

1. `docs/repos/` (except `docs/repos/index.md`)
2. `docs/reference/`
3. `.tmp/`
4. `docs/.vitepress/dist/`

Do not manually edit generated files. Change source repos or generator scripts instead.

## Troubleshooting

1. Build fails during aggregation:
   Confirm each repo/path in `data/repos.json` exists and is accessible.
2. Reference generation fails:
   Confirm required `specPath` directories exist in source repos and that the pinned
   schema release in `schemas/anolis-version.json` is published and reachable.
3. Dead-link build errors:
   Update links or generated content. Dead-link checks are intentionally strict.
4. Local `pnpm` in WSL fails to find `node`:
   Run build via Windows shell (`cmd.exe /c pnpm build`) in this environment.
