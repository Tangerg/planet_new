// Imported from the effect module directly, NOT the `@/infra/visualizer` barrel:
// the barrel pulls the effects registry, which pulls the WebGL cloud effect (with
// its shaders). This bar is mounted for the whole session, so a barrel import
// would drag the stage-only cloud into the startup chunk.
import { VisualizerCanvas } from "@/infra/visualizer/VisualizerCanvas";
import { wavesEffect } from "@/infra/visualizer/effects/waves";

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
