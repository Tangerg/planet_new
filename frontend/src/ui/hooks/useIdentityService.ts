import type { IdentityService } from "@contexts/identity";
import { useEngine } from "./useEngine";

export function useIdentityService(): IdentityService {
  return useEngine().identity;
}
