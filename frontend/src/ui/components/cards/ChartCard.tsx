// ============================================================
// ChartCard — tall chart banner (cover-bleed + title + period). Opening flies
// the morph from the whole banner. Built on LiftButton (it's a real <button>).
// ============================================================
import React from "react";
import { artBg } from "@/components/primitives";
import { LiftButton } from "@/components/lift";
import { useMorphOpen } from "@/hooks/useMorphOpen";

type ChartCardProps = {
  title: string;
  time: string;
  seed: number;
  grad?: string[];
  image?: string;
  onOpen: () => void;
};

export function ChartCard({ title, time, seed, grad, image, onOpen }: ChartCardProps) {
  const open = useMorphOpen();
  return (
    <LiftButton
      onClick={(e) => open(e, { seed, grad, image, run: onOpen })}
      className="grain"
      style={{
        position: "relative",
        border: 0,
        cursor: "pointer",
        overflow: "hidden",
        color: "#fff",
        minHeight: 200,
        background: artBg(seed, grad),
        textAlign: "left",
        padding: 0,
        borderRadius: "var(--r-md)",
      }}
    >
      {image && (
        <img
          src={image}
          alt=""
          draggable={false}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            zIndex: 1,
          }}
        />
      )}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          background: "linear-gradient(180deg, rgba(0,0,0,.15), rgba(0,0,0,.58))",
        }}
      />
      <div
        style={{
          position: "relative",
          zIndex: 3,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 30px",
        }}
      >
        <div
          style={{
            fontSize: 26,
            fontWeight: 300,
            letterSpacing: ".02em",
            textShadow: "0 2px 16px rgba(0,0,0,.5)",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            overflowWrap: "anywhere",
          }}
        >
          {title}
        </div>
        <div
          style={{ width: 64, height: 2, background: "rgba(255,255,255,.85)", margin: "16px 0" }}
        />
        <div className="mlabel" style={{ opacity: 0.8 }}>
          {time}
        </div>
      </div>
    </LiftButton>
  );
}
