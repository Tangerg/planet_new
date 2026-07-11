declare const providerIdBrand: unique symbol;

/** Stable machine identity for a music source. Unlike a provider display name,
 * this value is persisted in entity keys, credentials and cache namespaces. */
export type ProviderId = string & { readonly [providerIdBrand]: true };

const PROVIDER_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const ProviderId = {
  of(value: string): ProviderId {
    if (!PROVIDER_ID_PATTERN.test(value)) {
      throw new Error(`Invalid provider id "${value}"; use lowercase kebab-case.`);
    }
    return value as ProviderId;
  },
};
