'use client';
import {
  Firestore,
  onSnapshot,
  DocumentReference,
  doc,
} from 'firebase/firestore';
import { useEffect, useState, useRef } from 'react';
import { useFirestore } from '../';
import { errorEmitter } from '../error-emitter';
import {
  FirestorePermissionError,
  type SecurityRuleContext,
} from '../errors';

/**
 * Hook to get a document from Firestore.
 *
 * @param path The path to the document.
 * @returns An object with the data, loading state, and error state.
 */
export function useDoc<T>(ref?: DocumentReference | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (ref === null) {
      // Reference is explicitly null, so don't fetch.
      setData(null);
      setLoading(false);
      return;
    }
    if (!ref) {
      // Reference is not ready yet.
      return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = {
            ...snapshot.data(),
            id: snapshot.id,
          };
          setData(data as T);
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (err) => {
        const permissionError = new FirestorePermissionError({
          path: ref.path,
          operation: 'get',
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
  }, [ref]);

  return { data, loading, error };
}
