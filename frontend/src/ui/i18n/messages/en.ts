// English message pack — the source of truth for keys + the type shape every
// other pack is checked against (see i18n/index.ts CustomTypeOptions).
// Nested objects; react-i18next addresses them with dotted keys: t("browse.title").
export const en = {
  comments: {
    title: "Hot Comments",
    empty: "No comments yet.",
  },
  settings: {
    title: "Preferences",
    subtitle: "Personalize Sonance",
    accent: "Accent",
    playback: "Playback",
    interface: "Interface",
    language: "Language",
    audioQuality: "Audio quality",
    npOpens: "Now Playing opens",
    crossfade: "Crossfade tracks",
    crossfadeSub: "8 second blend",
    gapless: "Gapless playback",
    waves: "Flowing waves",
    wavesSub: "Animated XMB background",
    reduceMotion: "Reduce motion",
  },
};
