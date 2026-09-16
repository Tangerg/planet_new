import React from "react";
import { useTranslation } from "react-i18next";
import type { TrackListBindings, VibeTrack } from "@/model/vibe";
import { isVibeTrackLiked } from "@/model/likes";
import { trackRowModel, type TrackRowBadge, type TrackRowLeading } from "@/model/track-row";
import { localize } from "@/i18n/text";
import { Equalizer, Art } from "@/components/primitives";
import { Icon } from "@/infra/icons";
import { Button } from "@/components/controls/Button";
import { PressTarget } from "@/components/controls/PressTarget";
import { ArtistLinks } from "@/components/cards/ArtistLink";
import { useScreenActions } from "@/hooks/screenActions";
import { usePlaybackPolicy } from "@/hooks/usePlaybackPolicy";
import { writeTrackDragData } from "@/model/track-actions";
import { cn } from "@/lib/cn";
import { useAccent } from "@/hooks/accent";

type TrackRowProps = TrackListBindings & {
  track: VibeTrack;
  index: number;
  dark?: boolean;
  rank?: number;
  selected?: boolean;
  onSelect?: (track: VibeTrack, e: React.MouseEvent) => void;
  onRemoveFromQueue?: (track: VibeTrack) => void;
  onMenuPlay?: (track: VibeTrack) => void;
};

export const TRACK_ROW_HEIGHT = 66;

const BADGE_CLASS =
  "flex-none rounded-sm px-[5px] py-[2px] font-mono text-[8.5px] uppercase leading-[1.3] tracking-[0.08em]";

function TrackLeading({
  leading,
  color,
  muted,
  playable,
}: {
  leading: TrackRowLeading;
  color: string;
  muted: string;
  playable: boolean;
}) {
  const accent = useAccent();
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
    case "index":
      return (
        <>
          <span className="trow-index mlabel text-[12px]" style={{ color: muted }}>
            {leading.value}
          </span>
          {playable && (
            <span className="trow-play" style={{ color }}>
              <Icon.play size={15} />
            </span>
          )}
        </>
      );
  }
}

function TrackBadges({ badges, muted }: { badges: readonly TrackRowBadge[]; muted: string }) {
  const accent = useAccent();
  const { t } = useTranslation();
  return badges.map((badge) =>
    badge.kind === "subscription" ? (
      <span
        key={badge.kind}
        className={`${BADGE_CLASS} font-bold`}
        style={{ color: "#06060a", background: accent }}
      >
        {localize(t, badge.label)}
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
        {localize(t, badge.label)}
      </span>
    ),
  );
}

export const TrackRow = React.memo(function TrackRow({
  track,
  index,
  onPlay,
  current,
  playing,
  liked,
  toggleLike,
  dark = true,
  rank,
  selected,
  onSelect,
  onOpenArtist,
  onRemoveFromQueue,
  onMenuPlay,
}: TrackRowProps) {
  const { t } = useTranslation();
  const accent = useAccent();
  const { trackMenu } = useScreenActions();
  const policy = usePlaybackPolicy();
  const model = trackRowModel({ track, current, playing, index, rank, policy });
  const col = dark ? "#fff" : "#16161a";
  const sub = dark ? "rgba(255,255,255,.5)" : "rgba(10,10,12,.5)";
  const isLiked = isVibeTrackLiked(liked, track);
  const activateTrack = (
    e: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>,
  ) => {
    if (model.unavailable) return;
    if ("button" in e && onSelect && (e.metaKey || e.ctrlKey || e.shiftKey)) {
      onSelect(track, e);
      return;
    }
    onPlay(track);
  };
  return (
    <div
      draggable={!model.unavailable}
      onDragStart={(e: React.DragEvent) => {
        writeTrackDragData(e.dataTransfer, track);
        e.dataTransfer.effectAllowed = "copy";
      }}
      onContextMenu={(e: React.MouseEvent) =>
        trackMenu(e, track, onMenuPlay ? { onPlay: onMenuPlay } : undefined)
      }
      className={cn("trow", !dark && "on-light", model.unavailable && "is-unavailable")}
      style={
        selected ? { background: `${accent}22`, boxShadow: `inset 2px 0 0 ${accent}` } : undefined
      }
    >
      <PressTarget
        label={t("a11y.playItem", { name: track.title })}
        onActivate={activateTrack}
        disabled={model.unavailable}
        className="flex flex-none items-center gap-4"
      >
        <div className="flex-none text-center" style={{ width: model.chart ? 30 : 22 }}>
          <TrackLeading
            leading={model.leading}
            color={col}
            muted={sub}
            playable={!model.unavailable}
          />
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
          <TrackBadges badges={model.badges} muted={sub} />
        </PressTarget>
        <div className="truncate text-[12.5px] font-light" style={{ color: sub }}>
          <ArtistLinks
            artists={track.artists}
            fallback={track.artist}
            fallbackId={track.artistId}
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
        className="trow-like p-1"
        style={isLiked ? { color: accent } : undefined}
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
          className="trow-remove p-1"
        >
          <Icon.close size={16} />
        </Button>
      )}
    </div>
  );
});
