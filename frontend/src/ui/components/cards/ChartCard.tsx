// ============================================================
// ChartCard — square chart tile (cover-bleed + title + period). Hover scales the
// tile (the "card flow" lift, via LiftButton — neighbours stay put). Opening flies
// the morph as a square from the whole tile.
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
      scale={1.08}
      liftY={-5}
      className="grain relative block aspect-square w-full cursor-pointer overflow-hidden border-0 p-0 text-left text-white"
      style={{ background: artBg(seed, grad) }}
    >
      {image && (
        <img
          src={image}
          alt=""
          draggable={false}
          className="absolute inset-0 z-[1] h-full w-full object-cover"
        />
      )}
      <div
        className="absolute inset-0 z-[2]"
        style={{ background: "linear-gradient(180deg, rgba(0,0,0,.04) 38%, rgba(0,0,0,.7))" }}
      />
      <div className="absolute inset-x-0 bottom-0 z-[3] p-[18px]">
        <div
          className="line-clamp-2 text-[18px] font-normal leading-snug [overflow-wrap:anywhere]"
          style={{ textShadow: "0 2px 16px rgba(0,0,0,.5)" }}
        >
          {title}
        </div>
        <div className="mlabel mt-1.5 opacity-75">{time}</div>
      </div>
    </LiftButton>
  );
}
