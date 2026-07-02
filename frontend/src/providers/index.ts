import { Provider } from "./provider";
import type { MusicProvider, ProviderCapability } from "@domain";
import { NeteaseCloudMusic } from "./ncm";
import { Spotify } from "./Spotify";
import { Mock } from "./Mock";
import { QQMusic } from "./QQMusic";
import { LocalCredentialStore } from "./credentials";

export type { MusicProvider, ProviderCapability };
export { Provider, NeteaseCloudMusic, Spotify, Mock, QQMusic, LocalCredentialStore };
