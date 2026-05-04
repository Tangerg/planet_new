import Provider from "./provider";
import { ProviderCapability } from "./types";
import { Playlist } from "../model/playlist";
import { Track, TrackPlayUrl } from "../model/track";
import { Artist } from "../model/artist";
import { Album } from "../model/album";
import { Lyric, parseLyrics } from "../model/lyric";
import { Personalized } from "../model/personalized";

/**
 * Mock provider — 不依赖任何后端，纯前端生成可视化所需的数据。
 * 输出对同一个 id 是确定性的（hash → seed → PRNG），刷新页面不会闪烁。
 */

// 《稻香》— 周杰伦。仅用作 mock provider 的歌词演示。
// LRC 解析器把 .xxx 解释为字面毫秒，所以统一用 3 位毫秒。
const DAOXIANG_LRC = `[00:00.000]稻香 - 周杰伦
[00:01.000]词：周杰伦
[00:02.000]曲：周杰伦
[00:18.000]对这个世界如果你有太多的抱怨
[00:22.000]跌倒了 就不敢继续往前走
[00:26.000]为什么 人要这么的脆弱 堕落
[00:31.000]请你打开电视看看
[00:33.000]多少人 为生命在努力勇敢的走下去
[00:38.000]我们是不是该知足
[00:40.500]珍惜一切 就算没有拥有
[00:46.000]还记得你说家是唯一的城堡
[00:50.000]随着稻香河流继续奔跑
[00:54.000]微微笑 小时候的梦我知道
[00:58.000]不要哭 让萤火虫带着你逃跑
[01:02.000]乡间的歌谣 永远的依靠
[01:06.000]回家吧 回到最初的美好
[01:14.000]不要这么容易就想放弃 就像我说的
[01:18.000]追不到的梦想 换个梦不就得了
[01:22.000]为自己的人生鲜艳上色
[01:25.000]先把爱涂上喜欢的颜色
[01:28.000]笑一个吧 功成名就不是目的
[01:32.000]让自己快乐快乐 这才叫做意义
[01:36.000]童年的纸飞机 现在终于飞回我手里
[01:40.000]所谓的那快乐 赤脚在田里追蜻蜓追到累了
[01:46.000]偷摘水果被蜜蜂给叮到怕了
[01:49.000]谁在偷笑呢
[01:51.000]我靠着稻草人吹着风唱着歌睡着了
[01:56.000]哦 哦 午后吉他在虫鸣中更清脆
[02:01.000]哦 哦 阳光洒在路上就不怕心碎
[02:06.000]珍惜一切 就算没有拥有
[02:11.000]还记得你说家是唯一的城堡
[02:16.000]随着稻香河流继续奔跑
[02:19.000]微微笑 小时候的梦我知道
[02:24.000]不要哭 让萤火虫带着你逃跑
[02:28.000]乡间的歌谣 永远的依靠
[02:32.000]回家吧 回到最初的美好
[02:39.000]还记得你说家是唯一的城堡
[02:43.000]随着稻香河流继续奔跑
[02:48.000]微微笑 小时候的梦我知道
[02:52.000]不要哭 让萤火虫带着你逃跑
[02:56.000]乡间的歌谣 永远的依靠
[03:00.000]回家吧 回到最初的美好`;

const PLAYLIST_TITLES = [
  "Late Night Drive",
  "Morning Coffee",
  "Focus Flow",
  "Indie Discovery",
  "Synthwave Sundown",
  "Mellow Mornings",
  "Bass & Bloom",
  "Deep Focus",
  "Neon Heartbeat",
  "Soft & Slow",
  "City Lights",
  "Pacific Drift",
  "Studio Sessions",
  "Velvet Hours",
  "Glass Garden",
  "Northern Lights",
];

const ALBUM_TITLES = [
  "Gravity",
  "Midnight Tide",
  "Paper Moon",
  "Glasshouse",
  "Atlas",
  "Solar Bloom",
  "Quiet Storms",
  "Echo Chamber",
  "Aurora",
  "Silver Linings",
  "Holograms",
  "Saturn Returns",
  "Ember",
  "Tidepool",
  "Halcyon",
  "Driftwood",
];

