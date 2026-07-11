import type { LibraryService } from "@contexts/account-library";
import { useEngine } from "./useEngine";

/** The logged-in user's library use-case service (liked songs, …). */
export function useLibraryService(): LibraryService {
  return useEngine().library;
}
