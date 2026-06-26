// ============================================================
// ScreenScaffold — the recurring screen shell: a FadeIn root, an optional
// cover-derived HeroBackdrop, and a `.scroll` container whose ref is published
// via ScrollProvider so any windowed grid/list inside virtualizes against it.
// Screens with bespoke scroll handling (Detail's sticky header, Queue's split,
// XMB) keep their own layout; this covers the common single-scroller screens.
// ============================================================
import React, { useRef } from "react";
import { cn } from "@/lib/cn";
import { HeroBackdrop } from "@/components/primitives";
import { FadeIn } from "@/components/motion";
import { ScrollProvider } from "@/components/layout/ScrollContext";

type ScreenScaffoldProps = {
  /** Root background (the page base behind the backdrop / scroll content). */
  background?: string;
  /** Cover-derived ambient backdrop; omit for flat screens. */
  backdrop?: { image?: string; seed?: number; grad?: string[]; scrim?: string };
  className?: string;
  rootStyle?: React.CSSProperties;
  scrollStyle?: React.CSSProperties;
  children: React.ReactNode;
};

export function ScreenScaffold({
  background,
  backdrop,
  className,
  rootStyle,
  scrollStyle,
  children,
}: ScreenScaffoldProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  return (
    <FadeIn style={{ height: "100%", position: "relative", background, ...rootStyle }}>
      {backdrop && (
        <HeroBackdrop
          image={backdrop.image}
          seed={backdrop.seed}
          grad={backdrop.grad}
          scrim={backdrop.scrim}
        />
      )}
      <div
        ref={scrollRef}
        className={cn("scroll", className)}
        style={{ position: "relative", zIndex: 2, height: "100%", ...scrollStyle }}
      >
        <ScrollProvider value={scrollRef}>{children}</ScrollProvider>
      </div>
    </FadeIn>
  );
}
