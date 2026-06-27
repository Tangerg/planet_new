// ============================================================
// Browse — classification facets (languages · genres · scenes · moods · themes).
// No provider exposes these facets yet, so the screen shows an honest empty state.
// ============================================================
import React from "react";
import { FadeIn } from "@/components/motion";

export function BrowseScreen() {
  return (
    <FadeIn
      className="scroll h-full"
      style={{ background: "radial-gradient(120% 80% at 50% -5%, #16161d, var(--surf-0))" }}
    >
      <div className="px-12 pb-10 pt-[62px]">
        <div className="mb-1.5 text-[36px] font-extralight">Browse</div>
        <div className="mlabel mb-[30px] text-tx-3">
          Filter by language, genre, scene, mood &amp; theme
        </div>
        <div className="py-[50px] font-light text-tx-4">No categories yet.</div>
      </div>
    </FadeIn>
  );
}
