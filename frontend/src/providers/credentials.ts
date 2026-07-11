import { AuthSession, type CredentialStore } from "@contexts/identity";
import type { ProviderId } from "@contexts/contracts";

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

  set(providerId: ProviderId, session: AuthSession): void {
    localStorage.setItem(keyOf(providerId), JSON.stringify(session));
  }

  clear(providerId: ProviderId): void {
    localStorage.removeItem(keyOf(providerId));
  }
}
