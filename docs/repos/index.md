# Components

Each component's documentation lives in its own repository and is published
here at build time, from the release pinned for it in `data/repos.json`.

| Component | What it does |
|---|---|
| [anolis](/repos/anolis/) | The runtime: device discovery, state, control, automation, HTTP API, and `install.sh` for deployment |
| [anolis-protocol](/repos/anolis-protocol/) | ADPP, the protocol between the runtime and providers, and its conformance tests |
| [anolis-provider-sim](/repos/anolis-provider-sim/) | Simulated devices, for running Anolis without hardware |
| [anolis-provider-bread](/repos/anolis-provider-bread/) | Provider for BREAD boards on the CRUMBS I2C bus |
| [anolis-provider-ezo](/repos/anolis-provider-ezo/) | Provider for Atlas Scientific EZO sensor circuits over I2C |
| [anolis-provider-sdk](/repos/anolis-provider-sdk/) | C++ library the providers are built on |
| [anolis-workbench](/repos/anolis-workbench/) | Desktop and browser app to compose a machine's configuration, provision it, and operate it |
| [fluxgraph](/repos/fluxgraph/) | C++ signal-graph simulation library that provider-sim can use as a physics engine |

Not published here yet:
[anolis-telemetry-export](https://github.com/anolishq/anolis-telemetry-export)
exports the runtime's telemetry from InfluxDB, and
[anolis-projects](https://github.com/anolishq/anolis-projects) holds machine
configurations for specific deployments, such as bioreactor-v1.
