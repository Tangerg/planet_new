import { createContext, use, useInsertionEffect, useMemo, useState } from "react";

import { DEFAULT_ACCENT } from "@/model/defaults";

/**
 * The accent colour — one app-wide theme value with one owner.
 *
 * It reaches the UI through two channels that must not drift: the `--accent`
 * custom property every stylesheet reads via `var(--accent)`, and the JS string
 * the components that compute a colour inline (glows, gradients, scrubbers)
 * need. This provider owns both — it holds the state and publishes the custom
 * property — so the stylesheets do NOT declare `--accent` themselves. They used
 * to, with a different literal than `DEFAULT_ACCENT`, which is exactly the drift
 * this removes.
 *
 * The publish runs in an insertion effect so the property is on `:root` before
 * the browser's first paint; a `useEffect` would paint one frame unaccented.
 */
type AccentTheme = {
  accent: string;
  setAccent: (accent: string) => void;
};

// Outside a provider the accent still resolves to the default, so a component
// rendered in isolation (tests, storybook-style harnesses) is never colourless.
const AccentContext = createContext<AccentTheme>({
  accent: DEFAULT_ACCENT,
  setAccent: () => {},
});

export function AccentProvider({ children }: { children: React.ReactNode }) {
  const [accent, setAccent] = useState(DEFAULT_ACCENT);
  useInsertionEffect(() => {
    document.documentElement.style.setProperty("--accent", accent);
  }, [accent]);
  const value = useMemo(() => ({ accent, setAccent }), [accent]);
  return <AccentContext.Provider value={value}>{children}</AccentContext.Provider>;
}

/** The live accent, for components that compute a colour in JS. */
export function useAccent(): string {
  return use(AccentContext).accent;
}

/** The accent picker's write end (Settings). */
export function useSetAccent(): (accent: string) => void {
  return use(AccentContext).setAccent;
}
