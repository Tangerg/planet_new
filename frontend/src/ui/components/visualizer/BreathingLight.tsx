import { VisualizerCanvas, wavesEffect } from "@/infra/visualizer";

type BreathingLightProps = {
  playing: boolean;
  accent: string;
  /** Current cover URL — the waves effect tones itself from its extracted colours,
   *  falling back to the accent when it can't be sampled. */
  image?: string;
};

/**
 * The player bar's ambient visualiser — the compact form of the shared engine: the
 * waves effect, dimmed when paused and not animated while idle (it's always mounted).
 */
export function BreathingLight({ playing, accent, image }: BreathingLightProps) {
  return (
    <VisualizerCanvas
      effect={wavesEffect}
      image={image}
      accent={accent}
      playing={playing}
      animateWhilePaused={false}
      className="pointer-events-none absolute inset-0 z-[0] h-full w-full"
      style={{ opacity: playing ? 1 : 0.36 }}
    />
  );
}
