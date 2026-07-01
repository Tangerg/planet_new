/**
 * Upgrade an `http://` URL to `https://` (leaving other URLs untouched, and
 * mapping a missing URL to ""). The app runs in a secure-context webview where
 * http subresources are blocked as mixed content, while the media CDNs serve
 * both schemes — so every provider image/stream URL is normalized to https.
 */
export function httpsUrl(url: string | undefined): string {
  return (url ?? "").replace(/^http:\/\//, "https://");
}
