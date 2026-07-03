import { Engine, Planet } from "@core";
import {
  Playback,
  Volume,
  PlayQueue,
  Progress,
  Lyrics,
  ProviderRegistry,
  AudioEngine,
} from "@core/plugin";
import type { Provider } from "@providers";
import { LocalCredentialStore, LocalMusic, NeteaseCloudMusic, QQMusic, Spotify } from "@providers";

import { audioAnalysisSource } from "@/infra/audioAnalysis";
import { PlayQueueStoreBridge } from "@/store/bridge";

const env = import.meta.env;

/** On-device credential store, shared by auth-capable providers + the Engine. */
const credentials = new LocalCredentialStore();

/** VITE_PROVIDER value → provider `name`. */
const PROVIDER_NAMES: Record<string, string> = {
  spotify: Spotify.NAME,
  netease: NeteaseCloudMusic.NAME,
  qqmusic: QQMusic.NAME,
  local: LocalMusic.NAME,
};

/**
 * Build every provider the environment can construct (all are inert until used)
 * and pick the active one from VITE_PROVIDER. Spotify needs credentials, so it's
 * only mounted when present; NeteaseCloudMusic is the default and the fallback
 * for an unset/unknown selection (it's always constructible).
 */
function buildProviders(): { providers: Provider[]; active: string } {
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
  const wanted = PROVIDER_NAMES[env.VITE_PROVIDER ?? "netease"] ?? NeteaseCloudMusic.NAME;
  const active = providers.some((p) => p.name === wanted) ? wanted : NeteaseCloudMusic.NAME;
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
    new AudioEngine(),
    new ProviderRegistry(active),
    new Lyrics(),
    new PlayQueueStoreBridge(),
  ],
});

/** The application Engine — the UI's single handle to the kernel (events +
 *  playback/media/auth use-cases + provider selection). */
export const engine = new Engine(planet, credentials, {
  resolveAudioAnalysisSource: audioAnalysisSource,
});
