// ============================================================
// Music Videos - MV hub, detail and theater playback.
// Kept inside the player visual language: ambient cover wash, thin labels,
// light glass controls, and no generic video-platform chrome.
// ============================================================
import React, { useEffect, useRef, useState } from "react";

import type { ArtistRef, VibeComment, VibeMusicVideo } from "@/model/adapt";
import { Art, artBg } from "@/components/primitives";
import { Button } from "@/components/controls/Button";
import { CardRail } from "@/components/layout/CardRail";
import { Empty } from "@/components/layout/Empty";
import { PageColumn } from "@/components/layout/PageColumn";
import { ScreenScaffold } from "@/components/layout/ScreenScaffold";
import { SectionHead } from "@/components/layout/SectionHead";
import { FadeIn } from "@/components/motion";
import { Icon } from "@/infra/icons";
import { compactCount } from "@shared/number";

type MusicVideosScreenProps = {
  videos: VibeMusicVideo[];
  isLoading: boolean;
  accent: string;
  onOpenVideo: (video: VibeMusicVideo, related?: VibeMusicVideo[]) => void;
};

type MusicVideoDetailScreenProps = {
  video: VibeMusicVideo;
  related: VibeMusicVideo[];
  accent: string;
  onPlay: (video: VibeMusicVideo) => void;
  onOpenVideo: (video: VibeMusicVideo, related?: VibeMusicVideo[]) => void;
  onOpenArtist: (artist: ArtistRef) => void;
};

type MusicVideoTheaterScreenProps = {
  video: VibeMusicVideo;
  comments: VibeComment[];
  accent: string;
  onClose: () => void;
};

function time(value: number): string {
  const v = Math.max(0, Math.floor(value));
  return `${Math.floor(v / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(v % 60)
    .toString()
    .padStart(2, "0")}`;
}

function VideoThumb({
  video,
  accent,
  onOpen,
}: {
  video: VibeMusicVideo;
  accent: string;
  onOpen: () => void;
}) {
  return (
    <Button
      onClick={onOpen}
      className="group block w-[224px] flex-none border-0 bg-transparent p-0 text-left text-white"
      aria-label={video.title}
    >
      <Art
        seed={video.coverSeed}
        image={video.image}
        images={video.images}
        px={448}
        className="aspect-video w-full"
        style={{
          boxShadow: "inset 0 1px 0 rgba(255,255,255,.1), 0 18px 38px -22px rgba(0,0,0,.85)",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-85" />
        <div
          className="absolute bottom-3 right-3 grid h-[38px] w-[38px] place-items-center opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          style={{
            borderRadius: "50%",
            background: accent,
            color: "#06060a",
            boxShadow: `0 12px 28px -10px ${accent}`,
          }}
        >
          <Icon.play size={15} />
        </div>
      </Art>
      <div className="mt-3 truncate text-[15px] font-light text-white/88">{video.title}</div>
      <div className="mlabel mt-1 truncate text-[10px] text-white/38">
        {video.artist || "Music Video"}
      </div>
    </Button>
  );
}

function VideoMeta({ video }: { video: VibeMusicVideo }) {
  const pieces = [
    video.quality ? `${video.quality}P` : "MV",
    video.duration,
    video.playCount ? `${compactCount(video.playCount)} plays` : "",
  ].filter(Boolean);
  return <span className="mlabel text-[10px] text-white/42">{pieces.join(" · ")}</span>;
}

