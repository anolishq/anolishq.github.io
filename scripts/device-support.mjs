import fs from "fs/promises";
import { fileURLToPath } from "url";
import { parseDocument } from "yaml";

// Reads a provider's docs/device-support.yaml. The format is documented in
// docs/contributing/device-support.md; keep the two in step.

export const STATUSES = ["tested", "supported", "in-progress"];

const DEVICE_KEYS = ["type", "name", "status", "tested", "issue", "note"];
const TESTED_KEYS = ["version", "date", "scope"];
const TYPE_RE = /^[a-z][a-z0-9_]*$/;
const VERSION_RE = /^\d+\.\d+\.\d+$/;
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISSUE_RE = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+#[1-9]\d*$/;

const isMap = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const isText = (v) => typeof v === "string" && v.trim() !== "";

function isRealDate(s) {
  const m = DATE_RE.exec(s);
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
}

function unknownKeys(obj, allowed, where, errors) {
  for (const k of Object.keys(obj)) {
    if (!allowed.includes(k)) errors.push(`${where}: unknown key "${k}"`);
  }
}

function checkTested(t, where, errors) {
  if (!isMap(t)) {
    errors.push(`${where}.tested: must be a mapping with version, date and scope`);
    return;
  }
  unknownKeys(t, TESTED_KEYS, `${where}.tested`, errors);
  if (typeof t.version !== "string" || !VERSION_RE.test(t.version)) {
    errors.push(`${where}.tested.version: must be a provider release such as "0.12.0"`);
  }
  if (typeof t.date !== "string" || !isRealDate(t.date)) {
    errors.push(`${where}.tested.date: must be a date written YYYY-MM-DD`);
  }
  if (!isText(t.scope)) errors.push(`${where}.tested.scope: must say what was run`);
}

function checkDevice(d, i, seen, errors) {
  let where = `devices[${i}]`;
  if (!isMap(d)) {
    errors.push(`${where}: must be a mapping`);
    return;
  }
  if (typeof d.type === "string" && TYPE_RE.test(d.type)) {
    where = `devices[${i}] (${d.type})`;
    if (seen.has(d.type)) errors.push(`${where}: type is listed more than once`);
    seen.add(d.type);
  } else {
    errors.push(`${where}.type: must be a devices[].type value such as "rlht"`);
  }
  unknownKeys(d, DEVICE_KEYS, where, errors);
  if (!isText(d.name)) errors.push(`${where}.name: must be a display name`);
  if (!STATUSES.includes(d.status)) {
    errors.push(`${where}.status: must be one of ${STATUSES.join(", ")}`);
  }

  if (d.status === "tested") checkTested(d.tested, where, errors);
  else if ("tested" in d) errors.push(`${where}.tested: only a tested entry has it`);

  if (d.status === "in-progress") {
    if (typeof d.issue !== "string" || !ISSUE_RE.test(d.issue)) {
      errors.push(`${where}.issue: must be an issue or pull request such as "anolishq/anolis-provider-ezo#180"`);
    }
  } else if ("issue" in d) {
    errors.push(`${where}.issue: only an in-progress entry has it`);
  }

  if ("note" in d && !isText(d.note)) errors.push(`${where}.note: must be text when present`);
}

// Returns the parsed file, or throws one Error listing every problem found.
export function parseDeviceSupport(text, source = "device-support.yaml") {
  const doc = parseDocument(text);
  // The parser's messages carry a source excerpt after the first line.
  const errors = doc.errors.map((e) => e.message.split("\n")[0]);
  if (errors.length === 0) {
    const data = doc.toJS();
    if (!isMap(data)) {
      errors.push("the file must be a mapping with a devices list");
    } else {
      unknownKeys(data, ["devices"], "top level", errors);
      if (!Array.isArray(data.devices) || data.devices.length === 0) {
        errors.push("devices: must be a list with at least one entry");
      } else {
        const seen = new Set();
        data.devices.forEach((d, i) => checkDevice(d, i, seen, errors));
      }
    }
    if (errors.length === 0) return data;
  }
  throw new Error(`${source}:\n  ${errors.join("\n  ")}`);
}

// node scripts/device-support.mjs <file>...  checks each file, exit 1 on any problem.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const files = process.argv.slice(2);
  if (files.length === 0) {
    console.error("usage: node scripts/device-support.mjs <device-support.yaml>...");
    process.exit(2);
  }
  let failed = false;
  for (const f of files) {
    try {
      const { devices } = parseDeviceSupport(await fs.readFile(f, "utf-8"), f);
      console.log(`${f}: ok, ${devices.length} device type(s)`);
    } catch (e) {
      console.error(e.message);
      failed = true;
    }
  }
  process.exit(failed ? 1 : 0);
}
