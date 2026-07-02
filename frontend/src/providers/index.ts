import { Provider } from "./provider";
import type { MusicProvider, ProviderCapability } from "@domain";
import { NeteaseCloudMusic } from "./ncm";
import { Spotify } from "./spotify";
import { Mock } from "./Mock";
import { QQMusic } from "./qqmusic";
import { LocalCredentialStore } from "./credentials";

export type { MusicProvider, ProviderCapability };
export { Provider, NeteaseCloudMusic, Spotify, Mock, QQMusic, LocalCredentialStore };