const ARTIST_NAMES = [
  "Aurora Nights",
  "Velvet Echo",
  "Solar Drift",
  "Nimbus",
  "Hollow Coast",
  "Ines & The Wires",
  "Saint Marina",
  "Lumen",
  "Pale Reverie",
  "Rooftop Choir",
  "Sable",
  "Glass Atlas",
  "Yumeko",
  "Astra",
  "The Quiet Hour",
  "Moonbathers",
];

const TRACK_TITLES = [
  "Drifting",
  "Ember",
  "Slow Burn",
  "Silver Lining",
  "Paper Hearts",
  "Coastline",
  "Half Light",
  "Static",
  "Holding On",
  "Skylines",
  "Comet",
  "Lantern",
  "Dust & Echoes",
  "Soft Static",
  "Northbound",
  "Aurora",
  "Hollow",
  "Tidepool",
  "Velvet",
  "Glass",
  "Phosphor",
  "Halcyon",
  "Indigo",
  "Reverie",
];

const ARTIST_TAGS = [
  "indie",
  "synthwave",
  "ambient",
  "lofi",
  "alt-pop",
  "dream-pop",
  "shoegaze",
  "electronic",
];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function makeRng(seed: number): () => number {
  let s = (seed || 1) >>> 0;
  return () => {
    s = Math.imul(s ^ (s >>> 15), 2246822507);
    s = Math.imul(s ^ (s >>> 13), 3266489909);
    return ((s ^ (s >>> 16)) >>> 0) / 0xffffffff;
  };
}

function pick<T>(arr: T[], r: () => number): T {
  return arr[Math.floor(r() * arr.length)];
}

