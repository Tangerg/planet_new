import { useEffect, useRef, useState } from "react";

import { Slider } from "@/components/controls/Slider";
import { fmt } from "@/components/primitives";
import { effectiveDuration, playbackPosition } from "@/model/player";

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
  const dur = effectiveDuration(durationSec, fallbackDurationSec);
  const [scrub, setScrub] = useState<number | null>(null);
  const [scrubHover, setScrubHover] = useState<{ x: number; t: number } | null>(null);
  const scrubTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pos = playbackPosition(positionSec, dur, scrub);

  useEffect(() => () => clearTimeout(scrubTimer.current), []);

  const timeCls =
    "min-w-[42px] flex-none font-mono text-[11px] tracking-[0.04em] text-[rgba(20,20,24,0.5)]";

  return (
    <div className="relative z-[1] flex min-w-0 flex-1 items-center gap-3 px-[14px]">
      <span className={timeCls + " text-right"}>{fmt(Math.round(pos))}</span>
      <Slider
        min={0}
        max={dur}
        step={1}
        value={[pos]}
        onValueChange={([v]) => setScrub(v)}
        onValueCommit={([v]) => {
          onSeek(dur > 0 ? (v / dur) * 100 : 0);
          clearTimeout(scrubTimer.current);
          scrubTimer.current = setTimeout(() => setScrub(null), 400);
        }}
        thumbLabel="Seek"
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const x = Math.max(0, Math.min(r.width, e.clientX - r.left));
          setScrubHover({ x, t: r.width > 0 ? (x / r.width) * dur : 0 });
        }}
        onPointerLeave={() => setScrubHover(null)}
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
            style: {
              display: "block",
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#fff",
              boxShadow: `0 0 0 1px ${accent}, 0 1px 3px rgba(0,0,0,.4)`,
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
            {fmt(Math.round(scrubHover.t))}
          </div>
        )}
      </Slider>
      <span className={timeCls + " text-left"}>{fmt(Math.round(dur))}</span>
    </div>
  );
}
