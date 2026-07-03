type Method = (...args: never[]) => unknown;

/**
 * Structural guard: does `value` carry every named method? Used by the optional
 * provider ports (auth, user library) to narrow a MusicProvider to the richer
 * interface it advertises via `supports(...)`, so a capability claim is backed
 * by the actual methods before they're called.
 */
export function hasMethods<K extends string>(
  value: object,
  methods: readonly K[],
): value is Record<K, Method> {
  const candidate = value as Record<K, unknown>;
  return methods.every((method) => typeof candidate[method] === "function");
}
