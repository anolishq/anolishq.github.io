import fs from "fs/promises";
import path from "path";

// Patterns from a repo's <docsPath>/.indexignore, one per line. A pattern is
// a path relative to <docsPath> ("TODO.md", "rfcs/review.md"); a leading "**/"
// matches that name at any depth. A trailing slash matches directories only.
// Blank lines and lines starting with "#" are ignored.
export async function readIndexIgnore(docsRoot) {
  let text;
  try {
    text = await fs.readFile(path.join(docsRoot, ".indexignore"), "utf-8");
  } catch {
    return [];
  }
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const dirOnly = l.endsWith("/");
      const anywhere = l.startsWith("**/");
      const pat = l.replace(/^\*\*\//, "").replace(/\/$/, "");
      return { pat, dirOnly, anywhere };
    });
}

export function ignored(rules, relPath, isDir) {
  const base = path.posix.basename(relPath);
  return rules.some(
    (r) =>
      (!r.dirOnly || isDir) &&
      (r.anywhere ? base === r.pat : relPath === r.pat)
  );
}
