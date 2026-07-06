import type { ProviderCapability } from "@domain/ports/provider";

export type CapabilitySupport = (capability: ProviderCapability) => boolean;

export function userLibraryQueryEnabled(loggedIn: boolean, librarySupported: boolean): boolean {
  return loggedIn && librarySupported;
}

export function supportedContentQueryEnabled({
  requested = true,
  hasTarget = true,
  capability,
  supports,
}: {
  requested?: boolean;
  hasTarget?: boolean;
  capability: ProviderCapability;
  supports: CapabilitySupport;
}): boolean {
  return requested && hasTarget && supports(capability);
}

export function artistMusicVideoDiscoveryQueryEnabled(
  artistIds: readonly string[],
  supports: CapabilitySupport,
): boolean {
  return supportedContentQueryEnabled({
    hasTarget: artistIds.length > 0,
    capability: "artistMusicVideos",
    supports,
  });
}

export function artistMusicVideosQueryEnabled(
  artistId: string | undefined,
  requested: boolean,
  supports: CapabilitySupport,
): boolean {
  return supportedContentQueryEnabled({
    requested,
    hasTarget: Boolean(artistId),
    capability: "artistMusicVideos",
    supports,
  });
}

export function musicVideoCommentsQueryEnabled(
  musicVideoId: string | undefined,
  requested: boolean,
  supports: CapabilitySupport,
): boolean {
  return supportedContentQueryEnabled({
    requested,
    hasTarget: Boolean(musicVideoId),
    capability: "musicVideoComments",
    supports,
  });
}

export function trackCommentsQueryEnabled(
  trackId: string | undefined,
  requested: boolean,
  supports: CapabilitySupport,
): boolean {
  return supportedContentQueryEnabled({
    requested,
    hasTarget: Boolean(trackId),
    capability: "comments",
    supports,
  });
}
