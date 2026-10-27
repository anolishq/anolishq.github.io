# How the parts fit

An Anolis machine is one **runtime** process and one or more **provider**
processes on the same host. Providers talk to hardware; the runtime owns state,
control, modes and safety. Once the runtime is running, the workbench,
dashboards and telemetry export reach it through its HTTP API or the telemetry
it writes. Provisioning reaches the host over SSH and runs `install.sh` there.

```text
  anolis-workbench, scripts, dashboards
                 │  HTTP /v0/*  (state, calls, mode, stop, events)
┌────────────────▼──────────────────────────────────────────┐
│ anolis-runtime                                            │
│   device registry   state cache   call router             │
│   provider supervision   behavior tree (optional)         │
│   software stop and modes          telemetry → InfluxDB   │
└────────┬──────────────────────┬───────────────────────────┘
         │ ADPP over stdio      │ ADPP over stdio
┌────────▼─────────┐   ┌────────▼───────────────────────────┐
│ provider-sim     │   │ provider-bread, provider-ezo       │
│ simulated devices│   │ real devices on a Linux I2C bus    │
└──────────────────┘   └────────────────────────────────────┘
```

## Providers and ADPP

A provider is a separate executable that the runtime starts as a child process.
It exposes devices; each device has **signals** that can be read and
**functions** that can be called. The runtime and a provider exchange
protobuf messages over the provider's standard input and output, framed with a
4-byte little-endian length. That contract is the Anolis Device Provider
Protocol, defined in [anolis-protocol](/repos/anolis-protocol/).

Providers hold no orchestration policy. Modes, stops and cross-device logic live
in the runtime. A provider may still refuse an unsafe device-level request.

The three providers are built on
[anolis-provider-sdk](/repos/anolis-provider-sdk/), which supplies the
transport, run loop and device model.

## Inside the runtime

- **Device registry.** At startup the runtime asks each provider for its
  devices and their capabilities. A provider's devices are discovered again
  when that provider is restarted.
- **State cache.** A background thread polls each device's signals that the
  provider marks for polling, every 500 ms by default. HTTP reads and the behavior tree read from the cache, not
  from providers.
- **Call router.** Every device call, from an operator or from automation,
  passes through one path that validates it against the registry and the
  current safety state before it reaches the provider.
- **Provider supervision.** Each provider runs in its own process, so one
  crashing does not take down the runtime. Automatic restart is opt-in per
  provider.
- **Automation.** With `automation.enabled`, a behavior tree runs in `AUTO`
  mode and calls devices through the same router. See
  [Automation](/repos/anolis/automation).
- **Safety.** A software stop latches, and outputs are driven to a declared
  safe state. It is not a hardware emergency stop. See
  [Safety](/repos/anolis/safety).
- **Telemetry.** Signal values can be written to InfluxDB for dashboards and
  export.

[Architecture](/repos/anolis/architecture) in the runtime docs covers the
threads and data flow in detail.

## Devices on a shared bus

bread and ezo can share one Linux I2C adapter. Each provider declares the
bus addresses it owns, and the runtime refuses to start when two providers
claim the same one.

## The workbench

[anolis-workbench](/repos/anolis-workbench/) is a desktop and browser app with
three steps: **Compose** a machine's configuration, **Commission** it, and
**Operate** a running runtime through its HTTP API. Machines are installed by
the runtime's `install.sh`, which the workbench and its `anolis-provision`
command drive; see [Deployment](/repos/anolis/deploy/README).

## Simulation

[anolis-provider-sim](/repos/anolis-provider-sim/) provides simulated devices
so a machine can run without hardware. Its default build uses a built-in
simulation; an optional mode drives a [FluxGraph](/repos/fluxgraph/) server
for physics.
