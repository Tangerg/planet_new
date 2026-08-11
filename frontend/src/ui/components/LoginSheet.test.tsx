import React from "react";
import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { LoginFlow, LoginStatus } from "@contexts/identity";
import { LoginSheet } from "./LoginSheet";

const mocks = vi.hoisted(() => ({
  warnReadFailure: vi.fn<(subject: string, error: unknown) => void>(),
}));

vi.mock("@shared/debug", () => ({ warnReadFailure: mocks.warnReadFailure }));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("@/components/Sheet", () => ({
  Sheet: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? children : null,
}));

function qrFlow(poll: () => Promise<LoginStatus>): LoginFlow {
  return { kind: "qr", image: "qr:data", poll };
}

afterEach(() => {
  vi.useRealTimers();
  mocks.warnReadFailure.mockReset();
});

describe("LoginSheet", () => {
  it("polls once per interval and closes after authorization", async () => {
    vi.useFakeTimers();
    const poll = vi.fn<() => Promise<LoginStatus>>().mockResolvedValue({ state: "authorized" });
    const beginLogin = vi.fn<() => Promise<LoginFlow>>().mockResolvedValue(qrFlow(poll));
    const markLoggedIn = vi.fn<() => void>();
    const onClose = vi.fn<() => void>();

    render(
      <LoginSheet
        open
        beginLogin={beginLogin}
        markLoggedIn={markLoggedIn}
        sourceName="Test Source"
        onClose={onClose}
      />,
    );
    await act(async () => Promise.resolve());

    expect(beginLogin).toHaveBeenCalledTimes(1);
    expect(poll).not.toHaveBeenCalled();

    await act(async () => vi.advanceTimersByTimeAsync(2000));

    expect(poll).toHaveBeenCalledTimes(1);
    expect(markLoggedIn).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("turns a rejected login start into an explicit failure state", async () => {
    const error = new Error("offline");
    const beginLogin = vi.fn<() => Promise<LoginFlow>>().mockRejectedValue(error);

    render(
      <LoginSheet
        open
        beginLogin={beginLogin}
        markLoggedIn={vi.fn<() => void>()}
        sourceName="Test Source"
        onClose={vi.fn<() => void>()}
      />,
    );
    await act(async () => Promise.resolve());

    expect(screen.getByText("login.failed")).toBeInTheDocument();
    expect(mocks.warnReadFailure).toHaveBeenCalledWith("identity.login.begin", error);
  });

  it("stops polling and exposes a failure when the provider poll rejects", async () => {
    vi.useFakeTimers();
    const error = new Error("poll failed");
    const poll = vi.fn<() => Promise<LoginStatus>>().mockRejectedValue(error);

    render(
      <LoginSheet
        open
        beginLogin={() => Promise.resolve(qrFlow(poll))}
        markLoggedIn={vi.fn<() => void>()}
        sourceName="Test Source"
        onClose={vi.fn<() => void>()}
      />,
    );
    await act(async () => Promise.resolve());
    await act(async () => vi.advanceTimersByTimeAsync(2000));

    expect(screen.getByText("login.failed")).toBeInTheDocument();
    expect(mocks.warnReadFailure).toHaveBeenCalledWith("identity.login.poll", error);
    await act(async () => vi.advanceTimersByTimeAsync(4000));
    expect(poll).toHaveBeenCalledTimes(1);
  });

  it("ignores an in-flight poll after the sheet unmounts", async () => {
    vi.useFakeTimers();
    let finishPoll!: (status: LoginStatus) => void;
    const poll = vi.fn<() => Promise<LoginStatus>>(
      () =>
        new Promise<LoginStatus>((resolve) => {
          finishPoll = resolve;
        }),
    );
    const markLoggedIn = vi.fn<() => void>();
    const onClose = vi.fn<() => void>();
    const { unmount } = render(
      <LoginSheet
        open
        beginLogin={() => Promise.resolve(qrFlow(poll))}
        markLoggedIn={markLoggedIn}
        sourceName="Test Source"
        onClose={onClose}
      />,
    );
    await act(async () => Promise.resolve());
    await act(async () => vi.advanceTimersByTimeAsync(2000));
    expect(poll).toHaveBeenCalledTimes(1);

    unmount();
    await act(async () => finishPoll({ state: "authorized" }));

    expect(markLoggedIn).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
