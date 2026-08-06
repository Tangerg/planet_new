import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Slider } from "@/components/controls/Slider";
import {
  effectiveMediaDuration,
  formatCompactMediaTime,
  mediaPlaybackPosition,
  mediaSeekPercent,
  mediaTimelinePreview,
} from "@/model/media-playback";

type Props = {
  positionSec: number;
  durationSec: number;
  fallbackDurationSec?: number;
  accent: string;
  onSeek: (pct: number) => void;
};

export function PlayerScrubber({
  positionSec,
  durationSec,
  fallbackDurationSec,
  accent,
  onSeek,
}: Props) {
  const { t } = useTranslation();
  const dur = effectiveMediaDuration(durationSec, fallbackDurationSec);
  const [scrub, setScrub] = useState<number | null>(null);
  const [scrubHover, setScrubHover] = useState<{ x: number; positionSec: number } | null>(null);
  const scrubTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pos = mediaPlaybackPosition(positionSec, dur, scrub);

  useEffect(() => () => clearTimeout(scrubTimer.current), []);

  const timeCls =
    "min-w-[42px] flex-none font-mono text-[11px] tracking-[0.04em] text-[rgba(20,20,24,0.5)]";

  return (
    <div className="relative z-[1] flex min-w-0 flex-1 items-center gap-3 px-[14px]">
      <span className={timeCls + " text-right"}>{formatCompactMediaTime(pos)}</span>
      <Slider
        min={0}
        max={dur}
        step={1}
        value={[pos]}
        onValueChange={([v]) => setScrub(v)}
        onValueCommit={([v]) => {
          onSeek(mediaSeekPercent(v, dur));
          clearTimeout(scrubTimer.current);
          scrubTimer.current = setTimeout(() => setScrub(null), 400);
        }}
        thumbLabel={t("common.seek")}
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setScrubHover(
            mediaTimelinePreview({
              clientX: e.clientX,
              durationSec: dur,
              left: r.left,
              width: r.width,
            }),
          );
        }}
        onPointerLeave={() => setScrubHover(null)}
        // `.pscrub` owns the thumb's hover reveal in CSS. This component
        // subscribes to the playback clock, so it already re-renders several
        // times a second — adding a hover state would have made merely resting
        // the cursor on the bar re-render it twice more.
        className={scrub === null ? "pscrub" : "pscrub is-scrubbing"}
        style={{
          position: "relative",
          flex: 1,
          minWidth: 0,
          display: "flex",
          alignItems: "center",
          height: 16,
          cursor: "pointer",
          touchAction: "none",
        }}
        parts={{
          track: {
            style: {
              position: "relative",
              flexGrow: 1,
              height: 4,
              borderRadius: 999,
              background: "rgba(20,20,24,.14)",
            },
          },
          range: {
            style: {
              position: "absolute",
              height: "100%",
              borderRadius: 999,
              background: accent,
            },
          },
          thumb: {
            // Spotify-style: a small, clean white dot (no coloured glow ring) that
            // only appears on hover or while scrubbing; hidden otherwise (.pscrub).
            className: "pscrub-thumb",
            style: {
              display: "block",
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#fff",
              boxShadow: "0 1px 3px rgba(0,0,0,.35)",
            },
          },
        }}
      >
        {scrubHover && (
          <div
            aria-hidden
            className="glass-pop pointer-events-none absolute px-2.5 py-1 font-mono text-[10.5px] font-medium tabular-nums"
            style={{
              left: scrubHover.x,
              bottom: "calc(100% + 6px)",
              transform: "translateX(-50%)",
              whiteSpace: "nowrap",
            }}
          >
            {formatCompactMediaTime(scrubHover.positionSec)}
          </div>
        )}
      </Slider>
      <span className={timeCls + " text-left"}>{formatCompactMediaTime(dur)}</span>
    </div>
  );
}
