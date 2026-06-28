import type { AuthSession, CredentialStore } from "@domain";

const keyOf = (provider: string) => `planet.auth.${provider}`;

/**
 * localStorage-backed credential store (single-user desktop app). Kept behind
 * the CredentialStore port so it can be swapped for a Wails on-disk store later
 * without touching providers or services.
 */
export class LocalCredentialStore implements CredentialStore {
  get(provider: string): AuthSession | null {
    try {
      const raw = localStorage.getItem(keyOf(provider));
      return raw ? (JSON.parse(raw) as AuthSession) : null;
    } catch {
      return null;
    }
  }

  set(provider: string, session: AuthSession): void {
    localStorage.setItem(keyOf(provider), JSON.stringify(session));
  }

  clear(provider: string): void {
    localStorage.removeItem(keyOf(provider));
  }
}
