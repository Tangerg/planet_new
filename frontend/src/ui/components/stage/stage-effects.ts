import { createAuroraField } from "./aurora-field";
import { createParticleField } from "./particle-field";
import type { StageEffect } from "./stage-effect";

// The selectable fullscreen effects, in switcher order. Adding a new visual is one
// entry here (id + label + a create() returning a per-frame draw) — the stage host,
// switcher, and persistence all read from this list.
export const STAGE_EFFECTS: readonly StageEffect[] = [
  { id: "particles", labelKey: "stage.effect.particles", create: createParticleField },
  { id: "aurora", labelKey: "stage.effect.aurora", create: createAuroraField },
];

export const DEFAULT_STAGE_EFFECT = STAGE_EFFECTS[0].id;

export function stageEffectById(id: string): StageEffect {
  return STAGE_EFFECTS.find((effect) => effect.id === id) ?? STAGE_EFFECTS[0];
}
