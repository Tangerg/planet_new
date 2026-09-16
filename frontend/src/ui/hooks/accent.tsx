import { createContext, use, useInsertionEffect, useMemo, useState } from "react";

import { DEFAULT_ACCENT } from "@/model/defaults";

type AccentTheme = {
  accent: string;
  setAccent: (accent: string) => void;
};

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

export function useAccent(): string {
  return use(AccentContext).accent;
}

export function useSetAccent(): (accent: string) => void {
  return use(AccentContext).setAccent;
}
