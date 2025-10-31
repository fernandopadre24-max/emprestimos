'use client';
import { onAuthStateChanged, signInAnonymously, type User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { useAuth } from '..';

/**
 * Hook to get the current user from Firebase Auth.
 *
 * @returns An object with the user, loading state, and error state.
 */
export function useUser() {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!auth) {
      // Auth is not ready yet.
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        if (user) {
          setUser(user);
        } else {
          // If no user, sign in anonymously
          signInAnonymously(auth)
            .then((anonUser) => {
              setUser(anonUser.user);
            })
            .catch((err) => {
              console.error('Anonymous sign-in failed:', err);
              setError(err);
            });
        }
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [auth]);

  return { user, loading, error };
}
