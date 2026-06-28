import { useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuthService } from "./useAuthService";
import { useMediaService } from "./useMediaService";
import { useAuthStore } from "@/store/auth";

/**
 * UI handle for login: reactive `loggedIn` + the current `account` (React Query,
 * keyed by provider), plus begin/mark/logout. The login flow itself (QR poll)
 * is driven by LoginSheet; `markLoggedIn` is called on success to refresh state.
 */
export function useAuth() {
  const auth = useAuthService();
  const media = useMediaService();
  const qc = useQueryClient();
  const loggedIn = useAuthStore((s) => s.loggedIn);
  const setLoggedIn = useAuthStore((s) => s.setLoggedIn);

  // Seed the reactive flag from the persisted credential.
  useEffect(() => {
    setLoggedIn(auth.isLoggedIn());
  }, [auth, setLoggedIn]);

  const { data: account } = useQuery({
    queryKey: ["account", media.providerName],
    queryFn: () => auth.account(),
    enabled: auth.supported && loggedIn,
    retry: false,
  });

  const markLoggedIn = useCallback(() => {
    setLoggedIn(true);
    void qc.invalidateQueries({ queryKey: ["account"] });
  }, [qc, setLoggedIn]);

  const logout = useCallback(async () => {
    await auth.logout();
    setLoggedIn(false);
    qc.removeQueries({ queryKey: ["account"] });
  }, [auth, qc, setLoggedIn]);

  return {
    supported: auth.supported,
    loggedIn,
    account: account ?? null,
    beginLogin: () => auth.beginLogin(),
    markLoggedIn,
    logout,
  };
}
