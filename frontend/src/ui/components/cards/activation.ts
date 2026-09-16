import type React from "react";

import { useMorphOpen } from "@/hooks/useMorphOpen";
import type { CardItem } from "@/model/vibe";

export type CardActivation<T extends CardItem> = {
  item: T;
  onOpen: (item: T) => void;
  onPlay?: (item: T) => void;
  playable?: boolean;
};

type CardActivationGesture = (event: React.MouseEvent | React.KeyboardEvent) => void;

export function useCardActivation<T extends CardItem>(
  { item, onOpen }: Pick<CardActivation<T>, "item" | "onOpen">,
  art: { selector: string; round?: boolean },
): { activate: CardActivationGesture; activateFromTarget: CardActivationGesture } {
  const open = useMorphOpen();
  const activate: CardActivationGesture = (e) =>
    open(e, {
      seed: item.coverSeed,
      grad: item.gradient,
      image: item.image,
      round: art.round,
      artSelector: art.selector,
      run: () => onOpen(item),
    });
  return {
    activate,
    activateFromTarget: (e) => {
      e.stopPropagation();
      activate(e);
    },
  };
}
