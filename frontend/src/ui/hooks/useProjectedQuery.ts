import { useMemo } from "react";
import { useQuery, type QueryKey, type UseQueryResult } from "@tanstack/react-query";

type ProjectedQueryOptions<TQueryData, TView, TQueryKey extends QueryKey> = {
  queryKey: TQueryKey;
  queryFn: () => Promise<TQueryData>;
  enabled?: boolean;
  project: (data: TQueryData | undefined) => TView;
};

/**
 * Query boundary for UI view models: application services return domain data,
 * and this hook applies the one-way projection into Vibe shapes at the edge.
 */
export function useProjectedQuery<TQueryData, TView, TQueryKey extends QueryKey>({
  queryKey,
  queryFn,
  enabled = true,
  project,
}: ProjectedQueryOptions<TQueryData, TView, TQueryKey>): Omit<
  UseQueryResult<TQueryData>,
  "data"
> & {
  data: TView;
} {
  const query = useQuery<TQueryData>({ queryKey, queryFn, enabled });
  const data = useMemo(() => project(query.data), [project, query.data]);

  return { ...query, data };
}
