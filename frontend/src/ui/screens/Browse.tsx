// ============================================================
// Browse — classification facets (languages · genres · scenes · moods · themes).
// ============================================================
import React from "react";
import { artBg } from "@/components/primitives";
import { LiftButton } from "@/components/lift";
import { FadeIn } from "@/components/motion";
import { useMorphOpen } from "@/hooks/useMorphOpen";
import { MOCK } from "@/model/mock";
import "./Browse.css";

type BrowseScreenProps = {
  onOpenGenre: (name: string) => void;
};

export function BrowseScreen({ onOpenGenre }: BrowseScreenProps) {
  const open = useMorphOpen();
  const C = MOCK.classification;
  const sections: [string, keyof typeof C][] = [
    ["Languages", "languages"],
    ["Genres", "genres"],
    ["Scenes", "scenes"],
    ["Moods", "moods"],
    ["Themes", "themes"],
  ];
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
        {sections.map(([label, key]) => (
          <section key={key} className="mb-[34px]">
            <div className="sech" style={{ marginBottom: 14 }}>
              <h2 style={{ fontSize: 20 }}>{label}</h2>
            </div>
            <div
              className="grid gap-[14px]"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(168px, 1fr))" }}
            >
              {C[key].map((g, i) => {
                const [name, color] = g;
                return (
                  <LiftButton
                    key={name}
                    className="gtile"
                    style={{ background: color }}
                    onClick={(e) =>
                      open(e, { seed: i, grad: [color, "#06060a"], run: () => onOpenGenre(name) })
                    }
                  >
                    <h3>{name}</h3>
                    <div
                      className="gart grain"
                      style={{ background: artBg(i, [color, "#06060a"]) }}
                    />
                  </LiftButton>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </FadeIn>
  );
}
