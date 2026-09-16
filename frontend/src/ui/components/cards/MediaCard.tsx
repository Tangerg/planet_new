import React from "react";
import { useTranslation } from "react-i18next";
import type { CardItem } from "@/model/vibe";
import { useCardActivation, type CardActivation } from "@/components/cards/activation";
import { Art, artPair } from "@/components/primitives";
import { LiftCard, type LiftTuning } from "@/components/lift";
import { PlayFab } from "@/components/cards/PlayFab";
import { PressTarget } from "@/components/controls/PressTarget";
import { useScreenActions } from "@/hooks/screenActions";

export const MEDIA_CARD_ROW_HEIGHT = 240;

type MediaCardProps<T extends CardItem> = CardActivation<T> & {
  sub?: string;
  round?: boolean;
  lift?: LiftTuning;
  px?: number;
};

function MediaCardInner<T extends CardItem>({
  item,
  sub,
  round,
  lift,
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
      {...lift}
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

export const MediaCard = React.memo(MediaCardInner) as typeof MediaCardInner;
