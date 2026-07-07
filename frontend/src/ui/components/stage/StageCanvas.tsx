import { useEffect, useMemo, useRef } from "react";

import { useAudioSpectrum } from "@/hooks/useAudioSpectrum";
import { useCoverColors } from "@/hooks/useCoverColors";
import { useCoverParticles } from "@/hooks/useCoverParticles";
import {
  initialAudioLightFrameState,
  nextAudioLightFrame,
  spectralLightColors,
  type AudioLightFrameState,
  type SpectralLightColors,
} from "@/model/audio-visualization";
import type { CoverParticles } from "@/model/stage-particles";

import { stageEffectById } from "./stage-effects";

type Props = {
  effectId: string;
  image?: string;
  accent: string;
  playing: boolean;
};

const BAND_COUNT = 18;
const FFT_SIZE = 2048;
const MAX_DT = 0.05; // clamp dt so a tab-switch stall doesn't fling the field

/**
 * Fullscreen visualiser host: owns the rAF loop, the shared audio sampler (kernel
 * analyser), and the cover→particles / cover→palette pipelines; each effect owns its
 * own drawing context (2D or WebGL). The canvas is keyed by effect id so switching
 * remounts a fresh canvas — a canvas can only ever hold one context type. Volatile
 * inputs are read through refs so the loop keeps running (idle motion while paused)
 * without restarting on every cover/palette/play change.
 */
export function StageCanvas({ effectId, image, accent, playing }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cover = useCoverColors(image);
  const particles = useCoverParticles(image);
  const tones = useMemo(() => cover ?? [accent], [cover, accent]);
  const colors = useMemo(() => spectralLightColors({ accent, tones }), [accent, tones]);

  const sampler = useAudioSpectrum({
    enabled: playing,
    fftSize: FFT_SIZE,
    smoothingTimeConstant: 0.5,
    minDecibels: -100,
    maxDecibels: -12,
  });

  const samplerRef = useRef(sampler);
  const colorsRef = useRef<SpectralLightColors>(colors);
  const particlesRef = useRef<CoverParticles | null>(particles ?? null);
  const playingRef = useRef(playing);
  samplerRef.current = sampler;
  colorsRef.current = colors;
  particlesRef.current = particles ?? null;
  playingRef.current = playing;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const effect = stageEffectById(effectId).create(canvas);
    let raf = 0;
    let width = 1;
    let height = 1;
    let dpr = 1;
    let last = performance.now();
    let bytes = new Uint8Array(samplerRef.current.binCount);
    let frameState: AudioLightFrameState = initialAudioLightFrameState(BAND_COUNT);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      effect.resize?.(width, height, dpr);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const draw = (time: number) => {
      const dtSec = Math.min(MAX_DT, Math.max(0, (time - last) / 1000));
      last = time;
      if (bytes.length !== samplerRef.current.binCount) {
        bytes = new Uint8Array(samplerRef.current.binCount);
      }
      const read = samplerRef.current.sample(bytes);
      frameState = nextAudioLightFrame({
        previous: frameState,
        bytes,
        read,
        bandCount: BAND_COUNT,
      });

      effect.draw({
        width,
        height,
        dpr,
        timeSec: time / 1000,
        dtSec,
        playing: playingRef.current,
        frame: frameState,
        colors: colorsRef.current,
        particles: particlesRef.current,
      });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      effect.dispose?.();
    };
  }, [effectId]);

  return (
    <canvas key={effectId} ref={canvasRef} aria-hidden className="absolute inset-0 h-full w-full" />
  );
}
