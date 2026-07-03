import { useEffect, useRef } from "react";

import { useAudioSpectrum } from "@/hooks/useAudioSpectrum";
import { smoothSpectrum, spectrumFrame } from "@/model/audio-visualization";

type BreathingLightProps = {
  playing: boolean;
  playUrl?: string;
  accent: string;
  tintA: string;
  tintB: string;
};

const BAND_COUNT = 18;
const FFT_SIZE = 128;

function rgba(hex: string, alpha: number): string {
  const value = hex.trim().replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(value)) return `rgba(20,255,130,${alpha})`;
  const num = Number.parseInt(value, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function paint(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  timeSec: number,
  bands: readonly number[],
  {
    accent,
    tintA,
    tintB,
    energy,
    playing,
  }: {
    accent: string;
    tintA: string;
    tintB: string;
    energy: number;
    playing: boolean;
  },
): void {
  ctx.clearRect(0, 0, width, height);

  const idleBreath = 0.5 + Math.sin(timeSec * 1.35) * 0.5;
  const pulse = playing ? Math.max(energy, 0.18 + idleBreath * 0.2) : 0.08;
  const drift = Math.sin(timeSec * 0.24) * 0.12;
  const centerX = width * (0.5 + drift);
  const radius = Math.max(width * (0.62 + pulse * 0.22), height * 5);

  const wash = ctx.createLinearGradient(0, 0, width, 0);
  wash.addColorStop(0, rgba(tintA, 0.1 + pulse * 0.12));
  wash.addColorStop(0.42, rgba(accent, 0.06 + pulse * 0.16));
  wash.addColorStop(1, rgba(tintB, 0.1 + pulse * 0.1));
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, width, height);

  ctx.globalCompositeOperation = "lighter";
  const bloom = ctx.createRadialGradient(centerX, height * 0.48, 0, centerX, height * 0.48, radius);
  bloom.addColorStop(0, rgba(accent, 0.1 + pulse * 0.34));
  bloom.addColorStop(0.35, rgba(tintA, 0.06 + pulse * 0.16));
  bloom.addColorStop(0.7, rgba(tintB, 0.03 + pulse * 0.1));
  bloom.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = bloom;
  ctx.fillRect(0, 0, width, height);

  const baseY = height * 0.62;
  const amplitude = height * (0.08 + pulse * 0.12);
  const line = ctx.createLinearGradient(0, 0, width, 0);
  line.addColorStop(0, rgba(tintA, 0));
  line.addColorStop(0.22, rgba(accent, 0.08 + pulse * 0.2));
  line.addColorStop(0.78, rgba(accent, 0.08 + pulse * 0.2));
  line.addColorStop(1, rgba(tintB, 0));
  ctx.strokeStyle = line;
  ctx.lineWidth = 1;
  ctx.globalAlpha = playing ? 0.22 : 0.08;
  ctx.beginPath();
  for (let i = 0; i <= 96; i++) {
    const x = (i / 96) * width;
    const band = bands[Math.floor((i / 96) * bands.length)] ?? 0;
    const wave = Math.sin(timeSec * 2.1 + i * 0.18) * (0.35 + band * 0.65);
    const y = baseY + wave * amplitude;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
}

export function BreathingLight({ playing, playUrl, accent, tintA, tintB }: BreathingLightProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sampler = useAudioSpectrum({
    enabled: playing,
    playUrl,
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
    let bands = Array.from({ length: BAND_COUNT }, () => 0);

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
      const frame = read ? spectrumFrame(bytes, BAND_COUNT) : undefined;
      bands = smoothSpectrum(bands, frame?.active ? frame.bands : bands, 0.28, 0.08);
      const idle = 0.12 + (0.5 + Math.sin(time / 1000 + 0.4) * 0.5) * 0.18;
      const energy = frame?.active ? frame.low * 0.62 + frame.mid * 0.24 + frame.peak * 0.14 : idle;

      paint(ctx, width, height, time / 1000, bands, {
        accent,
        tintA,
        tintB,
        energy,
        playing,
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
