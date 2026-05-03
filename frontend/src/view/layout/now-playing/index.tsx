import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, Heart, MoreHorizontal, Plus } from "lucide-react";

import { PlayState } from "../../../packages/plugin";
import { Tooltip } from "../../ui/tooltip";
import { cn } from "../../lib/cn";
import useAppStore from "../../store/app";
import { useStore as usePlayQueueStore } from "../../store/playqueue";
import LyricPanel from "../../components/lyric-panel";
import CoverAmbientBg from "../../components/cover-ambient-bg";
import VolumeControl from "../../components/volume-control";
import Control from "../basic/player/control";
import Vinyl from "./vinyl";

const TopIconButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement>
> = ({ children, className, ...props }) => (
  <button
    className={cn(
      "flex h-9 w-9 items-center justify-center rounded-full text-text-muted transition-colors",
      "hover:bg-white/10 hover:text-white",
      className,
    )}
    {...props}
  >
    {children}
  </button>
);

const ActionButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }
> = ({ children, active, className, ...props }) => (
  <button
    className={cn(
      "flex h-9 w-9 items-center justify-center rounded-full transition-colors",
      active
        ? "text-accent hover:scale-105"
        : "text-text-muted hover:scale-105 hover:text-white",
      className,
    )}
    {...props}
  >
    {children}
  </button>
);

const NowPlaying: React.FC = () => {
  const isOpen = useAppStore.use.isNowPlayingOpen();
  const setIsOpen = useAppStore.use.setIsNowPlayingOpen();

  const track = usePlayQueueStore.use.track();
  const playState = usePlayQueueStore.use.playState();
  const [liked, setLiked] = useState(false);
  const [added, setAdded] = useState(false);

  const albumImage = track?.album?.image;
  const trackName = track?.name;
  const trackArtist = track?.artists?.map((a) => a.name).join(" / ");
  const trackAlbum = track?.album?.name;
  const spinning = playState === PlayState.PLAYING;

  // ESC 关闭
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, setIsOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="now-playing"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
          className="fixed inset-0 z-50 overflow-hidden bg-base text-white"
        >
          <CoverAmbientBg
            image={albumImage}
            className="flex h-full w-full flex-col"
          >
            {/* 顶栏：close + 来源标 */}
            <header className="flex shrink-0 items-center justify-between px-6 py-5">
              <Tooltip content="Minimize">
                <TopIconButton onClick={() => setIsOpen(false)}>
                  <ChevronDown size={18} />
                </TopIconButton>
              </Tooltip>
              <div className="text-button-uppercase text-text-muted">
                {trackAlbum ? `Playing from · ${trackAlbum}` : "Now Playing"}
              </div>
              <div className="w-9" />
            </header>

            {/* 主体：左 vinyl / 右 标题+lyric */}
            <main className="grid min-h-0 flex-1 grid-cols-[auto_1fr] items-stretch gap-16 overflow-hidden px-16 pb-6">
              <div className="flex items-center justify-center">
                <Vinyl image={albumImage} spinning={spinning} size={360} />
              </div>

              <section className="flex min-h-0 min-w-0 flex-col gap-6 overflow-hidden">
                <header className="shrink-0 pt-6">
                  <p className="text-button-uppercase text-text-muted">Song</p>
                  <h1 className="mt-3 font-title text-[64px] font-extrabold leading-[1.05] tracking-tight text-white">
                    {trackName ?? "—"}
                  </h1>
                  <p className="mt-3 text-xl font-medium text-text-muted">
                    {trackArtist ?? ""}
                  </p>
                  {trackAlbum && (
                    <p className="mt-1 text-sm text-text-muted/80">
                      {trackAlbum}
                    </p>
                  )}

                  <div className="mt-6 flex items-center gap-1">
                    <Tooltip content={liked ? "Remove from Liked" : "Save to Liked"}>
                      <ActionButton
                        active={liked}
                        onClick={() => setLiked((v) => !v)}
                      >
                        <Heart
                          size={20}
                          className={cn(liked && "fill-accent text-accent")}
                        />
                      </ActionButton>
                    </Tooltip>
                    <Tooltip content={added ? "In your library" : "Add to library"}>
                      <ActionButton
                        active={added}
                        onClick={() => setAdded((v) => !v)}
                      >
                        <Plus size={20} />
                      </ActionButton>
                    </Tooltip>
                    <Tooltip content="More">
                      <ActionButton>
                        <MoreHorizontal size={20} />
                      </ActionButton>
                    </Tooltip>
                  </div>
                </header>

                <div className="flex min-h-0 flex-1 overflow-hidden">
                  <LyricPanel className="h-full flex-1" />
                </div>
              </section>
            </main>

            {/* 底栏 */}
            <footer className="shrink-0 px-16 pb-6 pt-2">
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-6">
                <div />
                <div className="min-w-[460px]">
                  <Control />
                </div>
                <div className="flex justify-end">
                  <VolumeControl sliderWidth={128} />
                </div>
              </div>
            </footer>
          </CoverAmbientBg>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NowPlaying;
