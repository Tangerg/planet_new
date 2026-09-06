/** Failure projected at the application boundary. The original cause remains
 * available for diagnostics without leaking transport-specific result types. */
export class QueryFailedError extends Error {
  constructor(
    readonly source: string,
    readonly operation: string,
    options: { cause: unknown },
  ) {
    super(`${source}.${operation} query failed`, options);
    this.name = "QueryFailedError";
  }
}

/** Query-state algebra kept at the application boundary. Domain entities and
 * provider ports continue to use ordinary domain values. */
export type QueryResult<T> =
  | Readonly<{ status: "success"; data: T }>
  | Readonly<{ status: "partial"; data: T; errors: readonly QueryFailedError[] }>
  | Readonly<{ status: "unsupported" }>
  | Readonly<{ status: "notFound" }>
  | Readonly<{ status: "failed"; error: QueryFailedError }>;

export const QueryResult = {
  success: <T>(data: T): QueryResult<T> => ({ status: "success", data }),
  partial: <T>(data: T, errors: readonly QueryFailedError[]): QueryResult<T> => ({
    status: "partial",
    data,
    errors,
  }),
  unsupported: <T>(): QueryResult<T> => ({ status: "unsupported" }),
  notFound: <T>(): QueryResult<T> => ({ status: "notFound" }),
  failed: <T>(error: QueryFailedError): QueryResult<T> => ({ status: "failed", error }),
} as const;

/** Where a failed read happened, as the boundary reports it. */
export type QueryOrigin = Readonly<{ source: string; operation: string }>;

/**
 * Project one read against an optional port into the outcome algebra above: a
 * port the active source does not implement is `unsupported`, a thrown cause is
 * `failed`, a read that yields nothing is `notFound`, anything else `success`.
 *
 * Every application service reads exactly this way, so the classification lives
 * beside the algebra it produces. Restated per service — as it was, three times
 * over — one copy eventually classifies a failure differently from its
 * siblings, and the UI's handling of that case silently stops matching.
 */
export async function readPort<Port, T>(
  port: Port | null,
  origin: QueryOrigin,
  read: (port: Port) => Promise<T | undefined>,
): Promise<QueryResult<T>> {
  if (!port) return QueryResult.unsupported();
  try {
    const data = await read(port);
    return data === undefined ? QueryResult.notFound() : QueryResult.success(data);
  } catch (cause) {
    return QueryResult.failed(new QueryFailedError(origin.source, origin.operation, { cause }));
  }
}
