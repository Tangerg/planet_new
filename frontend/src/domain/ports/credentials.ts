import type { AuthSession } from "../model/auth";

/**
 * On-device store for provider credentials, keyed by provider name. The
 * implementation is infrastructure (localStorage today, a Wails disk store
 * later) and is injected — inner layers depend only on this port.
 */
export interface CredentialStore {
  get(provider: string): AuthSession | null;
  set(provider: string, session: AuthSession): void;
  clear(provider: string): void;
}
