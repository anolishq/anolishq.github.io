/**
 * fetch-metrics.mjs
 *
 * Fetches metrics.json from the release each repo in data/repos.json is
 * pinned to ("ref") and writes it to docs/public/metrics/{repo}.json for use
 * at build time. Repos marked "metrics": false publish no metrics.json.
 *
 * Authenticates with GITHUB_TOKEN when present (set in CI) to avoid the low
 * unauthenticated rate limit. On pull-request builds a missing release or
 * asset is non-fatal: the repo is skipped with a warning rather than failing
 * the whole build, so a docs-only PR cannot red-fail for reasons outside this
 * repo. On main/deploy builds any miss is still fatal so the published site is
 * complete. Called as part of the `build` script before generate-metrics.mjs.
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { repos } from "./repos.mjs";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../../");
const OUT_DIR = path.join(ROOT, "docs/public/metrics");

const REPOS = repos.filter((r) => r.metrics !== false);

// Authenticate when a token is available (CI sets GITHUB_TOKEN) to lift the
// unauthenticated rate limit that otherwise makes PR builds flaky.
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const AUTH_HEADERS = TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {};

// On pull-request builds, a missing downstream asset is non-fatal: skip the
// repo rather than fail a docs-only PR for reasons outside this repo.
const PR_BUILD = process.env.GITHUB_EVENT_NAME === "pull_request";

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "anolishq-docs-build", ...AUTH_HEADERS },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching ${url}`);
  }
  return res.text();
}

// Fail the build on a miss, unless this is a PR build — then warn and skip.
function failOrSkip(message) {
  if (PR_BUILD) {
    console.warn(`  WARN (skipped on PR build): ${message}`);
    return "skip";
  }
  console.error(`  ERROR: ${message}`);
  process.exit(1);
}

await fs.mkdir(OUT_DIR, { recursive: true });

const results = [];

for (const r of REPOS) {
  const repo = r.name;
  const tagName = r.ref;
  console.log(`Fetching metrics for ${repo} @ ${tagName}...`);

  const assetUrl = `https://github.com/${r.repo}/releases/download/${tagName}/metrics.json`;

  let metricsText;
  try {
    metricsText = await fetchText(assetUrl);
  } catch (err) {
    if (failOrSkip(`could not fetch metrics.json for ${repo} @ ${tagName}: ${err.message}`) === "skip") continue;
  }

  let metrics;
  try {
    metrics = JSON.parse(metricsText);
  } catch (err) {
    if (failOrSkip(`invalid JSON in metrics.json for ${repo} @ ${tagName}: ${err.message}`) === "skip") continue;
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
