import { createContext, use } from "react";

export type MorphSource = {
  seed?: number;
  grad?: string[];
  image?: string;
  radius?: number | string;
  run?: () => void;
};

export type MorphFn = (source: MorphSource, rect: DOMRect) => void;

const fallback: MorphFn = (source) => source.run?.();

const MorphContext = createContext<MorphFn>(fallback);

export function MorphProvider({ morph, children }: { morph: MorphFn; children: React.ReactNode }) {
  return <MorphContext.Provider value={morph}>{children}</MorphContext.Provider>;
}

export function useMorph(): MorphFn {
  return use(MorphContext);
}

const FrozenContext = createContext(false);

export function MorphFrozen({ children }: { children: React.ReactNode }) {
  return <FrozenContext.Provider value={true}>{children}</FrozenContext.Provider>;
}

export function useMorphFrozen(): boolean {
  return use(FrozenContext);
}
