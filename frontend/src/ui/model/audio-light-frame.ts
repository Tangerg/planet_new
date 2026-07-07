import {
  adaptiveGain,
  initialAdaptiveGain,
  smoothSpectrum,
  spectrumFrame,
  type AdaptiveGainState,
} from "./audio-spectrum";

/** The per-frame data visualizers render from — just the display bands. */
export type AudioLightFrame = {
  bands: readonly number[];
};

/** The state carried between frames: the display bands (smoothing seed) plus the
 *  per-band adaptive-gain running level. */
export type AudioLightFrameState = AudioLightFrame & {
  level: AdaptiveGainState;
};

// Light display damping only — near-instant attack and a fast release so the AGC's
// beat-to-beat jitter survives to the screen instead of being averaged flat. Heavy
// smoothing here (plus the AnalyserNode's own) is what made loud tracks look pinned
// and their motion sluggish.
const ATTACK = 0.8;
const RELEASE = 0.5;

export function initialAudioLightFrameState(bandCount: number): AudioLightFrameState {
  return {
    bands: Array.from({ length: bandCount }, () => 0),
    level: initialAdaptiveGain(bandCount),
  };
}

export function nextAudioLightFrame({
  previous,
  bytes,
  read,
  bandCount,
}: {
  previous: AudioLightFrameState;
  bytes: ArrayLike<number>;
  read: boolean;
  bandCount: number;
}): AudioLightFrameState {
  const base =
    previous.bands.length === bandCount ? previous : initialAudioLightFrameState(bandCount);
  const frame = read ? spectrumFrame(bytes, bandCount) : undefined;
  // When there's no signal (paused / silence between tracks) feed zeros: the gain
  // envelope decays and the bands release toward the baseline, so playback resumes
  // lively instead of over-boosted from a stale envelope.
  const raw = frame?.active ? frame.bands : initialAudioLightFrameState(bandCount).bands;
  const gained = adaptiveGain(raw, base.level);
  const bands = smoothSpectrum(base.bands, gained.bands, ATTACK, RELEASE);
  return { bands, level: gained.level };
}
