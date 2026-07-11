import type { AuthSession } from "../model/auth";
import type { ProviderId } from "../model/provider-id";

/**
 * On-device store for provider credentials, keyed by stable provider id. The
 * implementation is infrastructure (localStorage today, a Wails disk store
 * later) and is injected — inner layers depend only on this port.
 */
export interface CredentialStore {
  get(providerId: ProviderId): AuthSession | null;
  set(providerId: ProviderId, session: AuthSession): void;
  clear(providerId: ProviderId): void;
}
