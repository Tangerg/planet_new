import { useMemo } from "react";
import { useQuery, type QueryKey, type UseQueryResult } from "@tanstack/react-query";
import type { QueryResult } from "@contexts/contracts";
import { queryDataOr } from "@/model/application-query";

type ProjectedQueryOptions<TQueryData, TView, TQueryKey extends QueryKey> = {
  queryKey: TQueryKey;
  queryFn: () => Promise<TQueryData>;
  enabled?: boolean;
  project: (data: TQueryData | undefined) => TView;
};

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

type ProjectedResultQueryOptions<TQueryData, TView, TQueryKey extends QueryKey> = Omit<
  ProjectedQueryOptions<TQueryData, TView, TQueryKey>,
  "queryFn"
> & {
  queryFn: () => Promise<QueryResult<TQueryData>>;
  fallback: TQueryData;
};

export function useProjectedResultQuery<TQueryData, TView, TQueryKey extends QueryKey>({
  queryFn,
  fallback,
  ...options
}: ProjectedResultQueryOptions<TQueryData, TView, TQueryKey>) {
  return useProjectedQuery({
    ...options,
    queryFn: async () => queryDataOr(await queryFn(), fallback),
  });
}