export function MusicVideosScreen({
  videos,
  isLoading,
  accent,
  onOpenVideo,
}: MusicVideosScreenProps) {
  const featured = videos[0];
  const rest = videos.slice(1);
  const related = videos;

  return (
    <ScreenScaffold
      background="#08080b"
      backdrop={{
        image: featured?.image,
        seed: featured?.coverSeed ?? 14,
        scrim: "linear-gradient(180deg, rgba(8,8,11,.22) 0%, rgba(8,8,11,.62) 52%, #08080b 100%)",
      }}
    >
      <PageColumn className="pb-[58px] pt-[60px]">
        <div className="mb-[30px] flex items-end justify-between">
          <div>
            <div className="mlabel mb-2 text-[10px]" style={{ color: accent }}>
              Netease Cloud Music
            </div>
            <div className="text-[36px] font-extralight tracking-[0.01em]">Music Videos</div>
          </div>
          {featured && <VideoMeta video={featured} />}
        </div>

        {isLoading ? (
          <Empty className="mt-20 p-[90px] text-center text-[22px]">Loading music videos...</Empty>
        ) : !featured ? (
          <Empty className="mt-20 p-[90px] text-center text-[22px]">
            No music videos from this provider yet.
          </Empty>
        ) : (
          <>
            <Button
              onClick={() => onOpenVideo(featured, related)}
              className="grain group relative mb-10 block h-[320px] w-full overflow-hidden border-0 p-0 text-left text-white"
              style={{
                background: artBg(featured.coverSeed),
                boxShadow: "0 24px 60px -24px rgba(0,0,0,.78)",
              }}
            >
              {featured.image && (
                <>
                  <img
                    src={featured.image}
                    alt=""
                    aria-hidden
                    className="absolute inset-0 z-[1] h-full w-full scale-[1.18] object-cover opacity-58 blur-[34px] saturate-[1.14]"
                  />
                  <img
                    src={featured.image}
                    alt=""
                    aria-hidden
                    className="absolute inset-y-0 right-0 z-[2] h-full w-[58%] object-cover opacity-92"
                  />
                </>
              )}
              <div
                className="absolute inset-0 z-[3]"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(6,6,10,.9) 0%, rgba(6,6,10,.7) 43%, rgba(6,6,10,.18) 74%, rgba(6,6,10,.34) 100%)",
                }}
              />
              <div className="absolute inset-0 z-[4] flex max-w-[690px] flex-col justify-center px-14">
                <span className="tag self-start" style={{ background: accent, color: "#06060a" }}>
                  Featured MV
                </span>
                <div className="mb-[12px] mt-5 line-clamp-2 text-[46px] font-extralight leading-[1.04] tracking-[0.005em] [overflow-wrap:anywhere]">
                  {featured.title}
                </div>
                <div className="text-[17px] font-light text-white/56">{featured.artist}</div>
                {featured.description && (
                  <div className="mt-4 line-clamp-2 max-w-[520px] text-[14px] font-light leading-[1.55] text-white/52">
                    {featured.description}
                  </div>
                )}
                <div className="mt-[26px] flex items-center gap-[14px]">
                  <span className="pill-accent inline-flex items-center gap-2.5 px-[28px] py-[13px] text-[12px]">
                    <Icon.play size={15} /> Open
                  </span>
                  <VideoMeta video={featured} />
                </div>
              </div>
            </Button>

            {rest.length > 0 && (
              <section className="mb-10">
                <SectionHead title="Artist Videos" />
                <CardRail
                  count={rest.length}
                  itemWidth={224}
                  gap={18}
                  itemKey={(i) => rest[i].id}
                  renderItem={(i) => {
                    const mv = rest[i];
                    return (
                      <VideoThumb
                        video={mv}
                        accent={accent}
                        onOpen={() => onOpenVideo(mv, related)}
                      />
                    );
                  }}
                />
              </section>
            )}
          </>
        )}
      </PageColumn>
    </ScreenScaffold>
  );
}

