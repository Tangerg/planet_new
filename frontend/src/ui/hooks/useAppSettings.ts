import { useState } from "react";

import { DEFAULT_SETTINGS, type Settings } from "@/model/defaults";

/**
 * Local user preferences (audio quality, Now Playing mode, motion, …). Session
 * state with no kernel or account involvement — kept apart from the likes hook,
 * whose account syncing it has nothing to do with.
 */
export function useAppSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  return { settings, setSettings };
}
