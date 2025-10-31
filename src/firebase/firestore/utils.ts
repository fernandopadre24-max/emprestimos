import { useMemo } from 'react';

/**
 * A hook to memoize a Firestore query or document reference. This is useful
 * for preventing infinite loops in `useEffect` hooks that depend on a query.
 *
 * @example
 * ```
 * const query = useMemoFirebase(
 *   () => (firestore ? query(collection(firestore, 'users')) : null),
 *   [firestore]
 * );
 * const { data } = useCollection(query);
 * ```
 */
export function useMemoFirebase<T>(
  factory: () => T | null,
  deps: React.DependencyList
): T | null {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(factory, deps);
}
