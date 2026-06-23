import { Planet } from "@core";
import { Control, Volume, PlayQueue, Progress } from "@core/plugin";
import { Mock, NeteaseCloudMusic, Provider, QQMusic, Spotify } from "@providers";

import { PlayQueueStoreBridge } from "@/store/bridge";

const env = import.meta.env;

function createProvider(): Provider {
  switch (env.VITE_PROVIDER) {
    case "spotify": {
      if (!env.VITE_SPOTIFY_CLIENT_ID || !env.VITE_SPOTIFY_CLIENT_SECRET) {
        throw new Error(
          "VITE_PROVIDER=spotify requires both VITE_SPOTIFY_CLIENT_ID and VITE_SPOTIFY_CLIENT_SECRET to be set",
        );
      }
      return new Spotify({
        clientId: env.VITE_SPOTIFY_CLIENT_ID,
        clientSecret: env.VITE_SPOTIFY_CLIENT_SECRET,
        market: env.VITE_SPOTIFY_MARKET,
      });
    }
    case "netease":
      return new NeteaseCloudMusic({
        host: env.VITE_NETEASE_HOST ?? "http://localhost:3000",
      });
    case "qqmusic":
      return new QQMusic({
        host: env.VITE_QQMUSIC_HOST ?? "http://localhost:3200",
      });
    case "mock":
    default:
      return new Mock();
  }
}

const planet = new Planet({
  plugins: [
    createProvider(),
    new Control(),
    new PlayQueue(),
    new Volume(),
    new Progress(),
    new PlayQueueStoreBridge(),
  ],
});

export default planet;
