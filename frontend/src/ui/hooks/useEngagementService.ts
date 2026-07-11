import type { EngagementService } from "@contexts/engagement";
import { useEngine } from "./useEngine";

export function useEngagementService(): EngagementService {
  return useEngine().engagement;
}
