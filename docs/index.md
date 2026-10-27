---
layout: home

hero:
  name: Anolis
  text: A control runtime for machines built from many devices
  image:
    src: /assets/brand/anolis-logo-512.png
    alt: Anolis logo
    width: 250
    height: 250
  actions:
    - theme: brand
      text: Get started
      link: /get-started/
    - theme: alt
      text: How the parts fit
      link: /concepts/
    - theme: alt
      text: Reference
      link: /reference/
---

## What Anolis is

Anolis runs on the computer that controls a machine, such as a Raspberry Pi in
a lab rig. Each piece of hardware is reached through a **provider**: a separate
program that talks to the device and speaks the Anolis Device Provider Protocol
(ADPP) to the runtime over its standard input and output.

The runtime starts the providers, discovers their devices, polls their signals,
and is the single path for control. An operator calls device functions over an
HTTP API, and a behavior tree can call the same functions in automation. The
software stop, and the runtime mode when automation is enabled, decide which
calls are allowed.

Anolis is for engineers building lab or process equipment from off-the-shelf
and custom boards who want one control and safety model across all of it. The
[bioreactor project](https://github.com/anolishq/anolis-projects/tree/main/projects/bioreactor-v1)
is a working example.

## The parts

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
| [anolis-telemetry-export](https://github.com/anolishq/anolis-telemetry-export) | Service for authenticated exports of the runtime's telemetry from InfluxDB |
| [anolis-projects](https://github.com/anolishq/anolis-projects) | Machine configurations for specific deployments; bioreactor-v1 installs with `install.sh` |
