// ============================================================
// Sonance Vibe — Shell
// Resident shell + shared-element transition engine, ported verbatim from the
// example Sonance Vibe.html App. The phase machine (trans / startForward /
// startReverse / morph layers) is unchanged; only MOCK playback became the real kernel.
// ============================================================
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { usePlanet } from "@/hooks/usePlanet";
import { useActiveProvider } from "@/hooks/useActiveProvider";

import { artBg, Equalizer, Icon } from "./primitives";
import { MOCK } from "./mockCatalog";
import { useCatalog, useLyric, useProviderSearch, useToplists, useVibePlayback } from "./hooks";
import {
  toVibeAlbum,
  toVibeArtist,
  toVibePlaylist,
  toVibeTracks,
  type VibeTrack,
} from "./adapt";

import { PlayerBar } from "./PlayerBar";
import { XMB } from "./XMB";
import { ForYouScreen } from "./ForYou";
import { NowPlaying } from "./NowPlaying";
import { ContextMenu } from "./Menu";
import { SearchScreen, ChartsScreen, LibraryScreen } from "./Browse";
import {
  PlaylistDetailScreen,
  QueueScreen,
  HistoryScreen,
  SettingsScreen,
} from "./Detail";
import { ArtistScreen, ProfileScreen, BrowseScreen, CommentsScreen } from "./Pages";

/* ---- keyboard spatial focus: pick the nearest focusable in a direction (by geometry) ---- */
function nearestInDirection(
  current: HTMLElement,
  dir: string,
  candidates: HTMLElement[],
): HTMLElement | null {
  const c = current.getBoundingClientRect();
  const cx = c.left + c.width / 2,
    cy = c.top + c.height / 2;
  let best: HTMLElement | null = null,
    bestScore = Infinity;
  for (const el of candidates) {
    if (el === current) continue;
    const r = el.getBoundingClientRect();
    const x = r.left + r.width / 2,
      y = r.top + r.height / 2;
    const dx = x - cx,
      dy = y - cy;
    let primary: number, secondary: number;
    if (dir === "right") {
      if (dx <= 4) continue;
      primary = dx;
      secondary = Math.abs(dy);
    } else if (dir === "left") {
      if (dx >= -4) continue;
      primary = -dx;
      secondary = Math.abs(dy);
    } else if (dir === "down") {
      if (dy <= 4) continue;
      primary = dy;
      secondary = Math.abs(dx);
    } else {
      if (dy >= -4) continue;
      primary = -dy;
      secondary = Math.abs(dx);
    }
    const score = primary + secondary * 2.2;
    if (score < bestScore) {
      bestScore = score;
      best = el;
    }
  }
  return best;
}

const ACCENTS = ["#0fff83", "#ff2188", "#19d3c5", "#ff5a3c", "#7a5cff"];

// Placeholder track before playback starts, so the bar and screens read defined fields, not undefined.
const PLACEHOLDER_TRACK: VibeTrack = {
  id: "",
  title: "Not playing",
  name: "Not playing",
  artist: "",
  coverSeed: 0,
  durSec: 0,
  duration: "0:00",
  tracks: [] as any,
};

