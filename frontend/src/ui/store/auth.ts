import { create } from "zustand";

/**
 * Reactive login flag (the persisted credential itself lives in CredentialStore,
 * which isn't reactive). Seeded from IdentityService.isLoggedIn() on mount, flipped
 * by the login/logout flow so Profile etc. re-render.
 */
type AuthState = {
  loggedIn: boolean;
  setLoggedIn: (loggedIn: boolean) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  loggedIn: false,
  setLoggedIn: (loggedIn) => set({ loggedIn }),
}));
