import { useEffect, useMemo, useState } from "react";

import {
  EMPTY_SEARCH_RESULTS,
  searchRequestPlan,
  searchScreenModel,
  type SearchProvider,
  type SearchScreenModel,
} from "@/model/search";
import type { SearchResults } from "@/model/vibe";
import { warnReadFailure } from "@shared/debug";

type Options = {
  debounceMs?: number;
  query: string;
  search?: SearchProvider;
};

/**
 * Search behavior sits here so the screen stays declarative: controlled query
 * in, debounced provider results out, with stale async completions ignored.
 */
export function useSearchScreenModel({
  debounceMs = 320,
  query,
  search,
}: Options): SearchScreenModel {
  const [results, setResults] = useState<SearchResults>(EMPTY_SEARCH_RESULTS);
  const [loading, setLoading] = useState(false);

  /* The effect below owns only the debounced request. A query that will not be
     requested drops the old results; one that will keeps them until the
     replacements land. `null` so a seeded first render still counts. */
  const [plannedFor, setPlannedFor] = useState<string | null>(null);
  if (plannedFor !== query) {
    setPlannedFor(query);
    const plan = searchRequestPlan(query);
    setLoading(plan.shouldRequest);
    if (!plan.shouldRequest) setResults(EMPTY_SEARCH_RESULTS);
  }

  useEffect(() => {
    const plan = searchRequestPlan(query);
    if (!plan.shouldRequest) return;

    let alive = true;
    const timer = window.setTimeout(() => {
      const provider = search ?? (async () => EMPTY_SEARCH_RESULTS);
      provider(plan.term)
        .then((nextResults) => {
          if (!alive) return;
          setResults(nextResults);
          setLoading(false);
        })
        .catch((error) => {
          if (!alive) return;
          warnReadFailure("search", error);
          setResults(EMPTY_SEARCH_RESULTS);
          setLoading(false);
        });
    }, debounceMs);

    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [debounceMs, query, search]);

  return useMemo(() => searchScreenModel(query, results, loading), [loading, query, results]);
}
