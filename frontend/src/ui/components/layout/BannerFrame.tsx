// ============================================================
// BannerFrame — the chrome of a full-width featured banner: a gently lifting
// card whose cover fills it twice (a blurred wash behind, the artwork contained
// on the right), a left-to-right scrim, and a content column above both.
//
// The banner's SUBJECT differs per screen (an editorial playlist, a music
// video); this frame does not. It lives here so the two cannot drift apart —
// they already had, by 2px of title margin, after the second one was written by
// copying the first.
// ============================================================
import React from "react";

import { artBg } from "@/components/primitives";
import { Button } from "@/components/controls/Button";
import { LiftCard } from "@/components/lift";
import { useAccent } from "@/hooks/accent";
import { Icon } from "@/infra/icons";

const SCRIM = "linear-gradient(90deg, rgba(6,6,10,.82) 0%, rgba(6,6,10,.45) 55%, transparent 100%)";

type BannerFrameProps = {
  /** Cover art. Absent (or still loading) leaves the seeded gradient showing. */
  image?: string;
  seed: number;
  grad?: string[];
  children: React.ReactNode;
};

export function BannerFrame({ image, seed, grad, children }: BannerFrameProps) {
  return (
    <LiftCard
      className="grain relative mb-10 h-[320px] overflow-hidden"
      scale={1.02}
      liftY={-4}
      style={{
        background: artBg(seed, grad),
        boxShadow: "0 24px 60px -20px rgba(0,0,0,.7)",
      }}
    >
      {image && (
        <>
          <img
            src={image}
            alt=""
            aria-hidden
            className="absolute inset-0 z-[1] h-full w-full scale-[1.18] object-cover opacity-60 blur-[40px] saturate-[1.2]"
          />
          <img
            src={image}
            alt=""
            aria-hidden
            className="absolute inset-0 z-[2] h-full w-full object-contain object-right"
          />
        </>
      )}
      <div className="absolute inset-0 z-[3]" style={{ background: SCRIM }} />
      <div className="absolute inset-0 z-[4] flex max-w-[640px] flex-col justify-center px-14">
        {children}
      </div>
    </LiftCard>
  );
}

/** The accent chip above the title ("Featured"). */
export function BannerTag({ children }: { children: React.ReactNode }) {
  const accent = useAccent();
  return (
    <span className="tag self-start" style={{ background: accent, color: "#06060a" }}>
      {children}
    </span>
  );
}

/** The banner headline. Clamped: real playlist and video titles run long, and
 *  the frame's height is fixed. */
export function BannerTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-[14px] mt-4 line-clamp-2 text-[46px] font-extralight leading-[1.04] tracking-[0.005em] [overflow-wrap:anywhere]">
      {children}
    </div>
  );
}

/** The row of actions under the copy. */
export function BannerActions({ children }: { children: React.ReactNode }) {
  return <div className="mt-[26px] flex items-center gap-[14px]">{children}</div>;
}

/** The banner's primary call to action, in the accent pill. */
export function BannerPrimaryAction({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      className="pill-accent inline-flex items-center gap-2.5"
      style={{ fontSize: 12, padding: "13px 30px" }}
      onClick={onClick}
    >
      <Icon.play size={15} /> {children}
    </Button>
  );
}
