import type { ProviderId } from "../model/provider-id";

export interface ProviderIdentity {
  /** Stable machine identity used for selection, persistence and cache isolation. */
  get providerId(): ProviderId;

  /** Human-readable diagnostic name; not an identity or persistence key. */
  get name(): string;
}
