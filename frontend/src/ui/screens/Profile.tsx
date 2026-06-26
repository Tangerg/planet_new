// ============================================================
// Profile — identity panel · photo · your playlists.
// ============================================================
import React, { useState } from "react";
import type { VibeCollection } from "@/model/adapt";
import { Art } from "@/components/primitives";
import { Button } from "@/components/controls/Button";
import { FadeIn } from "@/components/motion";
import { useMorphOpen } from "@/hooks/useMorphOpen";

type ProfileScreenProps = {
  accent: string;
  playlists: VibeCollection[];
  onOpenPlaylist: (playlist: VibeCollection) => void;
  mono: boolean;
};

export function ProfileScreen({ accent, playlists, onOpenPlaylist, mono }: ProfileScreenProps) {
  const open = useMorphOpen();
  const b = accent;
  const items = playlists.slice(0, 6).map((p, i) => ({
    ...p,
    plays: ["8.40K", "4", "69", "127", "2.3K", "910"][i] || "12",
  }));
  const [active, setActive] = useState(1);
  return (
    <FadeIn className="relative h-full">
      <Art
        seed={3}
        grad={["#16161c", "#2a2a33"]}
        mono={mono}
        style={{ position: "absolute", inset: 0 }}
      >
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, rgba(8,8,11,.4), rgba(8,8,11,.7))" }}
        />
      </Art>
      <div
        // minmax(0,…) so the panels shrink on a narrow window instead of clipping.
        className="relative z-[4] grid h-full items-start gap-0 px-14 pb-10 pt-[70px]"
        style={{ gridTemplateColumns: "minmax(0, 300px) minmax(0, 280px) minmax(0, 1fr)" }}
      >
        {/* identity panel */}
        <div
          className="grain min-h-[320px] px-[30px] py-[34px] text-white"
          style={{ background: `linear-gradient(160deg, ${accent}, ${b})` }}
        >
          <div className="mlabel opacity-80">Name</div>
          <div className="mb-7 mt-2 text-[26px] font-light">Lily Tran</div>
          <div className="flex items-baseline gap-2.5">
            <span className="text-[40px] font-extralight">598</span>
            <span className="mlabel opacity-85">Followers</span>
          </div>
          <div className="mt-[18px] flex items-baseline gap-2.5">
            <span className="text-[40px] font-extralight">6</span>
            <span className="mlabel opacity-85">Following</span>
          </div>
          <div className="mt-[30px] text-[15px] font-light opacity-90">
            Chasing reverb &amp; slow choruses.
          </div>
        </div>
        {/* photo */}
        <Art seed={9} grad={["#241003", "#ffb02e"]} mono className="-ml-px h-[380px]" />
        {/* playlists */}
        <div className="scroll h-full max-h-[420px] pl-11">
          <span className="tag mb-[18px]" style={{ display: "inline-block" }}>
            Playlist
          </span>
          <div className="mt-[14px] flex flex-col gap-1">
            {items.map((p, i) => (
              <Button
                key={p.id}
                onClick={(e) =>
                  open(e, {
                    seed: p.coverSeed,
                    grad: p.gradient,
                    image: p.image,
                    run: () => {
                      setActive(i);
                      onOpenPlaylist(p);
                    },
                  })
                }
                className="px-[14px] py-3 text-left text-white"
                style={{
                  background:
                    i === active ? `linear-gradient(90deg, ${accent}cc, transparent)` : "none",
                }}
              >
                <div className="truncate text-[19px] font-light">{p.name}</div>
                <div
                  className="mlabel mt-[5px] text-[10px]"
                  style={{ color: i === active ? "#06060a" : "var(--tx-3)" }}
                >
                  {p.plays} played
                </div>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </FadeIn>
  );
}
