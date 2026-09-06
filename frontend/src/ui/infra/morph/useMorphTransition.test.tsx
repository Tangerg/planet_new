import { useEffect, useRef, useState } from "react";
import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { MorphSource } from "./context";
import { MORPH_FAILSAFE_MS, useMorphTransition } from "./useMorphTransition";

type HarnessApi = ReturnType<typeof useMorphTransition>;

const origin = {
  left: 10,
  top: 20,
  width: 120,
  height: 120,
  right: 130,
  bottom: 140,
  x: 10,
  y: 20,
  toJSON: () => ({}),
} as DOMRect;

function Harness({ onApi }: { onApi: (api: HarnessApi) => void }) {
  const [view, setView] = useState("xmb");
  const rootRef = useRef<HTMLDivElement>(null);
  const api = useMorphTransition(rootRef, view, setView, "xmb");

  useEffect(() => {
    onApi(api);
  }, [api, onApi]);

  return (
    <div ref={rootRef} data-testid="root">
      <span data-testid="phase">{api.trans?.phase ?? "none"}</span>
    </div>
  );
}

describe("useMorphTransition", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn<typeof window.matchMedia>().mockReturnValue({
        matches: false,
        media: "",
        onchange: null,
        addListener: vi.fn<MediaQueryList["addListener"]>(),
        removeListener: vi.fn<MediaQueryList["removeListener"]>(),
        addEventListener: vi.fn<MediaQueryList["addEventListener"]>(),
        removeEventListener: vi.fn<MediaQueryList["removeEventListener"]>(),
        dispatchEvent: vi.fn<MediaQueryList["dispatchEvent"]>(),
      }),
    });
    Element.prototype.getBoundingClientRect = vi.fn<() => DOMRect>(() => origin);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("does not drop a navigation intent while a previous morph is still active", () => {
    let api!: HarnessApi;
    const runs: string[] = [];
    render(<Harness onApi={(next) => (api = next)} />);

    act(() => {
      api.startForward({ run: () => runs.push("first") }, origin);
    });
    expect(runs).toEqual(["first"]);

    act(() => {
      api.startForward({ run: () => runs.push("second") }, origin);
    });

    expect(runs).toEqual(["first", "second"]);
    expect(screen.getByTestId("phase")).toHaveTextContent("none");
  });

  it("clears a forward morph even if the animation phase never advances", () => {
    let api!: HarnessApi;
    const item: MorphSource = { run: vi.fn<() => void>() };
    render(<Harness onApi={(next) => (api = next)} />);

    act(() => {
      api.startForward(item, origin);
    });
    expect(screen.getByTestId("phase")).not.toHaveTextContent("none");

    act(() => {
      vi.advanceTimersByTime(MORPH_FAILSAFE_MS);
    });

    expect(screen.getByTestId("phase")).toHaveTextContent("none");
  });

  it("clears a reverse morph even if the animation phase never advances", () => {
    let api!: HarnessApi;
    const item: MorphSource = { run: vi.fn<() => void>() };
    render(<Harness onApi={(next) => (api = next)} />);

    act(() => {
      api.startForward(item, origin);
      vi.advanceTimersByTime(MORPH_FAILSAFE_MS);
    });
    expect(screen.getByTestId("phase")).toHaveTextContent("none");

    act(() => {
      api.startReverse();
    });
    expect(screen.getByTestId("phase")).not.toHaveTextContent("none");

    act(() => {
      vi.advanceTimersByTime(MORPH_FAILSAFE_MS);
    });

    expect(screen.getByTestId("phase")).toHaveTextContent("none");
  });
});
