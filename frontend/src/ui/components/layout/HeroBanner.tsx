// ============================================================
// HeroBanner — the featured playlist banner on ForYou (blurred cover fill +
// contained artwork on the right, title/description/actions on a scrim). Lifts
// gently on hover; "Open" flies the morph from the banner.
// ============================================================
import React from "react";
import type { VibeCollection } from "@/model/adapt";
import { Icon, artBg } from "@/components/primitives";
import { LiftCard } from "@/components/lift";
import { Button } from "@/components/controls/Button";
import { useMorphOpen } from "@/hooks/useMorphOpen";

type HeroBannerProps = {
  playlist: VibeCollection;
  onOpen: () => void;
  onPlay: () => void;
  accent: string;
};

export function HeroBanner({ playlist, onOpen, onPlay, accent }: HeroBannerProps) {
  const open = useMorphOpen();
  return (
    <LiftCard
      className="grain"
      scale={1.02}
      liftY={-4}
      style={{
        position: "relative",
        height: 320,
        overflow: "hidden",
        background: artBg(playlist.coverSeed, playlist.gradient),
        boxShadow: "0 24px 60px -20px rgba(0,0,0,.7)",
        marginBottom: 40,
      }}
    >
      {playlist.image && (
        <>
          <img
            src={playlist.image}
            alt=""
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 1,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "blur(40px) saturate(1.2)",
              transform: "scale(1.18)",
              opacity: 0.6,
            }}
          />
          <img
            src={playlist.image}
            alt=""
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 2,
              width: "100%",
              height: "100%",
              objectFit: "contain",
              objectPosition: "right center",
            }}
          />
        </>
      )}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 3,
          background: `linear-gradient(90deg, rgba(6,6,10,.82) 0%, rgba(6,6,10,.45) 55%, transparent 100%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 4,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 56px",
          maxWidth: 640,
        }}
      >
        <span
          className="tag"
          style={{ alignSelf: "flex-start", background: accent, color: "#06060a" }}
        >
          Featured
        </span>
        <div
          style={{
            fontSize: 46,
            fontWeight: 200,
            lineHeight: 1.04,
            letterSpacing: ".005em",
            margin: "16px 0 14px",
            // Real playlist names run long; clamp so the fixed-height banner holds.
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            overflowWrap: "anywhere",
          }}
        >
          {playlist.name}
        </div>
        <div
          style={{
            fontSize: 15,
            fontWeight: 300,
            color: "rgba(255,255,255,.72)",
            maxWidth: 460,
            lineHeight: 1.55,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {playlist.description}
        </div>
        <div style={{ display: "flex", gap: 14, marginTop: 26, alignItems: "center" }}>
          <Button
            className="pill-accent"
            onClick={onPlay}
            style={{
              fontSize: 12,
              padding: "13px 30px",
              display: "inline-flex",
              gap: 10,
              alignItems: "center",
            }}
          >
            <Icon.play size={15} /> Play
          </Button>
          <Button
            onClick={(e) =>
              open(e, {
                seed: playlist.coverSeed,
                grad: playlist.gradient,
                image: playlist.image,
                run: onOpen,
              })
            }
            className="pill-ghost"
          >
            Open
          </Button>
          <span className="mlabel" style={{ color: "rgba(255,255,255,.5)", marginLeft: 6 }}>
            {playlist.tracks.length} tracks
          </span>
        </div>
      </div>
    </LiftCard>
  );
}
