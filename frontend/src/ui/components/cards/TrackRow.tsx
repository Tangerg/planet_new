// ============================================================
// TrackRow — the dense track list row (art + meta + inline like + duration),
// with optional chart rank/trend and multi-select. The shared list-row used by
// Playlist/Album detail, Queue, History, Search and Library songs.
// ============================================================
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import type { ArtistRef, VibeTrack } from "@/model/vibe";
import { trackRowModel, type TrackRowTrend } from "@/model/track-row";
import { Equalizer, Art } from "@/components/primitives";
import { Icon } from "@/infra/icons";
import { Button } from "@/components/controls/Button";
import { ArtistLinks } from "@/components/cards/ArtistLink";
import { useScreenActions } from "@/hooks/screenActions";
import { usePlaybackPolicy } from "@/hooks/usePlaybackPolicy";
import { activateOnKey } from "@/lib/keys";
import { writeTrackDragData } from "@/model/track-actions";

type TrackRowProps = {
  track: VibeTrack;
  index: number;
  onPlay: (track: VibeTrack) => void;
  current?: VibeTrack;
  playing: boolean;
  liked: Set<string>;
  toggleLike: (id: string) => void;
  accent: string;
  dark?: boolean;
  rank?: number;
  delta?: number;
  selected?: boolean;
  onSelect?: (track: VibeTrack, e: React.MouseEvent) => void;
  onOpenArtist?: (artist: ArtistRef) => void;
};

