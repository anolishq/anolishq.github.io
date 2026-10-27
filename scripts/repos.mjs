// Loads data/repos.json, the single list of source repositories and the
// release tag each one is published from.

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../../");
export const REPOS_FILE = path.join(ROOT, "data/repos.json");

export const repos = JSON.parse(await fs.readFile(REPOS_FILE, "utf-8"));

for (const r of repos) {
  if (!r.ref) {
    console.error(`ERROR: ${r.name} has no "ref" in ${REPOS_FILE}`);
    process.exit(1);
  }
}

export function repoByName(name) {
  const r = repos.find((x) => x.name === name);
  if (!r) {
    console.error(`ERROR: ${name} is not listed in ${REPOS_FILE}`);
    process.exit(1);
  }
  return r;
}

// "v0.1.55" -> "0.1.55"
export function versionOf(name) {
  return repoByName(name).ref.replace(/^v/, "");
}
