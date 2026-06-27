// ============================================================
// Browse — classification facets (languages · genres · scenes · moods · themes).
// No provider exposes these facets yet, so the screen shows an honest empty state.
// ============================================================
import React from "react";
import { FadeIn } from "@/components/motion";
import { useT } from "@/i18n";

export function BrowseScreen() {
  const t = useT();
  return (
    <FadeIn
      className="scroll h-full"
      style={{ background: "radial-gradient(120% 80% at 50% -5%, #16161d, var(--surf-0))" }}
    >
      <div className="px-12 pb-10 pt-[62px]">
        <div className="mb-1.5 text-[36px] font-extralight">{t("browse.title")}</div>
        <div className="mlabel mb-[30px] text-tx-3">{t("browse.subtitle")}</div>
        <div className="py-[50px] font-light text-tx-4">{t("browse.empty")}</div>
      </div>
    </FadeIn>
  );
}
