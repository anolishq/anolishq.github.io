/**
 * fetch-metrics.mjs
 *
 * Fetches metrics.json from the latest release of each anolishq repo and
 * writes them to docs/public/metrics/{repo}.json for use at build time.
 *
 * Runs unauthenticated against public GitHub APIs — no token required.
 * Called as part of the `build` script before generate-metrics.mjs.
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../../");
const OUT_DIR = path.join(ROOT, "docs/public/metrics");

const REPOS = [
  "anolis",
  "anolis-protocol",
  "anolis-provider-bread",
  "anolis-provider-ezo",
  "anolis-provider-sim",
  "anolis-workbench",
  "fluxgraph",
];

const GITHUB_API = "https://api.github.com";

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "anolishq-docs-build",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching ${url}`);
  }
  return res.json();
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "anolishq-docs-build" },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching ${url}`);
  }
  return res.text();
}

await fs.mkdir(OUT_DIR, { recursive: true });

const results = [];

for (const repo of REPOS) {
  console.log(`Fetching metrics for ${repo}...`);

  let tagName;
  try {
    const release = await fetchJson(
      `${GITHUB_API}/repos/anolishq/${repo}/releases/latest`
    );
    tagName = release.tag_name;
  } catch (err) {
    console.error(`  ERROR: could not fetch latest release for ${repo}: ${err.message}`);
    process.exit(1);
  }

  const assetUrl = `https://github.com/anolishq/${repo}/releases/download/${tagName}/metrics.json`;

  let metricsText;
  try {
    metricsText = await fetchText(assetUrl);
  } catch (err) {
    console.error(`  ERROR: could not fetch metrics.json for ${repo} @ ${tagName}: ${err.message}`);
    process.exit(1);
  }

  let metrics;
  try {
    metrics = JSON.parse(metricsText);
  } catch (err) {
    console.error(`  ERROR: invalid JSON in metrics.json for ${repo} @ ${tagName}: ${err.message}`);
    process.exit(1);
  }

  const outFile = path.join(OUT_DIR, `${repo}.json`);
  await fs.writeFile(outFile, JSON.stringify(metrics, null, 2));
  console.log(`  ✓ ${repo} @ ${tagName} → docs/public/metrics/${repo}.json`);

  results.push({ repo, tag: tagName });
}

// Write a manifest so generate-metrics.mjs knows what was fetched without
// re-reading each file.
const manifest = {
  fetched_at: new Date().toISOString(),
  repos: results,
};
await fs.writeFile(
  path.join(OUT_DIR, "_manifest.json"),
  JSON.stringify(manifest, null, 2)
);

console.log(`\nFetched metrics for ${results.length} repos.`);
