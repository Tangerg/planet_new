// ============================================================
// TrackRow — the dense track list row (art + meta + inline like + duration),
// with optional chart rank and multi-select. The shared list-row used by
// Playlist/Album detail, Queue, History, Search and Library songs.
// ============================================================
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import type { ArtistRef, VibeTrack } from "@/model/vibe";
import { isVibeTrackLiked } from "@/model/likes";
import { trackRowModel, type TrackRowBadge, type TrackRowLeading } from "@/model/track-row";
import { Equalizer, Art } from "@/components/primitives";
import { Icon } from "@/infra/icons";
import { Button } from "@/components/controls/Button";
import { PressTarget } from "@/components/controls/PressTarget";
import { ArtistLinks } from "@/components/cards/ArtistLink";
import { useScreenActions } from "@/hooks/screenActions";
import { usePlaybackPolicy } from "@/hooks/usePlaybackPolicy";
import { writeTrackDragData } from "@/model/track-actions";

type TrackRowProps = {
  track: VibeTrack;
  index: number;
  onPlay: (track: VibeTrack) => void;
  current?: VibeTrack;
  playing: boolean;
  liked: Set<string>;
  toggleLike: (track: VibeTrack) => void;
  accent: string;
  dark?: boolean;
  rank?: number;
  selected?: boolean;
  onSelect?: (track: VibeTrack, e: React.MouseEvent) => void;
  onOpenArtist?: (artist: ArtistRef) => void;
  onRemoveFromQueue?: (track: VibeTrack) => void;
  onMenuPlay?: (track: VibeTrack) => void;
};

const BADGE_CLASS =
  "flex-none rounded-sm px-[5px] py-[2px] font-mono text-[8.5px] uppercase leading-[1.3] tracking-[0.08em]";

function TrackLeading({
  leading,
  accent,
  color,
  muted,
}: {
  leading: TrackRowLeading;
  accent: string;
  color: string;
  muted: string;
}) {
  switch (leading.kind) {
    case "rank":
      return (
        <span
          className="mlabel text-[16px] font-medium"
          style={{ color: leading.active ? accent : color }}
        >
          {leading.value}
        </span>
      );
    case "equalizer":
      return <Equalizer playing color={accent} size={14} />;
    case "play":
      return (
        <span style={{ color }}>
          <Icon.play size={15} />
        </span>
      );
    case "index":
      return (
        <span className="mlabel text-[12px]" style={{ color: muted }}>
          {leading.value}
        </span>
      );
  }
}

function TrackBadges({
  badges,
  accent,
  muted,
}: {
  badges: readonly TrackRowBadge[];
  accent: string;
  muted: string;
}) {
  return badges.map((badge) =>
    badge.kind === "subscription" ? (
      <span
        key={badge.kind}
        className={`${BADGE_CLASS} font-bold`}
        style={{ color: "#06060a", background: accent }}
      >
        {badge.label}
      </span>
    ) : (
      <span
        key={badge.kind}
        className={BADGE_CLASS}
        style={{
          color: badge.kind === "version" ? "rgba(255,255,255,.7)" : muted,
          border: `1px solid ${
            badge.kind === "version" ? "rgba(255,255,255,.22)" : "rgba(255,255,255,.18)"
          }`,
        }}
      >
        {badge.label}
      </span>
    ),
  );
}

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
  selected,
  onSelect,
  onOpenArtist,
  onRemoveFromQueue,
  onMenuPlay,
}: TrackRowProps) {
  const { t } = useTranslation();
  const { trackMenu } = useScreenActions();
  const policy = usePlaybackPolicy();
  const [hover, setHover] = useState(false);
  const model = trackRowModel({
    track,
    current,
    playing,
    hover,
    index,
    rank,
    policy,
  });
  const col = dark ? "#fff" : "#16161a";
  const sub = dark ? "rgba(255,255,255,.5)" : "rgba(10,10,12,.5)";
  const isLiked = isVibeTrackLiked(liked, track);
  const activateTrack = (
    e: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>,
  ) => {
    if (model.unavailable) return;
    // Modifier-click multi-selects; keyboard Enter/Space always plays. `"button"`
    // is present on a MouseEvent but not a KeyboardEvent, so it narrows the union.
    if ("button" in e && onSelect && (e.metaKey || e.ctrlKey || e.shiftKey)) {
      onSelect(track, e);
      return;
    }
    onPlay(track);
  };
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      draggable={!model.unavailable}
      onDragStart={(e: React.DragEvent) => {
        writeTrackDragData(e.dataTransfer, track);
        e.dataTransfer.effectAllowed = "copy";
      }}
      onContextMenu={(e: React.MouseEvent) =>
        trackMenu(e, track, onMenuPlay ? { onPlay: onMenuPlay } : undefined)
      }
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
      <PressTarget
        label={t("a11y.playItem", { name: track.title })}
        onActivate={activateTrack}
        disabled={model.unavailable}
        className="flex flex-none items-center gap-4"
      >
        <div className="flex-none text-center" style={{ width: model.chart ? 30 : 22 }}>
          <TrackLeading leading={model.leading} accent={accent} color={col} muted={sub} />
        </div>
        <Art
          seed={track.coverSeed}
          grad={track.gradient}
          image={track.image}
          images={track.images}
          className="flex-none"
          style={{ width: 44, height: 44 }}
        />
      </PressTarget>
      <div className="min-w-0 flex-1">
        <PressTarget
          label={t("a11y.playItem", { name: track.title })}
          onActivate={activateTrack}
          disabled={model.unavailable}
          className="flex min-w-0 items-center gap-2"
        >
          <span
            className="truncate text-[15px] font-normal"
            style={{ color: model.current ? accent : col }}
          >
            {track.title}
          </span>
          <TrackBadges badges={model.badges} accent={accent} muted={sub} />
        </PressTarget>
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
      <Button
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          toggleLike(track);
        }}
        aria-label={t("a11y.like")}
        className="p-1"
        style={{ color: isLiked ? accent : hover ? col : "transparent" }}
      >
        <Icon.heart size={17} filled={isLiked} />
      </Button>
      <span className="mlabel w-[42px] flex-none text-right text-[11px]" style={{ color: sub }}>
        {track.duration}
      </span>
      {onRemoveFromQueue && (
        <Button
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onRemoveFromQueue(track);
          }}
          aria-label={t("queue.remove")}
          className="p-1"
          style={{ color: hover ? "#ff6b6b" : "transparent" }}
        >
          <Icon.close size={16} />
        </Button>
      )}
    </div>
  );
});
