import React from "react";
import { createLazyFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Download,
  ListMusic,
  MoreHorizontal,
  Play,
  Plus,
  Search,
  Share2,
  Shuffle,
} from "lucide-react";
import { motion } from "motion/react";

import { Artist } from "@kernel/model/artist";
import { Track } from "@kernel/model/track";

import { ActionIcon, formatHumanDuration } from "@/components/detail-toolkit";
import PageLoading from "@/components/page-loading";
import TrackList from "@/components/track-list";
import { usePageCover } from "@/hooks/usePageCover";
import { usePlanet } from "@/hooks/usePlanet";
import { useProvider } from "@/hooks/useProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/avatar";
import { Tooltip } from "@/ui/tooltip";

/* -------------------------------------------------------------------------- */
/*  右栏小组件                                                                  */
/* -------------------------------------------------------------------------- */

/** 右栏 genre tag pill */
const GenrePill: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-flex h-9 items-center rounded-full border border-white/15 px-3.5 text-xs text-white">
    {children}
  </span>
);

/** 右栏 related artist 行 */
const RelatedArtistRow: React.FC<{ artist: Partial<Artist> }> = ({
  artist,
}) => (
  <div className="flex items-center gap-3 rounded-md p-1 hover:bg-white/5 cursor-pointer transition-colors">
    <Avatar className="h-12 w-12">
      {artist.image ? (
        <AvatarImage src={artist.image} alt={artist.name} />
      ) : null}
      <AvatarFallback>{artist.name?.[0] ?? "?"}</AvatarFallback>
    </Avatar>
    <span className="truncate text-[15px] font-medium text-white">
      {artist.name}
    </span>
  </div>
);

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                     */
/* -------------------------------------------------------------------------- */

/** 从 tracks 提取前 N 个不重复艺术家 */
function deriveRelatedArtists(
  tracks: readonly Partial<Track>[] | undefined,
  n = 3,
): Partial<Artist>[] {
  if (!tracks) return [];
  const seen = new Map<string, Partial<Artist>>();
  for (const t of tracks) {
    for (const a of t.artists ?? []) {
      if (!a.id) continue;
      if (!seen.has(a.id)) seen.set(a.id, a);
      if (seen.size >= n) return Array.from(seen.values());
    }
  }
  return Array.from(seen.values());
}

/** 从 tracks 推测一些 genre tag（fallback 用） */
const FALLBACK_GENRES = ["Pop", "Indie", "Electronic", "Chill", "Discover"];

/* -------------------------------------------------------------------------- */
/*  Page                                                                        */
/* -------------------------------------------------------------------------- */

const Playlist: React.FC = () => {
  const { playlistId } = Route.useParams();
  const planet = usePlanet();
  const provider = useProvider();

  const { data, isLoading } = useQuery({
    queryKey: ["playlist", provider.name, playlistId],
    queryFn: async () => provider.playlistDetail(playlistId),
  });

  // 把当前页的封面广播给 basic 布局，做整窗氛围色背景
  usePageCover(data?.image);

  if (isLoading) return <PageLoading />;

  const onRowClick = async (item: Track, items?: Track[]) => {
    const ids = items?.map((v) => v.id);
    const urls = await provider.playUrls(ids!);
    urls.forEach((url) => {
      items?.forEach((t) => {
        if (t.id === url.id) t.playUrl = url.playUrl;
      });
    });
    planet.hooks.emit("change_play_queue", {
      key: `playlist_${playlistId}`,
      tracks: items,
      track: item,
    });
  };

  const playAll = async () => {
    const tracks = data?.tracks as Track[] | undefined;
    if (!tracks?.length) return;
    await onRowClick(tracks[0], tracks);
  };

  const tracks = (data?.tracks ?? []) as Track[];
  const genres = (data?.tags?.length ? data.tags : FALLBACK_GENRES).slice(0, 5);
  const relatedArtists = deriveRelatedArtists(tracks, 3);

  return (
    <div className="min-h-full">
      <div className="grid grid-cols-[minmax(0,1fr)_360px] gap-10 px-8 pt-8 pb-12">
        {/* LEFT —— 标题 + action 行 + 曲目表 */}
        <div className="min-w-0">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="font-title text-4xl font-extrabold tracking-tight text-white">
              {data?.name}
            </h1>
            <div className="mt-3 flex items-center gap-2 text-sm text-text-muted">
              <span>By</span>
              <span className="font-bold text-white">
                {data?.creator?.nickname ?? "—"}
              </span>
              <span>·</span>
              <span>{data?.trackCount ?? 0} songs</span>
              {data?.durationCount ? (
                <>
                  <span>·</span>
                  <span>{formatHumanDuration(data.durationCount)}</span>
                </>
              ) : null}
            </div>
          </motion.div>

          {/* Action row */}
          <div className="mt-6 flex items-center gap-2">
            <Tooltip content="Play">
              <motion.button
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.95 }}
                onClick={playAll}
                className="mr-2 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-black shadow-elevated"
                aria-label="Play"
              >
                <Play size={20} fill="currentColor" />
              </motion.button>
            </Tooltip>
            <ActionIcon label="Shuffle">
              <Shuffle size={18} />
            </ActionIcon>
            <ActionIcon label="Add to library">
              <Plus size={18} />
            </ActionIcon>
            <ActionIcon label="Add to queue">
              <ListMusic size={18} />
            </ActionIcon>
            <ActionIcon label="Download">
              <Download size={18} />
            </ActionIcon>
            <ActionIcon label="Share">
              <Share2 size={18} />
            </ActionIcon>
            <ActionIcon label="More">
              <MoreHorizontal size={18} />
            </ActionIcon>
            <div className="ml-auto">
              <ActionIcon label="Search in playlist">
                <Search size={18} />
              </ActionIcon>
            </div>
          </div>

          {/* Track list */}
          <div className="mt-4">
            <TrackList onRowClick={onRowClick} tracks={tracks} />
          </div>
        </div>

        {/* RIGHT —— 封面 / 标题水印 / genre / related artists */}
        <aside className="hidden xl:block">
          <div className="sticky top-8 flex flex-col gap-6">
            <div className="relative aspect-square w-full overflow-hidden rounded-md bg-surface-2 shadow-dialog">
              {data?.image ? (
                <img
                  src={data.image}
                  alt={data.name}
                  className="h-full w-full object-cover"
                  draggable={false}
                />
              ) : null}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent px-4 pb-3 pt-12">
                <p className="font-title text-2xl font-extrabold leading-tight text-white drop-shadow-md">
                  {data?.name}
                </p>
              </div>
            </div>

            {/* Genre tags */}
            <div className="flex flex-wrap gap-2">
              {genres.map((g) => (
                <GenrePill key={g}>{g}</GenrePill>
              ))}
            </div>

            {/* Related artists */}
            {relatedArtists.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-button-uppercase mb-1 text-text-muted">
                  Related artists
                </p>
                {relatedArtists.map((a) => (
                  <RelatedArtistRow key={a.id} artist={a} />
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export const Route = createLazyFileRoute("/playlist/$playlistId")({
  component: Playlist,
});
