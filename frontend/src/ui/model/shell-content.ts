import type { ScreenData, VibeCollection, VibeMusicVideo } from "./vibe";

export type ShellContentQueryPlan = {
  loadTrackComments: boolean;
  loadMusicVideoRail: boolean;
  loadMusicVideoComments: boolean;
};

export function shellLibraryData(
  catalog: ScreenData,
  loggedIn: boolean,
  userPlaylists: readonly VibeCollection[],
): ScreenData {
  return loggedIn && userPlaylists.length ? { ...catalog, playlists: [...userPlaylists] } : catalog;
}

export function shellContentQueryPlan(view: string): ShellContentQueryPlan {
  const musicVideoScreen = view === "mv-detail" || view === "mv-theater";
  return {
    loadTrackComments: view === "comments" || view === "np",
    loadMusicVideoRail: musicVideoScreen,
    loadMusicVideoComments: view === "mv-theater",
  };
}

export function shellMusicVideoRail(
  fetched: readonly VibeMusicVideo[],
  fallback: readonly VibeMusicVideo[],
): VibeMusicVideo[] {
  return [...(fetched.length ? fetched : fallback)];
}
