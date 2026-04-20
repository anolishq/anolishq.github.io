# Repository Documentation

Each repo in the org has its own `/docs` folder. This site aggregates them all into a unified reference.

---

## Core Runtime

| Repo | Description |
|------|-------------|
| [anolis](anolis/) | Runtime kernel — device discovery, state management, control routing |
| [anolis-protocol](anolis-protocol/) | ADPP protobuf definitions — the contract between runtime and providers |

## Device Providers

| Repo | Description |
|------|-------------|
| [anolis-provider-sim](anolis-provider-sim/) | Simulation provider — virtual hardware for development and testing |
| [anolis-provider-bread](anolis-provider-bread/) | BREAD-over-CRUMBS hardware provider (I2C bus) |
| [anolis-provider-ezo](anolis-provider-ezo/) | Atlas Scientific EZO sensor provider (I2C bus) |

## Tooling

| Repo | Description |
|------|-------------|
| [anolis-workbench](anolis-workbench/) | Commissioning shell — compose, test, and package deployments |
| [fluxgraph](fluxgraph/) | Signal processing library — graph-based simulation with deterministic execution |
# Repos

Documentation aggregated from each repo in the org. Each section is copied directly from the repo's `/docs` directory and reflects the state of its `main` branch at the time this site was built.

| Repo | Description |
|---|---|
| [anolis](/repos/anolis/) | Behavior-tree runtime — orchestrates providers, manages signals, runs automation |
| [anolis-protocol](/repos/anolis-protocol/) | Anolis Device Provider Protocol (ADPP) — language-agnostic contract between runtime and providers |
| [anolis-provider-bread](/repos/anolis-provider-bread/) | Breadboard/GPIO provider for direct hardware signal access |
| [anolis-provider-ezo](/repos/anolis-provider-ezo/) | EZO circuit provider — Atlas Scientific I2C sensor integration |
| [anolis-provider-sim](/repos/anolis-provider-sim/) | Simulation provider — virtual device backend for development and testing |
| [anolis-workbench](/repos/anolis-workbench/) | Commissioning tooling and system composer |
| [fluxgraph](/repos/fluxgraph/) | Protocol-agnostic graph-based simulation library with deterministic execution |
