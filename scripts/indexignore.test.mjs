import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { readIndexIgnore, ignored } from "./indexignore.mjs";

async function rulesFrom(text) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "indexignore-"));
  await fs.writeFile(path.join(dir, ".indexignore"), text);
  return readIndexIgnore(dir);
}

test("patterns are relative to the docs root", async () => {
  const rules = await rulesFrom("README.md\nrfcs/review.md\n");
  assert.equal(ignored(rules, "README.md", false), true);
  assert.equal(ignored(rules, "deploy/README.md", false), false);
  assert.equal(ignored(rules, "rfcs/review.md", false), true);
  assert.equal(ignored(rules, "other/review.md", false), false);
});

test("a leading **/ matches at any depth", async () => {
  const rules = await rulesFrom("**/notes.md\n");
  assert.equal(ignored(rules, "notes.md", false), true);
  assert.equal(ignored(rules, "a/b/notes.md", false), true);
});

test("a trailing slash matches directories only", async () => {
  const rules = await rulesFrom("archive/\n");
  assert.equal(ignored(rules, "archive", true), true);
  assert.equal(ignored(rules, "archive", false), false);
  assert.equal(ignored(rules, "x/archive", true), false);
});

test("comments and blank lines are ignored", async () => {
  const rules = await rulesFrom("# README.md\n\n");
  assert.deepEqual(rules, []);
});

test("a missing file ignores nothing", async () => {
  assert.deepEqual(await readIndexIgnore("/nonexistent"), []);
});
