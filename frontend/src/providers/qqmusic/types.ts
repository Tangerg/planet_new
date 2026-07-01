export type QQId = number | string;

export type QQSinger = {
  mid?: QQId;
  singer_mid?: QQId;
  name?: string;
  singer_name?: string;
  singer_pic?: string;
};

export type QQAlbumRef = {
  mid?: QQId;
  pmid?: QQId;
  name?: string;
};

export type QQTrack = {
  mid?: QQId;
  songmid?: QQId;
  songId?: QQId;
  songname?: string;
  name?: string;
  title?: string;
  interval?: number;
  singer?: QQSinger[];
  singerName?: string;
  singerMid?: QQId;
  album?: QQAlbumRef;
  albumname?: string;
  albumName?: string;
  albummid?: QQId;
  albumMid?: QQId;
  cover?: string;
};

export type QQPlaylistDetail = {
  disstid?: QQId;
  dissid?: QQId;
  dissname?: string;
  desc?: string;
  logo?: string;
  songnum?: number;
  total_song_num?: number;
  songlist?: QQTrack[];
  encrypt_uin?: QQId;
  nickname?: string;
  nick?: string;
  headurl?: string;
};

export type QQAlbumDetail = {
  mid?: QQId;
  name?: string;
  list?: QQTrack[];
  aDate?: string;
  singermid?: QQId;
  singername?: string;
  total_song_num?: number;
  total?: number;
};

export type QQPlaylistStub = {
  dissid?: QQId;
  dissname?: string;
  imgurl?: string;
  songnum?: number;
};

export type QQSmartboxItem = {
  mid?: QQId;
  name?: string;
  singer?: string;
  pic?: string;
};

export type QQChart = {
  id?: QQId;
  topId?: QQId;
  topid?: QQId;
  title?: string;
  topTitle?: string;
  frontPicUrl?: string;
  headPicUrl?: string;
  picUrl?: string;
  macHeadPicUrl?: string;
  updateTime?: string;
  intro?: string;
};

export type QQNewAlbum = {
  mid?: QQId;
  name?: string;
  singers?: QQSinger[];
  ex?: {
    track_nums?: number;
  };
};

export type QQSongListDetailResponse = {
  response?: {
    cdlist?: QQPlaylistDetail[];
  };
};

export type QQAlbumInfoResponse = {
  response?: {
    data?: QQAlbumDetail;
  };
};

export type QQSingerHotsongResponse = {
  response?: {
    songList?: Array<{ musicData?: QQTrack }>;
    singerInfo?: { singer_name?: string };
  };
};

export type QQSingerDescriptionResponse = {
  response?: {
    data?: {
      info?: { desc?: string };
      basic_info?: { name?: string };
    };
  };
};

export type QQLyricResponse = {
  response?: {
    lyric?: string;
  };
};

export type QQMusicPlayResponse = {
  data?: {
    playUrl?: Record<string, { url?: string; error?: string | false }>;
  };
};

export type QQSongListsResponse = {
  response?: {
    data?: {
      list?: QQPlaylistStub[];
    };
  };
};

export type QQNewDisksResponse = {
  response?: {
    new_album?: {
      data?: {
        albums?: QQNewAlbum[];
      };
    };
  };
};

export type QQSingerListResponse = {
  response?: {
    singerList?: {
      data?: {
        singerlist?: QQSinger[];
      };
    };
  };
};

export type QQSmartboxResponse = {
  response?: {
    data?: {
      song?: { itemlist?: QQSmartboxItem[] };
      singer?: { itemlist?: QQSmartboxItem[] };
      album?: { itemlist?: QQSmartboxItem[] };
    };
  };
};

export type QQTopListsResponse = {
  response?: {
    data?: {
      topList?: QQChart[];
    };
  };
};

export type QQRanksResponse = {
  response?: {
    req_1?: {
      data?: {
        data?: {
          song?: QQTrack[];
        };
      };
    };
  };
};
