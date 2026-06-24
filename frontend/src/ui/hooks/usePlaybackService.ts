import { useMemo, useRef } from "react";

import { PlaybackService } from "@core/application";
import { usePlanet } from "./usePlanet";
import { useActiveProvider } from "./useActiveProvider";

/**
 * Creates a memoized PlaybackService bound to the current Planet + provider.
 *
 * The service encapsulates all playback use cases (play, togglePlay, next,
 * prev, seek, setVolume, toggleShuffle, toggleRepeat), keeping business logic
 * out of UI components. UI components call this hook and delegate to the
 * service — they never touch the provider or the event bus directly.
 */
export function usePlaybackService(): PlaybackService {
  const planet = usePlanet();
  const provider = useActiveProvider();
  // Use a ref to track the latest provider so the useMemo doesn't recreate
  // the service on every provider change — the factory function reads the ref.
  const providerRef = useRef(provider);
  providerRef.current = provider;
  return useMemo(() => new PlaybackService(planet, () => providerRef.current), [planet]);
}
