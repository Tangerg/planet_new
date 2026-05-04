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
/*  Page                                                                        */
/* -------------------------------------------------------------------------- */

const Album: React.FC = () => {
  const { albumId } = Route.useParams();
  const planet = usePlanet();
  const provider = useProvider();

  const { data, isLoading } = useQuery({
    queryKey: ["album", provider.name, albumId],
    queryFn: async () => provider.albumDetail(albumId),
  });

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
      key: `album_${albumId}`,
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
  const artist = data?.artist;
  const year = data?.publishTime
    ? new Date(data.publishTime).getFullYear()
    : null;

  return (
    <div className="min-h-full">
      <div className="grid grid-cols-[minmax(0,1fr)_360px] gap-10 px-8 pt-8 pb-12">
        {/* LEFT —— 标题 + meta + action 行 + 曲目表 */}
        <div className="min-w-0">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-button-uppercase text-text-muted">Album</p>
            <h1 className="mt-2 font-title text-4xl font-extrabold tracking-tight text-white">
              {data?.name}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-text-muted">
              {artist?.name && (
                <>
                  <span>By</span>
                  <span className="font-bold text-white">{artist.name}</span>
                </>
              )}
              {year ? (
                <>
                  <span>·</span>
                  <span>{year}</span>
                </>
              ) : null}
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
            <ActionIcon label="Save album">
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
              <ActionIcon label="Search in album">
                <Search size={18} />
              </ActionIcon>
            </div>
          </div>

          <div className="mt-4">
            <TrackList hiddenAlbum onRowClick={onRowClick} tracks={tracks} />
          </div>
        </div>

        {/* RIGHT —— 封面 / 艺术家卡 */}
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

            {/* About the artist */}
            {artist?.name && (
              <div className="flex flex-col gap-3">
                <p className="text-button-uppercase text-text-muted">
                  About the artist
                </p>
                <div className="overflow-hidden rounded-md bg-white/[0.04] p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-14 w-14">
                      {artist.image ? (
                        <AvatarImage src={artist.image} alt={artist.name} />
                      ) : null}
                      <AvatarFallback>{artist.name?.[0] ?? "?"}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-bold text-white">
                        {artist.name}
                      </p>
                      <p className="truncate text-xs text-text-muted">Artist</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export const Route = createLazyFileRoute("/album/$albumId")({
  component: Album,
});
