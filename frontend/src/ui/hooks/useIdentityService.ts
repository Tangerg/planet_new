import type { IdentityService } from "@contexts/identity";
import { useEngine } from "./useEngine";

/** Identity use cases from the Engine (authentication + persisted session). */
export function useIdentityService(): IdentityService {
  return useEngine().identity;
}
