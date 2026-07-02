import type { Image } from "@domain/model/image";

/**
 * Cross-provider mapper standard. Every provider mapper transforms raw provider
 * JSON into domain models; these are the field-normalization rules they share so
 * the same concept is handled the same way everywhere:
 *
 *   - id:       `toIdString` — provider ids are number or string; the domain
 *               always holds a string (undefined → "").
 *   - images:   `singleImage` — wrap one resolved URL into the `Image[]` contract
 *               (empty when none). Multi-resolution/URL-scheme building stays
 *               provider-specific (NCM `?param=WxH`, QQ template hosts, Spotify's
 *               own image array) — only the empty/one-item shaping is shared.
 *   - duration: `secondsToMs` — providers reporting seconds normalize to the
 *               domain's millisecond `durationMs`.
 *   - names/arrays: default with `?? ""` / `?? []` at the call site (idiomatic).
 *   - artist credit: not shaped here — the domain owns it via `ArtistCredit`;
 *               mappers only extract raw `{ id, name }` artist entries.
 *
 * Spotify ids arrive as strings already, so it maps them directly rather than
 * routing every field through `toIdString`.
 */

/** Normalize a provider id (number or string) to a string; undefined → "". */
export function toIdString(id: string | number | undefined): string {
  return id === undefined ? "" : id.toString();
}

/** Wrap a single resolved image URL into the `Image[]` contract (empty when none). */
export function singleImage(url: string | undefined): Image[] {
  return url ? [{ url }] : [];
}

/** Seconds → milliseconds, for providers that report track length in seconds. */
export function secondsToMs(seconds: number | undefined): number {
  return (seconds ?? 0) * 1000;
}
