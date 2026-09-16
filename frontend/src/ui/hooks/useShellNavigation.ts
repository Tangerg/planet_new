import { useCallback, useEffect, useRef, useState } from "react";
import type { QueryClient } from "@tanstack/react-query";

import type { MediaService } from "@contexts/catalog";
import { warnReadFailure } from "@shared/debug";

import { useMorphTransition, type MorphLastTile } from "@/infra/morph";
import {
  type ArtistTarget,
  type CollectionViewMode,
  type DetailTarget,
  type LibrarySectionTab,
  type OpenTarget,
  type VibeCollection,
  type VibeMusicVideo,
  type VibeTrack,
} from "@/model/vibe";
import { normalizeDetailTarget } from "@/model/detail";
import { LAUNCHER_VIEW, type ShellScreenView } from "@/model/shell-screen";
import { createNavSnapshot, NavigationSession, type NavSnapshot } from "@/model/shell-navigation";
import {
  fetchArtistTarget,
  fetchDetailTarget,
  fetchMusicVideoTarget,
  mergeFetchedMusicVideo,
} from "@/hooks/shellNavigationLoaders";

export function useShellNavigation(media: MediaService, queryClient: QueryClient) {
  const [view, setView] = useState<ShellScreenView>(LAUNCHER_VIEW);
  const [detail, setDetail] = useState<DetailTarget | null>(null);
  const [artistObj, setArtistObj] = useState<ArtistTarget>({ id: "", name: "" });
  const [musicVideoObj, setMusicVideoObj] = useState<VibeMusicVideo | null>(null);
  const [musicVideoRelated, setMusicVideoRelated] = useState<VibeMusicVideo[]>([]);
  const [searchQuery, setSeedQuery] = useState("");
  const [libraryTab, setLibraryTab] = useState<LibrarySectionTab>("playlists");
  const [libraryView, setLibraryView] = useState<CollectionViewMode>("grid");

  const navSession = useRef(new NavigationSession<MorphLastTile>());
  const navSnapRef = useRef<NavSnapshot<MorphLastTile> | null>(null);

  const playContext = useRef<VibeTrack[]>([]);

  const navigate = useCallback((v: ShellScreenView) => {
    navSession.current.beginForward(navSnapRef.current);
    setView(v);
  }, []);
  const openSearch = useCallback(() => {
    setSeedQuery("");
    navigate("search");
  }, [navigate]);

  const openDetail = useCallback(
    (input: OpenTarget) => {
      const ticket = navSession.current.beginAsyncScreen(navSnapRef.current);
      const obj = normalizeDetailTarget(input);
      setDetail(obj);
      playContext.current = obj.tracks;
      setView("detail");
      fetchDetailTarget({ media, queryClient }, obj)
        .then((merged) => {
          if (!merged || !navSession.current.accepts(ticket)) return;
          playContext.current = merged.tracks;
          setDetail(merged);
        })
        .catch((error) => warnReadFailure(`navigation.detail.${obj.id}`, error));
    },
    [media, queryClient],
  );
  const albumDetail = useCallback(
    (al: VibeCollection) => openDetail({ ...al, kind: "album" }),
    [openDetail],
  );
  const openChart = useCallback(
    (c: VibeCollection) => openDetail({ ...c, kind: "chart", fetchDetail: true }),
    [openDetail],
  );
  const openArtist = useCallback(
    (ar: ArtistTarget) => {
      const ticket = navSession.current.beginAsyncScreen(navSnapRef.current);
      setArtistObj(ar);
      playContext.current = ar.tracks ?? [];
      setView("artist");
      fetchArtistTarget({ media, queryClient }, ar)
        .then((mapped) => {
          if (!mapped || !navSession.current.accepts(ticket)) return;
          playContext.current = mapped.tracks ?? [];
          setArtistObj(mapped);
        })
        .catch((error) => warnReadFailure(`navigation.artist.${ar.id}`, error));
    },
    [media, queryClient],
  );
  const fetchMusicVideo = useCallback(
    (mv: VibeMusicVideo) => {
      const ticket = navSession.current.beginAsyncBackfill();
      fetchMusicVideoTarget({ media, queryClient }, mv)
        .then((full) => {
          if (!navSession.current.accepts(ticket)) return;
          setMusicVideoObj((current) => mergeFetchedMusicVideo(current, mv.id, full));
        })
        .catch((error) => warnReadFailure(`navigation.musicVideo.${mv.id}`, error));
    },
    [media, queryClient],
  );
  const openMusicVideo = useCallback(
    (mv: VibeMusicVideo, related: VibeMusicVideo[] = []) => {
      navSession.current.beginForward(navSnapRef.current);
      setMusicVideoObj(mv);
      setMusicVideoRelated(related);
      setView("mv-detail");
      if (!mv.playUrl) fetchMusicVideo(mv);
    },
    [fetchMusicVideo],
  );
  const openMusicVideoTheater = useCallback(
    (mv?: VibeMusicVideo) => {
      const target = mv ?? musicVideoObj;
      if (!target) return;
      navSession.current.beginForward(navSnapRef.current);
      setMusicVideoObj(target);
      setView("mv-theater");
      if (!target.playUrl) fetchMusicVideo(target);
    },
    [fetchMusicVideo, musicVideoObj],
  );
  const openLib = useCallback((tab: LibrarySectionTab, vw?: CollectionViewMode) => {
    navSession.current.beginForward(navSnapRef.current);
    setLibraryTab(tab);
    setLibraryView(vw || "grid");
    setView("library");
  }, []);

  const viewRef = useRef<HTMLDivElement | null>(null);
  const { trans, startForward, startReverse, readLastTile, restoreLastTile, morph } =
    useMorphTransition(viewRef, view, setView, LAUNCHER_VIEW);

  useEffect(() => {
    navSnapRef.current = createNavSnapshot({
      view,
      detail,
      artistObj,
      musicVideoObj,
      musicVideoRelated,
      libraryTab,
      libraryView,
      searchQuery,
      playContext: playContext.current,
      lastTile: readLastTile(),
    });
  });

  const goBack = useCallback(() => {
    const prev = navSession.current.beginBack();
    if (!prev) {
      startReverse();
      return;
    }
    setView(prev.view);
    setDetail(prev.detail);
    setArtistObj(prev.artistObj);
    setMusicVideoObj(prev.musicVideoObj);
    setMusicVideoRelated(prev.musicVideoRelated);
    setLibraryTab(prev.libraryTab);
    setLibraryView(prev.libraryView);
    setSeedQuery(prev.searchQuery);
    playContext.current = prev.playContext;
    restoreLastTile(prev.lastTile);
  }, [startReverse, restoreLastTile]);

  const goHome = useCallback(() => {
    navSession.current.beginHome();
    startReverse();
  }, [startReverse]);

  return {
    view,
    setView,
    detail,
    artistObj,
    musicVideoObj,
    musicVideoRelated,
    libraryTab,
    libraryView,
    searchQuery,
    setLibraryTab,
    setLibraryView,
    setSeedQuery,
    playContext,
    navigate,
    goBack,
    goHome,
    openSearch,
    openDetail,
    albumDetail,
    openChart,
    openArtist,
    openMusicVideo,
    openMusicVideoTheater,
    openLib,
    viewRef,
    trans,
    startForward,
    morph,
  };
}
