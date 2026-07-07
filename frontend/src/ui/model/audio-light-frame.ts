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
 *  per-band adaptive-gain envelope. */
export type AudioLightFrameState = AudioLightFrame & {
  env: AdaptiveGainState;
};

// Fast attack / slower release so the bands punch up on transients and ease back
// between beats — the pumping that reads as "reacting to the music". Applied on
// top of the per-band AGC, so this is purely visual damping.
const ATTACK = 0.6;
const RELEASE = 0.2;

export function initialAudioLightFrameState(bandCount: number): AudioLightFrameState {
  return {
    bands: Array.from({ length: bandCount }, () => 0),
    env: initialAdaptiveGain(bandCount),
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
  const gained = adaptiveGain(raw, base.env);
  const bands = smoothSpectrum(base.bands, gained.bands, ATTACK, RELEASE);
  return { bands, env: gained.env };
}
