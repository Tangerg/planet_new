/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Active provider; defaults to "netease" when unset. */
  readonly VITE_PROVIDER?: "spotify" | "netease" | "qqmusic" | "local";
  readonly VITE_NETEASE_HOST?: string;
  readonly VITE_QQMUSIC_HOST?: string;
  readonly VITE_SPOTIFY_CLIENT_ID?: string;
  readonly VITE_SPOTIFY_CLIENT_SECRET?: string;
  /** ISO 3166-1 alpha-2 country code (optional). */
  readonly VITE_SPOTIFY_MARKET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
