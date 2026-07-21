import type React from "react";
import { useTranslation } from "react-i18next";

import { artPair } from "@/components/primitives";
import { Button } from "@/components/controls/Button";
import { PressTarget } from "@/components/controls/PressTarget";
import { Sheet } from "@/components/Sheet";
import type { FlowItem } from "@/model/derive";
import type { VibeTrack } from "@/model/vibe";

/**
 * The expanded in-place tracklist for the centered cover — a Base UI Dialog Sheet
 * (Escape / click-outside) sliding up from the carousel floor. Tinted from the
 * centered cover's palette.
 */
export function CoverFlowSheet({
  open,
  onOpenChange,
  container,
  item,
  tracks,
  onOpen,
  onPlayTrack,
  trackMenu,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  container: HTMLElement | null;
  item?: FlowItem;
  tracks: VibeTrack[];
  onOpen: () => void;
  onPlayTrack?: (track: VibeTrack) => void;
  trackMenu: (e: React.MouseEvent, track: VibeTrack) => void;
}) {
  const { t } = useTranslation();
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      container={container}
      label={t("common.tracks")}
      className="z-[500] h-[56%]"
      overlayClassName="z-[499]"
      durationSec={0.38}
      style={{
        background: `linear-gradient(180deg, ${artPair(item?.seed, item?.grad)[1]}22, rgba(8,8,11,.97) 22%)`,
        backdropFilter: "blur(34px)",
        WebkitBackdropFilter: "blur(34px)",
        borderTop: "1px solid rgba(255,255,255,.13)",
        boxShadow: "0 -30px 80px rgba(0,0,0,.6)",
      }}
    >
      <button
        type="button"
        aria-label={t("common.collapse")}
        onClick={() => onOpenChange(false)}
        className="btn grid w-full cursor-pointer place-items-center pb-1 pt-3"
      >
        <div className="h-1 w-11 rounded-sm bg-white/[0.28]"></div>
      </button>
      <div className="px-10 pb-[30px] pt-1.5">
        <div className="mb-3 flex items-center justify-between gap-[14px]">
          <div className="flex min-w-0 flex-auto items-baseline gap-3">
            <span className="truncate text-[21px] font-extralight tracking-[0.03em]">
              {item?.name}
            </span>
            <span className="mlabel flex-none whitespace-nowrap text-white/40">
              {t("counts.tracks", { count: tracks.length })}
            </span>
          </div>
          <Button
            className="pill-accent inline-flex flex-none items-center gap-2"
            style={{ fontSize: 11, padding: "9px 18px" }}
            onClick={onOpen}
          >
            {t("common.open")}
          </Button>
        </div>
        {tracks.map((track, i) => (
          <PressTarget
            key={track.id + i}
            label={t("a11y.playItem", { name: track.title })}
            onActivate={() => onPlayTrack?.(track)}
            onContextMenu={(e) => trackMenu(e, track)}
            className="flex cursor-pointer items-center gap-[14px] border-b border-white/[0.06] py-[9px]"
          >
            <span className="mlabel w-[18px] flex-none text-center text-[11px] text-white/[0.32]">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[14px]">{track.title}</div>
              <div className="truncate text-[12px] font-light text-white/45">{track.artist}</div>
            </div>
            <span className="mlabel flex-none text-[10px] text-white/[0.32]">{track.duration}</span>
          </PressTarget>
        ))}
      </div>
    </Sheet>
  );
}
