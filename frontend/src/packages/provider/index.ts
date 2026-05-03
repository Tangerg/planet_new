import Provider from "./provider";
import { IProvider, ProviderCapability } from "./types";
import NeteaseCloudMusic from "./NeteaseCloudMusic";
import Spotify from "./Spotify";
import Mock from "./Mock";
import QQMusic from "./QQMusic";

export type { IProvider, ProviderCapability };
export { Provider, NeteaseCloudMusic, Spotify, Mock, QQMusic };
export default Provider;
