import type { LibraryService } from "@contexts/account-library";
import { useEngine } from "./useEngine";

export function useLibraryService(): LibraryService {
  return useEngine().library;
}
