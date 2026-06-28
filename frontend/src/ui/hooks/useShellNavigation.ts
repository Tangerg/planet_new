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

import type { MediaService } from "@core";

import { useMorphTransition } from "@/infra/morph";
import {
  toVibeAlbum,
  toVibeArtist,
  toVibePlaylist,
  toVibeTracks,
  type ArtistTarget,
  type DetailTarget,
  type OpenTarget,
  type VibeCollection,
  type VibeTrack,
} from "@/model/adapt";

// One frame of navigation state — enough to rebuild any screen on "back".
// Screen rendering reads several independent state slices (detail / artistObj /
// library tab+view / search seed), so a back-stack entry must snapshot all of
// them, not just the `view` string.
type NavSnapshot = {
  view: string;
  detail: DetailTarget | null;
  artistObj: ArtistTarget;
  libraryTab: string;
  libraryView: string;
  searchQuery: string;
  playContext: VibeTrack[];
  // The morph origin tile active while on this screen — restored so a later
  // collapse-to-launcher flies from the right place after a deep back-walk.
  lastTile: unknown;
};

export function useShellNavigation(media: MediaService, queryClient: QueryClient) {
  /* ---- navigation / view state ---- */
  const [view, setView] = useState("xmb");
  const [detail, setDetail] = useState<DetailTarget | null>(null);
  const [artistObj, setArtistObj] = useState<ArtistTarget>({ id: "", name: "" });
  const [searchQuery, setSeedQuery] = useState("");
  const [libraryTab, setLibraryTab] = useState("playlists");
  const [libraryView, setLibraryView] = useState("grid");

  /* ---- back-stack: each forward hop remembers the screen it left, so "back"
     pops one level instead of always collapsing to the XMB launcher. The
     launcher boundary itself stays the morph engine's job (startReverse), so
     we never push "xmb" — an empty stack means "morph home". Held in a ref:
     it only drives the goBack branch, never rendering. ---- */
  const navStack = useRef<NavSnapshot[]>([]);
  const navSnapRef = useRef<NavSnapshot | null>(null);

  /* Current playable context (filled once a detail/artist loads); Shell's
     onPlay(track) plays within this list. */
  const playContext = useRef<VibeTrack[]>([]);

  // Remember the current screen before a forward hop. No-op at the launcher:
  // the XMB↔screen boundary is the morph engine's (startReverse), not the stack's.
  // Reads navSnapRef at call time (populated each render, after the morph hook).
  const pushCurrent = useCallback(() => {
    const snap = navSnapRef.current;
    if (!snap || snap.view === "xmb") return;
    navStack.current.push(snap);
  }, []);
  // Forward navigation to a bare view: push the current screen, then switch.
  const navigate = useCallback(
    (v: string) => {
      pushCurrent();
      setView(v);
    },
    [pushCurrent],
  );
  // Open Search from anywhere (XMB entry + the global "/" hotkey). pushCurrent is a
  // no-op at the launcher, so this is safe both from the XMB and from a screen.
  const openSearch = useCallback(() => {
    setSeedQuery("");
    navigate("search");
  }, [navigate]);

  /* ---- open detail: fetch the real collection async (switch screen + skeleton now, backfill tracks when data lands) ---- */
  const openDetail = useCallback(
    (input: OpenTarget) => {
      pushCurrent();
      // Detail screens assume tracks is always an array (they read p.tracks.length);
      // a summary (charts especially) may lack it, so default it.
      const obj: DetailTarget = { ...input, tracks: input.tracks ?? [] };
      setDetail(obj);
      playContext.current = obj.tracks;
      setView("detail");
      // Real playlist/collection summaries carry no tracks -> fetch detail to backfill.
      if (obj.id && obj._real !== false && obj.tracks.length === 0) {
        const kind = obj.kind;
        const fetcher =
          kind === "Album"
            ? () => media.albumDetail(obj.id).then(toVibeAlbum)
            : kind === "Chart"
              ? () => media.toplistDetail(obj.id).then(toVibePlaylist)
              : () => media.playlistDetail(obj.id).then(toVibePlaylist);
        queryClient
          .fetchQuery({ queryKey: ["detail", kind, media.providerName, obj.id], queryFn: fetcher })
          .then((full) => {
            // detail wins by default; keep the summary's identity fields when the
            // detail lacks them (charts especially).
            const merged: DetailTarget = {
              ...obj,
              ...full,
              name: full.name || obj.name,
              image: full.image || obj.image,
              coverSeed: obj.coverSeed ?? full.coverSeed,
              kind: obj.kind ?? full.kind,
              tracks: full.tracks?.length ? full.tracks : obj.tracks,
            };
            playContext.current = merged.tracks;
            setDetail(merged);
          })
          .catch(() => {});
      }
    },
    [media, queryClient, pushCurrent],
  );
  const albumDetail = useCallback(
    (al: VibeCollection) => openDetail({ ...al, kind: "Album" }),
    [openDetail],
  );
  const openChart = useCallback(
    (c: VibeCollection) => openDetail({ ...c, kind: "Chart", _real: true }),
    [openDetail],
  );
  const openArtist = useCallback(
    (ar: ArtistTarget) => {
      pushCurrent();
      setArtistObj(ar);
      playContext.current = ar.tracks ?? [];
      setView("artist");
      if (ar.id && (!ar.tracks || ar.tracks.length === 0)) {
        queryClient
          .fetchQuery({
            queryKey: ["artist", media.providerName, ar.id],
            queryFn: () => media.artistDetail(ar.id),
          })
          .then((full) => {
            const mapped: ArtistTarget = {
              ...toVibeArtist(full),
              tracks: toVibeTracks(full.topTracks),
            };
            playContext.current = mapped.tracks ?? [];
            setArtistObj(mapped);
          })
          .catch(() => {});
      }
    },
    [media, queryClient, pushCurrent],
  );
  const openLib = useCallback(
    (tab: string, vw?: string) => {
      pushCurrent();
      setLibraryTab(tab);
      setLibraryView(vw || "grid");
      setView("library");
    },
    [pushCurrent],
  );

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
  navSnapRef.current = {
    view,
    detail,
    artistObj,
    libraryTab,
    libraryView,
    searchQuery,
    playContext: playContext.current,
    lastTile: lastTile.current,
  };

  /* Back: pop one screen off the stack and restore its full data snapshot;
     when the stack is empty we're at a launcher-level screen, so hand off to
     the morph engine to collapse home. */
  const goBack = useCallback(() => {
    const prev = navStack.current.pop();
    if (!prev) {
      startReverse();
      return;
    }
    setView(prev.view);
    setDetail(prev.detail);
    setArtistObj(prev.artistObj);
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
    navStack.current = [];
    startReverse();
  }, [startReverse]);

  return {
    // view state + setters the screens read/write
    view,
    setView,
    detail,
    artistObj,
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
    openLib,
    // morph engine surface Shell renders (MorphStage / MorphProvider / XMB onOpen)
    viewRef,
    trans,
    startForward,
    morph,
  };
}