function pickN<T>(arr: T[], n: number, r: () => number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && copy.length; i++) {
    const idx = Math.floor(r() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

// Dota 2 hero internal names —— 用于演示卡片 hover 效果，
// 取自 Steam CDN：https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/<name>.png
const DOTA_HEROES = [
  "antimage", "axe", "bane", "bloodseeker", "crystal_maiden", "drow_ranger",
  "earthshaker", "juggernaut", "mirana", "morphling", "phantom_lancer", "puck",
  "pudge", "razor", "sand_king", "storm_spirit", "sven", "tiny", "vengefulspirit",
  "windrunner", "zuus", "kunkka", "lina", "lion", "shadow_shaman", "slardar",
  "tidehunter", "witch_doctor", "riki", "enigma", "tinker", "sniper",
  "warlock", "beastmaster", "queenofpain", "venomancer", "faceless_void",
  "death_prophet", "phantom_assassin", "pugna", "templar_assassin", "viper",
  "luna", "dragon_knight", "dazzle", "rattletrap", "leshrac", "furion",
  "life_stealer", "dark_seer", "clinkz", "omniknight", "enchantress", "huskar",
  "night_stalker", "broodmother", "bounty_hunter", "weaver", "jakiro", "batrider",
  "chen", "spectre", "ancient_apparition", "ursa", "spirit_breaker",
  "gyrocopter", "alchemist", "invoker", "silencer", "obsidian_destroyer",
  "lycan", "brewmaster", "shadow_demon", "lone_druid", "chaos_knight", "meepo",
  "treant", "ogre_magi", "undying", "rubick", "disruptor", "nyx_assassin",
  "naga_siren", "keeper_of_the_light", "wisp", "visage", "slark", "medusa",
  "troll_warlord", "centaur", "magnataur", "shredder", "bristleback", "tusk",
  "skywrath_mage", "abaddon", "elder_titan", "legion_commander",
  "ember_spirit", "earth_spirit", "abyssal_underlord", "terrorblade", "phoenix",
  "oracle", "winter_wyvern", "arc_warden", "monkey_king", "dark_willow",
  "pangolier", "grimstroke", "hoodwink", "void_spirit", "snapfire", "mars",
  "primal_beast", "muerta", "nevermore",
];

function coverArt(seed: string): string {
  const idx = hash(seed) % DOTA_HEROES.length;
  return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${DOTA_HEROES[idx]}.png`;
}

function makeArtist(seed: string): Required<Pick<Artist, "id" | "name" | "image" | "alias">> {
  const r = makeRng(hash(`artist:${seed}`));
  const name = pick(ARTIST_NAMES, r);
  return {
    id: `mock-artist-${hash(`artist:${seed}`)}`,
    name,
    image: coverArt(`artist:${name}`),
    alias: pickN(ARTIST_TAGS, 1 + Math.floor(r() * 2), r),
  };
}

function makeAlbumStub(seed: string): {
  id: string;
  name: string;
  image: string;
} {
  const r = makeRng(hash(`album:${seed}`));
  const name = pick(ALBUM_TITLES, r);
  return {
    id: `mock-album-${hash(`album:${seed}`)}`,
    name,
    image: coverArt(`album:${name}`),
  };
}

function makeTrack(seed: string, index: number, albumStub?: { id: string; name: string; image: string }): Partial<Track> {
  const r = makeRng(hash(`track:${seed}:${index}`));
  const title = pick(TRACK_TITLES, r);
  const variation = r() < 0.3 ? ` (${pick(["Reprise", "Live", "Acoustic", "Edit", "Demo"], r)})` : "";
  const duration = 180_000 + Math.floor(r() * 180_000); // 3-6 分钟
  const album = albumStub ?? makeAlbumStub(`${seed}:${index}`);
  const numArtists = r() < 0.2 ? 2 : 1;
  const artists = Array.from({ length: numArtists }).map((_, i) => {
    const a = makeArtist(`${seed}:${index}:${i}`);
    return { id: a.id, name: a.name };
  });
  return {
    index: index + 1,
    id: `mock-track-${hash(`track:${seed}:${index}`)}`,
    name: `${title}${variation}`,
    duration,
    album,
    artists,
  };
}

function delay<T>(value: T, ms = 120): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export type MockOptions = {
  /** 模拟网络延迟，默认 120ms，便于看到 loading 状态 */
  latency?: number;
};

export class Mock extends Provider {
  public static readonly NAME = "Mock";

  private readonly latency: number;
  private static readonly CAPABILITIES: ReadonlySet<ProviderCapability> =
    new Set<ProviderCapability>([
      "playlistDetail",
      "albumDetail",
      "artistDetail",
      "lyric",
      "personalized",
      // 不含 fullPlayback / previewPlayback —— mock 不返回真实音频
    ]);

  constructor(opts: MockOptions = {}) {
    super();
    this.latency = opts.latency ?? 120;
  }

  get name(): string {
    return Mock.NAME;
  }

  get capabilities(): ReadonlySet<ProviderCapability> {
    return Mock.CAPABILITIES;
  }

  async playlistDetail(id: string): Promise<Playlist> {
    const r = makeRng(hash(`playlist:${id}`));
    const name = pick(PLAYLIST_TITLES, r);
    const trackCount = 12 + Math.floor(r() * 14); // 12-25 首
    const tracks = Array.from({ length: trackCount }).map((_, i) =>
      makeTrack(`playlist:${id}`, i),
    );
    const durationCount = tracks.reduce(
      (acc, t) => acc + (t.duration ?? 0),
      0,
    );
    const creator = makeArtist(`creator:${id}`);
    const playlist: Playlist = {
      id,
      name,
      description: "A mock-generated playlist for UI preview.",
      tags: pickN(ARTIST_TAGS, 2, r),
      image: coverArt(`playlist:${id}`),
      tracks,
      // 这两个字段在 model 上是 Duration（unknown 数字），运行时按 number 用
      createTime: Date.now() - 1000 * 60 * 60 * 24 * 30,
      creator: {
        id: creator.id,
        nickname: creator.name,
        image: creator.image,
      },
      trackCount,
      durationCount,
    };
    return delay(playlist, this.latency);
  }

  async albumDetail(id: string): Promise<Album> {
    const r = makeRng(hash(`album:${id}`));
    const name = pick(ALBUM_TITLES, r);
    const trackCount = 8 + Math.floor(r() * 8); // 8-15 首
    const albumImage = coverArt(`album:${id}`);
    const albumStub = { id, name, image: albumImage };
    const tracks = Array.from({ length: trackCount }).map((_, i) =>
      makeTrack(`album:${id}`, i, albumStub),
    );
    const durationCount = tracks.reduce(
      (acc, t) => acc + (t.duration ?? 0),
      0,
    );
    const artist = makeArtist(`album-artist:${id}`);
    const album: Album = {
      id,
      name,
      alias: r() < 0.3 ? [pick(["Deluxe Edition", "Anniversary Mix"], r)] : [],
      image: albumImage,
      trackCount,
      publishTime: Date.now() - Math.floor(r() * 1000 * 60 * 60 * 24 * 365 * 4),
      durationCount,
      tracks,
      artist: { id: artist.id, name: artist.name, image: artist.image },
      artists: [{ id: artist.id, name: artist.name, image: artist.image }],
    };
    return delay(album, this.latency);
  }

  async artistDetail(id: string): Promise<Artist> {
    const r = makeRng(hash(`artist-detail:${id}`));
    const stub = makeArtist(`detail:${id}`);
    const trackCount = 8 + Math.floor(r() * 5); // 8-12 首热门
    const topTracks = Array.from({ length: trackCount }).map((_, i) =>
      makeTrack(`artist-top:${id}`, i),
    );
    const followers = 50_000 + Math.floor(r() * 9_500_000);
    return delay(
      {
        id,
        name: stub.name,
        image: stub.image,
        alias: stub.alias,
        description: `${stub.name} 是一位 mock 演示用的艺术家。这里展示的描述、热门曲目与流派标签都来自前端确定性生成。`,
        followers,
        genres: stub.alias,
        topTracks,
      } satisfies Artist,
      this.latency,
    );
  }

  async lyric(_id: string): Promise<Lyric[]> {
    // 演示用：所有曲目都返回《稻香》——周杰伦
    return delay(parseLyrics(DAOXIANG_LRC), this.latency);
  }

  async playUrls(ids: string[]): Promise<TrackPlayUrl[]> {
    // 不返回真实 URL —— 仅供 UI 预览，无实际播放
    return delay(
      ids.map((id) => ({ id, playUrl: "" })),
      this.latency,
    );
  }

  async personalized(): Promise<Personalized> {
    const r = makeRng(hash("personalized:home"));
    const playlists: Partial<Playlist>[] = Array.from({ length: 10 }).map(
      (_, i) => {
        const seed = `home-pl-${i}`;
        const name = pick(PLAYLIST_TITLES, makeRng(hash(seed)));
        return {
          id: `mock-pl-${hash(seed)}`,
          name,
          image: coverArt(seed),
          trackCount: 12 + Math.floor(r() * 30),
        };
      },
    );

    const albums: Partial<Album>[] = Array.from({ length: 10 }).map((_, i) => {
      const seed = `home-al-${i}`;
      const ar = makeRng(hash(seed));
      const name = pick(ALBUM_TITLES, ar);
      const artist = makeArtist(`home-al-artist-${i}`);
      return {
        id: `mock-al-${hash(seed)}`,
        name,
        image: coverArt(seed),
        trackCount: 8 + Math.floor(ar() * 8),
        artist: { id: artist.id, name: artist.name },
      };
    });

    const artists: Partial<Artist>[] = Array.from({ length: 10 }).map((_, i) => {
      const a = makeArtist(`home-ar-${i}`);
      return {
        id: a.id,
        name: a.name,
        image: a.image,
        alias: a.alias,
      };
    });

    return delay(
      { playlists, albums, artists, tracks: [] },
      this.latency,
    );
  }
}

export default Mock;
