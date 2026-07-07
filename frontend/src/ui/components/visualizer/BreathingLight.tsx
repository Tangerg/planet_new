import { useMemo } from "react";

import { VisualizerCanvas, wavesEffect } from "@/infra/visualizer";

type BreathingLightProps = {
  playing: boolean;
  accent: string;
  tintA: string;
  tintB: string;
  /** Current cover URL — its extracted dominant colour tones the visualizer so it
   *  matches the artwork (falls back to the seed tints when it can't be sampled). */
  image?: string;
};

/**
 * The player bar's ambient visualiser — the compact form of the shared engine: the
 * waves effect, dimmed when paused and not animated while idle (it's always mounted).
 */
export function BreathingLight({ playing, accent, tintA, tintB, image }: BreathingLightProps) {
  const fallbackTones = useMemo(() => [tintA, tintB], [tintA, tintB]);

  return (
    <VisualizerCanvas
      effect={wavesEffect}
      image={image}
      accent={accent}
      fallbackTones={fallbackTones}
      playing={playing}
      animateWhilePaused={false}
      className="pointer-events-none absolute inset-0 z-[0] h-full w-full"
      style={{ opacity: playing ? 1 : 0.36 }}
    />
  );
}
