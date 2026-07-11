import { ProviderId } from "./provider-id";

declare const trackKeyBrand: unique symbol;
declare const albumKeyBrand: unique symbol;
declare const artistKeyBrand: unique symbol;

/** Serialized, source-qualified identities. The provider-local id remains
 * intact after decoding; URL encoding prevents separators inside upstream ids
 * from becoming ambiguous. Distinct brands prevent cross-entity mix-ups. */
export type TrackKey = string & { readonly [trackKeyBrand]: true };
export type AlbumKey = string & { readonly [albumKeyBrand]: true };
export type ArtistKey = string & { readonly [artistKeyBrand]: true };

export type EntityKeyParts = Readonly<{
  providerId: ProviderId;
  localId: string;
}>;

type KeyFactory<TKey extends string> = Readonly<{
  of(providerId: ProviderId, localId: string): TKey;
  parse(serialized: string): EntityKeyParts;
}>;

function serialize(providerId: ProviderId, localId: string): string {
  if (!localId || localId.trim() !== localId) {
    throw new Error("Entity local id must be non-empty and have no surrounding whitespace.");
  }
  return `${providerId}:${encodeURIComponent(localId)}`;
}

function parse(serialized: string): EntityKeyParts {
  const separator = serialized.indexOf(":");
  if (separator <= 0 || separator === serialized.length - 1) {
    throw new Error(`Invalid source-qualified entity key "${serialized}".`);
  }
  let providerId: ProviderId;
  try {
    providerId = ProviderId.of(serialized.slice(0, separator));
  } catch {
    throw new Error(`Invalid source-qualified entity key "${serialized}".`);
  }
  let localId: string;
  try {
    localId = decodeURIComponent(serialized.slice(separator + 1));
  } catch {
    throw new Error(`Invalid source-qualified entity key "${serialized}".`);
  }
  if (!localId || localId.trim() !== localId) {
    throw new Error(`Invalid source-qualified entity key "${serialized}".`);
  }
  return { providerId, localId };
}

function keyFactory<TKey extends string>(): KeyFactory<TKey> {
  return {
    of: (providerId, localId) => serialize(providerId, localId) as TKey,
    parse,
  };
}

export const TrackKey = keyFactory<TrackKey>();
export const AlbumKey = keyFactory<AlbumKey>();
export const ArtistKey = keyFactory<ArtistKey>();
