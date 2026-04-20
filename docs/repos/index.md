# Repos

Documentation on this site is aggregated from each repository's `/docs` directory at build time.

Repository sources are configured in `data/repos.json` and copied by `scripts/aggregate.mjs`.

| Repo | Description |
|---|---|
| [anolis](/repos/anolis/) | Behavior-tree runtime that discovers devices, maintains state, and routes control |
| [anolis-protocol](/repos/anolis-protocol/) | Anolis Device Provider Protocol (ADPP) contract between runtime and providers |
| [anolis-provider-bread](/repos/anolis-provider-bread/) | Breadboard/GPIO provider for direct hardware signal access |
| [anolis-provider-ezo](/repos/anolis-provider-ezo/) | Atlas Scientific EZO I2C sensor provider |
| [anolis-provider-sim](/repos/anolis-provider-sim/) | Simulation provider for virtual device development and testing |
| [anolis-workbench](/repos/anolis-workbench/) | Commissioning tooling and system composer |
| [fluxgraph](/repos/fluxgraph/) | Deterministic graph-based signal simulation library |

If a source repo has no `index.md` or `README.md` under its docs path, the aggregator generates a minimal stub page so
the route still resolves.
