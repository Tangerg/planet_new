// UI-layer morph infra: the page-to-page (cross-screen) shared-element
// transition engine + its render stage. Screen-agnostic — consumers supply
// `renderScreen` and a tile-background resolver. In-page animation is a
// separate concern (Motion); this owns only the navigation morph.
export { useMorphTransition, type MorphLastTile, type Transition } from "./useMorphTransition";
export { MorphStage } from "./MorphStage";
export {
  MorphProvider,
  useMorph,
  MorphFrozen,
  useMorphFrozen,
  type MorphFn,
  type MorphSource,
} from "./context";
