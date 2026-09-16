import { create } from "zustand";

type AuthState = {
  loggedIn: boolean;
  setLoggedIn: (loggedIn: boolean) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  loggedIn: false,
  setLoggedIn: (loggedIn) => set({ loggedIn }),
}));
