/**
 * The Shell's view-transition machine: navigation state + the shared-element
 * morph engine + a back-stack, as one cohesive unit — CLAUDE.md §1.3's
 * "navigation = single-page state machine + shared-element transition engine".
 *
 * It owns the `view` string and every nav-significant screen slice (detail /
 * artist / library tab+view / search seed), drives the morph engine
 * (useMorphTransition, ported verbatim and called here UNCHANGED), and
 * orchestrates data-on-open: openDetail/openArtist switch the screen with a
 * skeleton now and backfill tracks when the provider fetch lands. `goBack` pops
 * one level off the stack and restores its full snapshot; an empty stack hands
 * off to the morph engine to collapse home (the XMB↔screen boundary is the
 * morph's job, never the stack's — so "xmb" is never pushed).
 *
 * Shell composes the rest (likedDetail, onPlay, context menu, shortcuts, the XMB
 * tree) on top of what this returns. `playContext` (the open collection's
 * tracks) is exposed so Shell's onPlay can decide the queue.
 */
import { useCallback, useRef, useState } from "react";
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
import { createNavSnapshot, NavigationSession, type NavSnapshot } from "@/model/shell-navigation";
import {
  fetchArtistTarget,
  fetchDetailTarget,
  fetchMusicVideoTarget,
  mergeFetchedMusicVideo,
} from "@/hooks/shellNavigationLoaders";

export function useShellNavigation(media: MediaService, queryClient: QueryClient) {
  /* ---- navigation / view state ---- */
  const [view, setView] = useState("xmb");
  const [detail, setDetail] = useState<DetailTarget | null>(null);
  const [artistObj, setArtistObj] = useState<ArtistTarget>({ id: "", name: "" });
  const [musicVideoObj, setMusicVideoObj] = useState<VibeMusicVideo | null>(null);
  const [musicVideoRelated, setMusicVideoRelated] = useState<VibeMusicVideo[]>([]);
  const [searchQuery, setSeedQuery] = useState("");
  const [libraryTab, setLibraryTab] = useState<LibrarySectionTab>("playlists");
  const [libraryView, setLibraryView] = useState<CollectionViewMode>("grid");

  /* ---- back-stack: each forward hop remembers the screen it left, so "back"
     pops one level instead of always collapsing to the XMB launcher. The
     launcher boundary itself stays the morph engine's job (startReverse), so
     we never push "xmb" — an empty stack means "morph home". Held in a ref:
     it only drives the goBack branch, never rendering. ---- */
  const navSession = useRef(new NavigationSession<MorphLastTile>());
  const navSnapRef = useRef<NavSnapshot<MorphLastTile> | null>(null);

  /* Current playable context (filled once a detail/artist loads); Shell's
     onPlay(track) plays within this list. */
  const playContext = useRef<VibeTrack[]>([]);

  // Forward navigation to a bare view: push the current screen, then switch.
  const navigate = useCallback((v: string) => {
    navSession.current.beginForward(navSnapRef.current);
    setView(v);
  }, []);
  // Open Search from anywhere (XMB entry + the global "/" hotkey). pushCurrent is a
  // no-op at the launcher, so this is safe both from the XMB and from a screen.
  const openSearch = useCallback(() => {
    setSeedQuery("");
    navigate("search");
  }, [navigate]);

  /* ---- open detail: fetch the real collection async (switch screen + skeleton now, backfill tracks when data lands) ---- */
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

  /* ---- page-to-page transition engine (UI-layer infra: @/infra/morph) ---- */
  const viewRef = useRef<HTMLDivElement | null>(null);
  const { trans, startForward, startReverse, lastTile, morph } = useMorphTransition(
    viewRef,
    view,
    setView,
  );

  /* Mirror the live navigation state so a back-stack push captures the screen
     being left without stale closures. Written during render (pure mirror);
     placed after the morph hook so lastTile is in scope. A card morph mutates
     lastTile only inside the click handler that follows this render, so the
     value captured here is still the origin tile of the *current* screen. */
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
    lastTile: lastTile.current,
  });

  /* Back: pop one screen off the stack and restore its full data snapshot;
     when the stack is empty we're at a launcher-level screen, so hand off to
     the morph engine to collapse home. */
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
    lastTile.current = prev.lastTile;
  }, [startReverse, lastTile]);

  /* Jump straight to the XMB root from any nesting depth: clear the back-stack
     and collapse home via the launcher morph (startReverse falls back to a
     direct switch under reduced-motion / no origin tile). Bound to the "/"
     shortcut — a one-press escape hatch out of deep navigation. */
  const goHome = useCallback(() => {
    navSession.current.beginHome();
    startReverse();
  }, [startReverse]);

  return {
    // view state + setters the screens read/write
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
    // navigation intents
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
    // morph engine surface Shell renders (MorphStage / MorphProvider / XMB onOpen)
    viewRef,
    trans,
    startForward,
    morph,
  };
}
