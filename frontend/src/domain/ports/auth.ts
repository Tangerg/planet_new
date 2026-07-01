import type { Account } from "../model/account";
import type { LoginFlow } from "../model/auth";
import type { MusicProvider } from "./provider";
import { hasMethods } from "./capability";

/**
 * Login capability — orthogonal to MusicProvider, implemented only by providers
 * that can authenticate a user (gated by the "auth" capability). The provider
 * owns its credential lifecycle (it persists the session to the injected
 * CredentialStore on success and attaches it to requests).
 */
export interface AuthProvider {
  /** Start a login; the returned flow tells the UI how to drive it (QR / redirect). */
  beginLogin(): Promise<LoginFlow>;
  /** The currently authenticated account (requires a stored session). */
  account(): Promise<Account>;
  /** Drop the session (server + local). */
  logout(): Promise<void>;
}

export function isAuthProvider(provider: MusicProvider): provider is MusicProvider & AuthProvider {
  return provider.supports("auth") && hasMethods(provider, ["beginLogin", "account", "logout"]);
}
