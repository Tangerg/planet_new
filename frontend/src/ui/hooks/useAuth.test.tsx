import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProviderId } from "@contexts/contracts";
import { useAuth } from "./useAuth";

const mocks = vi.hoisted(() => ({
  identity: {
    providerId: "netease",
    supported: false,
    isLoggedIn: vi.fn<() => boolean>(() => true),
    account: vi.fn<() => Promise<undefined>>(async () => undefined),
    beginLogin: vi.fn<() => Promise<never>>(),
    logout: vi.fn<() => Promise<void>>(),
  },
  authState: {
    loggedIn: true,
    setLoggedIn: vi.fn<(loggedIn: boolean) => void>(),
  },
  warnWriteFailure: vi.fn<(subject: string, error: unknown) => void>(),
}));

vi.mock("./useIdentityService", () => ({ useIdentityService: () => mocks.identity }));
vi.mock("@/store/auth", () => ({
  useAuthStore: (selector: (state: typeof mocks.authState) => unknown) => selector(mocks.authState),
}));
vi.mock("@shared/debug", () => ({ warnWriteFailure: mocks.warnWriteFailure }));

beforeEach(() => {
  mocks.identity.providerId = ProviderId.of("netease");
  mocks.identity.logout.mockReset();
  mocks.authState.setLoggedIn.mockReset();
  mocks.warnWriteFailure.mockReset();
});

describe("useAuth", () => {
  it("finishes local logout state when the remote endpoint fails", async () => {
    const error = new Error("remote logout unavailable");
    mocks.identity.logout.mockRejectedValueOnce(error);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const removeQueries = vi.spyOn(queryClient, "removeQueries");
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useAuth(), { wrapper });
    mocks.authState.setLoggedIn.mockClear();

    await act(async () => result.current.logout());

    expect(mocks.warnWriteFailure).toHaveBeenCalledWith("netease.logout", error);
    expect(mocks.authState.setLoggedIn).toHaveBeenCalledWith(false);
    expect(removeQueries).toHaveBeenCalledWith({ queryKey: ["account"] });
  });
});
