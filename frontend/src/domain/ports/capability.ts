import type { MusicProvider, ProviderCapability } from "./provider";

type Method = (...args: never[]) => unknown;

export function hasMethods<K extends string>(
  value: object,
  methods: readonly K[],
): value is Record<K, Method> {
  const candidate = value as Record<K, unknown>;
  return methods.every((method) => typeof candidate[method] === "function");
}

/**
 * The deliberately focused streaming scope shared by every provider. Product
 * extras such as check-in, radio, podcasts and social feeds stay out of this
 * matrix by design; they are not part of the immersive player domain.
 */
export const CORE_STREAMING_CAPABILITIES: readonly ProviderCapability[] = [
  "search",
  "personalized",
  "playlistDetail",
  "albumDetail",
  "artistDetail",
  "trackDetail",
  "lyric",
  "comments",
  "toplist",
  "fullPlayback",
  "previewPlayback",
  "userLibrary",
  "auth",
  "musicVideoDetail",
  "artistMusicVideos",
  "musicVideoComments",
];

export type ProviderCapabilityStatus = {
  provider: string;
  capability: ProviderCapability;
  supported: boolean;
};

export function providerCapabilityMatrix(
  providers: readonly MusicProvider[],
  capabilities: readonly ProviderCapability[] = CORE_STREAMING_CAPABILITIES,
): ProviderCapabilityStatus[] {
  return providers.flatMap((provider) =>
    capabilities.map((capability) => ({
      provider: provider.name,
      capability,
      supported: provider.supports(capability),
    })),
  );
}

export function missingCapabilities(
  provider: MusicProvider,
  capabilities: readonly ProviderCapability[] = CORE_STREAMING_CAPABILITIES,
): ProviderCapability[] {
  return capabilities.filter((capability) => !provider.supports(capability));
}
