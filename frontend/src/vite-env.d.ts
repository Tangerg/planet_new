/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "mock" | "spotify" | "netease" | "qqmusic"，未设置时默认 mock */
  readonly VITE_PROVIDER?: "mock" | "spotify" | "netease" | "qqmusic";
  readonly VITE_NETEASE_HOST?: string;
  readonly VITE_QQMUSIC_HOST?: string;
  readonly VITE_SPOTIFY_CLIENT_ID?: string;
  readonly VITE_SPOTIFY_CLIENT_SECRET?: string;
  /** ISO 3166-1 alpha-2，可选 */
  readonly VITE_SPOTIFY_MARKET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