export default function Shell() {
  const planet = usePlanet();
  const provider = useActiveProvider();
  const queryClient = useQueryClient();

  /* ---- theme tweaks (example TweaksPanel knobs; fixed here, accent editable in Settings) ---- */
  const [accent, setAccent] = useState("#0fff83");
  const [heroTreatment] = useState<"mono" | "color">("mono");
  const [glass] = useState(30);
  useEffect(() => {
    document.documentElement.style.setProperty("--accent", accent);
    document.documentElement.style.setProperty("--glass-blur", glass + "px");
  }, [accent, glass]);

  /* ---- navigation / view state (kept as-is) ---- */
  const [view, setView] = useState("xmb");
  const [xmbCategory, setXmbCategory] = useState(1);
  const [xmbRowByCategory, setXmbRowByCategory] = useState<Record<string, number>>({});
  const [detail, setDetail] = useState<any>(null);
  const [artistObj, setArtistObj] = useState<any>(MOCK.artists[0]);
  const [searchQuery, setSeedQuery] = useState("");
  const [libraryTab, setLibraryTab] = useState("playlists");
  const [libraryView, setLibraryView] = useState("grid");

  /* ---- real kernel playback state (replaces the example MOCK + local useState) ---- */
  const playback = useVibePlayback();
  const current = playback.current ?? PLACEHOLDER_TRACK;
  const playing = playback.playing;
  const shuffle = playback.shuffle;
  const queue = playback.upNext;
  const setPlaying = () => playback.togglePlay();
  const setShuffle = () => playback.toggleShuffle();
  const playNext = () => playback.next();
  const playPrev = () => playback.prev();

  /* Current playable context (filled once a detail/artist loads); onPlay(track) plays within this list. */
  const playContext = useRef<VibeTrack[]>([]);
  const onPlay = (track: VibeTrack | undefined) => {
    if (!track) return;
    const ctx = playContext.current;
    // Use the context list as the queue only when it actually contains this track; otherwise play the single track (e.g. a search result).
    const list = ctx?.length && ctx.some((t) => t.id === track.id) ? ctx : [track];
    playback.play(list, track);
  };

  /* ---- catalog / charts / search (real provider) ---- */
  const { catalog } = useCatalog();
  const toplists = useToplists();
  const search = useProviderSearch();
  const screenData = useMemo(
    () => ({
      ...catalog.data,
      playlists: catalog.playlists.length ? catalog.playlists : MOCK.playlists,
      albums: catalog.albums.length ? catalog.albums : MOCK.albums,
      artists: catalog.artists.length ? catalog.artists : MOCK.artists,
      allTracks: catalog.data.allTracks.length
        ? catalog.data.allTracks
        : MOCK.data.allTracks,
    }),
    [catalog],
  );

  /* ---- likes / settings / history (local state, as in the example) ---- */
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<VibeTrack[]>([]);
  const [settings, setSettings] = useState({
    quality: "SQ",
    npMode: "COVER",
    crossfade: true,
    gapless: false,
    waves: true,
    comments: true,
    reduceMotion: false,
  });
  const toggleLike = (id: string) =>
    setLiked((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const isLiked = !!(current?.id && liked.has(current.id));

  // Record play history (dropping consecutive duplicates).
  useEffect(() => {
    if (!current?.id) return;
    setHistory((h) => (h[h.length - 1]?.id === current.id ? h : [...h, current]));
  }, [current?.id]);

  // Real lyrics ([] when none; NowPlaying shows "No lyrics" on its own).
  const realLyrics = useLyric(playback.current?.id);
  const lyrics = realLyrics.length ? realLyrics : [];

  /* ---- open detail: fetch the real collection async (switch screen + skeleton now, backfill tracks when data lands) ---- */
  const openDetail = (obj: any) => {
    // Detail screens assume tracks is always an array (they read p.tracks.length); a summary (charts especially) may lack it, so default it.
    obj = { ...obj, tracks: obj?.tracks ?? [] };
    setDetail(obj);
    playContext.current = obj.tracks;
    setView("detail");
    // Real playlist/collection summaries carry no tracks -> fetch detail to backfill.
    if (obj?.id && obj?._real !== false && (!obj.tracks || obj.tracks.length === 0)) {
      const kind = obj.kind;
      const fetcher =
        kind === "Album"
          ? () => provider.albumDetail(obj.id).then(toVibeAlbum)
          : kind === "Chart"
            ? () => provider.toplistDetail(obj.id).then(toVibePlaylist)
            : () => provider.playlistDetail(obj.id).then(toVibePlaylist);
      queryClient
        .fetchQuery({ queryKey: ["detail", kind, provider.name, obj.id], queryFn: fetcher })
        .then((full: any) => {
          // full (detail) is the base; keep summary name/image/coverSeed/kind when detail lacks them (charts especially).
          const merged: any = { ...obj, ...full };
          if (!merged.name) merged.name = obj.name;
          if (!merged.image) merged.image = obj.image;
          merged.coverSeed = obj.coverSeed ?? merged.coverSeed;
          merged.kind = obj.kind ?? merged.kind;
          if (!merged.tracks?.length) merged.tracks = obj.tracks ?? [];
          playContext.current = merged.tracks ?? [];
          setDetail(merged);
        })
        .catch(() => {});
    }
  };
  const albumDetail = (al: any) => openDetail({ ...al, kind: "Album" });
  const openChart = (c: any) => openDetail({ ...c, kind: "Chart", _real: true });
  const openArtist = (ar: any) => {
    setArtistObj(ar);
    playContext.current = ar?.tracks ?? [];
    setView("artist");
    if (ar?.id && (!ar.tracks || ar.tracks.length === 0)) {
      queryClient
        .fetchQuery({
          queryKey: ["artist", provider.name, ar.id],
          queryFn: () => provider.artistDetail(ar.id),
        })
        .then((full) => {
          const mapped: any = toVibeArtist(full);
          mapped.tracks = toVibeTracks(full.topTracks);
          playContext.current = mapped.tracks;
          setArtistObj(mapped);
        })
        .catch(() => {});
    }
  };
  const openGenre = (name?: string) => {
    setSeedQuery(name || "");
    setView("search");
  };
  const openLib = (tab: string, vw?: string) => {
    setLibraryTab(tab);
    setLibraryView(vw || "grid");
    setView("library");
  };
  const likedDetail = () =>
    openDetail({
      name: "Liked Songs",
      kind: "Playlist",
      owner: "You",
      coverSeed: 0,
      gradient: ["#2a0420", "#ff4fa3"],
      _real: false,
      description: "Everything you've hearted, in one place.",
      tracks: screenData.allTracks.filter((t: any) => liked.has(t.id)),
    });

  /* ---- right-click context menu ---- */
  const [menu, setMenu] = useState<any>(null);
  const openMenu = (e: any, items: any[]) => {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ x: e.clientX, y: e.clientY, items });
  };
  const trackMenu = (track: any) =>
    [
      { label: "Play", icon: "play", accent: true, onClick: () => onPlay(track) },
      { sep: true },
      {
        label: liked.has(track.id) ? "Remove from Liked" : "Add to Liked",
        icon: "heart",
        onClick: () => toggleLike(track.id),
      },
      track.artistId && {
        label: "Go to artist",
        icon: "user",
        onClick: () => openArtist({ id: track.artistId, name: track.artist }),
      },
    ].filter(Boolean) as any[];
  const collMenu = (item: any) =>
    [
      { label: "Open", icon: "play", accent: true, onClick: () => openDetail(item) },
      item.artistId && {
        label: "Go to artist",
        icon: "user",
        onClick: () => openArtist({ id: item.artistId, name: item.artist }),
      },
    ].filter(Boolean) as any[];
  useEffect(() => {
    window.__TRACKMENU = (e, track) => openMenu(e, trackMenu(track));
    window.__COLLMENU = (e, item) => openMenu(e, collMenu(item));
    window.__ENQUEUE = () => {};
    return () => {
      window.__TRACKMENU = undefined;
      window.__COLLMENU = undefined;
      window.__ENQUEUE = undefined;
    };
  });

  /* ---- PS5-style dynamic ambient: page glow follows the focused card ---- */
  const setAmbient = (seed?: number, grad?: string[]) => {
    const el = document.getElementById("ambient");
    if (!el) return;
    el.style.background = artBg(seed, grad);
    el.style.opacity = ".5";
  };
  useEffect(() => {
    window.__AMBIENT = setAmbient;
    return () => {
      window.__AMBIENT = undefined;
    };
  });
  useEffect(() => {
    const el = document.getElementById("ambient");
    if (el) el.style.opacity = "0";
  }, [view]);

  /* ==========================================================================
     shared-element navigation: tile morphs onto destination hero, and back
     -- the entire block below is a verbatim port of the example transition engine --
     ========================================================================== */
  const viewRef = useRef<HTMLDivElement | null>(null);
  const [trans, setTrans] = useState<any>(null);
  const lastTile = useRef<any>(null);
  const timers = useRef<any[]>([]);
  const EASE = "cubic-bezier(.16,1,.3,1)";
  const reduceMo = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  const relRect = (r: any) => {
    const v = viewRef.current!.getBoundingClientRect();
    return {
      left: r.left - v.left,
      top: r.top - v.top,
      width: r.width,
      height: r.height,
      borderRadius: 0,
    };
  };
  const fullRect = () => {
    const v = viewRef.current!.getBoundingClientRect();
    return { left: 0, top: 0, width: v.width, height: v.height, borderRadius: 0 };
  };
  const heroRect = (sel: string) => {
    const root = viewRef.current;
    if (!root) return null;
    const el = root.querySelector(sel);
    if (!el) return null;
    const r: any = relRect(el.getBoundingClientRect());
    const br = getComputedStyle(el).borderTopLeftRadius;
    r.borderRadius = br && br !== "0px" ? br : 0;
    return r;
  };
  const startForward = (item: any, rect: any) => {
    if (!viewRef.current || reduceMo()) {
      item.run && item.run();
      return;
    }
    clearTimers();
    const o = relRect(rect);
    const origin = { ...o, borderRadius: 6 };
    const vw = viewRef.current.getBoundingClientRect();
    const px = o.left + o.width / 2,
      py = o.top + o.height / 2;
    const clipR = Math.hypot(
      Math.max(px, vw.width - px),
      Math.max(py, vw.height - py),
    );
    lastTile.current = { origin, seed: item.seed, grad: item.grad, image: item.image };
    item.run && item.run();
    setTrans({
      from: view,
      to: item.dest,
      origin,
      target: fullRect(),
      point: { x: px, y: py },
      clipR,
      seed: item.seed,
      grad: item.grad,
      image: item.image,
      dir: "fwd",
      phase: "start",
      hero: null,
      measured: false,
    });
    timers.current.push(
      setTimeout(() => setTrans((t: any) => t && { ...t, phase: "reveal" }), 620),
    );
    timers.current.push(setTimeout(() => setTrans(null), 1000));
  };
  const startReverse = () => {
    const lt = lastTile.current;
    const from = view;
    if (!viewRef.current || !lt || reduceMo()) {
      setView("xmb");
      return;
    }
    clearTimers();
    const src = heroRect(".t-base [data-hero]");
    const o = lt.origin;
    const vw = viewRef.current.getBoundingClientRect();
    const px = o.left + o.width / 2,
      py = o.top + o.height / 2;
    const clipR = Math.hypot(
      Math.max(px, vw.width - px),
      Math.max(py, vw.height - py),
    );
    setTrans({
      from,
      to: "xmb",
      origin: lt.origin,
      target: src || fullRect(),
      point: { x: px, y: py },
      clipR,
      seed: lt.seed,
      grad: lt.grad,
      image: lt.image,
      dir: "rev",
      phase: "start",
      hero: !!src,
    });
    setView("xmb");
    requestAnimationFrame(() =>
      requestAnimationFrame(() => setTrans((t: any) => t && { ...t, phase: "morph" })),
    );
    timers.current.push(setTimeout(() => setTrans(null), 760));
  };
  const goMorph = (rect: any, seed?: number, grad?: string[], run?: () => void, image?: string) =>
    startForward({ seed, grad, dest: "_", run, image }, rect);
  useEffect(() => {
    window.__MORPH = goMorph as any;
    return () => {
      window.__MORPH = undefined;
    };
  });
  const layerStyle = (t: any): React.CSSProperties => {
    const begin = t.phase === "start" || t.hero === false;
    return {
      position: "absolute",
      inset: 0,
      height: "100%",
      pointerEvents: "none",
      zIndex: 20,
      opacity: begin ? 1 : 0,
      transform: begin ? "scale(1)" : "scale(.985)",
      filter: begin ? "blur(0px)" : "blur(3px)",
      transformOrigin: "center",
      transition: begin
        ? "none"
        : `opacity .32s ease, transform .46s ${EASE}, filter .46s ${EASE}`,
    };
  };

  React.useLayoutEffect(() => {
    if (!trans || trans.dir !== "fwd" || trans.measured) return;
    const hero = heroRect(".t-base [data-hero]");
    setTrans((t: any) => t && { ...t, target: hero || t.target, hero: !!hero, measured: true });
  }, [trans]);
  React.useEffect(() => {
    if (!trans || trans.dir !== "fwd" || !trans.measured || trans.phase !== "start")
      return;
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        setTrans((t: any) => (t && t.phase === "start" ? { ...t, phase: "morph" } : t)),
      ),
    );
    return () => cancelAnimationFrame(id);
  }, [trans]);

  const openNP = () => setView("np");

  /* ---- Esc returns to launcher ---- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && view !== "xmb") startReverse();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view]);

  /* ---- arrow-key spatial navigation inside non-XMB screens ---- */
  useEffect(() => {
    if (view === "xmb") return;
    const root = viewRef.current;
    if (!root) return;
    const list = () =>
      ([...root.querySelectorAll(
        'button:not([disabled]), input, [tabindex]:not([tabindex="-1"]), a[href]',
      )] as HTMLElement[]).filter((el) => el.offsetWidth > 0 && el.offsetHeight > 0);
    const t = setTimeout(() => {
      const f = list();
      if (f.length && !root.contains(document.activeElement)) f[0].focus();
    }, 90);
    const onKey = (e: KeyboardEvent) => {
      const ae = document.activeElement as HTMLElement | null;
      const inInput = ae && (ae.tagName === "INPUT" || ae.tagName === "TEXTAREA");
      const arrows: Record<string, string> = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
      };
      if (arrows[e.key]) {
        if (inInput && (e.key === "ArrowLeft" || e.key === "ArrowRight")) return;
        const items = list();
        if (!items.length) return;
        const cur = ae && root.contains(ae) ? ae : items[0];
        const next = nearestInDirection(cur, arrows[e.key], items);
        if (next) {
          e.preventDefault();
          next.focus();
        }
      } else if (e.key === "Backspace" && !inInput) {
        e.preventDefault();
        startReverse();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [view]);

  const npView = view === "np";
  const homeView = view === "xmb";

  /* ==========================================================================
     XMB model -- built from the real catalog + static categories (mirrors the example domain partitions)
     ========================================================================== */
  const cats = useMemo(() => {
    const pls = screenData.playlists;
    const als = screenData.albums;
    const ars = screenData.artists;
    return [
      // 1 · CONSUMPTION
      {
        id: "np",
        icon: "play",
        label: "Now Playing",
        items: [
          { key: "cover", label: current?.title || "Now Playing", sub: current?.artist, icon: "play", seed: current?.coverSeed || 0, grad: current?.gradient, image: current?.image, dest: "np", run: openNP },
          { key: "lyrics", label: "Lyrics", sub: "Synced lyrics", seed: (current?.coverSeed || 0) + 1, grad: current?.gradient, dest: "np", run: openNP },
          { key: "queue", label: "Up Next", sub: queue.length + " tracks queued", icon: "list", seed: 5, dest: "queue", run: () => setView("queue") },
          { key: "comments", label: "Hot Comments", sub: "On " + (current?.title || ""), icon: "comment", seed: 8, dest: "comments", run: () => setView("comments") },
          { key: "history", label: "History", sub: "Recently played", icon: "clock", seed: 12, grad: ["#161320", "#8a7bff"], dest: "history", run: () => setView("history") },
        ],
      },
      // 2 · ORGANIZATION — playlists
      {
        id: "foryou",
        icon: "star",
        label: "For You",
        items: [
          { key: "overview", label: "Overview", sub: "Your daily landing", icon: "note", seed: 7, grad: ["#1b1033", "#ff2188"], dest: "home", run: () => setView("home") },
          ...pls.slice(0, 6).map((p: any) => ({ key: p.id, label: p.name, sub: "Made for you", seed: p.coverSeed, grad: p.gradient, image: p.image, dest: "detail", run: () => openDetail(p) })),
        ],
      },
      // 3 · ORGANIZATION — charts (real charts)
      {
        id: "charts",
        icon: "bars",
        label: "Charts",
        items: [
          ...(toplists.length ? toplists : MOCK.charts).slice(0, 4).map((c: any) => ({ key: c.id, label: c.title, sub: c.updatedAt ? "Updated " + c.updatedAt : "Top chart", icon: "bars", seed: c.coverSeed ?? c.seed, grad: c.gradient, image: c.image, dest: "detail", run: () => (c.coverSeed != null ? openChart(c) : setView("charts")) })),
          { key: "all", label: "All charts", sub: "Browse grid", icon: "grid", seed: 10, grad: ["#240b04", "#ff8a3c"], dest: "charts", run: () => setView("charts") },
        ],
      },
      // 4 · ORGANIZATION — radio (static)
      {
        id: "radio",
        icon: "radio",
        label: "Radio",
        items: MOCK.radios.map((r: any) => ({ key: r.id, label: r.title, sub: r.sub, icon: r.type === "podcast" ? "volume" : "radio", seed: r.seed, grad: r.gradient, dest: "browse", run: () => setView("browse") })),
      },
      // 5 · USER — library
      {
        id: "library",
        icon: "stack",
        label: "Library",
        items: [
          { key: "liked", label: "Liked Songs", sub: liked.size + " tracks", icon: "heart", seed: 0, grad: ["#2a0420", "#ff4fa3"], dest: "detail", run: likedDetail },
          { key: "playlists", label: "Your Playlists", sub: pls.length + " playlists", icon: "list", seed: 1, grad: ["#1a0d3a", "#7755ff"], dest: "library", run: () => openLib("playlists") },
          { key: "albums", label: "Saved Albums", sub: als.length + " albums", icon: "stack", seed: 2, grad: ["#3a0d10", "#f3727f"], dest: "library", run: () => openLib("albums") },
          { key: "following", label: "Following", sub: ars.length + " artists", icon: "user", seed: 4, grad: ["#06222b", "#19d3c5"], dest: "library", run: () => openLib("artists") },
          { key: "flow", label: "Cover Flow", sub: "Flip through your albums", icon: "flow", seed: 6, grad: ["#06222b", "#19d3c5"], dest: "library", run: () => openLib("albums", "flow") },
        ],
      },
      // 6 · CLASSIFICATION — browse facets (static)
      {
        id: "browse",
        icon: "compass",
        label: "Browse",
        items: [
          { key: "lang", label: "Languages", sub: "Mandarin · Western · J-Pop · K-Pop", icon: "grid", seed: 5, grad: ["#13031f", "#b15cff"], dest: "browse", run: () => setView("browse") },
          { key: "genre", label: "Genres", sub: "Pop · Rock · Electronic · Jazz", seed: 2, grad: ["#0b1b3a", "#5b8cff"], dest: "browse", run: () => setView("browse") },
          { key: "scene", label: "Scenes", sub: "Commute · Workout · Study · Sleep", seed: 6, grad: ["#240b04", "#ff8a3c"], dest: "browse", run: () => setView("browse") },
          { key: "mood", label: "Moods", sub: "Calm · Happy · Melancholy · Hype", seed: 8, grad: ["#0a3a2a", "#1ed760"], dest: "browse", run: () => setView("browse") },
        ],
      },
      // 7 · RETRIEVAL — search
      {
        id: "search",
        icon: "search",
        label: "Search",
        items: [
          { key: "open", label: "Search music", sub: "Tracks, artists, albums", icon: "search", seed: 6, grad: ["#021e24", "#36c5e0"], dest: "search", run: () => { setSeedQuery(""); setView("search"); } },
        ],
      },
      // 8 · USER — account
      {
        id: "you",
        icon: "user",
        label: "You",
        items: [
          { key: "profile", label: "Profile", sub: "You", icon: "user", seed: 3, grad: ["#1b1033", "#ff2188"], dest: "profile", run: () => setView("profile") },
          { key: "stats", label: "Listening", sub: "Your top artists & minutes", icon: "bars", seed: 9, grad: ["#2a0420", "#ff4fa3"], dest: "profile", run: () => setView("profile") },
        ],
      },
      // 9 · SYSTEM — settings
      {
        id: "settings",
        icon: "gear",
        label: "Settings",
        items: [
          { key: "prefs", label: "Preferences", sub: "Audio, theme, interface", icon: "gear", seed: 9, grad: ["#13031f", "#b15cff"], dest: "settings", run: () => setView("settings") },
          { key: "about", label: "About Sonance", sub: "Version 2.0", seed: 2, dest: "settings", run: () => setView("settings") },
        ],
      },
    ];
  }, [current, queue, liked, screenData, toplists]);

  /* ==========================================================================
     render screen
     ========================================================================== */
  const renderScreen = (v: string) => {
    if (v === "xmb")
      return (
        <XMB cats={cats} accent={accent} playing={playing} showWaves={settings.waves}
          onOpen={startForward} cState={xmbCategory} setCState={setXmbCategory} rowsState={xmbRowByCategory} setRowsState={setXmbRowByCategory} />
      );
    if (v === "home")
      return (
        <ForYouScreen data={screenData} onPlay={onPlay} accent={accent}
          openPlaylist={openDetail} openAlbum={albumDetail} openArtist={openArtist} onNav={setView} />
      );
    if (v === "search")
      return (
        <SearchScreen data={screenData} onPlay={onPlay} current={current} playing={playing}
          accent={accent} initialQuery={searchQuery} liked={liked} toggleLike={toggleLike}
          openArtist={openArtist} openAlbum={albumDetail} openPlaylist={openDetail} search={search} />
      );
    if (v === "charts")
      return <ChartsScreen data={{ charts: toplists }} onOpenChart={openChart} />;
    if (v === "library" || v === "made")
      return (
        <LibraryScreen key={libraryTab + libraryView} initialTab={libraryTab} initialView={libraryView}
          data={screenData} onPlay={onPlay} current={current} playing={playing} accent={accent}
          openPlaylist={openDetail} openAlbum={albumDetail} openArtist={openArtist}
          liked={liked} toggleLike={toggleLike} />
      );
    if (v === "detail" && detail)
      return (
        <PlaylistDetailScreen playlist={detail} onPlay={onPlay} current={current}
          playing={playing} liked={liked} toggleLike={toggleLike} accent={accent} />
      );
    if (v === "queue")
      return (
        <QueueScreen current={current} queue={queue} onPlay={onPlay} playing={playing}
          liked={liked} toggleLike={toggleLike} accent={accent} />
      );
    if (v === "history")
      return (
        <HistoryScreen history={history} all={screenData.allTracks} onPlay={onPlay} current={current}
          playing={playing} liked={liked} toggleLike={toggleLike} accent={accent} />
      );
    if (v === "settings")
      return (
        <SettingsScreen accent={accent} setAccent={setAccent} accentOptions={ACCENTS}
          settings={settings} setSettings={setSettings} />
      );
    if (v === "artist")
      return (
        <ArtistScreen artist={artistObj}
          tracks={artistObj?.tracks ?? []}
          albums={[]}
          similar={screenData.artists.filter((a: any) => a.id !== artistObj?.id)}
          onPlay={onPlay} current={current} playing={playing} liked={liked} toggleLike={toggleLike}
          accent={accent} mono={heroTreatment === "mono"}
          onOpenAlbum={albumDetail} onOpenArtist={openArtist} />
      );
    if (v === "profile")
      return (
        <ProfileScreen accent={accent} playlists={screenData.playlists} onOpenPlaylist={openDetail}
          onPlay={onPlay} mono={heroTreatment === "mono"} />
      );
    if (v === "browse") return <BrowseScreen accent={accent} onOpenGenre={openGenre} />;
    if (v === "comments")
      return (
        <CommentsScreen track={current} accent={accent} liked={isLiked}
          toggleLike={() => current && toggleLike(current.id)} mono={heroTreatment === "mono"} />
      );
    if (v === "np")
      return (
        <NowPlaying track={current} accent={accent} liked={isLiked}
          toggleLike={() => current && toggleLike(current.id)} lyrics={lyrics}
          mono={heroTreatment === "mono"} queue={queue} onPlay={onPlay} current={current}
          onNext={playNext} onPrev={playPrev}
          initialMode={settings.npMode === "LYRICS" ? "lyrics" : "cover"}
          onClose={startReverse} />
      );
    return null;
  };

  // No native frame: the faux traffic lights take over real window controls; a draggable strip at the top moves the window.
  const wails = () => (window as any).runtime;
  const dragStyle = { "--wails-draggable": "drag" } as React.CSSProperties;
  const noDragStyle = { "--wails-draggable": "no-drag" } as React.CSSProperties;

  return (
    <div className="win-stage">
      <div className="win">
        {/* top drag strip (spans the top; traffic-light and tool buttons above it stay clickable) */}
        <div aria-hidden style={{ position: "absolute", top: 0, left: 0, right: 0, height: 30, zIndex: 55, ...dragStyle }} />

        <div className="traffic" style={noDragStyle}>
          <i className="r" style={{ cursor: "pointer" }} onClick={() => wails()?.Quit?.()} title="Close" />
          <i className="y" style={{ cursor: "pointer" }} onClick={() => wails()?.WindowMinimise?.()} title="Minimise" />
          <i className="g" style={{ cursor: "pointer" }} onClick={() => wails()?.WindowToggleMaximise?.()} title="Maximise" />
        </div>

        {!npView && (
          <div className="win-tools" style={noDragStyle}>
            {!homeView && (
              <button onClick={startReverse} aria-label="Menu">
                <Icon.back size={20} />
              </button>
            )}
            <button onClick={() => setView("np")} aria-label="Now playing">
              <Equalizer playing={playing} color="currentColor" size={18} />
            </button>
            <button aria-label="More">
              <Icon.kebab size={20} />
            </button>
          </div>
        )}

        <div className="view" ref={viewRef}>
          <div
            id="ambient"
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 7,
              pointerEvents: "none",
              opacity: 0,
              mixBlendMode: "screen",
              filter: "blur(90px) saturate(1.35)",
              transform: "scale(1.25)",
              transition: "opacity .55s ease, background .55s ease",
            }}
          ></div>
          {(() => {
            const fwd = trans && trans.dir === "fwd" && trans.point;
            const clipping = fwd && trans.hero !== true;
            const st: React.CSSProperties = { height: "100%" };
            if (clipping) {
              const started = trans.phase !== "start";
              const cp = `circle(${started ? trans.clipR : 0}px at ${trans.point.x}px ${trans.point.y}px)`;
              (st as any).clipPath = cp;
              (st as any).WebkitClipPath = cp;
              st.transition = started ? `clip-path .6s ${EASE}` : "none";
              st.position = "relative";
              st.zIndex = 25;
            }
            return (
              <div className="t-base" key={view} style={st}>
                {renderScreen(view)}
              </div>
            );
          })()}
          {trans && (
            <React.Fragment>
              {(() => {
                const fromStyle = layerStyle(trans);
                if (trans.dir === "rev" && trans.hero === false && trans.point) {
                  const collapsed = trans.phase !== "start";
                  const cp = `circle(${collapsed ? 0 : trans.clipR}px at ${trans.point.x}px ${trans.point.y}px)`;
                  (fromStyle as any).clipPath = cp;
                  (fromStyle as any).WebkitClipPath = cp;
                  fromStyle.opacity = 1;
                  fromStyle.transition = collapsed ? `clip-path .55s ${EASE}` : "none";
                }
                return (
                  <div className="t-layer t-from" style={fromStyle}>
                    {renderScreen(trans.from)}
                  </div>
                );
              })()}
              {trans.hero !== false &&
                (() => {
                  const t = trans;
                  const geom =
                    t.dir === "fwd"
                      ? t.phase === "start"
                        ? t.origin
                        : t.target
                      : t.phase === "start"
                        ? t.target
                        : t.origin;
                  const op =
                    t.dir === "fwd"
                      ? t.phase === "reveal"
                        ? 0
                        : 1
                      : t.phase === "start"
                        ? 1
                        : 0;
                  const anim = t.phase !== "start";
                  return (
                    <div
                      className="grain"
                      aria-hidden
                      style={{
                        position: "absolute",
                        zIndex: 40,
                        pointerEvents: "none",
                        overflow: "hidden",
                        left: geom.left,
                        top: geom.top,
                        width: geom.width,
                        height: geom.height,
                        borderRadius: geom.borderRadius,
                        opacity: op,
                        background: artBg(t.seed, t.grad),
                        boxShadow: "0 30px 70px -26px rgba(0,0,0,.5)",
                        transition: anim
                          ? `left .58s ${EASE}, top .58s ${EASE}, width .58s ${EASE}, height .58s ${EASE}, border-radius .58s ${EASE}, opacity .34s ease`
                          : "none",
                      }}
                    >
                      {t.image && (
                        <img
                          src={t.image}
                          alt=""
                          draggable={false}
                          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      )}
                    </div>
                  );
                })()}
            </React.Fragment>
          )}
        </div>

        {!npView && (
          <PlayerBar track={current} playing={playing} setPlaying={setPlaying}
            liked={isLiked} toggleLike={() => current && toggleLike(current.id)}
            accent={accent} shuffle={shuffle} setShuffle={setShuffle}
            onNext={playNext} onPrev={playPrev}
            onOpenNowPlaying={() => setView("np")}
            onOpenQueue={() => setView("queue")}
            onOpenComments={() => setView("comments")}
            onOpenLyrics={() => setView("np")} />
        )}
      </div>

      {menu && (
        <ContextMenu x={menu.x} y={menu.y} items={menu.items} accent={accent} onClose={() => setMenu(null)} />
      )}
    </div>
  );
}
