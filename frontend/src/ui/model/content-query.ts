export function userLibraryQueryEnabled(loggedIn: boolean, librarySupported: boolean): boolean {
  return loggedIn && librarySupported;
}

export function supportedContentQueryEnabled({
  requested = true,
  hasTarget = true,
  supported,
}: {
  requested?: boolean;
  hasTarget?: boolean;
  supported: boolean;
}): boolean {
  return requested && hasTarget && supported;
}

export function artistMusicVideoDiscoveryQueryEnabled(
  artistIds: readonly string[],
  supported: boolean,
): boolean {
  return supportedContentQueryEnabled({
    hasTarget: artistIds.length > 0,
    supported,
  });
}

export function artistMusicVideosQueryEnabled(
  artistId: string | undefined,
  requested: boolean,
  supported: boolean,
): boolean {
  return supportedContentQueryEnabled({
    requested,
    hasTarget: Boolean(artistId),
    supported,
  });
}

export function musicVideoCommentsQueryEnabled(
  musicVideoId: string | undefined,
  requested: boolean,
  supported: boolean,
): boolean {
  return supportedContentQueryEnabled({
    requested,
    hasTarget: Boolean(musicVideoId),
    supported,
  });
}

export function trackCommentsQueryEnabled(
  trackId: string | undefined,
  requested: boolean,
  supported: boolean,
): boolean {
  return supportedContentQueryEnabled({
    requested,
    hasTarget: Boolean(trackId),
    supported,
  });
}
