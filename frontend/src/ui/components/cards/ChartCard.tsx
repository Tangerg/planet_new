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
      className="grain relative min-h-[200px] cursor-pointer overflow-hidden border-0 p-0 text-left text-white"
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
        style={{ background: "linear-gradient(180deg, rgba(0,0,0,.15), rgba(0,0,0,.58))" }}
      />
      <div className="relative z-[3] flex h-full flex-col justify-center px-[30px]">
        <div
          className="line-clamp-2 overflow-hidden text-[26px] font-light tracking-[0.02em] [overflow-wrap:anywhere]"
          style={{ textShadow: "0 2px 16px rgba(0,0,0,.5)" }}
        >
          {title}
        </div>
        <div className="my-4 h-0.5 w-16 bg-white/85" />
        <div className="mlabel opacity-80">{time}</div>
      </div>
    </LiftButton>
  );
}
