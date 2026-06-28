// ============================================================
// PageColumn — the shared centered content column. Caps readable content at one
// consistent width and centers it, so a screen's header and its list line up on
// the same edges and the layout stays balanced on large displays (a full-width
// header over a narrow list is the imbalance this removes). Full-bleed chrome
// (atmospheric backdrops, the player bar) lives OUTSIDE this on purpose.
// ============================================================
import React from "react";
import { cn } from "@/lib/cn";

export function PageColumn({
  className,
  style,
  children,
}: {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("mx-auto box-border w-full max-w-[1320px] px-12", className)} style={style}>
      {children}
    </div>
  );
}
