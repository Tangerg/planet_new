import type { VisualEffect } from "../engine";
import { cloudEffect } from "./cloud";
import { wavesEffect } from "./waves";

// The selectable fullscreen effects, in switcher order. Adding a visual is one entry
// here (a create() consuming the VisualFrame) — the host + switcher read this list.
export const VISUAL_EFFECTS: readonly VisualEffect[] = [cloudEffect, wavesEffect];

export const DEFAULT_EFFECT_ID = VISUAL_EFFECTS[0].id;

export function effectById(id: string): VisualEffect {
  return VISUAL_EFFECTS.find((effect) => effect.id === id) ?? VISUAL_EFFECTS[0];
}

// The player bar always renders the waves (its compact form); the stage offers the
// full list above.
export { wavesEffect } from "./waves";
