// ============================================================
// MediaCard — square (or round) cover card for grids & rails: art + hover-rise
// play fab + title/sub. The whole tile opens on mouse click, while cover/title
// keep keyboard-accessible targets and the play fab remains a sibling action.
// Opening flies the shared-element morph from the `.art` rect.
// ============================================================
import React from "react";
import { useTranslation } from "react-i18next";
import type { CardItem } from "@/model/vibe";
import { Art, artPair } from "@/components/primitives";
import { LiftCard } from "@/components/lift";
import { PlayFab } from "@/components/cards/PlayFab";
import { useMorphOpen } from "@/hooks/useMorphOpen";
import { useScreenActions } from "@/hooks/screenActions";
import { activateOnKey } from "@/lib/keys";

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
  const { t } = useTranslation();
  const open = useMorphOpen();
  const { collMenu } = useScreenActions();
  const activate = (e: React.MouseEvent | React.KeyboardEvent) =>
    open(e, {
      seed: item.coverSeed,
      grad: item.gradient,
      image: item.image,
      round,
      artSelector: ".art",
      run: onOpen,
    });
  const activateFromTarget = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    activate(e);
  };
  return (
    <LiftCard
      className={"mcard gridcard" + (round ? " round" : "")}
      scale={liftScale}
      liftY={liftY}
      onClick={activate}
      onContextMenu={(e) => collMenu(e, item)}
    >
      <div className="relative">
        <div
          // eslint-disable-next-line jsx-a11y/prefer-tag-over-role -- rich art surface, not valid native button content
          role="button"
          tabIndex={0}
          aria-label={item.name}
          onClick={activateFromTarget}
          onKeyDown={activateOnKey(activateFromTarget)}
        >
          <Art
            seed={item.coverSeed}
            grad={item.gradient}
            image={item.image}
            images={item.images}
            px={px}
            className="art"
            glow={round ? undefined : artPair(item.coverSeed, item.gradient)[1]}
          />
        </div>
        {/* artists (round) are people, not playable — no cover play fab */}
        {onPlay && !round && (
          <PlayFab
            className="playfab"
            aria-label={t("a11y.playItem", { name: item.name })}
            onPlay={onPlay}
          />
        )}
      </div>
      <div
        // eslint-disable-next-line jsx-a11y/prefer-tag-over-role -- title is a secondary open target
        role="button"
        tabIndex={0}
        aria-label={item.name}
        onClick={activateFromTarget}
        onKeyDown={activateOnKey(activateFromTarget)}
        className="ttl"
      >
        {item.name}
      </div>
      {sub && <div className="sub">{sub}</div>}
    </LiftCard>
  );
}
