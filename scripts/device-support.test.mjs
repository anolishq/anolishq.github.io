import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "fs/promises";
import { parseDeviceSupport } from "./device-support.mjs";

const problems = (text) => {
  try {
    parseDeviceSupport(text, "f.yaml");
  } catch (e) {
    return e.message.split("\n").slice(1).map((l) => l.trim());
  }
  return [];
};

const one = (fields) => `devices:\n  - type: ph\n    name: EZO pH\n${fields}`;

test("the example on the format page is valid", async () => {
  const page = await fs.readFile(
    new URL("../docs/contributing/device-support.md", import.meta.url),
    "utf-8"
  );
  const example = /```yaml\n([\s\S]*?)```/.exec(page)[1];
  const { devices } = parseDeviceSupport(example);
  assert.deepEqual(
    devices.map((d) => d.status),
    ["tested", "tested", "supported", "in-progress"]
  );
  assert.equal(devices[0].tested.version, "0.12.0");
  assert.equal(devices[0].tested.date, "2026-11-11");
});

test("a tested entry needs version, date and scope", () => {
  assert.deepEqual(problems(one("    status: tested\n")), [
    "devices[0] (ph).tested: must be a mapping with version, date and scope",
  ]);
  assert.deepEqual(
    problems(one("    status: tested\n    tested:\n      version: 0.12\n      date: 2026-02-30\n      scope: ''\n")),
    [
      'devices[0] (ph).tested.version: must be a provider release such as "0.12.0"',
      "devices[0] (ph).tested.date: must be a date written YYYY-MM-DD",
      "devices[0] (ph).tested.scope: must say what was run",
    ]
  );
});

test("tested and issue belong to their own status only", () => {
  assert.deepEqual(
    problems(one("    status: supported\n    tested: {version: 0.1.0, date: 2026-01-01, scope: x}\n    issue: a/b#1\n")),
    [
      "devices[0] (ph).tested: only a tested entry has it",
      "devices[0] (ph).issue: only an in-progress entry has it",
    ]
  );
});

test("an in-progress entry needs an owner/repo#number issue", () => {
  assert.deepEqual(problems(one("    status: in-progress\n    issue: a/b#1\n")), []);
  assert.deepEqual(problems(one("    status: in-progress\n    issue: '#180'\n")), [
    'devices[0] (ph).issue: must be an issue or pull request such as "anolishq/anolis-provider-ezo#180"',
  ]);
});

test("status, type and name are checked", () => {
  assert.deepEqual(problems("devices:\n  - type: PH\n    status: done\n"), [
    'devices[0].type: must be a devices[].type value such as "rlht"',
    "devices[0].name: must be a display name",
    "devices[0].status: must be one of tested, supported, in-progress",
  ]);
});

test("a type listed twice is refused", () => {
  const text = one("    status: supported\n") + "  - type: ph\n    name: again\n    status: supported\n";
  assert.deepEqual(problems(text), ["devices[1] (ph): type is listed more than once"]);
});

test("unknown keys are refused at every level", () => {
  assert.deepEqual(problems(one("    status: supported\n    tests: yes\n") + "extra: 1\n"), [
    'top level: unknown key "extra"',
    'devices[0] (ph): unknown key "tests"',
  ]);
});

test("an empty or non-list devices is refused", () => {
  assert.deepEqual(problems("devices: []\n"), ["devices: must be a list with at least one entry"]);
  assert.deepEqual(problems("- ph\n"), ["the file must be a mapping with a devices list"]);
});

test("a YAML duplicate key is refused", () => {
  const msgs = problems(one("    status: supported\n    status: tested\n"));
  assert.equal(msgs.length, 1);
  assert.match(msgs[0], /unique/i);
});
