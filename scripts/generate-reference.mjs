import fs from "fs/promises";
import path from "path";
import { execFileSync } from "child_process";
import { existsSync } from "fs";
import { fileURLToPath } from "url";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../../");
const TMP = path.join(ROOT, ".tmp");
const OUT = path.join(ROOT, "docs/reference");

const repos = JSON.parse(
  await fs.readFile(path.join(ROOT, "data/repos.json"), "utf-8")
);

const specRepos = repos.filter(
  (r) => typeof r.specPath === "string" && r.specPath.trim().length > 0
);

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function walkFiles(rootDir) {
  const out = [];

  async function walk(current) {
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const next = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(next);
      } else {
        out.push(next);
      }
    }
  }

  await walk(rootDir);
  return out;
}

function relPosix(base, absPath) {
  return path.relative(base, absPath).split(path.sep).join("/");
}

function ensureCheckout(repo) {
  const checkout = path.join(TMP, repo.name);
  if (!existsSync(checkout)) {
    console.log(`Reference: cloning ${repo.repo}`);
    execFileSync("git", ["clone", "--depth=1", `https://github.com/${repo.repo}.git`, checkout], {
      stdio: "inherit",
    });
  }
  return checkout;
}

function shortSha(repoRoot) {
  try {
    return execFileSync("git", ["-C", repoRoot, "rev-parse", "--short", "HEAD"], {
      encoding: "utf-8",
    }).trim();
  } catch {
    return "unknown";
  }
}

