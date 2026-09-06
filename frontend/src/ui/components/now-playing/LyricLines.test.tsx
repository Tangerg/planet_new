import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { activeLyricScrollTop, LyricLines } from "./LyricLines";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("LyricLines", () => {
  it("computes the centered line position relative to the scroll container", () => {
    expect(activeLyricScrollTop(40, { top: 250, height: 40 }, { top: 100, height: 400 })).toBe(10);
  });

  it("interrupts an old smooth scroll before centering and on cleanup", () => {
    const scrollContainer = document.createElement("div");
    document.body.append(scrollContainer);
    scrollContainer.scrollTop = 40;
    const scrollTo = vi.fn<HTMLDivElement["scrollTo"]>();
    Object.defineProperty(scrollContainer, "scrollTo", { value: scrollTo });
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (
      this: HTMLElement,
    ) {
      return this === scrollContainer
        ? new DOMRect(0, 100, 100, 400)
        : new DOMRect(0, 250, 100, 40);
    });

    const { unmount } = render(
      <LyricLines
        lines={[{ duration: 0, content: "First line" }]}
        active={0}
        scrollRef={{ current: scrollContainer }}
      />,
      { container: scrollContainer },
    );

    expect(scrollTo.mock.calls).toEqual([
      [{ top: 40, behavior: "auto" }],
      [{ top: 10, behavior: "smooth" }],
    ]);

    unmount();
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 40, behavior: "auto" });
  });
});
