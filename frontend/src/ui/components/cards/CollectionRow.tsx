// ============================================================
// CollectionRow — compact list row for a collection (cover + name/sub + meta),
// the high-density alternative to the card grid. Opening flies the morph from
// the small cover (`.clrt`).
// ============================================================
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import type { CardItem } from "@/model/vibe";
import { Art } from "@/components/primitives";
import { Icon } from "@/infra/icons";
import { Button } from "@/components/controls/Button";
import { useMorphOpen } from "@/hooks/useMorphOpen";
import { useScreenActions } from "@/hooks/screenActions";
import { activateOnKey } from "@/lib/keys";

type CollectionRowProps = {
  item: CardItem;
  sub?: string;
  meta?: string;
  round?: boolean;
  onOpen: () => void;
  onPlay?: () => void;
};

export function CollectionRow({ item, sub, meta, round, onOpen, onPlay }: CollectionRowProps) {
  const { t } = useTranslation();
  const [hover, setHover] = useState(false);
  const open = useMorphOpen();
  const { collMenu } = useScreenActions();
  const activate = (e: React.MouseEvent | React.KeyboardEvent) =>
    open(e, {
      seed: item.coverSeed,
      grad: item.gradient,
      image: item.image,
      round,
      artSelector: ".clrt",
      run: onOpen,
    });
  const activateFromTarget = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    activate(e);
  };
  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events -- mouse-only row hit-area; cover/text below remain keyboard-accessible, and making the row role="button" would semantically nest the play button.
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={activate}
      onContextMenu={(e) => collMenu(e, item)}
      className="flex cursor-pointer items-center gap-4 rounded-[8px] px-[14px] py-[9px] transition-[background] duration-150"
      style={{ background: hover ? "rgba(255,255,255,.06)" : "transparent" }}
    >
      <div className="relative flex-none">
        <div
          // eslint-disable-next-line jsx-a11y/prefer-tag-over-role -- cover art opens the collection with morph geometry
          role="button"
          tabIndex={0}
          aria-label={item.name}
          onClick={activateFromTarget}
          onKeyDown={activateOnKey(activateFromTarget)}
        >
          <Art
            className="clrt"
            seed={item.coverSeed}
            grad={item.gradient}
            image={item.image}
            images={item.images}
            style={{ width: 48, height: 48, borderRadius: round ? "50%" : 0 }}
          />
        </div>
        {/* artists (round) are people, not playable — no cover play fab */}
        {onPlay && !round && hover && (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onPlay();
            }}
            aria-label={t("a11y.playItem", { name: item.name })}
            className="absolute inset-0 grid place-items-center text-white"
            style={{ background: "rgba(0,0,0,.42)", borderRadius: round ? "50%" : 0 }}
          >
            <Icon.play size={18} />
          </Button>
        )}
      </div>
      <div
        // eslint-disable-next-line jsx-a11y/prefer-tag-over-role -- text body is a secondary open target
        role="button"
        tabIndex={0}
        aria-label={item.name}
        onClick={activateFromTarget}
        onKeyDown={activateOnKey(activateFromTarget)}
        className="min-w-0 flex-1"
      >
        <div className="truncate text-[15px] font-normal">{item.name}</div>
        <div className="truncate text-[12.5px] font-light text-white/50">{sub}</div>
      </div>
      {meta && <span className="mlabel flex-none text-[11px] text-white/40">{meta}</span>}
    </div>
  );
}
