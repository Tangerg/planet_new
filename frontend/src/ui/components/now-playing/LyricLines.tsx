import { useEffect, type RefObject } from "react";

import type { LyricLine } from "@/model/now-playing";

type Props = {
  lines: LyricLine[];
  accent: string;
  active: number;
  scrollRef: RefObject<HTMLDivElement | null>;
};

/**
 * Timed lyric rendering plus active-line centering. The screen owns layout;
 * this component owns the lyric-reading behavior.
 */
export function LyricLines({ lines, accent, active, scrollRef }: Props) {
  useEffect(() => {
    const container = scrollRef.current;
    const el = container?.querySelector<HTMLElement>(`[data-lyric-idx="${active}"]`);
    if (!el || !container) return;
    const elRect = el.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const top =
      container.scrollTop +
      (elRect.top - containerRect.top) -
      containerRect.height / 2 +
      elRect.height / 2;
    // Interrupt any in-flight smooth scroll before starting a new one.
    // eslint-disable-next-line no-self-assign
    container.scrollTop = container.scrollTop;
    container.scrollTo({ top, behavior: "smooth" });
    return () => {
      // eslint-disable-next-line no-self-assign
      container.scrollTop = container.scrollTop;
    };
  }, [active, scrollRef]);

  return (
    <div className="flex flex-col gap-[25px] px-[11%] pb-[56%] pt-[34%] text-center">
      {lines.map((line, i) => {
        const on = i === active;
        if (!line.line) return <div key={i} className="h-0.5" />;
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
            {line.line}
            {line.tr && (
              <div
                style={{
                  marginTop: 5,
                  fontSize: on ? 16 : 14,
                  color: on ? `${accent}cc` : "rgba(255,255,255,.3)",
                }}
              >
                {line.tr}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
