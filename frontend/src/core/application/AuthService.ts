import type { Account, AuthProvider, CredentialStore, LoginFlow, MusicProvider } from "@domain";

/**
 * Application service for user login — the UI's single handle to auth. It works
 * against whatever the active provider is: providers that declare the "auth"
 * capability also implement AuthProvider. Symmetric with PlaybackService /
 * MediaService; bound to the same active-provider getter so a provider switch
 * needs no rewiring. Never imports React or `@providers`.
 */
export class AuthService {
  constructor(
    private readonly getProvider: () => MusicProvider,
    private readonly credentials: CredentialStore,
  ) {}

  /** Whether the active provider can log a user in at all. */
  get supported(): boolean {
    return this.getProvider().supports("auth");
  }

  /** Whether a session is stored for the active provider. */
  isLoggedIn(): boolean {
    return this.credentials.get(this.getProvider().name) !== null;
  }

  private auth(): AuthProvider {
    const provider = this.getProvider();
    if (!provider.supports("auth")) {
      throw new Error(`Provider ${provider.name} does not support auth.`);
    }
    // Capability-gated: an "auth"-declaring provider also implements AuthProvider.
    return provider as unknown as AuthProvider;
  }

  beginLogin(): Promise<LoginFlow> {
    return this.auth().beginLogin();
  }

  account(): Promise<Account> {
    return this.auth().account();
  }

  async logout(): Promise<void> {
    if (this.getProvider().supports("auth")) await this.auth().logout();
  }
}
