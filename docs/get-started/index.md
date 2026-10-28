# Get started

Pick the route that matches what you have.

## Try it without hardware

[Run Anolis with the simulator](/repos/anolis/quickstart-simulator): download
the released runtime and the simulation provider, start them on your own
computer, and read and control a simulated device over the HTTP API. Needs a
Linux x86_64 or arm64 machine.

## Install on a machine

For a Linux host that will run a real machine, such as a Raspberry Pi wired to
BREAD boards or EZO sensors. Every route ends in the runtime's `install.sh`,
driven directly, through the `anolis-provision` command, or from the
workbench.

- [Deployment overview](/repos/anolis/deploy/README): the routes and what gets
  installed
- [Deploy with `install.sh`](/repos/anolis/deploy/install-sh)
- [Deploy a remote machine over SSH](/repos/anolis/deploy/workbench-ssh)
- [anolis-workbench](/repos/anolis-workbench/): the desktop and browser app

Read [Safety](/repos/anolis/safety) before you power any actuator.

## Build from source

For working on the runtime or a provider.

- [Getting started](/repos/anolis/getting-started): build the runtime, run it
  with the simulation provider, and try the HTTP API
- [Deploy a development build](/repos/anolis/deploy/developer)
- Provider builds: [sim](/repos/anolis-provider-sim/setup-linux),
  [bread](/repos/anolis-provider-bread/build)
