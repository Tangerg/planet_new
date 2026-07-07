import type { AudioLightFrame } from "./audio-light-frame";

/**
 * One visualiser lane's per-frame DATA — pure audio logic, no colour and no
 * rendering. Consumers (the player-bar bar, a full page, particle effects, …) map
 * these energies to whatever visual they like, with their own palette.
 */
export type AudioLane = {
  /** 0 = the raw/overall track; 1..N = frequency bands, low → high. */
  index: number;
  /** True for the raw/overall track (index 0), false for a frequency band. */
  raw: boolean;
  /** Smoothed energy 0..1 for this lane this frame. */
  energy: number;
};

/** Mean energy of the frequency band assigned to band-lane `i` of `count`. */
function bandEnergy(bands: readonly number[], i: number, count: number): number {
  const per = bands.length / count;
  const start = Math.floor(i * per);
  const end = Math.max(start + 1, Math.min(bands.length, Math.floor((i + 1) * per)));
  let sum = 0;
  for (let b = start; b < end; b++) sum += bands[b] ?? 0;
  return sum / (end - start);
}

/** Broadband (whole-mix) energy — drives the raw/overall track. */
function overallEnergy(bands: readonly number[]): number {
  if (bands.length === 0) return 0;
  let sum = 0;
  for (const b of bands) sum += b;
  return sum / bands.length;
}

/**
 * Build the visualiser lanes for a frame: lane 0 is the raw/overall track (the
 * whole mix), then `bandCount` frequency-band lanes low→high. Pure logic — the
 * generic core both the compact player-bar bar and a dedicated visualisation page
 * render from, each supplying its own colours/geometry.
 */
export function audioLanes(frame: AudioLightFrame, bandCount: number): AudioLane[] {
  const lanes: AudioLane[] = [{ index: 0, raw: true, energy: overallEnergy(frame.bands) }];
  for (let i = 0; i < bandCount; i++) {
    lanes.push({ index: i + 1, raw: false, energy: bandEnergy(frame.bands, i, bandCount) });
  }
  return lanes;
}
