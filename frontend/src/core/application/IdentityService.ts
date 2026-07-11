import type {
  AccountSnapshot,
  CredentialStore,
  IdentitySourcePort,
  LoginFlow,
  ProviderId,
} from "@domain";

/** Identity use cases for the active source. Provider selection, remote
 * authentication and on-device session storage remain behind minimal ports. */
export class IdentityService {
  constructor(
    private readonly sources: IdentitySourcePort,
    private readonly credentials: CredentialStore,
  ) {}

  get providerId(): ProviderId {
    return this.sources.active().providerId;
  }

  /** Whether the active source exposes an authentication gateway. */
  get supported(): boolean {
    return this.sources.active().identity !== null;
  }

  /** Whether a validated session is stored for the active source. */
  isLoggedIn(): boolean {
    return this.credentials.get(this.providerId) !== null;
  }

  private gateway() {
    const source = this.sources.active();
    if (!source.identity) {
      throw new Error(`Provider ${source.diagnosticName} does not support identity.`);
    }
    return source.identity;
  }

  beginLogin(): Promise<LoginFlow> {
    return this.gateway().beginLogin();
  }

  account(): Promise<AccountSnapshot | undefined> {
    return this.gateway().account();
  }

  async logout(): Promise<void> {
    const source = this.sources.active();
    try {
      await source.identity?.logout();
    } finally {
      // Local identity state is authoritative for subsequent app startup even
      // when the remote logout endpoint is unavailable.
      this.credentials.clear(source.providerId);
    }
  }
}
