import {
  hsla,
  spectralLightColors,
  type AudioLightFrame,
  type HslColor,
} from "@/model/audio-visualization";

export type BreathingLightSkin = {
  accent: string;
  tintA: string;
  tintB: string;
};

export type BreathingLightPaintInput = {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  timeSec: number;
  playing: boolean;
  skin: BreathingLightSkin;
  frame: AudioLightFrame;
};

type PaintStop = {
  at: number;
  color: HslColor;
  intensity: number;
};

type SpectralPaintColors = ReturnType<typeof spectralLightColors>;

function addSpectralStops(
  gradient: CanvasGradient,
  stops: readonly PaintStop[],
  alpha: (intensity: number) => number,
): void {
  for (const stop of stops) {
    gradient.addColorStop(stop.at, hsla(stop.color, alpha(stop.intensity)));
  }
}

function paintAmbientWash(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  colors: SpectralPaintColors,
  pulse: number,
): void {
  const wash = ctx.createLinearGradient(0, 0, width, 0);
  addSpectralStops(wash, colors.stops, (intensity) => 0.05 + pulse * 0.08 + intensity * 0.055);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, width, height);
}

function paintBloom(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  colors: SpectralPaintColors,
  pulse: number,
  centerX: number,
  radius: number,
): void {
  ctx.globalCompositeOperation = "lighter";
  const bloom = ctx.createRadialGradient(centerX, height * 0.48, 0, centerX, height * 0.48, radius);
  bloom.addColorStop(0, hsla(colors.body, 0.1 + pulse * 0.35));
  bloom.addColorStop(0.26, hsla(colors.spark, 0.05 + pulse * 0.15));
  bloom.addColorStop(0.48, hsla(colors.warmth, 0.05 + pulse * 0.12));
  bloom.addColorStop(0.74, hsla(colors.air, 0.03 + pulse * 0.12));
  bloom.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = bloom;
  ctx.fillRect(0, 0, width, height);
}

function paintBreathLine(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  timeSec: number,
  bands: readonly number[],
  colors: SpectralPaintColors,
  pulse: number,
  playing: boolean,
): void {
  const baseY = height * 0.62;
  const amplitude = height * (0.08 + pulse * 0.12);
  const line = ctx.createLinearGradient(0, 0, width, 0);
  addSpectralStops(line, colors.stops, (intensity) => 0.035 + pulse * 0.12 + intensity * 0.08);

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
}

export function paintBreathingLight({
  ctx,
  width,
  height,
  timeSec,
  playing,
  skin,
  frame,
}: BreathingLightPaintInput): void {
  ctx.clearRect(0, 0, width, height);

  const idleBreath = 0.5 + Math.sin(timeSec * 1.35) * 0.5;
  const pulse = playing ? Math.max(frame.energy, 0.18 + idleBreath * 0.2) : 0.08;
  const drift = Math.sin(timeSec * 0.24) * 0.12;
  const centerX = width * (0.5 + drift);
  const radius = Math.max(width * (0.62 + pulse * 0.22), height * 5);
  const colors = spectralLightColors({
    accent: skin.accent,
    tintA: skin.tintA,
    tintB: skin.tintB,
    profile: frame.profile,
    signature: frame.signature,
  });

  paintAmbientWash(ctx, width, height, colors, pulse);
  paintBloom(ctx, width, height, colors, pulse, centerX, radius);
  paintBreathLine(ctx, width, height, timeSec, frame.bands, colors, pulse, playing);

  ctx.globalCompositeOperation = "source-over";
}
