import type { VibeMusicVideo } from "@/model/adapt";
import { useArtistMusicVideos, useMusicVideoComments } from "@/hooks/useMusicVideoData";
import { useComments, useLyric } from "@/hooks/useTrackContentData";

type Deps = {
  view: string;
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
  const lyrics = useLyric();
  const comments = useComments(currentTrackId, view === "comments" || view === "np");

  const musicVideoScreen = view === "mv-detail" || view === "mv-theater";
  const musicVideoTheater = view === "mv-theater";
  const relatedMusicVideos = useArtistMusicVideos(musicVideoArtistId, musicVideoScreen);
  const musicVideoComments = useMusicVideoComments(musicVideoId, musicVideoTheater);

  return {
    lyrics,
    comments,
    musicVideoRail: relatedMusicVideos.length ? relatedMusicVideos : musicVideoRelated,
    musicVideoComments,
  };
}
