// ============================================================
// TrackRow — the dense track list row (art + meta + inline like + duration),
// with optional chart rank/trend and multi-select. The shared list-row used by
// Playlist/Album detail, Queue, History, Search and Library songs.
// ============================================================
import React, { useState } from "react";
import type { ArtistRef, VibeTrack } from "@/model/adapt";
import { Icon, Equalizer, Art } from "@/components/primitives";
import { Button } from "@/components/controls/Button";
import { ArtistLink } from "@/components/cards/ArtistLink";
import { useScreenActions } from "@/hooks/screenActions";
import { activateOnKey } from "@/lib/keys";

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

export function TrackRow({
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
  const { trackMenu } = useScreenActions();
  const isCur = current?.id === track.id;
  const [hover, setHover] = useState(false);
  const col = dark ? "#fff" : "#16161a";
  const sub = dark ? "rgba(255,255,255,.5)" : "rgba(10,10,12,.5)";
  const unavailable = track.available === false;
  const isChart = rank != null;
  // Shared chart/version/VIP badge chrome (colours added per badge inline).
  const badgeCls =
    "flex-none rounded-sm px-[5px] py-[2px] font-mono text-[8.5px] uppercase leading-[1.3] tracking-[0.08em]";
  const Trend = () => {
    if (delta == null)
      return (
        <span className="font-mono text-[8.5px] tracking-[0.06em]" style={{ color: accent }}>
          NEW
        </span>
      );
    if (delta > 0)
      return (
        <span className="inline-flex items-center gap-px text-[11px]" style={{ color: "#1ed98a" }}>
          ▲<span className="text-[9px]">{delta}</span>
        </span>
      );
    if (delta < 0)
      return (
        <span className="inline-flex items-center gap-px text-[11px]" style={{ color: "#ff6b6b" }}>
          ▼<span className="text-[9px]">{-delta}</span>
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
      // A rich flex row (art + meta + inline actions), not valid native button
      // content — role="button" + keyboard handling is the right pattern.
      // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
      role="button"
      tabIndex={unavailable ? -1 : 0}
      aria-label={track.title}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      draggable={!unavailable}
      onDragStart={(e: React.DragEvent) => {
        e.dataTransfer.setData("text/sonance-track", track.id);
        e.dataTransfer.effectAllowed = "copy";
      }}
      onContextMenu={(e: React.MouseEvent) => trackMenu(e, track)}
      onClick={(e: React.MouseEvent) => {
        if (unavailable) return;
        if (onSelect && (e.metaKey || e.ctrlKey || e.shiftKey)) {
          onSelect(track, e);
          return;
        }
        onPlay(track);
      }}
      onKeyDown={activateOnKey(() => {
        if (!unavailable) onPlay(track);
      })}
      className="flex items-center gap-4 px-[14px] py-[11px] transition-[background] duration-150"
      style={{
        cursor: unavailable ? "default" : "pointer",
        opacity: unavailable ? 0.42 : 1,
        background: selected
          ? `${accent}22`
          : hover && !unavailable
            ? dark
              ? "rgba(255,255,255,.06)"
              : "rgba(0,0,0,.04)"
            : "transparent",
        boxShadow: selected ? `inset 2px 0 0 ${accent}` : "none",
      }}
    >
      <div className="flex-none text-center" style={{ width: isChart ? 30 : 22 }}>
        {isChart ? (
          <span className="mlabel text-[16px] font-medium" style={{ color: isCur ? accent : col }}>
            {rank}
          </span>
        ) : isCur && playing ? (
          <Equalizer playing color={accent} size={14} />
        ) : hover && !unavailable ? (
          <span style={{ color: col }}>
            <Icon.play size={15} />
          </span>
        ) : (
          <span className="mlabel text-[12px]" style={{ color: sub }}>
            {index}
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
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="truncate text-[15px] font-normal"
            style={{ color: isCur ? accent : col }}
          >
            {track.title}
          </span>
          {track.version && track.version !== "studio" && (
            <span
              className={badgeCls}
              style={{ color: "rgba(255,255,255,.7)", border: "1px solid rgba(255,255,255,.22)" }}
            >
              {track.version}
            </span>
          )}
          {track.vipOnly && (
            <span
              className={badgeCls + " font-bold"}
              style={{ color: "#06060a", background: accent }}
            >
              VIP
            </span>
          )}
          {unavailable && (
            <span
              className={badgeCls}
              style={{ color: sub, border: "1px solid rgba(255,255,255,.18)" }}
            >
              Unavailable
            </span>
          )}
        </div>
        <div className="truncate text-[12.5px] font-light" style={{ color: sub }}>
          <ArtistLink
            name={track.artist}
            artistId={track.artistId}
            accent={accent}
            color={sub}
            onOpenArtist={onOpenArtist}
          />
        </div>
      </div>
      {isChart && (
        <span className="w-[38px] flex-none text-center">
          <Trend />
        </span>
      )}
      <Button
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          toggleLike(track.id);
        }}
        aria-label="Like"
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
}
