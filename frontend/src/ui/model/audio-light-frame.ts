import type { SpectralColorSignature } from "./audio-color-signature";
import { smoothColorSignature, spectrumColorSignature } from "./audio-color-signature";
import type { SpectrumProfile } from "./audio-spectrum";
import { smoothSpectrum, spectrumFrame, spectrumProfile } from "./audio-spectrum";

export type AudioLightFrameState = {
  bands: readonly number[];
  signature?: SpectralColorSignature;
};

export type AudioLightFrame = AudioLightFrameState & {
  profile: SpectrumProfile;
  energy: number;
};

export function initialAudioLightFrameState(bandCount: number): AudioLightFrameState {
  return { bands: Array.from({ length: bandCount }, () => 0) };
}

export function nextAudioLightFrame({
  previous,
  bytes,
  read,
  timeMs,
  bandCount,
}: {
  previous: AudioLightFrameState;
  bytes: ArrayLike<number>;
  read: boolean;
  timeMs: number;
  bandCount: number;
}): AudioLightFrame {
  const seed =
    previous.bands.length === bandCount
      ? previous.bands
      : initialAudioLightFrameState(bandCount).bands;
  const frame = read ? spectrumFrame(bytes, bandCount) : undefined;
  const bands = smoothSpectrum(seed, frame?.active ? frame.bands : seed, 0.28, 0.08);
  const profile = spectrumProfile(bands);
  const nextSignature = read && profile.active ? spectrumColorSignature(bytes) : undefined;
  const signature = nextSignature
    ? smoothColorSignature(previous.signature, nextSignature)
    : previous.signature;
  const idle = 0.12 + (0.5 + Math.sin(timeMs / 1000 + 0.4) * 0.5) * 0.18;
  const energy = profile.active
    ? profile.low * 0.62 + profile.mid * 0.24 + profile.peak * 0.14
    : idle;

  return { bands, profile, signature, energy };
}
