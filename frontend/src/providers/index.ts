import { Provider } from "./provider";
import { MusicProvider, ProviderCapability } from "@domain";
import { NeteaseCloudMusic } from "./NeteaseCloudMusic";
import { Spotify } from "./Spotify";
import { Mock } from "./Mock";
import { QQMusic } from "./QQMusic";

export type { MusicProvider, ProviderCapability };
export { Provider, NeteaseCloudMusic, Spotify, Mock, QQMusic };
