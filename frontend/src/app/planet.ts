import { Engine, Planet } from "@core";
import { Playback, Volume, PlayQueue, Progress, Lyrics, ProviderRegistry } from "@core/plugin";
import { Mock, NeteaseCloudMusic, Provider, QQMusic, Spotify } from "@providers";

import { PlayQueueStoreBridge } from "@/store/bridge";

const env = import.meta.env;

/** VITE_PROVIDER value → provider `name`. */
const PROVIDER_NAMES: Record<string, string> = {
  spotify: Spotify.NAME,
  netease: NeteaseCloudMusic.NAME,
  qqmusic: QQMusic.NAME,
  mock: Mock.NAME,
};

/**
 * Build every provider the environment can construct (all are inert until used)
 * and pick the active one from VITE_PROVIDER. Spotify needs credentials, so it's
 * only mounted when present; an unavailable selection falls back to Mock.
 */
function buildProviders(): { providers: Provider[]; active: string } {
  const providers: Provider[] = [
    new Mock(),
    new NeteaseCloudMusic({ host: env.VITE_NETEASE_HOST ?? "http://localhost:3000" }),
    new QQMusic({ host: env.VITE_QQMUSIC_HOST ?? "http://localhost:3200" }),
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
  const wanted = PROVIDER_NAMES[env.VITE_PROVIDER ?? "mock"] ?? Mock.NAME;
  const active = providers.some((p) => p.name === wanted) ? wanted : Mock.NAME;
  return { providers, active };
}

const { providers, active } = buildProviders();

const planet = new Planet({
  plugins: [
    ...providers,
    new Playback(),
    new PlayQueue(),
    new Volume(),
    new Progress(),
    new ProviderRegistry(active),
    new Lyrics(),
    new PlayQueueStoreBridge(),
  ],
});

/** The application Engine — the UI's single handle to the kernel (events +
 *  playback/media use-cases + provider selection). */
export const engine = new Engine(planet);
