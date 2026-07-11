import React, { useEffect, type RefObject } from "react";

import type { Lyric } from "@contexts/playback";

type Props = {
  lines: readonly Lyric[];
  accent: string;
  active: number;
  scrollRef: RefObject<HTMLDivElement | null>;
};

function stopSmoothScroll(container: HTMLDivElement): void {
  container.scrollTo({ top: container.scrollTop, behavior: "auto" });
}

export function activeLyricScrollTop(
  scrollTop: number,
  line: Pick<DOMRect, "top" | "height">,
  container: Pick<DOMRect, "top" | "height">,
): number {
  return scrollTop + (line.top - container.top) - container.height / 2 + line.height / 2;
}

/**
 * Timed lyric rendering plus active-line centering. The screen owns layout;
 * this component owns the lyric-reading behavior.
 *
 * React.memo: its LyricsPanel host re-renders on every progress tick, but the
 * active line only advances every few seconds. Memoizing means the whole lyric
 * list (up to a few hundred lines) is re-laid only when `active` actually
 * changes — not several times a second.
 */
export const LyricLines = React.memo(function LyricLines({
  lines,
  accent,
  active,
  scrollRef,
}: Props) {
  useEffect(() => {
    const container = scrollRef.current;
    const el = container?.querySelector<HTMLElement>(`[data-lyric-idx="${active}"]`);
    if (!el || !container) return;
    const elRect = el.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const top = activeLyricScrollTop(container.scrollTop, elRect, containerRect);
    // Interrupt any in-flight smooth scroll before starting a new one.
    stopSmoothScroll(container);
    container.scrollTo({ top, behavior: "smooth" });
    return () => stopSmoothScroll(container);
  }, [active, scrollRef]);

  return (
    <div className="flex flex-col gap-[25px] px-[11%] pb-[56%] pt-[34%] text-center">
      {lines.map((line, i) => {
        const on = i === active;
        if (!line.content) return <div key={i} className="h-0.5" />;
        return (
          <div
            key={i}
            data-lyric-idx={i}
            style={{
              fontSize: on ? 27 : 20,
              fontWeight: 300,
              letterSpacing: ".01em",
              lineHeight: 1.42,
              color: on ? accent : "rgba(255,255,255,.44)",
              transition: "color .4s, font-size .4s",
              paddingBottom: on ? 16 : 0,
              borderBottom: on ? `1px solid ${accent}aa` : "none",
            }}
          >
            {line.content}
            {line.translation && (
              <div
                style={{
                  marginTop: 5,
                  fontSize: on ? 16 : 14,
                  color: on ? `${accent}cc` : "rgba(255,255,255,.3)",
                }}
              >
                {line.translation}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});
