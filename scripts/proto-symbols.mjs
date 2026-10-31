// Symbols declared in a .proto file, for the ADPP reference page. Messages and
// enums are named by their nesting (`DeviceHealth.State`), so two nested types
// with the same short name stay distinct.

function stripComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

export function protoSymbols(raw) {
  const text = stripComments(raw);
  const packageName = text.match(/^\s*package\s+([^;]+);/m)?.[1] ?? "unknown";

  const messages = [];
  const enums = [];
  const services = [];
  const rpcs = [...text.matchAll(/^\s*rpc\s+([A-Za-z0-9_]+)\s*\(/gm)].map((m) => m[1]);

  // Walk declarations and braces in order, keeping the enclosing declaration
  // names on a stack; a brace without a declaration (an option block) pushes
  // null so the closing brace stays balanced.
  const stack = [];
  const token = /\b(message|enum|service)\s+([A-Za-z0-9_]+)\s*\{|\{|\}/g;
  for (const m of text.matchAll(token)) {
    if (m[0] === "}") {
      stack.pop();
      continue;
    }
    if (m[0] === "{") {
      stack.push(null);
      continue;
    }
    const [, kind, name] = m;
    const qualified = [...stack.filter(Boolean), name].join(".");
    if (kind === "message") messages.push(qualified);
    else if (kind === "enum") enums.push(qualified);
    else services.push(qualified);
    stack.push(name);
  }

  return { packageName, messages, enums, services, rpcs };
}
