import type { RefObject } from "react";

import type { ArtistRef, VibeTrack } from "@/model/vibe";
import { Equalizer, Art } from "@/components/primitives";
import { Sheet } from "@/components/Sheet";
import { ArtistLinks } from "@/components/cards/ArtistLink";
import { Empty } from "@/components/layout/Empty";
import { VirtualList } from "@/components/layout/VirtualList";
import { useScreenActions } from "@/hooks/screenActions";
import { activateOnKey } from "@/lib/keys";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  container: HTMLElement | null;
  contentRef: RefObject<HTMLDivElement | null>;
  track?: VibeTrack;
  queue: VibeTrack[];
  accent: string;
  tintA: string;
  grad?: string[];
  onPlay?: (track: VibeTrack) => void;
  onOpenArtist?: (artist: ArtistRef) => void;
};

export function UpNextSheet({
  open,
  onOpenChange,
  container,
  contentRef,
  track,
  queue,
  accent,
  tintA,
  grad,
  onPlay,
  onOpenArtist,
}: Props) {
  const { trackMenu } = useScreenActions();

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      container={container}
      label="Up Next"
      contentRef={contentRef}
      className="z-[22] h-[70%]"
      overlayClassName="z-[21]"
      durationSec={0.58}
      style={{
        background: `linear-gradient(180deg, ${tintA}26, rgba(8,8,11,.97) 20%)`,
        backdropFilter: "blur(34px)",
        WebkitBackdropFilter: "blur(34px)",
        borderTop: "1px solid rgba(255,255,255,.13)",
        boxShadow: "0 -34px 90px rgba(0,0,0,.62)",
      }}
    >
      <button
        type="button"
        aria-label="Collapse queue"
        onClick={() => onOpenChange(false)}
        className="btn grid w-full cursor-pointer place-items-center pb-1 pt-[13px]"
      >
        <div className="h-1 w-11 rounded-sm bg-white/[0.28]"></div>
      </button>
      <div className="px-11 pb-11 pt-2">
        <div className="mb-4 flex items-baseline gap-[13px]">
          <span className="text-[24px] font-extralight tracking-[0.05em]">Up Next</span>
          <span className="mlabel text-white/40">{queue.length} tracks</span>
        </div>
        <div className="mb-2 flex items-center gap-[14px] border-b border-white/10 pb-[14px] pt-2.5">
          <span className="grid w-[18px] place-items-center">
            <Equalizer playing color={accent} size={15} />
          </span>
          <Art
            seed={track?.coverSeed}
            grad={grad}
            image={track?.image}
            images={track?.images}
            className="flex-none"
            style={{ width: 44, height: 44 }}
          />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px]" style={{ color: accent }}>
              {track?.title}
            </div>
            <div className="truncate text-[12.5px] font-light text-white/50">
              <ArtistLinks
                artists={track?.artists}
                fallback={track?.artist}
                fallbackId={track?.artistId}
                accent={accent}
                color="rgba(255,255,255,.5)"
                onOpenArtist={onOpenArtist}
              />
            </div>
          </div>
          <span className="mlabel text-[10px] text-white/40">Now</span>
        </div>
        {queue.length > 0 ? (
          <VirtualList
            scrollRef={contentRef}
            count={queue.length}
            estimateSize={58}
            itemKey={(vi) => queue[vi].id + vi}
            renderItem={(vi) => {
              const queued = queue[vi];
              return (
                <div
                  // eslint-disable-next-line jsx-a11y/prefer-tag-over-role -- rich queue row (art + meta), not valid native button content
                  role="button"
                  tabIndex={0}
                  aria-label={queued.title}
                  onClick={() => onPlay?.(queued)}
                  onKeyDown={activateOnKey(() => onPlay?.(queued))}
                  onContextMenu={(e) => trackMenu(e, queued)}
                  className="flex cursor-pointer items-center gap-[14px] py-[9px]"
                >
                  <span className="mlabel w-[18px] flex-none text-center text-[11px] text-white/[0.32]">
                    {vi + 1}
                  </span>
                  <Art
                    seed={queued.coverSeed}
                    grad={queued.gradient}
                    image={queued.image}
                    images={queued.images}
                    className="flex-none"
                    style={{ width: 40, height: 40 }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px]">{queued.title}</div>
                    <div className="truncate text-[12px] font-light text-white/45">
                      {queued.artist}
                    </div>
                  </div>
                  <span className="mlabel flex-none text-[10px] text-white/[0.32]">
                    {queued.duration}
                  </span>
                </div>
              );
            }}
          />
        ) : (
          <Empty className="p-[30px]">Queue is empty.</Empty>
        )}
      </div>
    </Sheet>
  );
}
