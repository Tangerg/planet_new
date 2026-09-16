import { useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useIdentityService } from "./useIdentityService";
import { useAuthStore } from "@/store/auth";
import { accountQueryEnabled } from "@/model/account-query";
import { queryKeys } from "@/model/queryKeys";
import { warnWriteFailure } from "@shared/debug";

export function useAuth() {
  const identity = useIdentityService();
  const providerId = identity.providerId;
  const qc = useQueryClient();
  const loggedIn = useAuthStore((s) => s.loggedIn);
  const setLoggedIn = useAuthStore((s) => s.setLoggedIn);

  useEffect(() => {
    setLoggedIn(identity.isLoggedIn());
  }, [identity, providerId, setLoggedIn]);

  const { data: account } = useQuery({
    queryKey: queryKeys.account(providerId),
    queryFn: () => identity.account(),
    enabled: accountQueryEnabled({ loggedIn, authSupported: identity.supported }),
    retry: false,
  });

  const markLoggedIn = useCallback(() => {
    setLoggedIn(true);
    void qc.invalidateQueries({ queryKey: queryKeys.accountRoot() });
  }, [qc, setLoggedIn]);

  const beginLogin = useCallback(() => identity.beginLogin(), [identity]);

  const logout = useCallback(async () => {
    try {
      await identity.logout();
    } catch (error) {
      warnWriteFailure(`${providerId}.logout`, error);
    } finally {
      setLoggedIn(false);
      qc.removeQueries({ queryKey: queryKeys.accountRoot() });
    }
  }, [identity, providerId, qc, setLoggedIn]);

  return {
    supported: identity.supported,
    loggedIn,
    account: account ?? null,
    beginLogin,
    markLoggedIn,
    logout,
  };
}
