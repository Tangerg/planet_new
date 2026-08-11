// ============================================================
// CollectionRow — compact list row for a collection (cover + name/sub + meta),
// the high-density alternative to the card grid. Opening flies the morph from
// the small cover (`.clrt`).
// ============================================================
import React from "react";
import { useTranslation } from "react-i18next";
import type { CardItem } from "@/model/vibe";
import type { CardActivation } from "@/components/cards/activation";
import { Art } from "@/components/primitives";
import { Icon } from "@/infra/icons";
import { Button } from "@/components/controls/Button";
import { PressTarget } from "@/components/controls/PressTarget";
import { useMorphOpen } from "@/hooks/useMorphOpen";
import { useScreenActions } from "@/hooks/screenActions";

/** Rendered height of one `.crow`. Windowed lists estimate with it, so it must
 *  track the row metrics in cards.css. */
export const COLLECTION_ROW_HEIGHT = 66;

type CollectionRowProps<T extends CardItem> = CardActivation<T> & {
  sub?: string;
  meta?: string;
  round?: boolean;
};

function CollectionRowInner<T extends CardItem>({
  item,
  sub,
  meta,
  round,
  onOpen,
  onPlay,
  playable = true,
}: CollectionRowProps<T>) {
  const { t } = useTranslation();
  const open = useMorphOpen();
  const { collMenu } = useScreenActions();
  const activate = (e: React.MouseEvent | React.KeyboardEvent) =>
    open(e, {
      seed: item.coverSeed,
      grad: item.gradient,
      image: item.image,
      round,
      artSelector: ".clrt",
      run: () => onOpen(item),
    });
  const activateFromTarget = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    activate(e);
  };
  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events -- mouse-only row hit-area; cover/text below remain keyboard-accessible, and making the row role="button" would semantically nest the play button.
    <div onClick={activate} onContextMenu={(e) => collMenu(e, item)} className="crow">
      <div className="relative flex-none">
        <PressTarget label={item.name} onActivate={activateFromTarget}>
          <Art
            className="clrt"
            seed={item.coverSeed}
            grad={item.gradient}
            image={item.image}
            images={item.images}
            style={{ width: 48, height: 48, borderRadius: round ? "50%" : 0 }}
          />
        </PressTarget>
        {/* artists (round) are people, not playable — no cover play fab.
            Mounted unconditionally and revealed by the row's :hover rule; gating
            it on a hover STATE re-rendered the row on every cursor crossing. It
            covers the artwork, so it stays pointer-transparent until revealed —
            otherwise it would swallow the clicks meant to open the collection. */}
        {onPlay && !round && playable && (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onPlay(item);
            }}
            aria-label={t("a11y.playItem", { name: item.name })}
            className="crow-play absolute inset-0 grid place-items-center text-white"
            style={{ borderRadius: round ? "50%" : 0 }}
          >
            <Icon.play size={18} />
          </Button>
        )}
      </div>
      <PressTarget label={item.name} onActivate={activateFromTarget} className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-normal">{item.name}</div>
        <div className="truncate text-[12.5px] font-light text-white/50">{sub}</div>
      </PressTarget>
      {meta && <span className="mlabel flex-none text-[11px] text-white/40">{meta}</span>}
    </div>
  );
}

// React.memo: leaf of the windowed collection list; VList re-invokes renderItem
// for all visible rows on each scroll tick. The stable per-item callbacks the
// CardActivation contract mandates let the shallow compare bail so only entering
// rows render. The cast preserves the generic call signature that React.memo erases.
export const CollectionRow = React.memo(CollectionRowInner) as typeof CollectionRowInner;
