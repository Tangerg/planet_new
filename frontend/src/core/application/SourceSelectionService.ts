import type { ProviderId } from "@domain";

type SourceIdentity = Readonly<{ providerId: ProviderId }>;

/** Consumer-owned view of the runtime registry. It deliberately excludes
 * source capability implementations: selection needs identity, not adapters. */
export interface SourceSelectionPort {
  readonly active: SourceIdentity | null;
  readonly providers: readonly SourceIdentity[];
  setActive(providerId: ProviderId): boolean;
}

/** Application use cases for listing and selecting the browse source. */
export class SourceSelectionService {
  constructor(private readonly getSources: () => SourceSelectionPort) {}

  get activeId(): ProviderId | null {
    return this.getSources().active?.providerId ?? null;
  }

  get ids(): readonly ProviderId[] {
    return this.getSources().providers.map(({ providerId }) => providerId);
  }

  select(providerId: ProviderId): boolean {
    return this.getSources().setActive(providerId);
  }
}
