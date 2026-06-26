// ============================================================
// MediaCard — square (or round) cover card for grids & rails: art + hover-rise
// play fab + title/sub. Composed from CardShell (interaction) + Art + PlayFab.
// Opening flies the shared-element morph from the `.art` rect.
// ============================================================
import React from "react";
import type { CardItem } from "@/model/adapt";
import { Art, artPair } from "@/components/primitives";
import { CardShell } from "@/components/cards/CardShell";
import { PlayFab } from "@/components/cards/PlayFab";
import { useMorphOpen } from "@/hooks/useMorphOpen";
import { useScreenActions } from "@/hooks/screenActions";

type MediaCardProps = {
  item: CardItem;
  sub?: string;
  round?: boolean;
  /** Lift intensity — gentler for rail/wrapping cards (square covers use 1.22). */
  liftScale?: number;
  liftY?: number;
  /** Art render-width hint for image-variant selection. */
  px?: number;
  onOpen: () => void;
  onPlay?: () => void;
};

export function MediaCard({
  item,
  sub,
  round,
  liftScale,
  liftY,
  px = 176,
  onOpen,
  onPlay,
}: MediaCardProps) {
  const open = useMorphOpen();
  const { collMenu } = useScreenActions();
  return (
    <CardShell
      className={"mcard gridcard" + (round ? " round" : "")}
      scale={liftScale}
      liftY={liftY}
      onActivate={(e) =>
        open(e, {
          seed: item.coverSeed,
          grad: item.gradient,
          image: item.image,
          round,
          artSelector: ".art",
          run: onOpen,
        })
      }
      onContextMenu={(e) => collMenu(e, item)}
    >
      <Art
        seed={item.coverSeed}
        grad={item.gradient}
        image={item.image}
        images={item.images}
        px={px}
        className="art"
        glow={round ? undefined : artPair(item.coverSeed, item.gradient)[1]}
      >
        {onPlay && <PlayFab className="playfab" onPlay={onPlay} />}
      </Art>
      <div className="ttl">{item.name}</div>
      {sub && <div className="sub">{sub}</div>}
    </CardShell>
  );
}
