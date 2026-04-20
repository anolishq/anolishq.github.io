# System Architecture

Anolis is a **capability-oriented machine runtime** for systems built from heterogeneous hardware devices. It sits between low-level device buses and high-level behavior: discovering what devices exist, maintaining live state, and routing all control through a single validated path.

The org is split across focused repos. Each has a defined role. Nothing crosses boundaries without a protocol contract.

---

## Repos and roles

| Repo | Language | Role |
|---|---|---|
| [anolis](/repos/anolis/) | C++ | Runtime kernel — the operational brain |
| [anolis-protocol](/repos/anolis-protocol/) | Protobuf | ADPP — the contract between runtime and providers |
| [anolis-provider-sim](/repos/anolis-provider-sim/) | C++ | Simulation provider — virtual hardware backend for development and testing |
| [anolis-provider-bread](/repos/anolis-provider-bread/) | C++ | BREAD-over-CRUMBS hardware provider over I2C |
| [anolis-provider-ezo](/repos/anolis-provider-ezo/) | C++ | Atlas Scientific EZO sensor provider over I2C |
| [anolis-workbench](/repos/anolis-workbench/) | Python | Commissioning shell and system composer |
| [fluxgraph](/repos/fluxgraph/) | C++ | Deterministic signal processing library embedded in provider-sim |

---

