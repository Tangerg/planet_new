import React from "react";
import { Track } from "../../../packages/model/track";
import {
  formatDuration,
  Minute,
  Second,
} from "../../../packages/shared-utils/time";

type TrackItemProps = {
  track: Track;
  onClick?: (track: Track) => void;
};

const TrackItem: React.FC<TrackItemProps> = ({ track, onClick }) => (
  <div
    onClick={() => onClick?.(track)}
    className="group flex items-center gap-3 rounded-md p-2 cursor-pointer transition-colors hover:bg-white/5"
  >
    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-surface-2">
      {track.album?.image ? (
        <img
          src={track.album.image}
          alt={track.name}
          className="h-full w-full object-cover"
        />
      ) : null}
    </div>
    <div className="flex min-w-0 flex-1 flex-col">
      <span className="truncate text-sm font-bold text-white">{track.name}</span>
      <span className="truncate text-xs text-text-muted">
        {track.artists?.[0]?.name}
      </span>
    </div>
    <span className="shrink-0 text-xs tabular-nums text-text-muted">
      {formatDuration(track.duration, [Minute, Second])}
    </span>
  </div>
);

export default TrackItem;
