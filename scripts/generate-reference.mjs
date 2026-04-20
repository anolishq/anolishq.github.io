import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../../");
const OUT = path.join(ROOT, "docs/reference");

await fs.rm(OUT, { recursive: true, force: true });
await fs.mkdir(OUT, { recursive: true });

// Phase 1 stub — extend in Phase 2 with protoc-gen-doc for anolis-protocol
// and OpenAPI rendering for anolis when a spec exists in docs/http/
await fs.writeFile(
  path.join(OUT, "index.md"),
  "# Reference\n\nGenerated protocol and API reference will appear here.\n"
);

console.log("Reference generation complete (stub).");
