# Verifying docs

Every checkable statement on this site is verified against the source at the
release the site publishes. A statement that cannot be verified is rewritten
until it can be, or removed.

## What counts as a claim

- Commands, flags and their arguments
- File paths, configuration keys and their defaults
- Version numbers and compatibility statements
- HTTP endpoints, status codes, event names and payload fields
- Protocol messages and their fields
- Behaviour: what the software does in a given situation
- Statements about another repository

## How to verify

Use the strongest check available:

1. **Run it.** Run the command, or the binary's `--help`, built from the
   release being documented.
2. **Validate it.** Parse every YAML and JSON example, and validate it against
   the schema published with that release.
3. **Cite it.** Find the line in the source that implements the claim, at the
   release tag.

Behaviour that depends on hardware and cannot be shown from source is not
asserted. Mark it for bench verification with the `needs-bench` label on the
tracking issue.

## Verdicts

| Verdict | Meaning | Action |
|---|---|---|
| True | Matches the source at the release | Keep |
| False | Contradicts the source | Fix |
| Stale | Was true for an earlier release | Fix |
| Unverifiable | No source or check can settle it | Rewrite to what can be verified, remove, or mark `needs-bench` |

Only true claims are published.

## In the pull request

List each claim the change adds or alters, with its evidence: the command that
was run, or the source as `<repo>/<path>:<line>` at the tag. A reviewer
re-checks claims about safety, security and installation independently of the
author.

## Keeping it true

- Generate what can be generated: version strings, repository lists, API and
  protocol reference.
- The site build fails on a dead internal link.

Publishing each repository's docs from its latest release is planned
([#69](https://github.com/anolishq/anolishq.github.io/issues/69)).
