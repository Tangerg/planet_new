import { useEffect, useMemo, useRef, type CSSProperties } from "react";

import { useAudioSpectrum } from "@/hooks/useAudioSpectrum";
import {
  initialAudioLightFrameState,
  nextAudioLightFrame,
  type AudioLightFrameState,
} from "@/model/audio-visualization";

import {
  audioReactive,
  initialReactiveState,
  resolveEngineConfig,
  type EngineConfig,
  type ReactiveState,
  type VisualEffect,
} from "./engine";

type Props = {
  effect: VisualEffect;
  image?: string;
  accent: string;
  playing: boolean;
  /** Keep animating while paused (immersive stage). The player bar passes false so
   *  it settles to a static frame and stops the rAF loop when nothing is playing. */
  animateWhilePaused?: boolean;
  className?: string;
  style?: CSSProperties;
};

const BAND_COUNT = 18; // internal spectral resolution; effects regroup via config.bands
const MAX_DT = 0.05; // clamp dt so a tab-switch stall doesn't fling the field

/**
 * The shared visualiser host — the audio engine's runtime. It samples the kernel
 * analyser (tuned per effect), derives the reactive audio once (audioReactive), and
 * drives the active effect, which owns its 2D/WebGL context AND fetches its own cover
 * art / other material (the engine stays audio-only). Both the player bar and the
 * fullscreen stage mount this; they differ only in the effect and animate-while-paused.
 * Volatile inputs are read through refs so image/accent/play changes don't restart the
 * loop; the effect id (via the canvas key) is the only thing that rebuilds the instance.
 */
export function VisualizerCanvas({
  effect,
  image,
  accent,
  playing,
  animateWhilePaused = true,
  className,
  style,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const config = useMemo(() => resolveEngineConfig(effect.tuning), [effect]);

  const sampler = useAudioSpectrum({
    enabled: playing,
    fftSize: config.fftSize,
    smoothingTimeConstant: config.smoothingTimeConstant,
    minDecibels: config.minDecibels,
    maxDecibels: config.maxDecibels,
  });

  const samplerRef = useRef(sampler);
  const configRef = useRef<EngineConfig>(config);
  const imageRef = useRef(image);
  const accentRef = useRef(accent);
  const playingRef = useRef(playing);
  const animatePausedRef = useRef(animateWhilePaused);
  const kickRef = useRef<() => void>(() => {});
  samplerRef.current = sampler;
  configRef.current = config;
  imageRef.current = image;
  accentRef.current = accent;
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
      const cfg = configRef.current;
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
        attack: cfg.attack,
        release: cfg.release,
        gain: {
          rise: cfg.levelRise,
          fall: cfg.levelFall,
          target: cfg.levelTarget,
          contrast: cfg.levelContrast,
        },
      });
      const isPlaying = playingRef.current;
      const timeSec = time / 1000;
      const derived = audioReactive(frameState, reactive, isPlaying, timeSec, cfg);
      reactive = derived.state;

      instance.draw({
        width,
        height,
        dpr,
        timeSec,
        dtSec,
        playing: isPlaying,
        audio: derived.audio,
        image: imageRef.current,
        accent: accentRef.current,
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
