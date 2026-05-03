import React, { useEffect, useState } from "react";
import { Heart, Maximize2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { usePlanet } from "../../../hooks/usePlanet";
import { Track } from "../../../../packages/model/track";
import { Tooltip } from "../../../ui/tooltip";
import { cn } from "../../../lib/cn";
import useAppStore from "../../../store/app";

const Meta: React.FC = () => {
  const [track, setTrack] = useState<Partial<Track>>({
    name: "Planet",
    artists: [{ name: "" }],
    album: { image: "" },
  });
  const [liked, setLiked] = useState(false);
  const planet = usePlanet();
  const setIsNowPlayingOpen = useAppStore.use.setIsNowPlayingOpen();

  useEffect(() => {
    planet.hooks.on("current_track_changed", setTrack);
    return () => {
      planet.hooks.off("current_track_changed", setTrack);
    };
  }, []);

  const openNowPlaying = () => setIsNowPlayingOpen(true);

  return (
    <div className="flex items-center gap-3 min-w-0">
      <Tooltip content="Open now playing">
        <button
          type="button"
          onClick={openNowPlaying}
          className="group relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-surface-2 shadow-elevated"
        >
          <AnimatePresence mode="wait">
            {track.album?.image ? (
              <motion.img
                key={track.album.image}
                src={track.album.image}
                alt={track.name}
                className="h-full w-full object-cover"
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-surface-3 to-surface" />
            )}
          </AnimatePresence>
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            <Maximize2 size={16} className="text-white" />
          </span>
        </button>
      </Tooltip>

      <button
        type="button"
        onClick={openNowPlaying}
        className="flex min-w-0 cursor-pointer flex-col text-left"
      >
        <span className="truncate text-sm font-bold text-white hover:underline">
          {track.name}
        </span>
        <span className="truncate text-xs text-text-muted">
          {track.artists?.[0]?.name}
        </span>
      </button>

      <Tooltip content={liked ? "Remove from Liked Songs" : "Save to Liked Songs"}>
        <button
          onClick={() => setLiked((v) => !v)}
          className="ml-2 flex h-8 w-8 items-center justify-center rounded-full text-text-muted hover:text-white transition-colors"
        >
          <Heart
            size={18}
            className={cn(
              "transition-colors",
              liked && "fill-accent text-accent",
            )}
          />
        </button>
      </Tooltip>
    </div>
  );
};

export default Meta;
