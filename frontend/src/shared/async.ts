/**
 * Run `task` over every item with at most `limit` running at once, resolving to
 * the results in INPUT order.
 *
 * The alternative to a serial `for … await` loop is not `Promise.all` over the
 * whole list: a page/batch fan-out is sized by the user's data (a 5000-track
 * playlist is 10 pages; its details are 50 batches), and firing all of them at
 * once buries the upstream API and its rate limiter. This is the middle ground —
 * genuinely parallel, but with a ceiling.
 *
 * Rejects on the first task that throws, like `Promise.all`. A caller that
 * tolerates partial failure catches inside its own `task` and returns an
 * outcome value, so the failure policy stays where the meaning lives.
 */
export async function mapConcurrent<T, R>(
  items: readonly T[],
  limit: number,
  task: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) return [];
  const width = Math.max(1, Math.min(limit, items.length));
  const results: R[] = Array.from({ length: items.length });
  let next = 0;
  // Each worker pulls the next index until the list is exhausted, so a slow task
  // never idles the others (as a fixed chunk-per-worker split would).
  const worker = async (): Promise<void> => {
    for (let index = next++; index < items.length; index = next++) {
      results[index] = await task(items[index], index);
    }
  };
  await Promise.all(Array.from({ length: width }, worker));
  return results;
}

/** Offsets for `total` items taken `size` at a time: 0, size, 2·size, … */
export function pageOffsets(total: number, size: number): number[] {
  if (total <= 0 || size <= 0) return [];
  return Array.from({ length: Math.ceil(total / size) }, (_, page) => page * size);
}
