import { useEffect, useMemo, useRef } from "react";

import { useAudioSpectrum } from "@/hooks/useAudioSpectrum";
import { useCoverColors } from "@/hooks/useCoverColors";
import {
  initialAudioLightFrameState,
  nextAudioLightFrame,
  type AudioLightFrameState,
} from "@/model/audio-visualization";

import { paintBreathingLight } from "./breathing-light-canvas";

type BreathingLightProps = {
  playing: boolean;
  accent: string;
  tintA: string;
  tintB: string;
  /** Current cover URL — its extracted dominant colour tones the visualizer so it
   *  matches the artwork (falls back to the seed tints when it can't be sampled). */
  image?: string;
};

const BAND_COUNT = 18;
// A large FFT so the log-frequency split has real low-end resolution (each bin is
// ~21 Hz at 44.1 kHz, vs ~172 Hz at 256). Downstream per-band AGC needs honest
// spectral detail to normalise, so this is where responsiveness is won.
const FFT_SIZE = 2048;

export function BreathingLight({ playing, accent, tintA, tintB, image }: BreathingLightProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Tone from the artwork's real theme colours when they can be sampled; otherwise
  // the seed tints. The ramp gradients through them. Memoized so the draw effect
  // isn't re-armed by a fresh array reference each render.
  const cover = useCoverColors(image);
  const tones = useMemo(() => cover ?? [tintA, tintB], [cover, tintA, tintB]);
  const sampler = useAudioSpectrum({
    enabled: playing,
    fftSize: FFT_SIZE,
    // Low node smoothing — the AnalyserNode's own averaging is the first thing that
    // flattens beat-to-beat motion, so keep it light and let our per-band AGC +
    // attack/release do the shaping (this is what restores the "jitter").
    smoothingTimeConstant: 0.5,
    // A wide dB window feeds honest dynamics to the AGC (it, not this window, sets
    // the visible level), so quiet masters aren't clamped to the floor.
    minDecibels: -100,
    maxDecibels: -12,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let raf = 0;
    let width = 1;
    let height = 1;
    let bytes: Uint8Array<ArrayBuffer> = new Uint8Array(sampler.binCount);
    let frameState: AudioLightFrameState = initialAudioLightFrameState(BAND_COUNT);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const draw = (time: number) => {
      if (bytes.length !== sampler.binCount) bytes = new Uint8Array(sampler.binCount);
      const read = sampler.sample(bytes);
      const frame = nextAudioLightFrame({
        previous: frameState,
        bytes,
        read,
        bandCount: BAND_COUNT,
      });
      frameState = frame;

      paintBreathingLight({
        ctx,
        width,
        height,
        timeSec: time / 1000,
        playing,
        skin: { accent, tones },
        frame,
      });

      if (playing) raf = requestAnimationFrame(draw);
    };

    draw(performance.now());

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [accent, playing, sampler, tones]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[0] h-full w-full"
      style={{ opacity: playing ? 1 : 0.36 }}
    />
  );
}
