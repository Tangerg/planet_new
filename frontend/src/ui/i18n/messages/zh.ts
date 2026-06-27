import type { MessageKey } from "./en";

// Simplified Chinese pack. Partial by design — any key not translated here falls
// back to English. Adding a new language = a sibling file of the same shape.
export const zh: Partial<Record<MessageKey, string>> = {
  "browse.title": "浏览",
  "browse.subtitle": "按语言、流派、场景、心情和主题筛选",
  "browse.empty": "暂无分类。",

  "comments.title": "热门评论",
  "comments.empty": "暂无评论。",

  "settings.title": "偏好设置",
  "settings.subtitle": "个性化 Sonance",
  "settings.accent": "强调色",
  "settings.playback": "播放",
  "settings.interface": "界面",
  "settings.language": "语言",
  "settings.audioQuality": "音质",
  "settings.npOpens": "播放页默认打开",
  "settings.crossfade": "淡入淡出",
  "settings.crossfadeSub": "8 秒过渡",
  "settings.gapless": "无缝播放",
  "settings.waves": "流动波纹",
  "settings.wavesSub": "动态 XMB 背景",
  "settings.showComments": "显示热门评论",
  "settings.reduceMotion": "减弱动效",
};
