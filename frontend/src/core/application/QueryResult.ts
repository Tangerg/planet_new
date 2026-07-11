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