## System diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    anolis-workbench                         │
│    Compose → Commission → Operate (→ /v0/* proxy)           │
│    Produces: .anpkg handoff package                         │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP /v0/*
┌────────────────────────▼────────────────────────────────────┐
│                    anolis runtime                           │
│                                                             │
│  ┌──────────────┐   ┌──────────────┐   ┌───────────────┐   │
│  │   Registry   │   │  StateCache  │   │  CallRouter   │   │
│  │  (immutable  │◄──│  (polls 500ms│   │  (validates + │   │
│  │  after disco)│   │   per device)│   │  serializes)  │   │
│  └──────────────┘   └──────────────┘   └───────┬───────┘   │
│                                                 │           │
│  ┌──────────────────────────────────────────────▼────────┐  │
│  │  ProviderHost — spawns, supervises, frames stdio      │  │
│  └───────────────────────┬───────────────────────────────┘  │
│                          │                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  BehaviorTree (optional, AUTO mode only)             │   │
│  │  reads: StateCache  /  writes: CallRouter            │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  HTTP /v0/* (state, control, mode, automation, events)      │
└───────────────┬──────────────────────┬──────────────────────┘
                │ ADPP (framed stdio)  │ ADPP (framed stdio)
┌───────────────▼──────┐  ┌────────────▼────────────────────┐
│  anolis-provider-sim │  │  anolis-provider-bread           │
│                      │  │  anolis-provider-ezo             │
│  FluxGraph physics   │  │  (share I2C bus — runtime        │
│  engine embedded     │  │   enforces exclusive ownership   │
└──────────────────────┘  │   per address at startup)        │
                          └─────────────────────────────────┘
```

---

## ADPP — the protocol boundary

**Anolis Device Provider Protocol** ([anolis-protocol](/repos/anolis-protocol/)) is the contract every provider implements. It is transport-agnostic and language-agnostic. The current transport is **protobuf over framed stdio** (uint32_le length-prefix).

Provider baseline:

| Operation | Purpose |
|---|---|
| `Hello` | Provider announces identity |
| `ListDevices` | Runtime enumerates available devices |
| `DescribeDevice` | Runtime learns signals and callable functions per device |
| `ReadSignals` | StateCache polls device telemetry |
| `Call` | CallRouter invokes a device function |
| `GetHealth` | Runtime monitors provider and device health |
| `WaitReady` | Runtime waits for provider startup before serving traffic |

**Providers MUST NOT encode orchestration policy.** All control modes, safety interlocks, and cross-device coordination live in the runtime, not in providers. A provider may reject an invalid or unsafe device-level action defensively, but it has no view of system state.

---

## Runtime internals

### Device registry

Built once at startup by running Hello → ListDevices → DescribeDevice against every provider. Immutable after discovery (no hot-plug in v0). Used by CallRouter to validate every control request before it reaches a provider.

### StateCache

Background thread polling all devices at 500 ms by default. Thread-safe snapshot API. All reads — from HTTP, behavior trees, tooling — go through StateCache. External layers never query providers directly.

### CallRouter

Single path for all control operations, manual or automated. Validates against the registry, acquires a per-provider mutex (serializes calls to the same provider), forwards to ProviderHost, triggers an immediate post-call state poll. Behavior tree writes use the same path as manual HTTP calls — no bypass.

### Runtime modes

| Mode | Automation | Manual calls | Notes |
|---|---|---|---|
| `IDLE` | Stopped | Blocked | Safe startup/standby |
| `MANUAL` | Stopped | Allowed | Operator-driven commissioning |
| `AUTO` | Running | Policy-gated | `BLOCK` or `OVERRIDE` policy |
| `FAULT` | Stopped | Allowed | Explicit recovery path |

Valid transitions: `IDLE ↔ MANUAL ↔ AUTO`, `Any → FAULT`, `FAULT → MANUAL`. `FAULT → AUTO` and `AUTO → IDLE` are invalid.

### Provider supervision

Each provider is a supervised child process. On crash or unresponsiveness: exponential backoff, restart up to `max_attempts`, full device rediscovery after restart, circuit breaker opens after consecutive failures. Each provider is supervised independently — one provider crashing does not affect others.

---

## Providers

### anolis-provider-sim

Simulation provider for development and testing without hardware. Embeds **FluxGraph** — a deterministic topological signal processing library — as a physics engine. The physics layer operates on abstract signal paths via `ISignalSource`; it has zero knowledge of ADPP. Device adapters translate between ADPP protocol and FluxGraph signal paths.

### anolis-provider-bread

BREAD-over-CRUMBS provider. Scoped to BREAD hardware specifically (not generic CRUMBS). Communicates via Linux I2C using the CRUMBS HAL. Internally organized into: ADPP transport layer, CRUMBS session layer, BREAD helpers, per-device adapters.

### anolis-provider-ezo

Atlas Scientific EZO circuit provider (pH, ORP, EC, DO, RTD, HUM sensors) over I2C. v1 function surface is intentionally limited to safe controls: `find`, `set_led`, `sleep`. Full calibration commands are deferred.

**Shared bus safety:** bread and ezo can share the same Linux I2C adapter. The runtime enforces exclusive `(bus_path, i2c_address)` ownership across all providers at startup — duplicate ownership is a hard startup error.

---

## anolis-workbench

Python commissioning shell with three workflow tracks:

- **Compose** — define the system: providers, devices, behavior configuration. Produces a validated system document.
- **Commission** — launch the runtime locally from the composed system, run operate checks, validate contracts.
- **Operate** — proxy to a live runtime's `/v0/*` API for manual control and observation.

Produces `.anpkg` handoff packages for headless deployment. Includes a desktop wrapper (Tauri) alongside the Python server.

---

## FluxGraph

Deterministic C++ signal processing library. Not a runtime dependency of anolis itself — embedded inside anolis-provider-sim. Uses **immediate topological propagation semantics**: signals execute in DAG topological order within each tick; upstream writes are visible to downstream nodes in the same tick. No cycles permitted. Designed for real-time simulation at <10ms ticks.

---

## Key invariants

1. **Only providers talk to hardware.** No direct bus access from the runtime.
2. **All reads go through StateCache.** No direct provider queries from external layers.
3. **All writes go through CallRouter.** Behavior trees, HTTP, CLI — same path, same validation.
4. **Registry is read-only after discovery.** No hot-plug in v0.
5. **Providers are isolated processes.** A provider crash does not crash the runtime.
6. **No orchestration policy in providers.** Modes, interlocks, and sequencing live in the runtime.
7. **Shared bus ownership is enforced at startup.** Duplicate `(bus_path, address)` is a hard error, not a warning.
