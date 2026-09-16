import { createContext, use } from "react";
import type { RefObject } from "react";

export type ScrollRef = RefObject<HTMLElement | null>;

const ScrollContext = createContext<ScrollRef | null>(null);

export const ScrollProvider = ScrollContext.Provider;

export function useScrollRef(): ScrollRef | null {
  return use(ScrollContext);
}
