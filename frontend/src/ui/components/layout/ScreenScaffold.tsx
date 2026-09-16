import React, { useRef } from "react";
import { cn } from "@/lib/cn";
import { HeroBackdrop } from "@/components/primitives";
import { FadeIn } from "@/components/motion";
import { ScrollProvider } from "@/components/layout/ScrollContext";

type ScreenScaffoldProps = {
  background?: string;
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
    <FadeIn className="relative h-full" style={{ background, ...rootStyle }}>
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
        className={cn("scroll relative z-[2] h-full", className)}
        style={scrollStyle}
      >
        <ScrollProvider value={scrollRef}>{children}</ScrollProvider>
      </div>
    </FadeIn>
  );
}
