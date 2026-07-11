#!/usr/bin/env node
// Run madge --circular and fail on any cycle not on the allowlist.
// Allowlist entries are full file-sets of a known, benign (type-only) cycle.

import { execFileSync } from "node:child_process";

// Each entry is the full set of files in a known cycle, sorted. A reported
// cycle matches if its sorted file list deep-equals one of these.
const ALLOWED = [
  // The catalog entities mutually reference each other purely through
  // `import type` (a Track has an Album + Artists; an Album has Tracks +
  // Artists; an Artist has top Tracks). These are erased at compile time —
  // zero runtime cycle. madge can't distinguish type from value imports, so
  // it flags them. Breaking the cycle would mean weakening the domain model.
  ["domain/model/album.ts", "domain/model/artist.ts", "domain/model/track.ts"],
  ["domain/model/album.ts", "domain/model/track.ts"],
  ["domain/model/album.ts", "domain/model/artist.ts"], // Artist now lists its Albums; Album lists its Artists
];

const allowedKeys = new Set(ALLOWED.map((cycle) => [...cycle].sort().join("|")));

let raw;
try {
  raw = execFileSync(
    "npx",
    [
      "madge",
      "--circular",
      "--extensions",
      "ts,tsx",
      "--ts-config",
      "tsconfig.app.json",
      "--json",
      "src/",
    ],
    { encoding: "utf8" },
  );
} catch (err) {
  raw = err.stdout?.toString() ?? "";
}

let cycles;
try {
  cycles = JSON.parse(raw);
} catch {
  console.error("[check-circular] madge did not produce valid JSON:");
  console.error(raw);
  process.exit(2);
}

const unexpected = cycles.filter((cycle) => !allowedKeys.has([...cycle].sort().join("|")));

if (unexpected.length > 0) {
  console.error(`[check-circular] Found ${unexpected.length} new circular dependency(ies):`);
  for (const cycle of unexpected) {
    console.error("  " + cycle.join(" > ") + " > " + cycle[0]);
  }
  console.error("");
  console.error("If a new cycle is intentional (type-only, no runtime hazard),");
  console.error("add it to ALLOWED in scripts/check-circular.mjs with a comment.");
  process.exit(1);
}

console.log(`[check-circular] OK — ${cycles.length} cycle(s) found, all on the allowlist.`);
