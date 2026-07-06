import { useEffect, useRef } from "react";

import { useAudioSpectrum } from "@/hooks/useAudioSpectrum";
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
};

const BAND_COUNT = 18;
const FFT_SIZE = 256;

export function BreathingLight({ playing, accent, tintA, tintB }: BreathingLightProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sampler = useAudioSpectrum({
    enabled: playing,
    fftSize: FFT_SIZE,
    smoothingTimeConstant: 0.88,
    minDecibels: -92,
    maxDecibels: -18,
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
        timeMs: time,
        bandCount: BAND_COUNT,
      });
      frameState = frame;

      paintBreathingLight({
        ctx,
        width,
        height,
        timeSec: time / 1000,
        playing,
        skin: { accent, tintA, tintB },
        frame,
      });

      if (playing) raf = requestAnimationFrame(draw);
    };

    draw(performance.now());

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [accent, playing, sampler, tintA, tintB]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[0] h-full w-full"
      style={{ opacity: playing ? 1 : 0.36 }}
    />
  );
}
