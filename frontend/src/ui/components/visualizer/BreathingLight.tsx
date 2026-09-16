import { VisualizerCanvas } from "@/infra/visualizer/VisualizerCanvas";
import { wavesEffect } from "@/infra/visualizer/effects/waves";

type BreathingLightProps = {
  playing: boolean;
  image?: string;
};

export function BreathingLight({ playing, image }: BreathingLightProps) {
  return (
    <VisualizerCanvas
      effect={wavesEffect}
      image={image}
      playing={playing}
      animateWhilePaused={false}
      className="pointer-events-none absolute inset-0 z-[0] h-full w-full"
      style={{ opacity: playing ? 1 : 0.36 }}
    />
  );
}
