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

type MediaCardProps<T extends CardItem> = {
  item: T;
  sub?: string;
  round?: boolean;
  /** Lift intensity — gentler for rail/wrapping cards (square covers use 1.22). */
  liftScale?: number;
  liftY?: number;
  /** Art render-width hint for image-variant selection. */
  px?: number;
  /** Callbacks take the item so callers pass ONE reused handler reference (not a
   *  fresh `() => open(item)` per cell). That keeps the memoized card from
   *  re-rendering on every scroll windowing tick — see the React.memo note below. */
  onOpen: (item: T) => void;
  onPlay?: (item: T) => void;
  /** Show the play fab. Default true; pass false to hide it per-item (e.g. a
   *  collection with no playable track) while keeping onPlay a stable reference. */
  playable?: boolean;
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
  const open = useMorphOpen();
  const { collMenu } = useScreenActions();
  const activate = (e: React.MouseEvent | React.KeyboardEvent) =>
    open(e, {
      seed: item.coverSeed,
      grad: item.gradient,
      image: item.image,
      round,
      artSelector: ".art",
      run: () => onOpen(item),
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
        {onPlay && !round && playable && (
          <PlayFab
            className="playfab"
            aria-label={t("a11y.playItem", { name: item.name })}
            onPlay={() => onPlay(item)}
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

// React.memo: leaf of every card grid/rail; the windowed grid/rail re-invokes
// renderItem for all visible cells on each scroll tick. With stable per-item
// callbacks (above) the shallow compare bails, so only entering cards render.
// The cast preserves the generic call signature that React.memo erases.
export const MediaCard = React.memo(MediaCardInner) as typeof MediaCardInner;