// React.memo: this row is the leaf of every virtualized track list, so on each
// scroll windowing tick the list re-invokes renderItem for all visible rows.
// Memoizing means only rows whose props actually changed re-render (the row
// entering the window, or the one whose current/selected/liked flipped) instead
// of the whole visible set — the difference between a jittery and a 60fps scroll.
// All call sites pass stable references (onPlay/toggleLike/current/liked/accent)
// or primitives (index/rank/selected), so the default shallow compare bails.
export const TrackRow = React.memo(function TrackRow({
  track,
  index,
  onPlay,
  current,
  playing,
  liked,
  toggleLike,
  accent,
  dark = true,
  rank,
  delta,
  selected,
  onSelect,
  onOpenArtist,
}: TrackRowProps) {
  const { t } = useTranslation();
  const { trackMenu } = useScreenActions();
  const policy = usePlaybackPolicy();
  const [hover, setHover] = useState(false);
  const model = trackRowModel({
    track,
    currentId: current?.id,
    playing,
    hover,
    index,
    rank,
    delta,
    policy,
  });
  const col = dark ? "#fff" : "#16161a";
  const sub = dark ? "rgba(255,255,255,.5)" : "rgba(10,10,12,.5)";
  const activateTrack = (e?: React.MouseEvent) => {
    if (model.unavailable) return;
    if (e && onSelect && (e.metaKey || e.ctrlKey || e.shiftKey)) {
      onSelect(track, e);
      return;
    }
    onPlay(track);
  };
  // Shared chart/version/VIP badge chrome (colours added per badge inline).
  const badgeCls =
    "flex-none rounded-sm px-[5px] py-[2px] font-mono text-[8.5px] uppercase leading-[1.3] tracking-[0.08em]";
  const Trend = ({ trend }: { trend: TrackRowTrend }) => {
    if (trend.kind === "new")
      return (
        <span className="font-mono text-[8.5px] tracking-[0.06em]" style={{ color: accent }}>
          NEW
        </span>
      );
    if (trend.kind === "up")
      return (
        <span className="inline-flex items-center gap-px text-[11px]" style={{ color: "#1ed98a" }}>
          ▲<span className="text-[9px]">{trend.value}</span>
        </span>
      );
    if (trend.kind === "down")
      return (
        <span className="inline-flex items-center gap-px text-[11px]" style={{ color: "#ff6b6b" }}>
          ▼<span className="text-[9px]">{trend.value}</span>
        </span>
      );
    return (
      <span className="text-[12px]" style={{ color: sub }}>
        –
      </span>
    );
  };
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      draggable={!model.unavailable}
      onDragStart={(e: React.DragEvent) => {
        writeTrackDragData(e.dataTransfer, track.id);
        e.dataTransfer.effectAllowed = "copy";
      }}
      onContextMenu={(e: React.MouseEvent) => trackMenu(e, track)}
      className="flex items-center gap-4 px-[14px] py-[11px] transition-[background] duration-150"
      style={{
        cursor: model.unavailable ? "default" : "pointer",
        opacity: model.unavailable ? 0.42 : 1,
        background: selected
          ? `${accent}22`
          : hover && !model.unavailable
            ? dark
              ? "rgba(255,255,255,.06)"
              : "rgba(0,0,0,.04)"
            : "transparent",
        boxShadow: selected ? `inset 2px 0 0 ${accent}` : "none",
      }}
    >
      <div
        // eslint-disable-next-line jsx-a11y/prefer-tag-over-role -- rich leading area (rank/equalizer/art) plays the track
        role="button"
        tabIndex={model.unavailable ? -1 : 0}
        aria-label={t("a11y.playItem", { name: track.title })}
        onClick={(e: React.MouseEvent) => activateTrack(e)}
        onKeyDown={activateOnKey(() => activateTrack())}
        className="flex flex-none items-center gap-4"
      >
        <div className="flex-none text-center" style={{ width: model.chart ? 30 : 22 }}>
          {model.leading.kind === "rank" ? (
            <span
              className="mlabel text-[16px] font-medium"
              style={{ color: model.leading.active ? accent : col }}
            >
              {model.leading.value}
            </span>
          ) : model.leading.kind === "equalizer" ? (
            <Equalizer playing color={accent} size={14} />
          ) : model.leading.kind === "play" ? (
            <span style={{ color: col }}>
              <Icon.play size={15} />
            </span>
          ) : (
            <span className="mlabel text-[12px]" style={{ color: sub }}>
              {model.leading.value}
            </span>
          )}
        </div>
        <Art
          seed={track.coverSeed}
          grad={track.gradient}
          image={track.image}
          images={track.images}
          className="flex-none"
          style={{ width: 44, height: 44 }}
        />
      </div>
      <div className="min-w-0 flex-1">
        <div
          // eslint-disable-next-line jsx-a11y/prefer-tag-over-role -- title line is a secondary play target
          role="button"
          tabIndex={model.unavailable ? -1 : 0}
          aria-label={t("a11y.playItem", { name: track.title })}
          onClick={(e: React.MouseEvent) => activateTrack(e)}
          onKeyDown={activateOnKey(() => activateTrack())}
          className="flex min-w-0 items-center gap-2"
        >
          <span
            className="truncate text-[15px] font-normal"
            style={{ color: model.current ? accent : col }}
          >
            {track.title}
          </span>
          {model.badges.map((badge) =>
            badge.kind === "subscription" ? (
              <span
                key={badge.kind}
                className={badgeCls + " font-bold"}
                style={{ color: "#06060a", background: accent }}
              >
                {badge.label}
              </span>
            ) : (
              <span
                key={badge.kind}
                className={badgeCls}
                style={{
                  color: badge.kind === "version" ? "rgba(255,255,255,.7)" : sub,
                  border: `1px solid ${
                    badge.kind === "version" ? "rgba(255,255,255,.22)" : "rgba(255,255,255,.18)"
                  }`,
                }}
              >
                {badge.label}
              </span>
            ),
          )}
        </div>
        <div className="truncate text-[12.5px] font-light" style={{ color: sub }}>
          <ArtistLinks
            artists={track.artists}
            fallback={track.artist}
            fallbackId={track.artistId}
            accent={accent}
            color={sub}
            onOpenArtist={onOpenArtist}
          />
        </div>
      </div>
      {model.trend && (
        <span className="w-[38px] flex-none text-center">
          <Trend trend={model.trend} />
        </span>
      )}
      <Button
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          toggleLike(track.id);
        }}
        aria-label={t("a11y.like")}
        className="p-1"
        style={{ color: liked.has(track.id) ? accent : hover ? col : "transparent" }}
      >
        <Icon.heart size={17} filled={liked.has(track.id)} />
      </Button>
      <span className="mlabel w-[42px] flex-none text-right text-[11px]" style={{ color: sub }}>
        {track.duration}
      </span>
    </div>
  );
});
