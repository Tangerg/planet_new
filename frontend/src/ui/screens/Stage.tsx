import { useState } from "react";
import { useTranslation } from "react-i18next";

import { FadeIn } from "@/components/motion";
import { ModeTag } from "@/components/now-playing/ModeTag";
import { Icon } from "@/infra/icons";
import {
  DEFAULT_EFFECT_ID,
  effectById,
  VISUAL_EFFECTS,
  VisualizerCanvas,
} from "@/infra/visualizer";
import type { VibeTrack } from "@/model/vibe";
import { TopEdgeControl } from "@/components/controls/TopEdgeControl";

type Props = {
  track?: VibeTrack;
  playing: boolean;
  onClose: () => void;
};

/**
 * Fullscreen visualisation stage. A dedicated immersive view (like Now Playing /
 * MV theater): a full-bleed reactive canvas with a switchable effect. The effect
 * choice is local, transient screen state — it isn't part of navigation history, so
 * Shell doesn't own it.
 */
export function Stage({ track, playing, onClose }: Props) {
  const { t } = useTranslation();
  const [effectId, setEffectId] = useState(DEFAULT_EFFECT_ID);

  return (
    <FadeIn className="relative h-full overflow-hidden bg-black">
      <VisualizerCanvas
        effect={effectById(effectId)}
        image={track?.image}
        playing={playing && !!track?.playUrl}
        className="absolute inset-0 h-full w-full"
      />

      <TopEdgeControl onClick={onClose} label={t("common.close")}>
        <Icon.close size={20} />
      </TopEdgeControl>

      {track && (
        <div className="pointer-events-none absolute bottom-[36px] left-12 z-20 max-w-[46%]">
          <div className="truncate text-[22px] font-light tracking-[0.02em] text-white">
            {track.title}
          </div>
          <div className="mt-0.5 truncate text-[14px] font-light text-white/55">{track.artist}</div>
        </div>
      )}

      <div className="absolute bottom-[32px] left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
        {VISUAL_EFFECTS.map((effect) => (
          <ModeTag
            key={effect.id}
            active={effect.id === effectId}
            onClick={() => setEffectId(effect.id)}
          >
            {t(effect.labelKey)}
          </ModeTag>
        ))}
      </div>
    </FadeIn>
  );
}
