import { useEffect, useMemo, useRef, type CSSProperties } from "react";

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

import {
  audioReactive,
  initialReactiveState,
  type ReactiveState,
  type VisualEffect,
} from "./engine";

type Props = {
  effect: VisualEffect;
  image?: string;
  accent: string;
  /** Tones to use when the cover can't be sampled (e.g. the bar's seed tints). */
  fallbackTones?: readonly string[];
  playing: boolean;
  /** Keep animating while paused (immersive stage). The player bar passes false so
   *  it settles to a static frame and stops the rAF loop when nothing is playing. */
  animateWhilePaused?: boolean;
  className?: string;
  style?: CSSProperties;
};

const BAND_COUNT = 18;
const FFT_SIZE = 2048;
const MAX_DT = 0.05; // clamp dt so a tab-switch stall doesn't fling the field

/**
 * The shared visualiser host — the engine's runtime. It samples the kernel analyser,
 * runs the cover → palette + particles pipelines, derives the reactive audio once
 * (audioReactive), and drives the active effect, which owns its own 2D/WebGL context.
 * Both the player bar and the fullscreen stage mount this; they differ only in which
 * effect they pass and whether it animates while paused. Volatile inputs are read
 * through refs so cover/palette/play changes don't restart the loop; the effect id
 * (via the canvas key) is the only thing that rebuilds the instance.
 */
export function VisualizerCanvas({
  effect,
  image,
  accent,
  fallbackTones,
  playing,
  animateWhilePaused = true,
  className,
  style,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cover = useCoverColors(image);
  const particles = useCoverParticles(image);
  const tones = useMemo(() => cover ?? fallbackTones ?? [accent], [cover, fallbackTones, accent]);
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
  const animatePausedRef = useRef(animateWhilePaused);
  const kickRef = useRef<() => void>(() => {});
  samplerRef.current = sampler;
  colorsRef.current = colors;
  particlesRef.current = particles ?? null;
  playingRef.current = playing;
  animatePausedRef.current = animateWhilePaused;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const instance = effect.create(canvas);
    let raf = 0;
    let running = false;
    let width = 1;
    let height = 1;
    let dpr = 1;
    let last = performance.now();
    let bytes = new Uint8Array(samplerRef.current.binCount);
    let frameState: AudioLightFrameState = initialAudioLightFrameState(BAND_COUNT);
    let reactive: ReactiveState = initialReactiveState;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      instance.resize?.(width, height, dpr);
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
      const isPlaying = playingRef.current;
      const timeSec = time / 1000;
      const derived = audioReactive(frameState, reactive, isPlaying, timeSec);
      reactive = derived.state;

      instance.draw({
        width,
        height,
        dpr,
        timeSec,
        dtSec,
        playing: isPlaying,
        audio: derived.audio,
        colors: colorsRef.current,
        particles: particlesRef.current,
      });

      // Keep spinning while playing (or when the surface wants idle motion); otherwise
      // let the last frame stand and stop — the [playing] effect re-kicks on resume.
      if (playingRef.current || animatePausedRef.current) raf = requestAnimationFrame(draw);
      else running = false;
    };

    const kick = () => {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(draw);
    };
    kickRef.current = kick;
    kick();

    return () => {
      cancelAnimationFrame(raf);
      running = false;
      observer.disconnect();
      instance.dispose?.();
      kickRef.current = () => {};
    };
  }, [effect]);

  // Re-arm the loop when it should animate again (playback resumes / mode changes).
  useEffect(() => {
    if (playing || animateWhilePaused) kickRef.current();
  }, [playing, animateWhilePaused]);

  return <canvas key={effect.id} ref={canvasRef} aria-hidden className={className} style={style} />;
}
