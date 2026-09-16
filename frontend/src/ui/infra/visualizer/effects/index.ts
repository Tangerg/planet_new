import type { VisualEffect } from "../effect";
import { cloudEffect } from "./cloud";
import { wavesEffect } from "./waves";

export const VISUAL_EFFECTS: readonly VisualEffect[] = [cloudEffect, wavesEffect];

export const DEFAULT_EFFECT_ID = VISUAL_EFFECTS[0].id;

export function effectById(id: string): VisualEffect {
  return VISUAL_EFFECTS.find((effect) => effect.id === id) ?? VISUAL_EFFECTS[0];
}
