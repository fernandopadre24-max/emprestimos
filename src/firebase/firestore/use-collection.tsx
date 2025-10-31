'use client';
import {
  Firestore,
  onSnapshot,
  Query,
  collection,
  query,
} from 'firebase/firestore';
import { useEffect, useState, useRef } from 'react';
import { useFirestore } from '../';
import { errorEmitter } from '../error-emitter';
import {
  FirestorePermissionError,
  type SecurityRuleContext,
} from '../errors';

/**
 * Hook to get a collection from Firestore.
 *
 * @param path The path to the collection.
 * @returns An object with the data, loading state, and error state.
 */
export function useCollection<T>(q?: Query | null) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (q === null) {
      // Query is explicitly null, so don't fetch.
      setData(null);
      setLoading(false);
      return;
    }
    if (!q) {
      // Query is not ready yet.
      return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));

        setData(data as T[]);
        setLoading(false);
      },
      (err) => {
        const permissionError = new FirestorePermissionError({
          path: q.path,
          operation: 'list',
        } satisfies SecurityRuleContext);

        // Emit the error with the global error emitter
        errorEmitter.emit('permission-error', permissionError);

        setError(err);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [q]);

  return { data, loading, error };
}
