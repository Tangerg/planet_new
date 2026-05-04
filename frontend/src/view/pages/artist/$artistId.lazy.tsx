import React from "react";
import { createLazyFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, MoreHorizontal, Play, Share2 } from "lucide-react";
import { motion } from "motion/react";

import { Track } from "@kernel/model/track";
import {
  formatDuration,
  Minute,
  Second,
} from "@kernel/shared-utils/time";

import { ActionIcon } from "@/components/detail-toolkit";
import PageLoading from "@/components/page-loading";
import { usePageCover } from "@/hooks/usePageCover";
import { usePlanet } from "@/hooks/usePlanet";
import { useProvider } from "@/hooks/useProvider";
import { cn } from "@/lib/cn";
import { Tooltip } from "@/ui/tooltip";

/* -------------------------------------------------------------------------- */

const formatFollowers = (n: number | undefined): string => {
  if (!n) return "";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
};

/* -------------------------------------------------------------------------- */

const Artist: React.FC = () => {
  const { artistId } = Route.useParams();
  const planet = usePlanet();
  const provider = useProvider();
  const [followed, setFollowed] = React.useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["artist", provider.name, artistId],
    queryFn: async () => provider.artistDetail(artistId),
    enabled: provider.supports("artistDetail"),
  });

  // 用 banner 优先，没有就 image 兜底
  usePageCover(data?.banner || data?.image);

  if (!provider.supports("artistDetail")) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-text-muted">
        This source ({provider.name}) does not provide artist pages.
      </div>
    );
  }

  if (isLoading) return <PageLoading />;

  const tracks = (data?.topTracks ?? []) as Track[];

  const onRowClick = async (item: Partial<Track>, items?: Partial<Track>[]) => {
    if (!item.id) return;
    const list = (items ?? tracks) as Track[];
    const ids = list.map((v) => v.id).filter(Boolean);
    const urls = await provider.playUrls(ids);
    urls.forEach((url) => {
      list.forEach((t) => {
        if (t.id === url.id) t.playUrl = url.playUrl;
      });
    });
    planet.hooks.emit("change_play_queue", {
      key: `artist_${artistId}`,
      tracks: list,
      track: item as Track,
    });
  };

  const playPopular = async () => {
    if (!tracks.length) return;
    await onRowClick(tracks[0], tracks);
  };

  return (
    <div className="min-h-full">
      {/* HERO */}
      <section className="relative">
        <div className="relative h-[44vh] min-h-[300px] w-full overflow-hidden">
          {data?.banner || data?.image ? (
            <img
              src={data.banner || data.image}
              alt={data.name}
              className="h-full w-full object-cover"
              draggable={false}
            />
          ) : (
            <div className="h-full w-full bg-surface-2" />
          )}
          {/* 渐隐到主背景 */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/40" />
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            className="absolute inset-x-0 bottom-0 px-10 pb-8"
          >
            <div className="mb-3 flex items-center gap-2">
              <CheckCircle2
                size={20}
                className="fill-info text-info"
                strokeWidth={2.4}
              />
              <span className="text-sm font-bold text-white">
                Verified Artist
              </span>
            </div>
            <h1 className="font-title text-7xl font-extrabold tracking-tight text-white drop-shadow-md">
              {data?.name}
            </h1>
            {data?.followers ? (
              <p className="mt-3 text-sm text-white/85">
                {formatFollowers(data.followers)} monthly listeners
              </p>
            ) : null}
          </motion.div>
        </div>
      </section>

      {/* CONTENT */}
      <div className="px-10 pb-12">
        {/* Action row */}
        <div className="-mt-2 flex items-center gap-3 pb-4">
          <Tooltip content="Play">
            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.95 }}
              onClick={playPopular}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-black shadow-elevated"
              aria-label="Play"
            >
              <Play size={22} fill="currentColor" />
            </motion.button>
          </Tooltip>
          <button
            onClick={() => setFollowed((v) => !v)}
            className={cn(
              "h-9 rounded-full border px-5 text-sm font-bold uppercase tracking-button transition-colors",
              followed
                ? "border-white/40 bg-white/10 text-white"
                : "border-white/40 text-white hover:border-white",
            )}
          >
            {followed ? "Following" : "Follow"}
          </button>
          <ActionIcon label="Share">
            <Share2 size={18} />
          </ActionIcon>
          <ActionIcon label="More">
            <MoreHorizontal size={18} />
          </ActionIcon>
        </div>

        {/* Popular */}
        <div className="mt-4">
          <h2 className="mb-3 font-title text-2xl font-bold tracking-tight text-white">
            Popular
          </h2>
          {tracks.length === 0 ? (
            <p className="text-sm text-text-muted">No popular tracks.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {tracks.slice(0, 5).map((t, i) => (
                <li
                  key={t.id}
                  onClick={() => onRowClick(t, tracks)}
                  className="group grid cursor-pointer grid-cols-[40px_1fr_60px] items-center gap-4 rounded-md px-3 py-2 transition-colors hover:bg-white/5"
                >
                  <span className="relative flex w-10 items-center justify-end pr-2 text-sm tabular-nums text-text-muted">
                    <span className="group-hover:opacity-0">{i + 1}</span>
                    <Play
                      size={14}
                      fill="currentColor"
                      className="absolute right-2 hidden text-white group-hover:inline-block"
                    />
                  </span>
                  <div className="flex min-w-0 items-center gap-3">
                    {t.album?.image && (
                      <img
                        src={t.album.image}
                        alt={t.name}
                        className="h-10 w-10 shrink-0 rounded-md object-cover"
                      />
                    )}
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-bold text-white">
                        {t.name}
                      </span>
                      {t.album?.name && (
                        <span className="truncate text-xs text-text-muted">
                          {t.album.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="flex justify-end text-xs tabular-nums text-text-muted">
                    {t.duration
                      ? formatDuration(t.duration, [Minute, Second])
                      : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* About */}
        {data?.description ? (
          <div className="mt-12">
            <h2 className="mb-3 font-title text-2xl font-bold tracking-tight text-white">
              About
            </h2>
            <div className="overflow-hidden rounded-lg bg-white/[0.04] p-6">
              <p className="whitespace-pre-line text-sm leading-relaxed text-text-muted">
                {data.description}
              </p>
            </div>
          </div>
        ) : null}

        {/* Genres */}
        {data?.genres && data.genres.length > 0 ? (
          <div className="mt-8 flex flex-wrap gap-2">
            {data.genres.slice(0, 8).map((g) => (
              <span
                key={g}
                className="inline-flex h-9 items-center rounded-full border border-white/15 px-3.5 text-xs text-white"
              >
                {g}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export const Route = createLazyFileRoute("/artist/$artistId")({
  component: Artist,
});
