import { AuthSession, type CredentialStore } from "@contexts/identity";
import type { ProviderId } from "@contexts/contracts";
import { warnWriteFailure } from "@shared/debug";

const keyOf = (providerId: ProviderId) => `planet.auth.${providerId}`;

/**
 * localStorage-backed credential store (single-user desktop app). Kept behind
 * the CredentialStore port so it can be swapped for a Wails on-disk store later
 * without touching providers or services.
 */
export class LocalCredentialStore implements CredentialStore {
  get(providerId: ProviderId): AuthSession | null {
    const key = keyOf(providerId);
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const session = AuthSession.parse(JSON.parse(raw));
      if (!session) localStorage.removeItem(key);
      return session;
    } catch {
      try {
        localStorage.removeItem(key);
      } catch {
        // Storage can be unavailable as well as corrupt.
      }
      return null;
    }
  }

  // Persisting is best-effort: storage throws when it is full or disabled, and a
  // sign-in that actually succeeded must not fail because the session could not
  // be written down. The session stays live for this run; it just won't survive
  // a restart.
  set(providerId: ProviderId, session: AuthSession): void {
    try {
      localStorage.setItem(keyOf(providerId), JSON.stringify(session));
    } catch (error) {
      warnWriteFailure(`credentials.set(${providerId})`, error);
    }
  }

  clear(providerId: ProviderId): void {
    try {
      localStorage.removeItem(keyOf(providerId));
    } catch (error) {
      warnWriteFailure(`credentials.clear(${providerId})`, error);
    }
  }
}
