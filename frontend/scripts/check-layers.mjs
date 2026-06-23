#!/usr/bin/env node
// Layer-boundary guard for the single-package clean-architecture layering.
// Complements check-circular.mjs (which forbids cycles): this one forbids
// *upward* / wrong-direction import edges across layers.
//
// Dependency rule (one-way, inner <- outer):
//   shared <- domain <- core <- providers <- ui <- app
//
// Each guarded layer declares the set of layers it must NEVER import (anything
// outer than itself). Edges inward are always allowed. UI is deliberately
// forbidden from importing `providers` (infrastructure): the view reaches data
// only through the `@domain` port + kernel hooks, never the concrete adapters.

import { execFileSync } from "node:child_process";
import { closeSync, openSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Ordered longest-prefix-first: first match wins. Paths are relative to src/.
const LAYER_PREFIXES = [
  ["shared/", "shared"],
  ["domain/", "domain"],
  ["core/", "core"],
  ["providers/", "providers"],
  ["ui/", "ui"],
  ["app/", "app"],
];

function layerOf(path) {
  for (const [prefix, layer] of LAYER_PREFIXES) if (path.startsWith(prefix)) return layer;
  return "other"; // main.tsx / index.css / env shims — bare entry, unguarded
}

// Per layer: the layers it must NEVER import (everything strictly outward).
const FORBIDDEN = {
  shared: ["domain", "core", "providers", "ui", "app"],
  domain: ["core", "providers", "ui", "app"],
  core: ["providers", "ui", "app"],
  providers: ["ui", "app"],
  ui: ["providers", "app"],
  app: [],
};

// Documented exceptions: "importer↦importee" file pairs (src-relative) knowingly
// allowed despite the rule. Empty today.
const ALLOWED_EDGES = new Set([]);

const graphFile = join(tmpdir(), "planet-check-layers-madge.json");
let raw = "";
try {
  const fd = openSync(graphFile, "w");
  try {
    execFileSync(
      "npx",
      ["madge", "--extensions", "ts,tsx", "--ts-config", "tsconfig.app.json", "--json", "src/"],
      { stdio: ["ignore", fd, "inherit"] },
    );
  } catch {
    // madge can exit non-zero on warnings yet still write a full graph.
  } finally {
    closeSync(fd);
  }
  raw = readFileSync(graphFile, "utf8");
} finally {
  rmSync(graphFile, { force: true });
}

let graph;
try {
  graph = JSON.parse(raw);
} catch {
  console.error("[check-layers] madge did not produce valid JSON:");
  console.error(raw);
  process.exit(2);
}

const violations = [];
for (const [file, deps] of Object.entries(graph)) {
  if (/\.(test|spec)\.[tj]sx?$/.test(file)) continue; // tests may cross layers for fixtures
  const from = layerOf(file);
  const forbidden = FORBIDDEN[from];
  if (!forbidden) continue;
  for (const dep of deps) {
    const to = layerOf(dep);
    if (forbidden.includes(to) && !ALLOWED_EDGES.has(`${file}↦${dep}`)) {
      violations.push({ file, dep, from, to });
    }
  }
}

if (violations.length > 0) {
  console.error(`[check-layers] Found ${violations.length} layer-boundary violation(s):`);
  for (const v of violations) {
    console.error(`  ${v.from} -> ${v.to}:  ${v.file}  ->  ${v.dep}`);
  }
  console.error("");
  console.error("An inner layer is importing an outer one. Invert the dependency, or");
  console.error("— if genuinely intentional — add the edge to ALLOWED_EDGES with a comment.");
  process.exit(1);
}

console.log("[check-layers] OK — no layer-boundary violations.");
