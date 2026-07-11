import { Engine } from "@core";
import type { Provider } from "@providers";
import { LocalCredentialStore, LocalMusic, NeteaseCloudMusic, QQMusic, Spotify } from "@providers";
import type { ProviderId } from "@contexts/contracts";
import { WebAudioRuntime } from "../infrastructure/audio";
import { SystemRandom } from "../infrastructure/random";
import { composePlanet } from "./composePlanet";

import { resolveDesktopMediaAnalysisSource } from "@/infra/mediaSource";

const env = import.meta.env;

/** On-device credential store, shared by auth-capable providers + the Engine. */
const credentials = new LocalCredentialStore();

/** VITE_PROVIDER value → stable provider id. */
const PROVIDER_IDS: Record<string, ProviderId> = {
  spotify: Spotify.ID,
  netease: NeteaseCloudMusic.ID,
  qqmusic: QQMusic.ID,
  local: LocalMusic.ID,
};

/**
 * Build every provider the environment can construct (all are inert until used)
 * and pick the active one from VITE_PROVIDER. Spotify needs credentials, so it's
 * only mounted when present; NeteaseCloudMusic is the default and the fallback
 * for an unset/unknown selection (it's always constructible).
 */
function buildProviders(): { providers: Provider[]; active: ProviderId } {
  const providers: Provider[] = [
    new NeteaseCloudMusic({
      host: env.VITE_NETEASE_HOST ?? "http://localhost:3000",
      credentials,
    }),
    new QQMusic({ host: env.VITE_QQMUSIC_HOST ?? "http://localhost:3200" }),
    // On-device library via the Wails Go bridge; inert (empty) outside the
    // desktop runtime, so it is always safe to mount.
    new LocalMusic(),
  ];
  if (env.VITE_SPOTIFY_CLIENT_ID && env.VITE_SPOTIFY_CLIENT_SECRET) {
    providers.push(
      new Spotify({
        clientId: env.VITE_SPOTIFY_CLIENT_ID,
        clientSecret: env.VITE_SPOTIFY_CLIENT_SECRET,
        market: env.VITE_SPOTIFY_MARKET,
      }),
    );
  }
  const wanted = PROVIDER_IDS[env.VITE_PROVIDER ?? "netease"] ?? NeteaseCloudMusic.ID;
  const active = providers.some((provider) => provider.providerId === wanted)
    ? wanted
    : NeteaseCloudMusic.ID;
  return { providers, active };
}

const { providers, active } = buildProviders();

const planet = composePlanet({
  audio: new WebAudioRuntime(),
  random: new SystemRandom(),
  providers,
  activeProviderId: active,
  resolveAnalysisSource: resolveDesktopMediaAnalysisSource,
});

/** The application Engine — the UI's single handle to the kernel (events +
 *  playback/media/identity use-cases + provider selection). */
export const engine = new Engine(planet, credentials);
