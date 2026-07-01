export type LyricLine = { line: string; t?: number; tr?: string };

const NO_LYRICS: LyricLine = { line: "No lyrics for this track." };

export function lyricLinesOrFallback(lines: readonly LyricLine[]): LyricLine[] {
  return lines.length ? [...lines] : [NO_LYRICS];
}

export function activeLyricIndex(lines: readonly LyricLine[], progressSec: number): number {
  if (!lines.length || typeof lines[0].t !== "number") return 0;
  const posMs = progressSec * 1000;
  let idx = 0;
  for (let i = 0; i < lines.length; i++) {
    const timestamp = lines[i]?.t;
    if (typeof timestamp === "number" && timestamp <= posMs) idx = i;
    else break;
  }
  return idx;
}
