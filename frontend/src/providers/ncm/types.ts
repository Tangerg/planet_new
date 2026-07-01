export type NcmId = number | string;

export type NcmImageSource = {
  picUrl?: string;
  coverImgUrl?: string;
  cover?: string;
  coverUrl?: string;
  imgurl?: string;
  imgurl16v9?: string;
  img1v1Url?: string;
  avatarUrl?: string;
};

export type NcmArtist = NcmImageSource & {
  id?: NcmId;
  name?: string;
  alias?: string[];
  picUrl?: string;
};

export type NcmAlbum = NcmImageSource & {
  id?: NcmId;
  name?: string;
  alias?: string[];
  description?: string;
  size?: number;
  publishTime?: number;
  artist?: NcmArtist;
  artists?: NcmArtist[];
};

export type NcmTrack = {
  id?: NcmId;
  name?: string;
  dt?: number;
  duration?: number;
  al?: NcmAlbum;
  album?: NcmAlbum;
  ar?: NcmArtist[];
  artists?: NcmArtist[];
  mv?: NcmId;
  mvid?: NcmId;
  mvId?: NcmId;
};

export type NcmUser = NcmImageSource & {
  id?: NcmId;
  userId?: NcmId;
  nickname?: string;
  followeds?: number;
  follows?: number;
};

export type NcmPlaylist = NcmImageSource & {
  id?: NcmId;
  name?: string;
  description?: string;
  trackCount?: number;
  tracks?: NcmTrack[];
  creator?: NcmUser;
};

export type NcmChart = {
  id?: NcmId;
  name?: string;
  coverImgUrl?: string;
  updateFrequency?: string;
};

export type NcmComment = {
  commentId?: NcmId;
  id?: NcmId;
  user?: NcmUser;
  content?: string;
  likedCount?: number;
  time?: number;
};

export type NcmMusicVideo = NcmImageSource & {
  id?: NcmId;
  mvid?: NcmId;
  name?: string;
  title?: string;
  artists?: NcmArtist[];
  artistId?: NcmId;
  artistName?: string;
  duration?: number;
  durationms?: number;
  desc?: string;
  description?: string;
  publishTime?: string;
  publishDate?: string;
  playCount?: number;
  commentCount?: number;
  likedCount?: number;
  shareCount?: number;
};

export type NcmPlaylistDetailResponse = { playlist?: NcmPlaylist };
export type NcmPlaylistTracksResponse = { songs?: NcmTrack[] };
export type NcmLyricResponse = { lrc?: { lyric?: string }; tlyric?: { lyric?: string } };
export type NcmAlbumDetailResponse = { album?: NcmAlbum; songs?: NcmTrack[] };
export type NcmArtistInfoResponse = { artist?: NcmArtist; hotSongs?: NcmTrack[] };
export type NcmArtistDescriptionResponse = {
  briefDesc?: string;
  introduction?: { ti?: string; txt?: string }[];
};
export type NcmArtistAlbumsResponse = { hotAlbums?: NcmAlbum[] };
export type NcmSimilarArtistsResponse = { artists?: NcmArtist[] };
export type NcmSongDetailResponse = { songs?: NcmTrack[] };
export type NcmMusicVideoDetailResponse = { data?: NcmMusicVideo };
export type NcmMusicVideoUrlResponse = { data?: { url?: string; r?: number } };
export type NcmMusicVideoCountsResponse = {
  commentCount?: number;
  likedCount?: number;
  shareCount?: number;
};
export type NcmArtistMusicVideosResponse = { mvs?: NcmMusicVideo[] };
export type NcmPlayUrlResponse = { data?: Array<{ id: NcmId; url?: string | null }> };
export type NcmPersonalizedPlaylistsResponse = { result?: NcmPlaylist[] };
export type NcmPersonalizedTracksResponse = { result?: Array<{ song?: NcmTrack }> };
export type NcmNewestAlbumsResponse = { albums?: NcmAlbum[] };
export type NcmTopArtistsResponse = { artists?: NcmArtist[] };
export type NcmSearchResponse = {
  result?: {
    songs?: NcmTrack[];
    artists?: NcmArtist[];
    albums?: NcmAlbum[];
    playlists?: NcmPlaylist[];
  };
};
export type NcmToplistsResponse = { list?: NcmChart[] };
export type NcmCommentsResponse = { hotComments?: NcmComment[]; comments?: NcmComment[] };
export type NcmQrKeyResponse = { data?: { unikey?: string } };
export type NcmQrCreateResponse = { data?: { qrimg?: string } };
export type NcmQrCheckResponse = { code?: number; cookie?: string };
export type NcmAccountResponse = { profile?: NcmUser; account?: { vipType?: number } };
export type NcmUserDetailResponse = { profile?: NcmUser };
export type NcmLikedTrackIdsResponse = { ids?: NcmId[] };
export type NcmUserPlaylistsResponse = { playlist?: NcmPlaylist[] };
export type NcmPlayRecordResponse = {
  weekData?: Array<{ song?: NcmTrack }>;
  allData?: Array<{ song?: NcmTrack }>;
};
export type NcmDailyRecommendationsResponse = { data?: { dailySongs?: NcmTrack[] } };
