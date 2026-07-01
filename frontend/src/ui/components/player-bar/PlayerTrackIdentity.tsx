import type { ArtistRef, VibeTrack } from "@/model/adapt";
import { ArtistLinks } from "@/components/cards/ArtistLink";
import { Marquee } from "@/components/Marquee";
import { Art } from "@/components/primitives";
import { activateOnKey } from "@/lib/keys";

type Props = {
  track?: VibeTrack;
  accent: string;
  onOpenNowPlaying: (element: HTMLElement) => void;
  onOpenArtist?: (artist: ArtistRef) => void;
};

export function PlayerTrackIdentity({ track, accent, onOpenNowPlaying, onOpenArtist }: Props) {
  return (
    <div
      // Children are <div>s (invalid inside a native button), so role="button" +
      // keyboard handling is the correct accessible pattern here.
      // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
      role="button"
      tabIndex={0}
      aria-label="Open now playing"
      onClick={(e) => onOpenNowPlaying(e.currentTarget)}
      onKeyDown={activateOnKey<HTMLDivElement>((e) => onOpenNowPlaying(e.currentTarget))}
      className="relative z-[1] flex w-[224px] min-w-0 flex-none cursor-pointer items-center gap-[11px] pl-[18px] pr-1.5"
    >
      <Art
        seed={track?.coverSeed || 0}
        grad={track?.gradient}
        image={track?.image}
        images={track?.images}
        className="flex-none"
        style={{
          width: 54,
          height: 54,
          boxShadow: "0 1px 2px rgba(0,0,0,.25), 0 6px 16px -4px rgba(0,0,0,.35)",
        }}
      />
      <div className="min-w-0">
        <Marquee className="text-[16px] font-normal">{track?.title || "—"}</Marquee>
        <Marquee className="text-[13px] font-light text-[rgba(20,20,24,0.55)]">
          <ArtistLinks
            artists={track?.artists}
            fallback={track?.artist || ""}
            fallbackId={track?.artistId}
            accent={accent}
            color="rgba(20,20,24,.55)"
            onOpenArtist={onOpenArtist}
          />
        </Marquee>
      </div>
    </div>
  );
}
