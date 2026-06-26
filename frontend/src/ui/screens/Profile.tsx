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
    <FadeIn style={{ height: "100%", position: "relative" }}>
      <Art
        seed={3}
        grad={["#16161c", "#2a2a33"]}
        mono={mono}
        style={{ position: "absolute", inset: 0 }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, rgba(8,8,11,.4), rgba(8,8,11,.7))",
          }}
        />
      </Art>
      <div
        style={{
          position: "relative",
          zIndex: 4,
          height: "100%",
          display: "grid",
          // minmax(0,…) so the panels shrink on a narrow window instead of clipping.
          gridTemplateColumns: "minmax(0, 300px) minmax(0, 280px) minmax(0, 1fr)",
          gap: 0,
          padding: "70px 56px 40px",
          alignItems: "start",
        }}
      >
        {/* identity panel */}
        <div
          className="grain"
          style={{
            background: `linear-gradient(160deg, ${accent}, ${b})`,
            color: "#fff",
            padding: "34px 30px",
            minHeight: 320,
          }}
        >
          <div className="mlabel" style={{ opacity: 0.8 }}>
            Name
          </div>
          <div style={{ fontSize: 26, fontWeight: 300, margin: "8px 0 28px" }}>Lily Tran</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontSize: 40, fontWeight: 200 }}>598</span>
            <span className="mlabel" style={{ opacity: 0.85 }}>
              Followers
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 18 }}>
            <span style={{ fontSize: 40, fontWeight: 200 }}>6</span>
            <span className="mlabel" style={{ opacity: 0.85 }}>
              Following
            </span>
          </div>
          <div style={{ marginTop: 30, fontWeight: 300, fontSize: 15, opacity: 0.9 }}>
            Chasing reverb &amp; slow choruses.
          </div>
        </div>
        {/* photo */}
        <Art seed={9} grad={["#241003", "#ffb02e"]} mono style={{ height: 380, marginLeft: -1 }} />
        {/* playlists */}
        <div className="scroll" style={{ height: "100%", maxHeight: 420, paddingLeft: 44 }}>
          <span className="tag" style={{ marginBottom: 18, display: "inline-block" }}>
            Playlist
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 14 }}>
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
                style={{
                  background:
                    i === active ? `linear-gradient(90deg, ${accent}cc, transparent)` : "none",
                  border: 0,
                  textAlign: "left",
                  cursor: "pointer",
                  padding: "12px 14px",
                  color: "#fff",
                }}
              >
                <div
                  style={{
                    fontSize: 19,
                    fontWeight: 300,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {p.name}
                </div>
                <div
                  className="mlabel"
                  style={{
                    color: i === active ? "#06060a" : "var(--tx-3)",
                    marginTop: 5,
                    fontSize: 10,
                  }}
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
