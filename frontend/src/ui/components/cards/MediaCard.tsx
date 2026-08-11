// ============================================================
// MediaCard — square (or round) cover card for grids & rails: art + hover-rise
// play fab + title/sub. The whole tile opens on mouse click, while cover/title
// keep keyboard-accessible targets and the play fab remains a sibling action.
// Opening flies the shared-element morph from the `.art` rect.
// ============================================================
import React from "react";
import { useTranslation } from "react-i18next";
import type { CardItem } from "@/model/vibe";
import { useCardActivation, type CardActivation } from "@/components/cards/activation";
import { Art, artPair } from "@/components/primitives";
import { LiftCard } from "@/components/lift";
import { PlayFab } from "@/components/cards/PlayFab";
import { PressTarget } from "@/components/controls/PressTarget";
import { useScreenActions } from "@/hooks/screenActions";

/** Rendered height of one grid row of media cards (cover + two text lines).
 *  Windowed grids estimate with it. */
export const MEDIA_CARD_ROW_HEIGHT = 240;

type MediaCardProps<T extends CardItem> = CardActivation<T> & {
  sub?: string;
  round?: boolean;
  /** Lift intensity — gentler for rail/wrapping cards (square covers use 1.22). */
  liftScale?: number;
  liftY?: number;
  /** Art render-width hint for image-variant selection. */
  px?: number;
};

function MediaCardInner<T extends CardItem>({
  item,
  sub,
  round,
  liftScale,
  liftY,
  px = 176,
  onOpen,
  onPlay,
  playable = true,
}: MediaCardProps<T>) {
  const { t } = useTranslation();
  const { collMenu } = useScreenActions();
  const { activate, activateFromTarget } = useCardActivation(
    { item, onOpen },
    { selector: ".art", round },
  );
  return (
    <LiftCard
      className={"mcard gridcard" + (round ? " round" : "")}
      scale={liftScale}
      liftY={liftY}
      onClick={activate}
      onContextMenu={(e) => collMenu(e, item)}
    >
      <div className="relative">
        <PressTarget label={item.name} onActivate={activateFromTarget}>
          <Art
            seed={item.coverSeed}
            grad={item.gradient}
            image={item.image}
            images={item.images}
            px={px}
            className="art"
            glow={round ? undefined : artPair(item.coverSeed, item.gradient)[1]}
          />
        </PressTarget>
        {/* artists (round) are people, not playable — no cover play fab */}
        {onPlay && !round && playable && (
          <PlayFab
            className="playfab"
            aria-label={t("a11y.playItem", { name: item.name })}
            onPlay={() => onPlay(item)}
          />
        )}
      </div>
      <PressTarget label={item.name} onActivate={activateFromTarget} className="ttl">
        {item.name}
      </PressTarget>
      {sub && <div className="sub">{sub}</div>}
    </LiftCard>
  );
}

// React.memo: leaf of every card grid/rail; the windowed grid/rail re-invokes
// renderItem for all visible cells on each scroll tick. With the stable per-item
// callbacks the CardActivation contract mandates, the shallow compare bails so
// only entering cards render. The cast preserves the generic call signature that
// React.memo erases.
export const MediaCard = React.memo(MediaCardInner) as typeof MediaCardInner;
