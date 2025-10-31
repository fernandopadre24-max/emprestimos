"use client";
import { useState, useEffect } from "react";
import {
  onSnapshot,
  query,
  type Query,
  type DocumentData,
} from "firebase/firestore";
import { useFirestore } from "../provider";
import { errorEmitter } from "../error-emitter";
import { FirestorePermissionError } from "../errors";

export function useCollection<T>(q: Query<T> | null) {
  const [data, setData] = useState<T[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const firestore = useFirestore();

  useEffect(() => {
    if (!q) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        setData(items);
        setIsLoading(false);
      },
      async (err) => {
        const permissionError = new FirestorePermissionError({
          path: (q as any)._query.path.segments.join("/"),
          operation: "list",
        });
        errorEmitter.emit("permission-error", permissionError);
        setError(permissionError);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [q]);

  return { data, isLoading, error };
}
