# Writing style

These rules apply to every page published on this site, including pages
aggregated from other repositories. The reader is an engineer or operator
installing, configuring or extending an Anolis system.

## Describe the current release

Write what the software does in the release the site publishes. Leave out
history: "previously", "no longer", "as of 0.1.40", "unchanged from prior
releases". Changes belong in the repository's `CHANGELOG.md`.

Behaviour that is not released yet gets one line, linking the issue that
tracks it:

```text
Planned for v<version> (#<issue>).
```

No banners, roadmaps or status sections.

## Start with the content

The first sentence says what the thing is or what to do. Do not open with
"Welcome", "This page describes", or a sentence that restates the heading.

Do not describe how a document or feature was produced: reviews, research
passes, pull requests, tooling used to write it.

## Plain words

- No marketing language: robust, seamless, comprehensive, powerful,
  effortless, simply, just.
- No emoji.
- Bold only the one term a reader must not miss in a paragraph.
- Name things consistently: Anolis (the system), the runtime
  (`anolis-runtime`), a provider, ADPP, the workbench.

## Structure

- Use a numbered list only for steps done in order. Use bullets for a set of
  parallel items. Otherwise write prose.
- Use a table to compare items across the same attributes.
- Headings are in sentence case.
- One page covers one task or one concept.

## One home per fact

State a fact once and link to it. A warning that must appear in more than one
place is short and identical everywhere it appears.

Version numbers, repository lists and endpoint lists come from a generated
page or a release where one exists. Do not copy them by hand.

## Commands and examples

- Commands are complete and copy-pasteable: real flags and paths, and the
  directory they run from when it matters.
- Show output in a separate block from the command.
- Every YAML or JSON example parses and validates against the published schema.
- State the platform when a command or path is platform-specific.

## Links

- Link within a repository's `docs/` with relative paths.
- Link to a file outside `docs/` with an absolute GitHub URL. Only `docs/` is
  published, so a relative link out of it breaks the site build. See
  [Repo docs aggregation](./aggregation-and-reference.md#repo-docs-aggregation).
- Cite an issue number only for planned behaviour or a known limitation the
  reader may hit.
- Never link to a private repository or to unpublished notes.

## What is not published

Design assessments, audits, reviews and release-handoff notes are working
documents. Keep them in the repository and list them in its
`docs/.indexignore`, which keeps them off the site. See
[Repo docs aggregation](./aggregation-and-reference.md#repo-docs-aggregation).
