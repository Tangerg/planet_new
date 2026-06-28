import type { AuthService } from "@core";
import { useEngine } from "./useEngine";

/** The login use-case service from the Engine (provider auth + credential). */
export function useAuthService(): AuthService {
  return useEngine().auth;
}
