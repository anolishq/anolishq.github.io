# Contribution Checklist

Use this checklist before opening a pull request.

## Scope

1. Confirm the change is documented in the PR description.
2. List touched areas:
   authored docs, aggregation scripts, reference scripts, or CI workflow.

## Content Quality

1. Verify headings and terminology are consistent with existing docs.
2. Avoid placeholder text in top-level pages (`/`, `/architecture/`, `/guides/`, `/repos/`, `/reference/`).
3. Ensure repo links use absolute site routes such as `/repos/anolis/`.

## Local Validation

1. Install dependencies:
   `pnpm install --frozen-lockfile`
2. Run full build:
   `pnpm build`
3. Spot-check generated output in local preview:
   `pnpm preview`

## Generated Content Rules

1. Do not manually edit generated repo docs under `docs/repos/<repo>/`.
2. Update generators or source repos instead of patching generated files.
3. Keep `docs/repos/index.md` as the canonical hand-authored repos landing page.

## CI and Deployment Expectations

1. PR validation should pass build and link checks.
2. Deploy should happen only from `main`.
3. If generation behavior changes, include migration notes in the PR.
