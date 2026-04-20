import fs from "fs/promises";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../../");
const TMP = path.join(ROOT, ".tmp");
const OUT = path.join(ROOT, "docs/repos");

const repos = JSON.parse(
  await fs.readFile(path.join(ROOT, "data/repos.json"), "utf-8")
);

// Exclude files that are tooling artifacts, not documentation content
const EXCLUDE = new Set(["Doxyfile"]);

async function copyDocs(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    if (EXCLUDE.has(entry.name)) continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDocs(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function hasEntryPoint(dir) {
  for (const name of ["index.md", "README.md"]) {
    try {
      await fs.access(path.join(dir, name));
      return true;
    } catch {
      // continue
    }
  }
  return false;
}

// Preserve static index.md (committed to repo, not generated)
const staticIndex = path.join(OUT, "index.md");
let savedIndex = null;
try {
  savedIndex = await fs.readFile(staticIndex, "utf-8");
} catch {
  // no static index to preserve
}

// Clean previous outputs
await fs.rm(TMP, { recursive: true, force: true });
await fs.rm(OUT, { recursive: true, force: true });
await fs.mkdir(TMP, { recursive: true });
await fs.mkdir(OUT, { recursive: true });

// Restore static index.md
if (savedIndex !== null) {
  await fs.writeFile(staticIndex, savedIndex);
}

for (const r of repos) {
  console.log(`Aggregating: ${r.name}`);

  const cloneTarget = path.join(TMP, r.name);
  execSync(
    `git clone --depth=1 https://github.com/${r.repo}.git ${cloneTarget}`,
    { stdio: "inherit" }
  );

  const srcDocs = path.join(cloneTarget, r.docsPath);
  try {
    await fs.access(srcDocs);
  } catch {
    console.error(`ERROR: ${r.repo} is missing /${r.docsPath} — aborting.`);
    process.exit(1);
  }

  const dest = path.join(OUT, r.name);
  await copyDocs(srcDocs, dest);

  // Generate a minimal stub if no entry point exists
  if (!(await hasEntryPoint(dest))) {
    console.warn(
      `  Warning: ${r.name} has no index.md or README.md — generating stub.`
    );
    await fs.writeFile(
      path.join(dest, "index.md"),
      `# ${r.name}\n\nDocumentation for [${r.repo}](https://github.com/${r.repo}).\n`
    );
  }
}

console.log("Aggregation complete.");
