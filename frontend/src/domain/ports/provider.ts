import type { Lyric } from "../model/lyric";
import type { IdentityGateway } from "./auth";
import type { CatalogSource } from "./catalog";
import type { PlaybackResolver } from "./playback";
import type { UserLibrary } from "./userLibrary";
import type { EngagementPorts } from "./engagement";

export { ProviderId } from "../model/provider-id";
export type { ProviderIdentity } from "./source";
export type {
  AlbumReader,
  ArtistMusicVideoReader,
  ArtistReader,
  CatalogAvailability,
  CatalogHomePort,
  CatalogPorts,
  CatalogSearchPort,
  CatalogSource,
  ChartReader,
  MusicVideoReader,
  PlaylistReader,
  TrackReader,
} from "./catalog";

export interface LyricProvider {
  lyric(id: string): Promise<Lyric[]>;
}

/** Infrastructure registration composed from actual context ports. Optional
 * capabilities are represented only by nullable port slots. */
export interface MusicSource extends CatalogSource {
  readonly playback: PlaybackResolver;
  readonly lyrics: LyricProvider | null;
  readonly identity: IdentityGateway | null;
  readonly userLibrary: UserLibrary | null;
  readonly engagement: EngagementPorts;
}
