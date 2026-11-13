# Device support file

A hardware provider states which of its device types have run on real hardware
in `docs/device-support.yaml`, at the root of its `docs/` directory. The file
has one entry for each `devices[].type` value the provider accepts in its
config. A site page that lists every provider's devices from these files is
planned ([#103](https://github.com/anolishq/anolishq.github.io/issues/103)).

This example takes entries from two providers, to show each status:

```yaml
devices:
  - type: rlht
    name: RLHT heater
    status: tested
    tested:
      version: 0.12.0
      date: 2026-11-11
      scope: closed-loop heat, e-stop, safe-state re-assert
  - type: dcmt
    name: DCMT motor
    status: tested
    tested:
      version: 0.12.0
      date: 2026-11-11
      scope: open-loop and brake only
    note: The closed-loop modes need motor encoders and have not run on hardware.
  - type: rtd
    name: EZO RTD temperature
    status: supported
  - type: co2
    name: EZO CO2
    status: in-progress
    issue: anolishq/anolis-provider-ezo#180
```

## Statuses

| Status | Meaning |
|---|---|
| `tested` | The device has run on real hardware, driven by the runtime through this provider. `tested` records the provider release, the date, and what was run. |
| `supported` | The provider accepts the device type in a release, and its own tests cover it, but it has not run on hardware. |
| `in-progress` | Work on the device type has started and is not in a provider release. `issue` names the issue or pull request that tracks it. |

A `tested` entry describes the most recent hardware run. A later provider
release does not reset it to `supported`; the recorded version shows how old
the run is. Update `version`, `date` and `scope` when the device runs on
hardware again.

## Fields

| Field | Required | Value |
|---|---|---|
| `type` | always | The `devices[].type` value the provider's `--config-schema` accepts, such as `rlht`. Each type appears once. |
| `name` | always | A display name, such as `RLHT heater`. |
| `status` | always | `tested`, `supported` or `in-progress`. |
| `tested.version` | `tested` only | The provider release that ran, written `MAJOR.MINOR.PATCH`. |
| `tested.date` | `tested` only | The date of the run, written `YYYY-MM-DD`. |
| `tested.scope` | `tested` only | What was run: the functions, modes or conditions exercised. |
| `issue` | `in-progress` only | `owner/repo#number` of the tracking issue or pull request. |
| `note` | no | One or two sentences a reader choosing hardware should know, such as a mode that has not been run. |

Any other key is an error.

## Rules

- `scope` and `note` state what was run and what was not. Leave out what the
  run found and how it went: that belongs in the provider's issues and
  changelog.
- An `issue` names a public repository. Never link a private repository or an
  unpublished record, here or in `scope` and `note`.
- Each provider checks in its own CI that every type its `--config-schema`
  accepts has an entry, and that every entry other than `in-progress` names a
  type it accepts.

## Checking a file

From a checkout of this site's repository, after `pnpm install`:

```sh
node scripts/device-support.mjs ../anolis-provider-bread/docs/device-support.yaml
```

```text
../anolis-provider-bread/docs/device-support.yaml: ok, 2 device type(s)
```

A file with a problem prints each one with the entry it is in, and the command
exits 1:

```text
../anolis-provider-bread/docs/device-support.yaml:
  devices[1] (dcmt).tested.date: must be a date written YYYY-MM-DD
```
