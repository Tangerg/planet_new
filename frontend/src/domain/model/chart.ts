import type { ProviderId } from "./provider-id";

/**
 * Chart list item (only the fields needed to render). Chart detail goes through
 * provider.toplistDetail(id), which reuses the Playlist shape to return tracks.
 */
export type Chart = {
  providerId: ProviderId;
  id: string;
  title: string;
  image: string;
  /** Optional: chart type / period description. */
  period?: string;
};
