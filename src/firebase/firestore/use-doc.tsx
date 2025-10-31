"use client";
import { useState, useEffect } from "react";
import {
  onSnapshot,
  doc,
  type DocumentReference,
  type DocumentData,
} from "firebase/firestore";
import { useFirestore } from "../provider";
import { errorEmitter } from "../error-emitter";
import { FirestorePermissionError } from "../errors";

export function useDoc<T>(ref: DocumentReference<T> | null) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const firestore = useFirestore();

  useEffect(() => {
    if (!ref) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        setData(snapshot.data() ?? null);
        setIsLoading(false);
      },
      async (err) => {
        const permissionError = new FirestorePermissionError({
          path: ref.path,
          operation: "get",
        });
        errorEmitter.emit("permission-error", permissionError);
        setError(permissionError);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [ref]);

  return { data, isLoading, error };
}
