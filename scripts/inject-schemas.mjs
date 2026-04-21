import fs from "fs/promises";
import os from "os";
import path from "path";
import { execFileSync } from "child_process";
import { fileURLToPath } from "url";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../../");
const PIN_FILE = path.join(ROOT, "schemas/anolis-version.json");
const OUT_BASE = path.join(ROOT, "docs/public/schemas/anolis");

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function fetchWithRetry(url, retries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      return buffer;
    } catch (error) {
      lastError = error;
      if (attempt === retries) break;
      await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
    }
  }

  throw lastError;
}

async function main() {
  if (!(await fileExists(PIN_FILE))) {
    fail(`schema pin file not found: ${PIN_FILE}`);
  }

  const pin = JSON.parse(await fs.readFile(PIN_FILE, "utf-8"));
  const version = pin.anolis_version;

  if (!version) {
    fail(`anolis_version not set in ${PIN_FILE}`);
  }

  console.log(`Injecting anolis schemas v${version} ...`);

  const baseUrl = `https://github.com/anolishq/anolis/releases/download/v${version}`;
  const schemas = [
    {
      tarball: `anolis-${version}-runtime-config-schema.tar.gz`,
      member: "schemas/runtime/runtime-config.schema.json",
      output: "runtime/runtime-config.schema.json",
    },
    {
      tarball: `anolis-${version}-machine-profile-schema.tar.gz`,
      member: "schemas/machine/machine-profile.schema.json",
      output: "machine/machine-profile.schema.json",
    },
    {
      tarball: `anolis-${version}-telemetry-schema.tar.gz`,
      member: "schemas/telemetry/telemetry-timeseries.schema.v1.json",
      output: "telemetry/telemetry-timeseries.schema.v1.json",
    },
    {
      tarball: `anolis-${version}-runtime-http-schema.tar.gz`,
      member: "schemas/http/runtime-http.openapi.v0.yaml",
      output: "http/runtime-http.openapi.v0.yaml",
    },
  ];

  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "anolis-schemas-"));

  try {
    for (const schema of schemas) {
      const url = `${baseUrl}/${schema.tarball}`;
      const tarballPath = path.join(tempRoot, schema.tarball);
      const extractDir = path.join(tempRoot, `extract-${schema.tarball.replace(/\.tar\.gz$/, "")}`);
      const outputFile = path.join(OUT_BASE, schema.output);

      console.log(`  Fetching ${url} ...`);
      const tarball = await fetchWithRetry(url);
      await fs.writeFile(tarballPath, tarball);

      await fs.mkdir(extractDir, { recursive: true });
      execFileSync("tar", ["-xzf", tarballPath, "-C", extractDir], { stdio: "inherit" });

      const sourceFile = path.join(extractDir, ...schema.member.split("/"));
      if (!(await fileExists(sourceFile))) {
        fail(`expected member '${schema.member}' not found in ${schema.tarball}`);
      }

      await fs.mkdir(path.dirname(outputFile), { recursive: true });
      await fs.copyFile(sourceFile, outputFile);
      console.log(`  -> ${path.relative(ROOT, outputFile).split(path.sep).join("/")}`);
    }
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }

  console.log("");
  console.log(`Schema injection complete (anolis v${version})`);
}

await main();