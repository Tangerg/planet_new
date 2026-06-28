import type { Image } from "./image";

/** The logged-in user of a provider (filled by an authenticated session). */
export type Account = {
  id: string;
  name: string;
  /** Avatar variants (largest-first), or empty when none. */
  avatar?: Image[];
  /** Whether the account has an active membership (e.g. NCM VIP). */
  vip?: boolean;
};
