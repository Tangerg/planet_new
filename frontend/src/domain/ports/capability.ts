type Method = (...args: never[]) => unknown;

export function hasMethods<K extends string>(
  value: object,
  methods: readonly K[],
): value is Record<K, Method> {
  const candidate = value as Record<K, unknown>;
  return methods.every((method) => typeof candidate[method] === "function");
}
