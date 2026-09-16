import { useState } from "react";

import { DEFAULT_SETTINGS, type Settings } from "@/model/defaults";

export function useAppSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  return { settings, setSettings };
}