function parseOpenApi(yamlText) {
  const lines = yamlText.split(/\r?\n/);

  let title = "Runtime HTTP API";
  let version = "unknown";

  const titleMatch = yamlText.match(/^\s*title:\s*(.+)\s*$/m);
  if (titleMatch) title = titleMatch[1].trim().replace(/^["']|["']$/g, "");

  const versionMatch = yamlText.match(/^\s*version:\s*(.+)\s*$/m);
  if (versionMatch) version = versionMatch[1].trim().replace(/^["']|["']$/g, "");

  const pathMethods = new Map();
  let inPaths = false;
  let currentPath = null;

  for (const line of lines) {
    if (!inPaths) {
      if (/^paths:\s*$/.test(line)) {
        inPaths = true;
      }
      continue;
    }

    if (/^\S/.test(line)) break;

    const pathMatch = /^ {2}(\/[^:]+):\s*$/.exec(line);
    if (pathMatch) {
      currentPath = pathMatch[1];
      if (!pathMethods.has(currentPath)) pathMethods.set(currentPath, new Set());
      continue;
    }

    const methodMatch = /^ {4}(get|put|post|delete|patch|options|head|trace):\s*$/.exec(line);
    if (methodMatch && currentPath) {
      pathMethods.get(currentPath).add(methodMatch[1].toUpperCase());
    }
  }

  const schemas = [];
  let inComponents = false;
  let inSchemas = false;

  for (const line of lines) {
    if (!inComponents) {
      if (/^components:\s*$/.test(line)) inComponents = true;
      continue;
    }

    if (!inSchemas) {
      if (/^ {2}schemas:\s*$/.test(line)) {
        inSchemas = true;
      } else if (/^ {2}\S/.test(line)) {
        continue;
      }
      continue;
    }

    if (/^ {2}\S/.test(line)) break;

    const schemaMatch = /^ {4}([A-Za-z0-9_.-]+):\s*$/.exec(line);
    if (schemaMatch) schemas.push(schemaMatch[1]);
  }

  return {
    title,
    version,
    pathMethods: Array.from(pathMethods.entries())
      .map(([p, methods]) => ({ path: p, methods: Array.from(methods).sort() }))
      .sort((a, b) => a.path.localeCompare(b.path)),
    schemas: Array.from(new Set(schemas)).sort(),
  };
}

function protoSymbols(text) {
  const packageName = text.match(/^\s*package\s+([^;]+);/m)?.[1] ?? "unknown";

  const messages = [...text.matchAll(/^\s*message\s+([A-Za-z0-9_]+)\s*\{/gm)].map((m) => m[1]);
  const enums = [...text.matchAll(/^\s*enum\s+([A-Za-z0-9_]+)\s*\{/gm)].map((m) => m[1]);
  const services = [...text.matchAll(/^\s*service\s+([A-Za-z0-9_]+)\s*\{/gm)].map((m) => m[1]);
  const rpcs = [...text.matchAll(/^\s*rpc\s+([A-Za-z0-9_]+)\s*\(/gm)].map((m) => m[1]);

  return { packageName, messages, enums, services, rpcs };
}

async function generateAnolisRuntimeReference(repo) {
  const repoRoot = ensureCheckout(repo);
  const specRoot = path.join(repoRoot, repo.specPath);

  if (!(await exists(specRoot))) {
    fail(`Reference input missing for ${repo.name}: ${repo.specPath}`);
  }

  const allFiles = await walkFiles(repoRoot);
  const openApiCandidates = allFiles
    .filter((f) => /\.(ya?ml|json)$/i.test(f))
    .filter((f) => /openapi/i.test(path.basename(f)))
    .filter((f) => /schemas[\\/]+http|docs[\\/]+http/i.test(f))
    .sort((a, b) => a.localeCompare(b));

  if (openApiCandidates.length === 0) {
    fail(
      `No OpenAPI file found for ${repo.name}. Checked repo for filenames containing 'openapi' under HTTP-related paths.`
    );
  }

  const openApiFile = openApiCandidates[0];
  const openApiText = await fs.readFile(openApiFile, "utf-8");
  const summary = parseOpenApi(openApiText);

  const specFiles = (await walkFiles(specRoot))
    .filter((f) => /\.(md|ya?ml|json)$/i.test(f))
    .sort((a, b) => a.localeCompare(b));

  const repoSha = shortSha(repoRoot);
  const openApiRel = relPosix(repoRoot, openApiFile);

  const endpointRows =
    summary.pathMethods.length === 0
      ? "_No endpoints parsed from OpenAPI._"
      : [
          "| Path | Methods |",
          "|---|---|",
          ...summary.pathMethods.map((p) => `| \`${p.path}\` | ${p.methods.join(", ")} |`),
        ].join("\n");

  const schemaRows =
    summary.schemas.length === 0
      ? "_No schemas parsed from OpenAPI components.schemas._"
      : [
          "| Schema |",
          "|---|",
          ...summary.schemas.map((s) => `| \`${s}\` |`),
        ].join("\n");

  const sourcesRows =
    specFiles.length === 0
      ? "_No files found under configured spec path._"
      : [
          "| Source File |",
          "|---|",
          ...specFiles.map((f) => {
            const rel = relPosix(repoRoot, f);
            return `| [\`${rel}\`](https://github.com/${repo.repo}/blob/main/${rel}) |`;
          }),
        ].join("\n");

  const body = [
    "# Runtime HTTP API Reference",
    "",
    `Generated from [${repo.repo}](https://github.com/${repo.repo}) @ \`${repoSha}\`. ` +
      `Configured spec path: \`${repo.specPath}\`.`,
    "",
    "## OpenAPI Summary",
    "",
    `- Title: **${summary.title}**`,
    `- Version: **${summary.version}**`,
    `- Source: [\`${openApiRel}\`](https://github.com/${repo.repo}/blob/main/${openApiRel})`,
    "",
    "## Endpoints",
    "",
    endpointRows,
    "",
    "## Schemas",
    "",
    schemaRows,
    "",
    "## Reference Sources",
    "",
    sourcesRows,
    "",
  ].join("\n");

  return {
    fileName: "runtime-http-api.md",
    title: "Runtime HTTP API",
    description: `OpenAPI-derived endpoint and schema summary from ${repo.name}.`,
    body,
  };
}

async function generateAdppReference(repo) {
  const repoRoot = ensureCheckout(repo);
  const specRoot = path.join(repoRoot, repo.specPath);

  if (!(await exists(specRoot))) {
    fail(`Reference input missing for ${repo.name}: ${repo.specPath}`);
  }

  const protoFiles = (await walkFiles(specRoot))
    .filter((f) => f.endsWith(".proto"))
    .sort((a, b) => a.localeCompare(b));

  if (protoFiles.length === 0) {
    fail(`No .proto files found for ${repo.name} under ${repo.specPath}`);
  }

  const fileSummaries = [];
  const allMessages = new Set();
  const allEnums = new Set();
  const allServices = new Set();
  const allRpcs = new Set();

  for (const protoFile of protoFiles) {
    const text = await fs.readFile(protoFile, "utf-8");
    const symbols = protoSymbols(text);
    const rel = relPosix(repoRoot, protoFile);

    symbols.messages.forEach((m) => allMessages.add(m));
    symbols.enums.forEach((e) => allEnums.add(e));
    symbols.services.forEach((s) => allServices.add(s));
    symbols.rpcs.forEach((r) => allRpcs.add(r));

    fileSummaries.push({
      rel,
      packageName: symbols.packageName,
      messages: symbols.messages,
      enums: symbols.enums,
      services: symbols.services,
      rpcs: symbols.rpcs,
    });
  }

  const repoSha = shortSha(repoRoot);

  const fileTable = [
    "| Proto File | Package | Messages | Enums | Services | RPCs |",
    "|---|---|---:|---:|---:|---:|",
    ...fileSummaries.map(
      (f) =>
        `| [\`${f.rel}\`](https://github.com/${repo.repo}/blob/main/${f.rel}) | \`${f.packageName}\` | ` +
        `${f.messages.length} | ${f.enums.length} | ${f.services.length} | ${f.rpcs.length} |`
    ),
  ].join("\n");

  const symbolList = (title, values) =>
    values.length === 0 ? `### ${title}\n\n_None found._` : `### ${title}\n\n${values.map((v) => `- \`${v}\``).join("\n")}`;

  const body = [
    "# ADPP Protocol Reference",
    "",
    `Generated from [${repo.repo}](https://github.com/${repo.repo}) @ \`${repoSha}\`. ` +
      `Configured spec path: \`${repo.specPath}\`.`,
    "",
    "## Overview",
    "",
    `- Proto files: **${protoFiles.length}**`,
    `- Messages: **${allMessages.size}**`,
    `- Enums: **${allEnums.size}**`,
    `- Services: **${allServices.size}**`,
    `- RPCs: **${allRpcs.size}**`,
    "",
    "## Files",
    "",
    fileTable,
    "",
    symbolList("Messages", Array.from(allMessages).sort()),
    "",
    symbolList("Enums", Array.from(allEnums).sort()),
    "",
    symbolList("Services", Array.from(allServices).sort()),
    "",
    symbolList("RPCs", Array.from(allRpcs).sort()),
    "",
  ].join("\n");

  return {
    fileName: "adpp-protocol.md",
    title: "ADPP Protocol",
    description: `Proto-derived symbol inventory from ${repo.name}.`,
    body,
  };
}

async function generateGenericSpecReference(repo) {
  const repoRoot = ensureCheckout(repo);
  const specRoot = path.join(repoRoot, repo.specPath);

  if (!(await exists(specRoot))) {
    fail(`Reference input missing for ${repo.name}: ${repo.specPath}`);
  }

  const files = (await walkFiles(specRoot)).sort((a, b) => a.localeCompare(b));
  const repoSha = shortSha(repoRoot);

  const rows =
    files.length === 0
      ? "_No files found._"
      : [
          "| File |",
          "|---|",
          ...files.map((f) => {
            const rel = relPosix(repoRoot, f);
            return `| [\`${rel}\`](https://github.com/${repo.repo}/blob/main/${rel}) |`;
          }),
        ].join("\n");

  return {
    fileName: `${repo.name}-reference.md`,
    title: `${repo.name} Reference`,
    description: `Source inventory from ${repo.name}.`,
    body: [
      `# ${repo.name} Reference`,
      "",
      `Generated from [${repo.repo}](https://github.com/${repo.repo}) @ \`${repoSha}\`. ` +
        `Configured spec path: \`${repo.specPath}\`.`,
      "",
      "## Files",
      "",
      rows,
      "",
    ].join("\n"),
  };
}

if (specRepos.length === 0) {
  fail("No repositories with specPath configured in data/repos.json");
}

await fs.rm(OUT, { recursive: true, force: true });
await fs.mkdir(OUT, { recursive: true });

const pages = [];

for (const repo of specRepos) {
  console.log(`Reference: generating for ${repo.name}`);
  if (repo.name === "anolis") {
    pages.push(await generateAnolisRuntimeReference(repo));
  } else if (repo.name === "anolis-protocol") {
    pages.push(await generateAdppReference(repo));
  } else {
    pages.push(await generateGenericSpecReference(repo));
  }
}

for (const page of pages) {
  await fs.writeFile(path.join(OUT, page.fileName), page.body, "utf-8");
}

const generatedAt = new Date().toISOString();
const indexBody = [
  "# Reference",
  "",
  "Generated protocol and API reference pages built from source repositories.",
  "",
  `Generated at: \`${generatedAt}\``,
  "",
  "| Reference | Description |",
  "|---|---|",
  ...pages.map((p) => `| [${p.title}](/reference/${p.fileName.replace(/\.md$/, "")}) | ${p.description} |`),
  "",
  "## Inputs",
  "",
  ...specRepos.map((r) => `- \`${r.name}\`: repo \`${r.repo}\`, specPath \`${r.specPath}\``),
  "",
].join("\n");

await fs.writeFile(path.join(OUT, "index.md"), indexBody, "utf-8");

console.log(`Reference generation complete. Pages: ${pages.length}`);
