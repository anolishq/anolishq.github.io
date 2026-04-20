# Repos

Documentation on this site is aggregated from each repository's `/docs` directory at build time.

Repository sources are configured in `data/repos.json` and copied by `scripts/aggregate.mjs`.

| Repo | Description |
|---|---|
| [anolis](/repos/anolis/) | Runtime kernel — device discovery, state management, and control routing |
| [anolis-protocol](/repos/anolis-protocol/) | ADPP — language-agnostic contract between runtime and providers |
| [anolis-provider-bread](/repos/anolis-provider-bread/) | BREAD-over-CRUMBS hardware provider over I2C |
| [anolis-provider-ezo](/repos/anolis-provider-ezo/) | Atlas Scientific EZO sensor provider over I2C |
| [anolis-provider-sim](/repos/anolis-provider-sim/) | Simulation provider — virtual hardware backend for development and testing |
| [anolis-workbench](/repos/anolis-workbench/) | Commissioning shell and system composer |
| [fluxgraph](/repos/fluxgraph/) | Deterministic signal processing library embedded in provider-sim |

If a source repo has no `index.md` or `README.md` under its docs path, the aggregator generates a minimal stub page so
the route still resolves.
