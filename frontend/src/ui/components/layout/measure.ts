import { useLayoutEffect, type RefObject } from "react";

import { useEventCallback } from "@/hooks/useEventCallback";

/**
 * The offset from the scroller's content top to `el`'s top — what TanStack
 * Virtual wants as `scrollMargin` when the windowed area sits below other
 * content (a hero, a sticky header) rather than filling the scroller.
 */
export function scrollTopOffset(el: HTMLElement, scroller: HTMLElement): number {
  return el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
}

/**
 * Run `measure` immediately, on any resize of the windowed box or its scroller,
 * and whenever `revision` changes.
 *
 * The callback is held at a stable identity, so the ResizeObserver is created
 * exactly once yet always calls the latest closure — which is why a caller can
 * read live props inside `measure` instead of mirroring each one into a ref to
 * keep the observer from being rebuilt.
 *
 * `revision` is the caller's "a measurement input changed" signal: bump it (a
 * count, or a joined key of the metrics the measurement reads) and the box is
 * re-measured without disturbing the observer.
 */
export function useMeasuredInScroller(
  scrollRef: RefObject<HTMLElement | null>,
  containerRef: RefObject<HTMLElement | null>,
  measure: (el: HTMLElement, scroller: HTMLElement) => void,
  revision: string | number,
): void {
  const run = useEventCallback(() => {
    const el = containerRef.current;
    const scroller = scrollRef.current;
    if (el && scroller) measure(el, scroller);
  });

  useLayoutEffect(() => {
    run();
    const observer = new ResizeObserver(run);
    if (scrollRef.current) observer.observe(scrollRef.current);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [run, scrollRef, containerRef]);

  useLayoutEffect(() => {
    run();
  }, [run, revision]);
}
