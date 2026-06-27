// English message pack — the source of truth for message keys. Other packs are
// Partial<> of this; missing keys fall back to English at lookup time.
// Keys are flat + dot-namespaced (`area.thing`) so `keyof typeof en` is the key type.
export const en = {
  // Browse
  "browse.title": "Browse",
  "browse.subtitle": "Filter by language, genre, scene, mood & theme",
  "browse.empty": "No categories yet.",

  // Comments
  "comments.title": "Hot Comments",
  "comments.empty": "No comments yet.",

  // Settings
  "settings.title": "Preferences",
  "settings.subtitle": "Personalize Sonance",
  "settings.accent": "Accent",
  "settings.playback": "Playback",
  "settings.interface": "Interface",
  "settings.language": "Language",
  "settings.audioQuality": "Audio quality",
  "settings.npOpens": "Now Playing opens",
  "settings.crossfade": "Crossfade tracks",
  "settings.crossfadeSub": "8 second blend",
  "settings.gapless": "Gapless playback",
  "settings.waves": "Flowing waves",
  "settings.wavesSub": "Animated XMB background",
  "settings.showComments": "Show hot comments",
  "settings.reduceMotion": "Reduce motion",
};

export type MessageKey = keyof typeof en;
