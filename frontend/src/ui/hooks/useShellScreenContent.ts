import type { ShellScreenView } from "@/model/shell-screen";
import type { VibeMusicVideo } from "@/model/vibe";
import { useArtistMusicVideos, useMusicVideoComments } from "@/hooks/useMusicVideoData";
import { useComments, useLyric } from "@/hooks/useTrackContentData";
import { shellContentQueryPlan, shellMusicVideoRail } from "@/model/shell-content";

type Deps = {
  view: ShellScreenView;
  currentTrackId?: string;
  musicVideoArtistId?: string;
  musicVideoId?: string;
  musicVideoRelated: VibeMusicVideo[];
};

export function useShellScreenContent({
  view,
  currentTrackId,
  musicVideoArtistId,
  musicVideoId,
  musicVideoRelated,
}: Deps) {
  const plan = shellContentQueryPlan(view);
  const lyrics = useLyric();
  const comments = useComments(currentTrackId, plan.loadTrackComments);

  const relatedMusicVideos = useArtistMusicVideos(musicVideoArtistId, plan.loadMusicVideoRail);
  const musicVideoComments = useMusicVideoComments(musicVideoId, plan.loadMusicVideoComments);

  return {
    lyrics,
    comments,
    musicVideoRail: shellMusicVideoRail(relatedMusicVideos, musicVideoRelated),
    musicVideoComments,
  };
}
