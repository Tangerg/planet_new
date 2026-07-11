import type { AccountSnapshot } from "../model/account";
import type { LoginFlow } from "../model/auth";
import type { ProviderId } from "../model/provider-id";

/**
 * Login port — orthogonal to catalog playback, implemented only by sources
 * that can authenticate a user. The provider
 * owns its credential lifecycle (it persists the session to the injected
 * CredentialStore on success and attaches it to requests).
 */
export interface IdentityGateway {
  /** Start a login; the returned flow tells the UI how to drive it (QR / redirect). */
  beginLogin(): Promise<LoginFlow>;
  /** The currently authenticated account (requires a stored session). */
  account(): Promise<AccountSnapshot | undefined>;
  /** Drop the session (server + local). */
  logout(): Promise<void>;
}

export type ActiveIdentitySource = Readonly<{
  providerId: ProviderId;
  diagnosticName: string;
  identity: IdentityGateway | null;
}>;

export interface IdentitySourcePort {
  active(): ActiveIdentitySource;
}