export function MusicVideoDetailScreen({
  video,
  related,
  accent,
  onPlay,
  onOpenVideo,
  onOpenArtist,
}: MusicVideoDetailScreenProps) {
  const artist = video.artists?.[0];
  const rail = related.filter((mv) => mv.id !== video.id).slice(0, 12);

  return (
    <ScreenScaffold
      background="#0a0a0d"
      backdrop={{
        image: video.image,
        seed: video.coverSeed,
        scrim:
          "linear-gradient(180deg, rgba(10,10,13,.18) 0%, rgba(10,10,13,.58) 48%, #0a0a0d 88%)",
      }}
    >
      <PageColumn className="pb-12 pt-[88px]">
        <div
          className="grid items-end gap-[34px]"
          style={{ gridTemplateColumns: "minmax(460px, .98fr) minmax(360px, 1.02fr)" }}
        >
          <Button
            onClick={() => onPlay(video)}
            className="group relative block border-0 bg-transparent p-0 text-left"
            disabled={!video.playUrl}
            aria-label={`Play ${video.title}`}
          >
            <Art
              seed={video.coverSeed}
              image={video.image}
              images={video.images}
              px={980}
              className="aspect-video w-full"
              style={{
                boxShadow: "inset 0 1px 0 rgba(255,255,255,.11), 0 28px 74px -26px rgba(0,0,0,.9)",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/58 via-transparent to-black/10" />
              <div
                className="absolute bottom-6 right-6 grid h-[58px] w-[58px] place-items-center transition-transform duration-200 group-hover:scale-105"
                style={{
                  borderRadius: "50%",
                  background: video.playUrl ? accent : "rgba(255,255,255,.16)",
                  color: video.playUrl ? "#06060a" : "rgba(255,255,255,.62)",
                  boxShadow: video.playUrl ? `0 12px 34px -10px ${accent}` : "none",
                }}
              >
                <Icon.play size={22} />
              </div>
            </Art>
          </Button>

          <div className="min-w-0 pb-2">
            <div className="mlabel mb-4 inline-block bg-[rgba(6,6,9,.78)] px-4 py-2 text-[10px] text-white/74">
              Music Video
            </div>
            <div className="line-clamp-2 max-w-[700px] text-[52px] font-extralight leading-[1.04] tracking-[0.005em] [overflow-wrap:anywhere]">
              {video.title}
            </div>
            <Button
              onClick={() => artist && onOpenArtist(artist)}
              disabled={!artist?.id}
              className="mt-4 block border-0 bg-transparent p-0 text-left text-[19px] font-light text-white/55"
            >
              {video.artist || "Unknown Artist"}
            </Button>
            {video.description && (
              <p className="mt-6 line-clamp-2 max-w-[560px] text-[14px] font-light leading-[1.6] text-white/52">
                {video.description}
              </p>
            )}
            <div className="mlabel mt-[18px] text-[10px] text-white/42">
              <VideoMeta video={video} />
            </div>
            <div className="mt-[28px] flex items-center gap-[14px]">
              <Button
                onClick={() => onPlay(video)}
                disabled={!video.playUrl}
                className="pill-accent inline-flex items-center gap-2.5 px-[28px] py-[13px] text-[12px]"
                style={{
                  background: video.playUrl ? accent : "rgba(255,255,255,.12)",
                  color: video.playUrl ? "#06060a" : "rgba(255,255,255,.55)",
                }}
              >
                <Icon.play size={15} /> Play
              </Button>
              {video.commentCount ? (
                <span className="mlabel text-[10px] text-white/40">
                  {compactCount(video.commentCount)} comments
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {rail.length > 0 && (
          <section className="mt-[46px]">
            <SectionHead title="Artist Videos" />
            <CardRail
              count={rail.length}
              itemWidth={224}
              gap={18}
              itemKey={(i) => rail[i].id}
              renderItem={(i) => {
                const mv = rail[i];
                return (
                  <VideoThumb video={mv} accent={accent} onOpen={() => onOpenVideo(mv, related)} />
                );
              }}
            />
          </section>
        )}
      </PageColumn>
    </ScreenScaffold>
  );
}

export function MusicVideoTheaterScreen({
  video,
  comments,
  accent,
  onClose,
}: MusicVideoTheaterScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(Boolean(video.playUrl));
  const [timeSec, setTimeSec] = useState(0);
  const [duration, setDuration] = useState(video.durSec || 0);
  const [commentsOpen, setCommentsOpen] = useState(false);

  useEffect(() => {
    const node = videoRef.current;
    setTimeSec(0);
    setPlaying(Boolean(video.playUrl));
    if (!node || !video.playUrl) return;
    node.currentTime = 0;
    node.play().catch(() => setPlaying(false));
  }, [video.id, video.playUrl]);

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
  const total = duration || video.durSec || 1;
  const progress = Math.max(0, Math.min(1, timeSec / total));

  return (
    <FadeIn className="relative h-full overflow-hidden bg-[#08080b]">
      {video.playUrl ? (
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
            Video URL unavailable
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
          opacity: video.playUrl ? 0.28 : 1,
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
        aria-label="Close MV"
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
          MV
        </span>
        <Button
          onClick={() => setCommentsOpen((v) => !v)}
          className="mlabel cursor-pointer px-[12px] py-[7px] text-[10px]"
          style={{
            background: commentsOpen ? "rgba(18,255,131,.18)" : "rgba(6,6,9,.72)",
            color: commentsOpen ? accent : "rgba(255,255,255,.78)",
            borderBottom: commentsOpen ? `1px solid ${accent}` : "1px solid transparent",
            WebkitBackdropFilter: "blur(12px)",
            backdropFilter: "blur(12px)",
          }}
        >
          Comments
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
              className="grid h-10 w-10 flex-none place-items-center rounded-full"
              aria-label="Play MV"
              style={{
                background: accent,
                color: "#06060a",
                boxShadow: `0 10px 30px -12px ${accent}`,
              }}
            >
              {playing ? <Icon.pause size={18} /> : <Icon.play size={18} />}
            </Button>
            <span className="mlabel w-[46px] flex-none text-right text-[10px] text-white/52">
              {time(timeSec)}
            </span>
            <div className="relative h-8 min-w-[180px] flex-1">
              <div className="absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2 bg-white/14" />
              <div
                className="absolute left-0 top-1/2 h-[2px] -translate-y-1/2"
                style={{ width: `${progress * 100}%`, background: accent }}
              />
              <input
                aria-label="Seek MV"
                type="range"
                min={0}
                max={total}
                step={0.1}
                value={Math.min(timeSec, total)}
                onChange={(e) => seek(Number(e.currentTarget.value))}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </div>
            <span className="mlabel w-[46px] flex-none text-[10px] text-white/52">
              {time(total)}
            </span>
            <span className="mlabel flex-none text-[10px] text-white/36">
              {video.quality ? `${video.quality}P` : "MV"}
            </span>
            <Button
              onClick={() => setCommentsOpen((v) => !v)}
              className="grid h-10 w-10 flex-none place-items-center text-white/72"
              aria-label="Comments"
            >
              <Icon.comment size={18} />
            </Button>
          </div>
        </div>
      </div>

      <div
        className="absolute right-0 top-0 z-20 h-full w-[56%] overflow-hidden transition-opacity duration-500"
        style={{
          transform: commentsOpen ? "translateX(0)" : "translateX(100%)",
          opacity: commentsOpen ? 1 : 0,
          pointerEvents: commentsOpen ? "auto" : "none",
          transition: "transform .58s cubic-bezier(.16,1,.3,1), opacity .36s ease",
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
              Comments
            </div>
            <Button onClick={() => setCommentsOpen(false)} aria-label="Close comments">
              <Icon.close size={18} />
            </Button>
          </div>
          {comments.length ? (
            comments.slice(0, 14).map((comment) => (
              <div key={comment.id} className="mb-7">
                <div className="text-[13px] text-white/74">{comment.name}</div>
                <div className="mt-2 line-clamp-4 text-[13px] font-light leading-6 text-white/48">
                  {comment.content}
                </div>
              </div>
            ))
          ) : (
            <div className="pt-16 text-center text-[15px] font-light text-white/42">
              No comments yet.
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
