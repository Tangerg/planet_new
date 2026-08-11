import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import type { VibeComment, VibeMusicVideo } from "@/model/vibe";
import { type MusicVideoAvailabilityPolicy } from "@contexts/catalog";
import { Art } from "@/components/primitives";
import { Button } from "@/components/controls/Button";
import { FadeIn } from "@/components/motion";
import { Icon } from "@/infra/icons";
import { formatMediaTime } from "@/model/media-playback";
import { musicVideoTheaterModel } from "@/model/music-video-screen";
import { useAccent } from "@/hooks/accent";
import { EXPO_OUT_CSS } from "@/styles/motion";

type MusicVideoTheaterScreenProps = {
  video: VibeMusicVideo;
  comments: VibeComment[];
  playbackPolicy: MusicVideoAvailabilityPolicy;
  onClose: () => void;
};

export function MusicVideoTheaterScreen({
  video,
  comments,
  playbackPolicy,
  onClose,
}: MusicVideoTheaterScreenProps) {
  const accent = useAccent();
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const initialModel = musicVideoTheaterModel({
    comments,
    durationSec: video.durSec || 0,
    playbackPolicy,
    positionSec: 0,
    video,
  });
  const [playing, setPlaying] = useState(initialModel.hasStream);
  const [timeSec, setTimeSec] = useState(0);
  const [duration, setDuration] = useState(video.durSec || 0);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const model = musicVideoTheaterModel({
    comments,
    durationSec: duration,
    playbackPolicy,
    positionSec: timeSec,
    video,
  });

  useEffect(() => {
    const node = videoRef.current;
    setTimeSec(0);
    setPlaying(model.hasStream);
    if (!node || !video.playUrl) return;
    node.currentTime = 0;
    node.play().catch(() => setPlaying(false));
  }, [model.hasStream, video.id, video.playUrl]);

  const toggle = () => {
    const node = videoRef.current;
    if (!node) return;
    if (node.paused) void node.play();
    else node.pause();
  };
  const seek = (value: number) => {
    const node = videoRef.current;
    if (!node) return;
    node.currentTime = value;
    setTimeSec(value);
  };
  return (
    <FadeIn className="relative h-full overflow-hidden bg-[#08080b]">
      {model.hasStream ? (
        /* oxlint-disable-next-line jsx-a11y/media-has-caption -- Provider MV streams do not expose caption tracks yet. */
        <video
          ref={videoRef}
          src={video.playUrl}
          poster={video.image}
          className="absolute inset-0 z-[1] h-full w-full object-cover"
          playsInline
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onTimeUpdate={(e) => setTimeSec(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || video.durSec || 0)}
          onEnded={() => setPlaying(false)}
          style={{
            filter: commentsOpen ? "brightness(.62) saturate(.92)" : "brightness(.86) saturate(1)",
            transition: "filter .42s ease",
          }}
        />
      ) : (
        <Art
          seed={video.coverSeed}
          image={video.image}
          images={video.images}
          style={{ position: "absolute", inset: 0, height: "100%" }}
        >
          <div className="grid h-full place-items-center bg-black/35 text-[16px] font-light text-white/48">
            {t(model.fallbackTextKey)}
          </div>
        </Art>
      )}

      <Art
        seed={video.coverSeed}
        image={video.image}
        images={video.images}
        style={{
          position: "absolute",
          inset: "-4%",
          height: "108%",
          opacity: model.hasStream ? 0.28 : 1,
          filter: "blur(26px) saturate(1.18)",
          transform: "scale(1.08)",
          zIndex: 0,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-[2]"
        style={{
          background:
            "radial-gradient(72% 82% at 50% 42%, rgba(255,255,255,.02), transparent 36%, rgba(6,6,9,.30) 68%, rgba(6,6,9,.74) 100%), linear-gradient(180deg, rgba(6,6,9,.18) 0%, transparent 32%, rgba(6,6,9,.70) 100%), linear-gradient(90deg, rgba(6,6,9,.34), transparent 28%, transparent 58%, rgba(6,6,9,.50))",
        }}
      />

      <Button
        onClick={onClose}
        aria-label={t("a11y.closeMv")}
        className="absolute right-14 top-[18px] z-40 p-1 text-white/70"
      >
        <Icon.close size={22} />
      </Button>

      <div className="absolute left-12 top-16 z-30 flex flex-col items-start gap-[14px]">
        <span
          className="mlabel px-[12px] py-[7px] text-[10px]"
          style={{
            background: "rgba(6,6,9,.72)",
            color: accent,
            borderBottom: `1px solid ${accent}`,
            WebkitBackdropFilter: "blur(12px)",
            backdropFilter: "blur(12px)",
          }}
        >
          {t("musicVideos.mv")}
        </span>
        <Button
          onClick={() => setCommentsOpen((v) => !v)}
          className="mlabel cursor-pointer px-[12px] py-[7px] text-[10px]"
          style={{
            background: commentsOpen
              ? `color-mix(in srgb, ${accent} 18%, transparent)`
              : "rgba(6,6,9,.72)",
            color: commentsOpen ? accent : "rgba(255,255,255,.78)",
            borderBottom: commentsOpen ? `1px solid ${accent}` : "1px solid transparent",
            boxShadow: commentsOpen ? `0 8px 26px -18px ${accent}` : "none",
            WebkitBackdropFilter: "blur(12px)",
            backdropFilter: "blur(12px)",
          }}
        >
          {t("common.comments")}
        </Button>
      </div>

      <div
        className="absolute inset-x-0 bottom-0 z-30 h-[104px]"
        style={{
          background:
            "linear-gradient(180deg, rgba(18,18,22,.18), rgba(12,12,16,.58) 34%, rgba(10,10,13,.70))",
          WebkitBackdropFilter: "blur(30px) saturate(158%)",
          backdropFilter: "blur(30px) saturate(158%)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,.08)",
        }}
      >
        <div className="relative z-[1] flex h-full items-center gap-8 px-12">
          <div className="min-w-0 basis-[31%]">
            <div className="line-clamp-2 text-[27px] font-light leading-tight tracking-[0.02em]">
              {video.title}
            </div>
            <div className="mt-1 truncate text-[15px] font-light text-white/56">{video.artist}</div>
          </div>

          <div className="flex min-w-0 flex-1 items-center gap-4">
            <Button
              onClick={toggle}
              disabled={!model.hasStream}
              className="grid h-10 w-10 flex-none place-items-center rounded-full"
              aria-label={t("a11y.playMv")}
              style={{
                background: accent,
                color: "#06060a",
                boxShadow: `0 10px 30px -12px ${accent}`,
              }}
            >
              {playing ? <Icon.pause size={18} /> : <Icon.play size={18} />}
            </Button>
            <span className="mlabel w-[46px] flex-none text-right text-[10px] text-white/52 tabular-nums">
              {formatMediaTime(timeSec)}
            </span>
            <div className="relative h-8 min-w-[180px] flex-1">
              <div className="absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2 bg-white/14" />
              <div
                className="absolute left-0 top-1/2 h-[2px] -translate-y-1/2"
                style={{ width: `${model.progress * 100}%`, background: accent }}
              />
              <input
                aria-label={t("a11y.seekMv")}
                type="range"
                min={0}
                max={model.totalSec}
                step={0.1}
                value={Math.min(timeSec, model.totalSec)}
                onChange={(e) => seek(Number(e.currentTarget.value))}
                disabled={!model.hasStream}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </div>
            <span className="mlabel w-[46px] flex-none text-[10px] text-white/52 tabular-nums">
              {formatMediaTime(model.totalSec)}
            </span>
            <span className="mlabel flex-none text-[10px] text-white/36">{model.qualityLabel}</span>
            <Button
              onClick={() => setCommentsOpen((v) => !v)}
              className="grid h-10 w-10 flex-none place-items-center text-white/72"
              aria-label={t("a11y.toggleComments")}
            >
              <Icon.comment size={18} />
            </Button>
          </div>
        </div>
      </div>

      <div
        className="absolute right-0 top-0 z-20 h-full w-[56%] overflow-hidden"
        style={{
          transform: commentsOpen ? "translateX(0)" : "translateX(100%)",
          opacity: commentsOpen ? 1 : 0,
          pointerEvents: commentsOpen ? "auto" : "none",
          transition: `transform .42s ${EXPO_OUT_CSS}, opacity .26s ease`,
        }}
      >
        <div
          className="absolute inset-0 z-0"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(10,11,13,.18) 18%, rgba(10,11,13,.52) 48%, rgba(10,11,13,.66) 100%)",
            WebkitBackdropFilter: "blur(24px) saturate(120%)",
            backdropFilter: "blur(24px) saturate(120%)",
            WebkitMaskImage:
              "linear-gradient(90deg, transparent 0%, rgba(0,0,0,.2) 14%, rgba(0,0,0,.78) 36%, #000 56%)",
            maskImage:
              "linear-gradient(90deg, transparent 0%, rgba(0,0,0,.2) 14%, rgba(0,0,0,.78) 36%, #000 56%)",
          }}
        />
        <div
          className="scroll relative z-[1] ml-auto h-[calc(100%-104px)] w-[min(460px,76%)] px-8 pb-8 pt-[78px]"
          style={{
            WebkitMaskImage:
              "linear-gradient(180deg, transparent 0%, #000 9%, #000 88%, transparent 100%)",
            maskImage:
              "linear-gradient(180deg, transparent 0%, #000 9%, #000 88%, transparent 100%)",
          }}
        >
          <div className="mb-8 flex items-center justify-between">
            <div className="mlabel text-[10px]" style={{ color: accent }}>
              {t("common.comments")}
            </div>
            <Button onClick={() => setCommentsOpen(false)} aria-label={t("a11y.closeComments")}>
              <Icon.close size={18} />
            </Button>
          </div>
          {model.commentsPreview.length ? (
            model.commentsPreview.map((comment) => (
              <div key={comment.id} className="mb-7">
                <div className="text-[13px] text-white/74">{comment.name}</div>
                <div className="mt-2 line-clamp-4 text-[13px] font-light leading-6 text-white/48">
                  {comment.content}
                </div>
              </div>
            ))
          ) : (
            <div className="pt-16 text-center text-[15px] font-light text-white/42">
              {t("musicVideos.noComments")}
            </div>
          )}
        </div>
      </div>

      <div
        className="pointer-events-none absolute inset-0 z-[3] opacity-70"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,.035) 0%, transparent 7%, transparent 100%)",
        }}
      />
    </FadeIn>
  );
}
