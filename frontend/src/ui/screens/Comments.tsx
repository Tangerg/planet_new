// ============================================================
// Comments — hot comments for the current track (left cover + right list).
// Comments are mock (no provider capability yet); the list is bounded.
// ============================================================
import React, { useState } from "react";
import type { VibeTrack } from "@/model/adapt";
import { MOCK } from "@/model/mock";
import { Icon, Art } from "@/components/primitives";
import { Button } from "@/components/controls/Button";
import { FadeIn } from "@/components/motion";

type CommentsScreenProps = {
  track?: VibeTrack;
  accent: string;
  liked: boolean;
  toggleLike: () => void;
  mono: boolean;
};

export function CommentsScreen({ track, accent, liked, toggleLike, mono }: CommentsScreenProps) {
  const [likedC, setLikedC] = useState(new Set<string>());
  const tl = (id: string) =>
    setLikedC((p) => {
      const n = new Set(p);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  return (
    <FadeIn
      style={{
        height: "100%",
        display: "grid",
        gridTemplateColumns: "minmax(0, 0.78fr) minmax(0, 1.22fr)",
        background: "var(--surf-0)",
      }}
    >
      <Art
        seed={track?.coverSeed || 0}
        grad={track?.gradient}
        image={track?.image}
        images={track?.images}
        mono={mono}
        data-hero="1"
        style={{ height: "100%" }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 2,
            background: "linear-gradient(180deg, rgba(8,8,11,.25), rgba(8,8,11,.6))",
          }}
        />
        {/* Top tags + bottom title via flow (space-between column), not absolute. */}
        <div
          style={{
            position: "relative",
            zIndex: 4,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "flex-start",
            padding: "60px 48px 44px",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "flex-start" }}
          >
            <Button
              onClick={toggleLike}
              style={{
                background: "none",
                border: 0,
                cursor: "pointer",
                color: accent,
                padding: 0,
                filter: `drop-shadow(0 4px 12px ${accent}88)`,
              }}
            >
              <Icon.heart size={30} filled={liked} />
            </Button>
            <span className="pill-accent">{track?.quality || "SQ"}</span>
            <span className="tag">30.88K Comments</span>
          </div>
          <div style={{ maxWidth: "100%" }}>
            <div
              style={{
                fontSize: 28,
                fontWeight: 300,
                borderBottom: "1px solid rgba(255,255,255,.3)",
                paddingBottom: 10,
                maxWidth: "100%",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "inline-block",
              }}
            >
              {track?.title}
            </div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 300,
                color: "var(--tx-3)",
                marginTop: 10,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {track?.artist}
            </div>
          </div>
        </div>
      </Art>
      <div className="scroll" style={{ height: "100%", padding: "60px 48px 40px" }}>
        <div
          style={{
            fontSize: 28,
            fontWeight: 200,
            letterSpacing: ".06em",
            borderBottom: `2px solid ${accent}`,
            paddingBottom: 12,
            display: "inline-block",
            marginBottom: 24,
          }}
        >
          Hot Comments
        </div>
        {MOCK.comments.map((c) => (
          <div
            key={c.id}
            style={{
              display: "flex",
              gap: 16,
              padding: "18px 0",
              borderBottom: "1px solid var(--line)",
            }}
          >
            <Art
              seed={c.seed}
              grad={["#1b1033", accent]}
              style={{ width: 44, height: 44, borderRadius: "50%", flex: "0 0 auto" }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 400, fontSize: 15 }}>{c.text}</div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: 12,
                }}
              >
                <Button
                  onClick={() => tl(c.id)}
                  style={{
                    background: "none",
                    border: 0,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    color: likedC.has(c.id) ? accent : "var(--tx-3)",
                  }}
                >
                  <Icon.heart size={15} filled={likedC.has(c.id)} />
                  <span className="mlabel" style={{ fontSize: 10 }}>
                    {c.likes + (likedC.has(c.id) ? 1 : 0)}
                  </span>
                </Button>
                <span className="mlabel" style={{ color: "var(--tx-4)", fontSize: 10 }}>
                  {c.time}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </FadeIn>
  );
}
