type UiPerfTrigger = "input" | "keydown" | "pointerdown" | "wheel";

export type UiPerfSummary = {
  label: string;
  trigger: UiPerfTrigger;
  frames: number;
  avgMs: number;
  p95Ms: number;
  maxMs: number;
  over24: number;
  over32: number;
  over50: number;
  at: string;
};

type UiPerfState = {
  latest?: UiPerfSummary;
  samples: UiPerfSummary[];
  clear: () => void;
};

declare global {
  interface Window {
    __PLANET_UI_PERF__?: UiPerfState;
  }
}

const ENABLE_STORAGE_KEY = "planet.uiPerf";
const LATEST_STORAGE_KEY = "planet.uiPerf.latest";
const DEFAULT_SAMPLE_MS = 1100;
const INPUT_SAMPLE_MS = 2400;
const MAX_SAMPLES = 24;

let installed = false;
let sampling = false;

function isEnabled(): boolean {
  if (!import.meta.env.DEV || typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return params.has("perf") || window.localStorage.getItem(ENABLE_STORAGE_KEY) === "1";
}

function percentile(sorted: readonly number[], q: number): number {
  if (sorted.length === 0) return 0;
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))];
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

function expose(summary: UiPerfSummary): void {
  const state =
    window.__PLANET_UI_PERF__ ??
    (window.__PLANET_UI_PERF__ = {
      samples: [],
      clear() {
        this.samples = [];
        this.latest = undefined;
        window.localStorage.removeItem(LATEST_STORAGE_KEY);
        document.documentElement.removeAttribute("data-planet-perf-latest");
      },
    });

  state.latest = summary;
  state.samples = [...state.samples.slice(-(MAX_SAMPLES - 1)), summary];
  const json = JSON.stringify(summary);
  document.documentElement.setAttribute("data-planet-perf-latest", json);
  window.localStorage.setItem(LATEST_STORAGE_KEY, json);
  console.info("[planet:perf]", summary);
}

function summarize(label: string, trigger: UiPerfTrigger, intervals: number[]): UiPerfSummary {
  const sorted = [...intervals].sort((a, b) => a - b);
  const total = intervals.reduce((sum, item) => sum + item, 0);
  return {
    label,
    trigger,
    frames: intervals.length,
    avgMs: round(total / Math.max(1, intervals.length)),
    p95Ms: round(percentile(sorted, 0.95)),
    maxMs: round(sorted[sorted.length - 1] ?? 0),
    over24: intervals.filter((n) => n > 24).length,
    over32: intervals.filter((n) => n > 32).length,
    over50: intervals.filter((n) => n > 50).length,
    at: new Date().toISOString(),
  };
}

function startSample(label: string, trigger: UiPerfTrigger, sampleMs = DEFAULT_SAMPLE_MS): void {
  if (sampling || document.visibilityState === "hidden") return;
  sampling = true;

  const intervals: number[] = [];
  let previous: number | undefined;
  const startedAt = Date.now();

  const tick = (time: number) => {
    if (previous != null) intervals.push(time - previous);
    previous = time;

    if (Date.now() - startedAt < sampleMs) {
      window.requestAnimationFrame(tick);
      return;
    }

    sampling = false;
    expose(summarize(label, trigger, intervals));
  };

  window.requestAnimationFrame(tick);
}

function labelForEvent(event: Event): string {
  if (event.type === "input") {
    const target = event.target instanceof HTMLInputElement ? event.target : null;
    return target?.getAttribute("aria-label") || target?.placeholder || "input";
  }
  if (event.type === "keydown") return `key:${(event as KeyboardEvent).key}`;
  if (event.type === "wheel") return "wheel";
  const target =
    event.target instanceof Element ? event.target.closest("button,[role='button']") : null;
  return target?.getAttribute("aria-label") || target?.textContent?.trim() || "pointer";
}

export function installUiPerfProbe(): void {
  if (installed || !isEnabled()) return;
  installed = true;

  window.__PLANET_UI_PERF__ = window.__PLANET_UI_PERF__ ?? {
    samples: [],
    clear() {
      this.samples = [];
      this.latest = undefined;
      window.localStorage.removeItem(LATEST_STORAGE_KEY);
      document.documentElement.removeAttribute("data-planet-perf-latest");
    },
  };

  window.addEventListener("keydown", (event) => startSample(labelForEvent(event), "keydown"), {
    capture: true,
    passive: true,
  });
  window.addEventListener(
    "pointerdown",
    (event) => startSample(labelForEvent(event), "pointerdown"),
    {
      capture: true,
      passive: true,
    },
  );
  window.addEventListener("wheel", (event) => startSample(labelForEvent(event), "wheel"), {
    capture: true,
    passive: true,
  });
  window.addEventListener(
    "input",
    (event) => startSample(labelForEvent(event), "input", INPUT_SAMPLE_MS),
    {
      capture: true,
      passive: true,
    },
  );

  console.info("[planet:perf] UI perf probe enabled");
}
