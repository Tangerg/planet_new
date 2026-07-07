import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/controls/Button";
import { FadeIn } from "@/components/motion";
import { ModeTag } from "@/components/now-playing/ModeTag";
import { StageCanvas } from "@/components/stage/StageCanvas";
import { DEFAULT_STAGE_EFFECT, STAGE_EFFECTS } from "@/components/stage/stage-effects";
import { Icon } from "@/infra/icons";
import type { VibeTrack } from "@/model/vibe";

type Props = {
  track?: VibeTrack;
  accent: string;
  playing: boolean;
  onClose: () => void;
};

/**
 * Fullscreen visualisation stage. A dedicated immersive view (like Now Playing /
 * MV theater): a full-bleed reactive canvas with a switchable effect. The effect
 * choice is local, transient screen state — it isn't part of navigation history, so
 * Shell doesn't own it.
 */
export function Stage({ track, accent, playing, onClose }: Props) {
  const { t } = useTranslation();
  const [effectId, setEffectId] = useState(DEFAULT_STAGE_EFFECT);

  return (
    <FadeIn className="relative h-full overflow-hidden bg-black">
      <StageCanvas
        effectId={effectId}
        image={track?.image}
        accent={accent}
        playing={playing && !!track?.playUrl}
      />

      <Button
        onClick={onClose}
        aria-label={t("common.close")}
        className="absolute right-14 top-[18px] z-30 p-1 text-white/70"
      >
        <Icon.close size={20} />
      </Button>

      {track && (
        <div className="pointer-events-none absolute bottom-[36px] left-12 z-20 max-w-[46%]">
          <div className="truncate text-[22px] font-light tracking-[0.02em] text-white">
            {track.title}
          </div>
          <div className="mt-0.5 truncate text-[14px] font-light text-white/55">{track.artist}</div>
        </div>
      )}

      <div className="absolute bottom-[32px] left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
        {STAGE_EFFECTS.map((effect) => (
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
