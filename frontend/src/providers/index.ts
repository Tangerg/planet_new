import { Provider } from "./provider";
import type { MusicProvider, ProviderCapability } from "@domain";
import { NeteaseCloudMusic } from "./ncm";
import { Spotify } from "./spotify";
import { QQMusic } from "./qqmusic";
import { LocalMusic } from "./local";
import { LocalCredentialStore } from "./credentials";

export type { MusicProvider, ProviderCapability };
export { Provider, NeteaseCloudMusic, Spotify, QQMusic, LocalMusic, LocalCredentialStore };
