#!/usr/bin/env node
// Layer-boundary guard for the single-package clean-architecture layering.
// Complements check-circular.mjs (which forbids cycles): this one forbids
// *upward* / wrong-direction import edges across layers.
//
// Dependency rule (one-way, inner <- outer):
//   shared <- domain <- core/contexts <- providers/infrastructure <- ui <- app
//
// Each guarded layer declares the set of layers it must NEVER import (anything
// outer than itself). Edges inward are always allowed. UI is deliberately
// forbidden from importing `providers` (infrastructure): the view reaches data
// through `@contexts/*` public contracts + runtime hooks, never concrete adapters.

import { execFileSync } from "node:child_process";
import { closeSync, openSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Ordered longest-prefix-first: first match wins. Paths are relative to src/.
const LAYER_PREFIXES = [
  ["shared/", "shared"],
  ["domain/", "domain"],
  ["core/", "core"],
  ["contexts/", "core"],
  ["providers/", "providers"],
  ["infrastructure/", "providers"],
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

// Per bounded context: the internal module paths that UI/app must reach through
// `@contexts/<name>` instead. One row per context — the `@core`-root symbol
// re-export escape is caught once, generically, by CONTEXT_CONTRACT_SYMBOLS.
const CONTEXT_SURFACES = [
  {
    context: "Playback",
    internals: [
      "@domain/ports/playback",
      "@domain/model/(?:play-queue|playback-intent|playback-availability|repeat|volume)",
      "@core/application/PlaybackService",
      "@core/plugin/(?:playback|playqueue|progress|volume)",
    ],
  },
  {
    context: "Catalog",
    internals: [
      "@domain/ports/catalog",
      "@domain/model/(?:album|artist|playlist|music-video|personalized|search|chart)",
      "@core/application/MediaService",
    ],
  },
  {
    context: "Identity",
    internals: [
      "@domain/ports/(?:auth|credentials)",
      "@domain/model/(?:account|auth)",
      "@core/application/IdentityService",
    ],
  },
  {
    context: "Engagement",
    internals: [
      "@domain/ports/engagement",
      "@domain/model/comment",
      "@core/application/EngagementService",
    ],
  },
];

// Context contracts that must never be pulled from the `@core` root barrel.
const CONTEXT_CONTRACT_SYMBOLS = [
  "MediaService",
  "PlaybackService",
  "IdentityService",
  "EngagementService",
  "LibraryService",
  "QueryResult",
  "ProviderId",
  "TrackKey",
];

/** True when the source imports from any of the given module specifiers. */
function importsAnyOf(source, specifiers) {
  return new RegExp(`from\\s+["'](?:${specifiers.join("|")})["']`).test(source);
}

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
const architectureViolations = [];
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
    if (dep.startsWith("contexts/")) {
      const [, contextName, entry] = dep.split("/");
      const sameContext = file.startsWith(`contexts/${contextName}/`);
      if (!sameContext && entry !== "index.ts") {
        architectureViolations.push(`${file}: deep-imports context internals from ${dep}`);
      }
    }
  }

  const source = readFileSync(join("src", file), "utf8");
  if (/\b(?:MusicProvider|ProviderCapability|MUSIC_PROVIDER)\b/.test(source)) {
    architectureViolations.push(`${file}: legacy provider capability API`);
  }
  if (
    /from\s+["']@core\/(?:catalog|playback|identity|engagement|local-library|contracts|account-library)(?:\/[^"']*)?["']/.test(
      source,
    )
  ) {
    architectureViolations.push(`${file}: imports a removed pre-context public path`);
  }
  if (/\bprovider:changed\b/.test(source)) {
    architectureViolations.push(`${file}: uses the removed provider-change event`);
  }
  if (/from\s+["']@contexts\/[^/"']+\//.test(source)) {
    architectureViolations.push(`${file}: bypasses a bounded-context public index`);
  }
  // `@contexts/*` publishes domain/core internals to the layers ABOVE. An inner
  // file importing it would route back through its own public surface, so the
  // barrel would look like a dependency of the code it re-exports.
  if (
    (file.startsWith("domain/") || file.startsWith("core/")) &&
    /from\s+["']@contexts\//.test(source)
  ) {
    architectureViolations.push(`${file}: inner layer imports its own @contexts surface`);
  }
  if (
    /from\s+["']@wailsjs\//.test(source) &&
    !file.startsWith("providers/local/") &&
    file !== "ui/infra/localLibrary.ts"
  ) {
    architectureViolations.push(`${file}: Wails import is outside an approved platform adapter`);
  }
  if (
    file.startsWith("core/") &&
    /\bnew\s+(?:globalThis\.)?(?:Audio|AudioContext)\s*\(/.test(source)
  ) {
    architectureViolations.push(`${file}: core constructs a browser audio resource directly`);
  }
  if (
    (file.startsWith("domain/") || file.startsWith("core/application/")) &&
    /\b(?:Date\.now|performance\.now|Math\.random)\s*\(/.test(source)
  ) {
    architectureViolations.push(
      `${file}: domain/application reads an ambient clock or entropy source`,
    );
  }
  if (
    file.startsWith("core/application/") &&
    file !== "core/application/Engine.ts" &&
    /\bMusicSource\b/.test(source)
  ) {
    architectureViolations.push(`${file}: application use case depends on MusicSource composition`);
  }
  if (file.startsWith("ui/") || file.startsWith("app/")) {
    if (/from\s+["']@domain(?:\/[^"']+)?["']/.test(source)) {
      architectureViolations.push(`${file}: bypasses a bounded-context public contract`);
    }
    if (
      new RegExp(
        `import\\s+(?:type\\s+)?\\{[^}]*\\b(?:${CONTEXT_CONTRACT_SYMBOLS.join("|")})\\b[^}]*\\}\\s+from\\s+["']@core["']`,
        "s",
      ).test(source)
    ) {
      architectureViolations.push(`${file}: imports a context contract from the @core root`);
    }
    for (const { context, internals } of CONTEXT_SURFACES) {
      if (importsAnyOf(source, internals)) {
        architectureViolations.push(`${file}: bypasses the ${context} Context public API`);
      }
    }
    if (
      file !== "ui/infra/localLibrary.ts" &&
      /from\s+["']@wailsjs\/go\/backend\/Library["']/.test(source)
    ) {
      architectureViolations.push(`${file}: bypasses the Local Library Wails adapter`);
    }
  }
}

if (violations.length > 0 || architectureViolations.length > 0) {
  console.error(`[check-layers] Found ${violations.length} layer-boundary violation(s):`);
  for (const v of violations) {
    console.error(`  ${v.from} -> ${v.to}:  ${v.file}  ->  ${v.dep}`);
  }
  for (const violation of architectureViolations) {
    console.error(`  architecture: ${violation}`);
  }
  console.error("");
  console.error("An inner layer is importing an outer one. Invert the dependency, or");
  console.error("— if genuinely intentional — add the edge to ALLOWED_EDGES with a comment.");
  process.exit(1);
}

console.log("[check-layers] OK — no layer or provider-boundary violations.");
