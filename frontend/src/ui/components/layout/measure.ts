import { useLayoutEffect, type RefObject } from "react";

import { useEventCallback } from "@/hooks/useEventCallback";

export function scrollTopOffset(el: HTMLElement, scroller: HTMLElement): number {
  return el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
}

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
