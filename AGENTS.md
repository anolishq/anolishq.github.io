# AGENTS.md — anolishq.github.io

> Per-repo conventions for coding agents. The canonical cross-repo rules
> (Conventional Commits, minimal-first/YAGNI, no secrets, run checks before
> claiming success) live in the user's **global** `AGENTS.md` and are not
> repeated here. This file records only what is specific to this repo.

## Build / test

- `pnpm install --frozen-lockfile` then `pnpm build` (the build chains
  schema-inject → aggregate → reference-gen → metrics → `vitepress build`, and
  includes dead-link validation). `pnpm dev` for local preview.
- The required CI status check is the **`ok`** job; never merge red.

## Tooling

- **pnpm** (via SHA-pinned `pnpm/action-setup`, lockfile v9). Node 20+
  (`engines`); CI runs Node 24. VitePress (Vue) static docs site.

## Repo-specific gotchas

- **esbuild must be allowed to run its build script** via `allowBuilds:
  esbuild: true` in `pnpm-workspace.yaml`. Without it the build silently ships a
  broken esbuild — keep this entry.
- It **aggregates docs from ~7 downstream repos** (`scripts/aggregate.mjs` +
  friends). The **metrics fetch is authenticated** (`GITHUB_TOKEN`) and
  **gracefully skips on PR builds** — don't make it hard-fail on PRs.
